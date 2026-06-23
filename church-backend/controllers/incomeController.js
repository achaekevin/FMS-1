const { Income, Member, Fund, User } = require('../models');
const api    = require('../utils/apiResponse');
const audit  = require('../services/auditService');
const fund   = require('../services/fundService');
const { buildBranchFilter } = require('../middleware/branchScope');
const { getPagination, buildDateFilter } = require('../utils/helpers');
const { sequelize } = require('../config/sequelize');
const { Op, fn, col } = require('sequelize');

const INCLUDE = [
  { model: Member, as: 'member', attributes: ['id', 'fullName', 'phone'] },
  { model: Fund,   as: 'fund',   attributes: ['id', 'fundName'] },
  { model: User,   as: 'recorder', attributes: ['id', 'name'] },
];

exports.getAll = async (req, res) => {
  try {
    const { page = 1, limit = 10, search, type, paymentMethod, startDate, endDate, month, year, fundId } = req.query;
    const { limit: lim, offset } = getPagination(page, limit);
    const where = {
      ...buildDateFilter(startDate, endDate, month, year),
      ...buildBranchFilter(req.branchScope),
    };

    if (type)          where.type          = type;
    if (paymentMethod) where.paymentMethod = paymentMethod;
    if (fundId)        where.fundId        = fundId;

    const { count, rows } = await Income.findAndCountAll({
      where, limit: lim, offset,
      include: INCLUDE,
      order: [['date', 'DESC'], ['createdAt', 'DESC']],
    });

    const summary = await Income.findOne({
      where,
      attributes: [[fn('SUM', col('amount')), 'total'], [fn('COUNT', col('id')), 'count']],
      raw: true,
    });

    return api.paginate(res, { records: rows, summary }, count, page, lim);
  } catch (err) {
    return api.error(res, err.message);
  }
};

exports.getById = async (req, res) => {
  try {
    const record = await Income.findByPk(req.params.id, { include: INCLUDE });
    if (!record) return api.notFound(res, 'Income record not found');
    return api.success(res, record);
  } catch (err) {
    return api.error(res, err.message);
  }
};

exports.create = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const branchId = req.branchScope?.isGlobal ? (req.body.branchId || null) : req.branchScope?.branchId;
    const record = await Income.create({ ...req.body, recordedBy: req.user.id, branchId }, { transaction: t });
    if (req.body.fundId) await fund.creditFund(req.body.fundId, req.body.amount, t);
    await t.commit();

    const full = await Income.findByPk(record.id, { include: INCLUDE });
    await audit.log(req.user.id, 'CREATE', 'INCOME',
      `Recorded income: ${req.body.type} KES ${req.body.amount}`,
      { incomeId: record.id }, req,
      { after: full });
    return api.created(res, full, 'Income recorded successfully');
  } catch (err) {
    await t.rollback();
    return api.error(res, err.message);
  }
};

exports.update = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const record = await Income.findByPk(req.params.id, { transaction: t });
    if (!record) { await t.rollback(); return api.notFound(res, 'Income record not found'); }

    const beforeSnap = audit.snapshot(record);

    // Reverse old fund effect, apply new
    if (record.fundId) await fund.reverseCreditFund(record.fundId, record.amount, t);
    if (req.body.fundId) await fund.creditFund(req.body.fundId, req.body.amount, t);

    await record.update({ ...req.body, recordedBy: req.user.id }, { transaction: t });
    await t.commit();

    const full = await Income.findByPk(record.id, { include: INCLUDE });
    await audit.log(req.user.id, 'UPDATE', 'INCOME',
      `Updated income #${record.id}`,
      { incomeId: record.id }, req,
      { before: { ...beforeSnap }, after: full });
    return api.success(res, full, 'Income updated');
  } catch (err) {
    await t.rollback();
    return api.error(res, err.message);
  }
};

exports.remove = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const record = await Income.findByPk(req.params.id, { transaction: t });
    if (!record) { await t.rollback(); return api.notFound(res, 'Income record not found'); }

    const beforeSnap = audit.snapshot(record);
    if (record.fundId) await fund.reverseCreditFund(record.fundId, record.amount, t);
    await record.destroy({ transaction: t });
    await t.commit();

    await audit.log(req.user.id, 'DELETE', 'INCOME',
      `Deleted income #${req.params.id}`,
      null, req,
      { before: beforeSnap });
    return api.success(res, null, 'Income record deleted');
  } catch (err) {
    await t.rollback();
    return api.error(res, err.message);
  }
};

exports.getSummary = async (req, res) => {
  try {
    const { startDate, endDate, month, year } = req.query;
    const where = {
      ...buildDateFilter(startDate, endDate, month, year),
      ...buildBranchFilter(req.branchScope),
    };

    const byType = await Income.findAll({
      where,
      attributes: ['type', [fn('SUM', col('amount')), 'total'], [fn('COUNT', col('id')), 'count']],
      group: ['type'],
      raw: true,
    });
    const byPayment = await Income.findAll({
      where,
      attributes: ['paymentMethod', [fn('SUM', col('amount')), 'total']],
      group: ['paymentMethod'],
      raw: true,
    });
    const byMonth = await Income.findAll({
      where,
      attributes: [
        [fn('DATE_FORMAT', col('date'), '%Y-%m'), 'month'],
        [fn('SUM', col('amount')), 'total'],
      ],
      group: [fn('DATE_FORMAT', col('date'), '%Y-%m')],
      order: [[fn('DATE_FORMAT', col('date'), '%Y-%m'), 'ASC']],
      raw: true,
    });

    return api.success(res, { byType, byPayment, byMonth });
  } catch (err) {
    return api.error(res, err.message);
  }
};
