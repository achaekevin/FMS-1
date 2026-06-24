const { Income, Expense, Member, Fund } = require('../models');
const api    = require('../utils/apiResponse');
const audit  = require('../services/auditService');
const pdf    = require('../services/pdfService');
const excel  = require('../services/excelService');
const { buildDateFilter } = require('../utils/helpers');
const { fn, col } = require('sequelize');

const INCOME_INCLUDE = [
  { model: Member, as: 'member', attributes: ['id', 'fullName', 'phone'] },
  { model: Fund,   as: 'fund',   attributes: ['id', 'fundName'] },
];
const EXPENSE_INCLUDE = [
  { model: Fund, as: 'fund', attributes: ['id', 'fundName'] },
];

exports.incomeReport = async (req, res) => {
  try {
    const { startDate, endDate, month, year, format } = req.query;
    const where = buildDateFilter(startDate, endDate, month, year);
    const records = await Income.findAll({ where, include: INCOME_INCLUDE, order: [['date', 'DESC']] });

    await audit.log(req.user.id, 'VIEW', 'REPORT', 'Generated income report', { filters: req.query }, req);

    if (format === 'pdf')   return pdf.generateIncomeReport(res, records, req.query);
    if (format === 'excel') return excel.generateIncomeExcel(res, records);

    const total = records.reduce((s, r) => s + parseFloat(r.amount), 0);
    return api.success(res, { records, total, count: records.length });
  } catch (err) {
    return api.error(res, err.message);
  }
};

exports.expenseReport = async (req, res) => {
  try {
    const { startDate, endDate, month, year, format } = req.query;
    const where = buildDateFilter(startDate, endDate, month, year);
    const records = await Expense.findAll({ where, include: EXPENSE_INCLUDE, order: [['date', 'DESC']] });

    await audit.log(req.user.id, 'VIEW', 'REPORT', 'Generated expense report', { filters: req.query }, req);

    if (format === 'pdf')   return pdf.generateExpenseReport(res, records, req.query);
    if (format === 'excel') return excel.generateExpenseExcel(res, records);

    const total = records.reduce((s, r) => s + parseFloat(r.amount), 0);
    return api.success(res, { records, total, count: records.length });
  } catch (err) {
    return api.error(res, err.message);
  }
};

exports.fundReport = async (req, res) => {
  try {
    const { startDate, endDate, month, year } = req.query;
    const dateFilter = buildDateFilter(startDate, endDate, month, year);

    const funds = await Fund.findAll({ order: [['fundName', 'ASC']] });

    const detailed = await Promise.all(funds.map(async (f) => {
      const incomes  = await Income.sum('amount', { where: { fundId: f.id, ...dateFilter } }) || 0;
      const expenses = await Expense.sum('amount', { where: { fundId: f.id, ...dateFilter } }) || 0;
      return {
        id: f.id,
        fundName: f.fundName,
        currentBalance: f.balance,
        periodIncome: incomes,
        periodExpenses: expenses,
        netForPeriod: incomes - expenses,
      };
    }));

    await audit.log(req.user.id, 'VIEW', 'REPORT', 'Generated fund report', { filters: req.query }, req);
    return api.success(res, detailed);
  } catch (err) {
    return api.error(res, err.message);
  }
};

exports.contributionReport = async (req, res) => {
  try {
    const { startDate, endDate, month, year, format } = req.query;
    const dateFilter = buildDateFilter(startDate, endDate, month, year);

    const members = await Member.findAll({
      include: [{ model: Income, as: 'incomes', where: dateFilter, required: false }],
      order: [['fullName', 'ASC']],
    });

    const summary = members.map(m => ({
      id: m.id,
      fullName: m.fullName,
      phone: m.phone,
      email: m.email,
      totalContributions: m.incomes?.reduce((s, i) => s + parseFloat(i.amount), 0) || 0,
      contributionCount: m.incomes?.length || 0,
    })).sort((a, b) => b.totalContributions - a.totalContributions);

    await audit.log(req.user.id, 'VIEW', 'REPORT', 'Generated contribution report', { filters: req.query }, req);

    if (format === 'excel') return excel.generateMembersExcel(res, members);

    const grandTotal = summary.reduce((s, m) => s + m.totalContributions, 0);
    return api.success(res, { members: summary, grandTotal });
  } catch (err) {
    return api.error(res, err.message);
  }
};

exports.memberStatement = async (req, res) => {
  try {
    const { id } = req.params;
    const { startDate, endDate, month, year } = req.query;
    const dateFilter = buildDateFilter(startDate, endDate, month, year);

    const member = await Member.findByPk(id);
    if (!member) return api.notFound(res, 'Member not found');

    const records = await Income.findAll({ where: { memberId: id, ...dateFilter }, order: [['date', 'DESC']] });

    await audit.log(req.user.id, 'EXPORT', 'REPORT', `Generated statement for ${member.fullName}`, null, req);
    return pdf.generateMemberStatement(res, member, records);
  } catch (err) {
    return api.error(res, err.message);
  }
};
