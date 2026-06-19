const { Fund, Income, Expense } = require('../models');
const api   = require('../utils/apiResponse');
const audit = require('../services/auditService');
const { buildDateFilter } = require('../utils/helpers');

exports.getAll = async (req, res) => {
  try {
    const funds = await Fund.findAll({ order: [['fundName', 'ASC']] });
    return api.success(res, funds);
  } catch (err) {
    return api.error(res, err.message);
  }
};

exports.getById = async (req, res) => {
  try {
    const f = await Fund.findByPk(req.params.id);
    if (!f) return api.notFound(res, 'Fund not found');
    return api.success(res, f);
  } catch (err) {
    return api.error(res, err.message);
  }
};

exports.create = async (req, res) => {
  try {
    const f = await Fund.create(req.body);
    await audit.log(req.user.id, 'CREATE', 'FUND', `Created fund: ${f.fundName}`, { fundId: f.id }, req);
    return api.created(res, f, 'Fund created successfully');
  } catch (err) {
    return api.error(res, err.message);
  }
};

exports.update = async (req, res) => {
  try {
    const f = await Fund.findByPk(req.params.id);
    if (!f) return api.notFound(res, 'Fund not found');
    const { description, isActive } = req.body;
    await f.update({ description, isActive });
    await audit.log(req.user.id, 'UPDATE', 'FUND', `Updated fund: ${f.fundName}`, { fundId: f.id }, req);
    return api.success(res, f, 'Fund updated');
  } catch (err) {
    return api.error(res, err.message);
  }
};

/**
 * Detailed fund report: balance + income + expenses with breakdown
 */
exports.getFundReport = async (req, res) => {
  try {
    const { id } = req.params;
    const { startDate, endDate, month, year } = req.query;
    const dateFilter = buildDateFilter(startDate, endDate, month, year);

    const f = await Fund.findByPk(id);
    if (!f) return api.notFound(res, 'Fund not found');

    const incomes = await Income.findAll({ where: { fundId: id, ...dateFilter }, order: [['date', 'DESC']] });
    const expenses = await Expense.findAll({ where: { fundId: id, ...dateFilter }, order: [['date', 'DESC']] });

    const periodIncome   = incomes.reduce((s, i) => s + parseFloat(i.amount), 0);
    const periodExpenses = expenses.reduce((s, e) => s + parseFloat(e.amount), 0);

    return api.success(res, {
      fund: f,
      periodIncome,
      periodExpenses,
      netForPeriod: periodIncome - periodExpenses,
      currentBalance: f.balance,
      incomes,
      expenses,
    });
  } catch (err) {
    return api.error(res, err.message);
  }
};

exports.remove = async (req, res) => {
  try {
    const f = await Fund.findByPk(req.params.id);
    if (!f) return api.notFound(res, 'Fund not found');
    if (parseFloat(f.balance) > 0)
      return api.badRequest(res, 'Cannot delete a fund with a non-zero balance');
    await f.update({ isActive: false });
    await audit.log(req.user.id, 'DELETE', 'FUND', `Deactivated fund: ${f.fundName}`, null, req);
    return api.success(res, null, 'Fund deactivated');
  } catch (err) {
    return api.error(res, err.message);
  }
};
