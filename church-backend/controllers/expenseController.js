const { Expense, Fund, User } = require('../models');
const api         = require('../utils/apiResponse');
const audit       = require('../services/auditService');
const fundSvc     = require('../services/fundService');
const notify      = require('../services/notificationService');
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
  try {
    const data = {
      ...req.body,
      recordedBy: req.user.id,
      status: 'pending_pastor',  // always starts here
      approvedBy: null,
    };
    if (req.file) data.receiptPath = req.file.path;

    const record = await Expense.create(data);
    const full   = await Expense.findByPk(record.id, { include: INCLUDE });

    await audit.log(req.user.id, 'CREATE', 'EXPENSE',
      `Expense submitted for approval: ${req.body.category} KES ${req.body.amount}`,
      { expenseId: record.id }, req);

    // Notify all pastors
    await notifyRole('pastor',
      'Expense Awaiting Your Approval',
      `A ${req.body.category} expense of KES ${req.body.amount} has been submitted by ${req.user.name} and requires your approval.`
    );

    return api.created(res, full, 'Expense submitted and is awaiting pastor approval');
  } catch (err) {
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
    await record.update({
      status:          'pending_admin',
      pastorId:        req.user.id,
      pastorNote:      note || null,
      pastorApprovedAt: new Date(),
    });

    const full = await Expense.findByPk(record.id, { include: INCLUDE });

    await audit.log(req.user.id, 'APPROVE', 'EXPENSE',
      `Pastor approved expense #${record.id} (${record.category} KES ${record.amount})`,
      { expenseId: record.id }, req);

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

    // Debit the fund now that the expense is fully approved
    if (record.fundId) await fundSvc.debitFund(record.fundId, record.amount, t);

    await record.update({
      status:           'approved',
      adminId:          req.user.id,
      adminNote:        note || null,
      adminFinalizedAt: new Date(),
      approvedBy:       req.user.name,  // legacy field
    }, { transaction: t });

    await t.commit();

    const full = await Expense.findByPk(record.id, { include: INCLUDE });

    await audit.log(req.user.id, 'APPROVE', 'EXPENSE',
      `Admin finalized expense #${record.id} (${record.category} KES ${record.amount})`,
      { expenseId: record.id }, req);

    // Notify the treasurer who created the expense
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

    const updateData = { status: 'rejected' };
    if (role === 'pastor') {
      updateData.pastorId        = req.user.id;
      updateData.pastorNote      = note;
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
      { expenseId: record.id }, req);

    // Notify the treasurer who submitted it
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

    // Prevent treasurer from editing someone else's expense
    if (req.user.role === 'treasurer' && record.recordedBy !== req.user.id)
      return api.forbidden(res, 'You can only edit your own expenses');

    const data = { ...req.body };
    if (req.file) data.receiptPath = req.file.path;
    delete data.status;      // status changes only via workflow endpoints
    delete data.approvedBy;

    await record.update(data);
    const full = await Expense.findByPk(record.id, { include: INCLUDE });

    await audit.log(req.user.id, 'UPDATE', 'EXPENSE',
      `Updated expense #${record.id}`, { expenseId: record.id }, req);
    return api.success(res, full, 'Expense updated');
  } catch (err) {
    return api.error(res, err.message);
  }
};

/**
 * DELETE /api/expenses/:id
 * Only allowed while pending_pastor. Approved expenses cannot be deleted.
 */
exports.remove = async (req, res) => {
  try {
    const record = await Expense.findByPk(req.params.id);
    if (!record) return api.notFound(res, 'Expense not found');

    if (!['pending_pastor', 'rejected'].includes(record.status))
      return api.badRequest(res, 'Only pending or rejected expenses can be deleted');

    await record.destroy();
    await audit.log(req.user.id, 'DELETE', 'EXPENSE',
      `Deleted expense #${req.params.id}`, null, req);
    return api.success(res, null, 'Expense deleted');
  } catch (err) {
    return api.error(res, err.message);
  }
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
