const { Budget, Fund, User, Expense } = require('../models');
const api   = require('../utils/apiResponse');
const audit = require('../services/auditService');
const { getPagination } = require('../utils/helpers');
const { sequelize } = require('../config/sequelize');
const { fn, col, Op } = require('sequelize');

const INCLUDE = [
  { model: User, as: 'creator', attributes: ['id','name'] },
  { model: Fund, as: 'fund',    attributes: ['id','fundName'] },
];

/** Recalculate spentAmount + remainingAmount for a budget */
const recalcBudget = async (budget, t = null) => {
  const spent = await Expense.sum('amount', {
    where: {
      ...(budget.fundId ? { fundId: budget.fundId } : {}),
      date: { [Op.between]: [budget.startDate, budget.endDate || '9999-12-31'] },
    },
    transaction: t,
  }) || 0;
  const remaining = Math.max(0, parseFloat(budget.amount) - parseFloat(spent));
  const status = parseFloat(spent) > parseFloat(budget.amount) ? 'exceeded' : 'active';
  await budget.update({ spentAmount: spent, remainingAmount: remaining, status }, { transaction: t });
  return budget;
};

exports.getAll = async (req, res) => {
  try {
    const { page = 1, limit = 20, status, fundId } = req.query;
    const { limit: lim, offset } = getPagination(page, limit);
    const where = {};
    if (status) where.status = status;
    if (fundId) where.fundId = fundId;
    const { count, rows } = await Budget.findAndCountAll({ where, limit: lim, offset, include: INCLUDE, order: [['createdAt','DESC']] });
    return api.paginate(res, rows, count, page, lim);
  } catch (err) { return api.error(res, err.message); }
};

exports.getById = async (req, res) => {
  try {
    const b = await Budget.findByPk(req.params.id, { include: INCLUDE });
    if (!b) return api.notFound(res, 'Budget not found');
    return api.success(res, b);
  } catch (err) { return api.error(res, err.message); }
};

exports.create = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { title, category, amount, period, startDate, endDate, description, fundId } = req.body;
    const budget = await Budget.create({
      title, category, amount, period, startDate, endDate, description, fundId,
      createdBy: req.user.id,
      remainingAmount: amount,
    }, { transaction: t });
    await recalcBudget(budget, t);
    await t.commit();
    const full = await Budget.findByPk(budget.id, { include: INCLUDE });
    await audit.log(req.user.id, 'CREATE', 'BUDGET', `Created budget: ${title}`, { budgetId: budget.id }, req);
    return api.created(res, full, 'Budget created');
  } catch (err) { await t.rollback(); return api.error(res, err.message); }
};

exports.update = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const b = await Budget.findByPk(req.params.id, { transaction: t });
    if (!b) { await t.rollback(); return api.notFound(res, 'Budget not found'); }
    await b.update(req.body, { transaction: t });
    await recalcBudget(b, t);
    await t.commit();
    const full = await Budget.findByPk(b.id, { include: INCLUDE });
    await audit.log(req.user.id, 'UPDATE', 'BUDGET', `Updated budget: ${b.title}`, { budgetId: b.id }, req);
    return api.success(res, full, 'Budget updated');
  } catch (err) { await t.rollback(); return api.error(res, err.message); }
};

exports.remove = async (req, res) => {
  try {
    const b = await Budget.findByPk(req.params.id);
    if (!b) return api.notFound(res, 'Budget not found');
    const title = b.title;
    await b.destroy();
    await audit.log(req.user.id, 'DELETE', 'BUDGET', `Deleted budget: ${title}`, null, req);
    return api.success(res, null, 'Budget deleted');
  } catch (err) { return api.error(res, err.message); }
};

/** POST /budgets/recalc-all  — recalc all active budgets from actual expenses */
exports.recalcAll = async (req, res) => {
  try {
    const budgets = await Budget.findAll({ where: { status: ['active','exceeded'] } });
    for (const b of budgets) await recalcBudget(b);
    return api.success(res, null, `Recalculated ${budgets.length} budgets`);
  } catch (err) { return api.error(res, err.message); }
};

module.exports.recalcBudget = recalcBudget;
