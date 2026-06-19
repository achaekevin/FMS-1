const { Expense, Fund, User } = require('../models');
const api    = require('../utils/apiResponse');
const audit  = require('../services/auditService');
const fundSvc = require('../services/fundService');
const { getPagination, buildDateFilter } = require('../utils/helpers');
const { sequelize } = require('../config/sequelize');
const { Op, fn, col } = require('sequelize');
const upload = require('../middleware/upload');

const INCLUDE = [
  { model: Fund, as: 'fund',     attributes: ['id', 'fundName'] },
  { model: User, as: 'recorder', attributes: ['id', 'name'] },
];

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

exports.getById = async (req, res) => {
  try {
    const record = await Expense.findByPk(req.params.id, { include: INCLUDE });
    if (!record) return api.notFound(res, 'Expense not found');
    return api.success(res, record);
  } catch (err) {
    return api.error(res, err.message);
  }
};

exports.create = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const data = { ...req.body, recordedBy: req.user.id };
    if (req.file) data.receiptPath = req.file.path;

    if (req.body.fundId) await fundSvc.debitFund(req.body.fundId, req.body.amount, t);
    const record = await Expense.create(data, { transaction: t });
    await t.commit();

    const full = await Expense.findByPk(record.id, { include: INCLUDE });
    await audit.log(req.user.id, 'CREATE', 'EXPENSE',
      `Recorded expense: ${req.body.category} KES ${req.body.amount}`, { expenseId: record.id }, req);
    return api.created(res, full, 'Expense recorded successfully');
  } catch (err) {
    await t.rollback();
    return api.error(res, err.message);
  }
};

exports.update = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const record = await Expense.findByPk(req.params.id, { transaction: t });
    if (!record) { await t.rollback(); return api.notFound(res, 'Expense not found'); }

    if (record.fundId) await fundSvc.reverseDebitFund(record.fundId, record.amount, t);
    if (req.body.fundId) await fundSvc.debitFund(req.body.fundId, req.body.amount, t);

    const data = { ...req.body };
    if (req.file) data.receiptPath = req.file.path;
    await record.update(data, { transaction: t });
    await t.commit();

    const full = await Expense.findByPk(record.id, { include: INCLUDE });
    await audit.log(req.user.id, 'UPDATE', 'EXPENSE', `Updated expense #${record.id}`, { expenseId: record.id }, req);
    return api.success(res, full, 'Expense updated');
  } catch (err) {
    await t.rollback();
    return api.error(res, err.message);
  }
};

exports.remove = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const record = await Expense.findByPk(req.params.id, { transaction: t });
    if (!record) { await t.rollback(); return api.notFound(res, 'Expense not found'); }

    if (record.fundId) await fundSvc.reverseDebitFund(record.fundId, record.amount, t);
    await record.destroy({ transaction: t });
    await t.commit();

    await audit.log(req.user.id, 'DELETE', 'EXPENSE', `Deleted expense #${req.params.id}`, null, req);
    return api.success(res, null, 'Expense deleted');
  } catch (err) {
    await t.rollback();
    return api.error(res, err.message);
  }
};

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

    return api.success(res, { byCategory, byMonth });
  } catch (err) {
    return api.error(res, err.message);
  }
};
