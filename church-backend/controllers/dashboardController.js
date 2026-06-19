const { Income, Expense, Member, Fund, MpesaTransaction, Budget, Event, Asset, Employee } = require('../models');
const api = require('../utils/apiResponse');
const { fn, col, literal, Op } = require('sequelize');

/** GET /dashboard/stats */
exports.getStats = async (req, res) => {
  try {
    const [
      totalIncome, totalExpenses, totalMembers,
      totalTithes, totalDonations, totalOfferings,
      pendingMpesa, totalAssets, totalEmployees, upcomingEvents,
    ] = await Promise.all([
      Income.sum('amount')  || 0,
      Expense.sum('amount') || 0,
      Member.count({ where: { status: 'active' } }),
      Income.sum('amount', { where: { type: 'Tithe' } })    || 0,
      Income.sum('amount', { where: { type: 'Donation' } }) || 0,
      Income.sum('amount', { where: { type: 'Offering' } }) || 0,
      MpesaTransaction.count({ where: { status: 'pending' } }),
      Asset.sum('value')    || 0,
      Employee.count({ where: { status: 'active' } }),
      Event.count({ where: { eventDate: { [Op.gte]: new Date() }, status: 'upcoming' } }),
    ]);

    return api.success(res, {
      totalIncome:     parseFloat(totalIncome   || 0),
      totalExpenses:   parseFloat(totalExpenses || 0),
      netBalance:      parseFloat(totalIncome || 0) - parseFloat(totalExpenses || 0),
      totalMembers,
      totalTithes:     parseFloat(totalTithes    || 0),
      totalDonations:  parseFloat(totalDonations || 0),
      totalOfferings:  parseFloat(totalOfferings || 0),
      pendingMpesa,
      totalAssets:     parseFloat(totalAssets || 0),
      totalEmployees,
      upcomingEvents,
    });
  } catch (err) { return api.error(res, err.message); }
};

/** GET /dashboard/monthly-stats?months=6 */
exports.getMonthlyStats = async (req, res) => {
  try {
    const months = Math.min(parseInt(req.query.months) || 6, 24);

    const [incomeByMonth, expenseByMonth] = await Promise.all([
      Income.findAll({
        attributes: [
          [fn('DATE_FORMAT', col('date'), '%Y-%m'), 'month'],
          [fn('SUM', col('amount')), 'total'],
        ],
        group: [fn('DATE_FORMAT', col('date'), '%Y-%m')],
        order: [[fn('DATE_FORMAT', col('date'), '%Y-%m'), 'DESC']],
        limit: months,
        raw: true,
      }),
      Expense.findAll({
        attributes: [
          [fn('DATE_FORMAT', col('date'), '%Y-%m'), 'month'],
          [fn('SUM', col('amount')), 'total'],
        ],
        group: [fn('DATE_FORMAT', col('date'), '%Y-%m')],
        order: [[fn('DATE_FORMAT', col('date'), '%Y-%m'), 'DESC']],
        limit: months,
        raw: true,
      }),
    ]);

    const map = {};
    incomeByMonth.forEach(r => {
      map[r.month] = { month: r.month, income: parseFloat(r.total), expenses: 0 };
    });
    expenseByMonth.forEach(r => {
      if (!map[r.month]) map[r.month] = { month: r.month, income: 0, expenses: 0 };
      map[r.month].expenses = parseFloat(r.total);
    });
    const timeline = Object.values(map).sort((a, b) => a.month.localeCompare(b.month));
    return api.success(res, timeline);
  } catch (err) { return api.error(res, err.message); }
};

/** GET /dashboard/contribution-trends?months=6 */
exports.getContributionTrends = async (req, res) => {
  try {
    const months = Math.min(parseInt(req.query.months) || 6, 24);
    const types  = ['Tithe', 'Offering', 'Donation'];
    const results = {};

    for (const type of types) {
      const rows = await Income.findAll({
        where: { type },
        attributes: [
          [fn('DATE_FORMAT', col('date'), '%Y-%m'), 'month'],
          [fn('SUM', col('amount')), 'total'],
        ],
        group: [fn('DATE_FORMAT', col('date'), '%Y-%m')],
        order: [[fn('DATE_FORMAT', col('date'), '%Y-%m'), 'DESC']],
        limit: months,
        raw: true,
      });
      rows.forEach(r => {
        if (!results[r.month]) results[r.month] = { month: r.month, tithes: 0, offerings: 0, donations: 0 };
        const key = type.toLowerCase() + 's';
        results[r.month][key] = parseFloat(r.total);
      });
    }
    const sorted = Object.values(results).sort((a, b) => a.month.localeCompare(b.month));
    return api.success(res, sorted);
  } catch (err) { return api.error(res, err.message); }
};

/** GET /dashboard/top-contributors?limit=10 */
exports.getTopContributors = async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 10, 50);
    const { startDate, endDate, year, month } = req.query;
    const { buildDateFilter } = require('../utils/helpers');
    const dateFilter = buildDateFilter(startDate, endDate, month, year);

    const rows = await Income.findAll({
      where: { memberId: { [Op.ne]: null }, ...dateFilter },
      attributes: [
        'memberId',
        [fn('SUM', col('amount')), 'total'],
        [fn('COUNT', col('Income.id')), 'count'],
      ],
      include: [{ model: Member, as: 'member', attributes: ['fullName','phone'] }],
      group: ['memberId', 'member.id'],
      order: [[fn('SUM', col('amount')), 'DESC']],
      limit,
      raw: false,
    });

    const contributors = rows.map(r => ({
      memberId:  r.memberId,
      fullName:  r.member?.fullName || 'Anonymous',
      phone:     r.member?.phone,
      total:     parseFloat(r.dataValues.total || 0),
      count:     parseInt(r.dataValues.count   || 0),
    }));
    return api.success(res, contributors);
  } catch (err) { return api.error(res, err.message); }
};

/** GET /dashboard/fund-overview */
exports.getFundOverview = async (req, res) => {
  try {
    const funds = await Fund.findAll({
      attributes: ['id','fundName','balance','totalIncome','totalExpenses','isActive'],
      order: [['fundName','ASC']],
    });
    return api.success(res, funds);
  } catch (err) { return api.error(res, err.message); }
};

/** GET /dashboard/recent-transactions?limit=10 */
exports.getRecentTransactions = async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 10, 50);
    const [income, expenses] = await Promise.all([
      Income.findAll({
        limit, order: [['date','DESC'],['createdAt','DESC']],
        include: [{ model: Member, as: 'member', attributes: ['fullName'] }],
      }),
      Expense.findAll({
        limit, order: [['date','DESC'],['createdAt','DESC']],
      }),
    ]);
    const combined = [
      ...income.map(i => ({
        id: i.id, type: 'income', category: i.type, amount: parseFloat(i.amount),
        date: i.date, description: i.description, name: i.member?.fullName || 'Anonymous',
      })),
      ...expenses.map(e => ({
        id: e.id, type: 'expense', category: e.category, amount: parseFloat(e.amount),
        date: e.date, description: e.description, name: e.approvedBy,
      })),
    ].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, limit);
    return api.success(res, combined);
  } catch (err) { return api.error(res, err.message); }
};

/** GET /dashboard/yearly-comparison?years=3 */
exports.getYearlyComparison = async (req, res) => {
  try {
    const numYears = Math.min(parseInt(req.query.years) || 3, 5);
    const currentYear = new Date().getFullYear();
    const yearList = Array.from({ length: numYears }, (_, i) => currentYear - i);

    const rows = await Promise.all(yearList.map(async (yr) => {
      const [income, expenses] = await Promise.all([
        Income.sum('amount',  { where: { date: { [Op.between]: [`${yr}-01-01`, `${yr}-12-31`] } } }) || 0,
        Expense.sum('amount', { where: { date: { [Op.between]: [`${yr}-01-01`, `${yr}-12-31`] } } }) || 0,
      ]);
      return {
        year:     yr,
        income:   parseFloat(income),
        expenses: parseFloat(expenses),
        net:      parseFloat(income) - parseFloat(expenses),
      };
    }));
    return api.success(res, rows.reverse()); // oldest first
  } catch (err) { return api.error(res, err.message); }
};
