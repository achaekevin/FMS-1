const { Expense, Fund, User } = require('../models');
const api         = require('../utils/apiResponse');
const audit       = require('../services/auditService');
const fundSvc     = require('../services/fundService');
const notify      = require('../services/notificationService');
const { Setting } = require('../models');
const { getPagination, buildDateFilter } = require('../utils/helpers');
const { sequelize } = require('../config/sequelize');
const { Op, fn, col } = require('sequelize');

// ── Shared includes ────────────────────────────────────────
const INCLUDE = [
  { model: Fund, as: 'fund',     attributes: ['id', 'fundName'] },
  { model: User, as: 'recorder', attributes: ['id', 'name', 'role'] },
  { model: User, as: 'pastor',   attributes: ['id', 'name'], required: false },
  { model: User, as: 'admin',    attributes: ['id', 'name'], required: false },
];

// ── Get dual-auth threshold from settings (cached for 60s) ─
let _thresholdCache = null;
let _thresholdCachedAt = 0;
const getDualAuthThreshold = async () => {
  const now = Date.now();
  if (_thresholdCache !== null && now - _thresholdCachedAt < 60000) return _thresholdCache;
  try {
    const s = await Setting.findOne({ where: { key: 'dual_auth_threshold' } });
    _thresholdCache = s ? parseFloat(s.value) : 5000;
  } catch { _thresholdCache = 5000; }
  _thresholdCachedAt = now;
  return _thresholdCache;
};

// ── Helper: notify all users of a given role ──────────────
const notifyRole = async (role, title, message, module = 'EXPENSE') => {
  try {
    const users = await User.findAll({ where: { role, status: 'active' }, attributes: ['id'] });
    const ids = users.map(u => u.id);
    if (ids.length) await notify.broadcast(ids, title, message, 'warning', module);
  } catch (_) { /* non-fatal */ }
};

/**
 * GET /api/expenses
 */
exports.getAll = async (req, res) => {
  try {
    const { page = 1, limit = 10, category, status, startDate, endDate, month, year, fundId } = req.query;
    const { limit: lim, offset } = getPagination(page, limit);
    const where = { ...buildDateFilter(startDate, endDate, month, year) };
    if (category) where.category = category;
    if (status)   where.status   = status;
    if (fundId)   where.fundId   = fundId;

    const { count, rows } = await Expense.findAndCountAll({
      where, limit: lim, offset, include: INCLUDE, order: [['date', 'DESC']],
    });

    const summary = await Expense.findOne({
      where,
      attributes: [[fn('SUM', col('amount')), 'total'], [fn('COUNT', col('id')), 'count']],
      raw: true,
    });

    return api.paginate(res, { records: rows, summary }, count, page, lim);
  } catch (err) {
    return api.error(res, err.message);
  }
};

/**
 * GET /api/expenses/:id
 */
exports.getById = async (req, res) => {
  try {
    const record = await Expense.findByPk(req.params.id, { include: INCLUDE });
    if (!record) return api.notFound(res, 'Expense not found');
    return api.success(res, record);
  } catch (err) {
    return api.error(res, err.message);
  }
};

/**
 * POST /api/expenses
 * Treasurer creates expense — status starts as pending_pastor.
 * Fund is NOT debited yet; money is only moved on admin finalization.
 */
exports.create = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const threshold = await getDualAuthThreshold();
    const amount    = parseFloat(req.body.amount || 0);
    const needsDualAuth = amount >= threshold;

    const data = {
      ...req.body,
      recordedBy: req.user.id,
      approvedBy: null,
    };
    if (req.file) data.receiptPath = req.file.path;

    if (needsDualAuth) {
      // High-value — requires pastor + admin approval
      data.status = 'pending_pastor';
      const record = await Expense.create(data, { transaction: t });
      await t.commit();

      const full = await Expense.findByPk(record.id, { include: INCLUDE });
      await audit.log(req.user.id, 'CREATE', 'EXPENSE',
        `Expense submitted for dual-auth approval: ${req.body.category} KES ${amount} (threshold: KES ${threshold})`,
        { expenseId: record.id }, req, { after: full });

      await notifyRole('pastor',
        'Expense Awaiting Your Approval',
        `A ${req.body.category} expense of KES ${amount} has been submitted by ${req.user.name} and requires your approval. (Dual-auth required — above KES ${threshold} threshold)`
      );

      return api.created(res, full, `Expense submitted — dual-authorization required (KES ${amount} exceeds KES ${threshold} threshold). Awaiting pastor approval.`);
    } else {
      // Below threshold — auto-approve immediately, debit fund
      data.status    = 'approved';
      data.approvedBy = req.user.name;
      data.adminId   = req.user.id;
      data.adminFinalizedAt = new Date();

      const record = await Expense.create(data, { transaction: t });
      if (req.body.fundId) await fundSvc.debitFund(req.body.fundId, amount, t);
      await t.commit();

      const full = await Expense.findByPk(record.id, { include: INCLUDE });
      await audit.log(req.user.id, 'CREATE', 'EXPENSE',
        `Expense auto-approved (below KES ${threshold} threshold): ${req.body.category} KES ${amount}`,
        { expenseId: record.id }, req, { after: full });

      return api.created(res, full, `Expense recorded and auto-approved (KES ${amount} is below the KES ${threshold} dual-auth threshold).`);
    }
  } catch (err) {
    await t.rollback();
    return api.error(res, err.message);
  }
};

/**
 * PATCH /api/expenses/:id/approve
 * Pastor approves — moves status to pending_admin.
 */
exports.approve = async (req, res) => {
  try {
    const record = await Expense.findByPk(req.params.id);
    if (!record) return api.notFound(res, 'Expense not found');

    if (record.status !== 'pending_pastor')
      return api.badRequest(res, `Cannot approve an expense with status "${record.status}"`);

    const { note } = req.body;
    const beforeSnap = audit.snapshot(record);

    await record.update({
      status:          'pending_admin',
      pastorId:        req.user.id,
      pastorNote:      note || null,
      pastorApprovedAt: new Date(),
    });

    const full = await Expense.findByPk(record.id, { include: INCLUDE });

    await audit.log(req.user.id, 'APPROVE', 'EXPENSE',
      `Pastor approved expense #${record.id} (${record.category} KES ${record.amount})`,
      { expenseId: record.id }, req,
      { before: beforeSnap, after: full });

    // Notify all admins
    await notifyRole('administrator',
      'Expense Awaiting Final Approval',
      `${req.user.name} (Pastor) approved a ${record.category} expense of KES ${record.amount}. Please review and finalize.`
    );

    return api.success(res, full, 'Expense approved by pastor — awaiting admin finalization');
  } catch (err) {
    return api.error(res, err.message);
  }
};

/**
 * PATCH /api/expenses/:id/finalize
 * Admin finalizes — moves status to approved and debits the fund.
 */
exports.finalize = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const record = await Expense.findByPk(req.params.id, { transaction: t });
    if (!record) { await t.rollback(); return api.notFound(res, 'Expense not found'); }

    if (record.status !== 'pending_admin')
      { await t.rollback(); return api.badRequest(res, `Cannot finalize an expense with status "${record.status}"`); }

    const { note } = req.body;
    const beforeSnap = audit.snapshot(record);

    // Debit the fund now that the expense is fully approved
    if (record.fundId) await fundSvc.debitFund(record.fundId, record.amount, t);

    await record.update({
      status:           'approved',
      adminId:          req.user.id,
      adminNote:        note || null,
      adminFinalizedAt: new Date(),
      approvedBy:       req.user.name,
    }, { transaction: t });

    await t.commit();

    const full = await Expense.findByPk(record.id, { include: INCLUDE });

    await audit.log(req.user.id, 'APPROVE', 'EXPENSE',
      `Admin finalized expense #${record.id} (${record.category} KES ${record.amount})`,
      { expenseId: record.id }, req,
      { before: beforeSnap, after: full });

    await notify.create(
      record.recordedBy,
      'Expense Fully Approved',
      `Your ${record.category} expense of KES ${record.amount} has been approved and finalized by admin.`,
      'success', 'EXPENSE'
    );

    return api.success(res, full, 'Expense finalized and fund debited');
  } catch (err) {
    await t.rollback();
    return api.error(res, err.message);
  }
};

/**
 * PATCH /api/expenses/:id/reject
 * Pastor or Admin can reject at their respective stage.
 */
exports.reject = async (req, res) => {
  try {
    const record = await Expense.findByPk(req.params.id);
    if (!record) return api.notFound(res, 'Expense not found');

    const role = req.user.role;

    if (role === 'pastor' && record.status !== 'pending_pastor')
      return api.badRequest(res, 'You can only reject expenses that are pending your review');

    if (role === 'administrator' && record.status !== 'pending_admin')
      return api.badRequest(res, 'You can only reject expenses that are pending admin review');

    const { note } = req.body;
    if (!note) return api.badRequest(res, 'A rejection reason (note) is required');

    const beforeSnap = audit.snapshot(record);
    const updateData = { status: 'rejected' };
    if (role === 'pastor') {
      updateData.pastorId         = req.user.id;
      updateData.pastorNote       = note;
      updateData.pastorApprovedAt = new Date();
    } else {
      updateData.adminId          = req.user.id;
      updateData.adminNote        = note;
      updateData.adminFinalizedAt = new Date();
    }

    await record.update(updateData);
    const full = await Expense.findByPk(record.id, { include: INCLUDE });

    await audit.log(req.user.id, 'REJECT', 'EXPENSE',
      `${role} rejected expense #${record.id}: ${note}`,
      { expenseId: record.id }, req,
      { before: beforeSnap, after: full });

    await notify.create(
      record.recordedBy,
      'Expense Rejected',
      `Your ${record.category} expense of KES ${record.amount} was rejected by ${req.user.name}: "${note}"`,
      'error', 'EXPENSE'
    );

    return api.success(res, full, 'Expense rejected');
  } catch (err) {
    return api.error(res, err.message);
  }
};

/**
 * PUT /api/expenses/:id
 * Only allowed while still pending_pastor (treasurer can still edit before pastor reviews).
 */
exports.update = async (req, res) => {
  try {
    const record = await Expense.findByPk(req.params.id);
    if (!record) return api.notFound(res, 'Expense not found');

    if (record.status !== 'pending_pastor')
      return api.badRequest(res, 'Expense can only be edited while it is pending pastor approval');

    if (req.user.role === 'treasurer' && record.recordedBy !== req.user.id)
      return api.forbidden(res, 'You can only edit your own expenses');

    const beforeSnap = audit.snapshot(record);
    const data = { ...req.body };
    if (req.file) data.receiptPath = req.file.path;
    delete data.status;
    delete data.approvedBy;

    await record.update(data);
    const full = await Expense.findByPk(record.id, { include: INCLUDE });

    await audit.log(req.user.id, 'UPDATE', 'EXPENSE',
      `Updated expense #${record.id}`,
      { expenseId: record.id }, req,
      { before: beforeSnap, after: full });
    return api.success(res, full, 'Expense updated');
  } catch (err) {
    return api.error(res, err.message);
  }
};

exports.remove = async (req, res) => {
  try {
    const record = await Expense.findByPk(req.params.id);
    if (!record) return api.notFound(res, 'Expense not found');

    if (!['pending_pastor', 'rejected'].includes(record.status))
      return api.badRequest(res, 'Only pending or rejected expenses can be deleted');

    const beforeSnap = audit.snapshot(record);
    await record.destroy();
    await audit.log(req.user.id, 'DELETE', 'EXPENSE',
      `Deleted expense #${req.params.id}`,
      null, req,
      { before: beforeSnap });
    return api.success(res, null, 'Expense deleted');
  } catch (err) {
    return api.error(res, err.message);
  }
};

/**
 * GET /api/expenses/threshold
 * Returns the current dual-auth threshold from settings
 */
exports.getThreshold = async (req, res) => {
  try {
    _thresholdCache = null; // bust cache
    const threshold = await getDualAuthThreshold();
    return api.success(res, { threshold });
  } catch (err) { return api.error(res, err.message); }
};

/**
 * GET /api/expenses/summary
 */
exports.getSummary = async (req, res) => {
  try {
    const { startDate, endDate, month, year } = req.query;
    const where = buildDateFilter(startDate, endDate, month, year);

    const byCategory = await Expense.findAll({
      where,
      attributes: ['category', [fn('SUM', col('amount')), 'total'], [fn('COUNT', col('id')), 'count']],
      group: ['category'],
      raw: true,
    });
    const byMonth = await Expense.findAll({
      where,
      attributes: [
        [fn('DATE_FORMAT', col('date'), '%Y-%m'), 'month'],
        [fn('SUM', col('amount')), 'total'],
      ],
      group: [fn('DATE_FORMAT', col('date'), '%Y-%m')],
      order: [[fn('DATE_FORMAT', col('date'), '%Y-%m'), 'ASC']],
      raw: true,
    });
    const byStatus = await Expense.findAll({
      attributes: ['status', [fn('COUNT', col('id')), 'count'], [fn('SUM', col('amount')), 'total']],
      group: ['status'],
      raw: true,
    });

    return api.success(res, { byCategory, byMonth, byStatus });
  } catch (err) {
    return api.error(res, err.message);
  }
};
