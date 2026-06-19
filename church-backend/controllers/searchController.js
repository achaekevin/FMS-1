const { Member, Income, Expense, MpesaTransaction, Event, Asset } = require('../models');
const api = require('../utils/apiResponse');
const { Op } = require('sequelize');

/**
 * GET /search?q=term&limit=5
 * Searches across Members, Income, Expenses, Transactions, Events, Assets
 */
exports.globalSearch = async (req, res) => {
  try {
    const { q, limit = 5 } = req.query;
    if (!q || q.trim().length < 2)
      return api.badRequest(res, 'Query must be at least 2 characters');

    const term = `%${q.trim()}%`;
    const lim  = Math.min(parseInt(limit) || 5, 20);

    const [members, income, expenses, transactions, events, assets] = await Promise.all([
      Member.findAll({
        where: { [Op.or]: [
          { fullName: { [Op.like]: term } },
          { phone:    { [Op.like]: term } },
          { email:    { [Op.like]: term } },
        ]},
        attributes: ['id','fullName','phone','email','status'],
        limit: lim,
      }),

      Income.findAll({
        where: { [Op.or]: [
          { type:        { [Op.like]: term } },
          { description: { [Op.like]: term } },
          { mpesaRef:    { [Op.like]: term } },
        ]},
        attributes: ['id','type','amount','paymentMethod','date'],
        limit: lim,
      }),

      Expense.findAll({
        where: { [Op.or]: [
          { category:    { [Op.like]: term } },
          { description: { [Op.like]: term } },
          { approvedBy:  { [Op.like]: term } },
        ]},
        attributes: ['id','category','amount','approvedBy','date'],
        limit: lim,
      }),

      MpesaTransaction.findAll({
        where: { [Op.or]: [
          { phone:               { [Op.like]: term } },
          { mpesaReceiptNumber:  { [Op.like]: term } },
          { checkoutRequestId:   { [Op.like]: term } },
        ]},
        attributes: ['id','phone','amount','status','mpesaReceiptNumber'],
        limit: lim,
      }),

      Event.findAll({
        where: { [Op.or]: [
          { title:    { [Op.like]: term } },
          { location: { [Op.like]: term } },
          { category: { [Op.like]: term } },
        ]},
        attributes: ['id','title','category','eventDate','status'],
        limit: lim,
      }),

      Asset.findAll({
        where: { [Op.or]: [
          { assetName:    { [Op.like]: term } },
          { serialNumber: { [Op.like]: term } },
          { category:     { [Op.like]: term } },
        ]},
        attributes: ['id','assetName','category','value','condition'],
        limit: lim,
      }),
    ]);

    const total = members.length + income.length + expenses.length +
                  transactions.length + events.length + assets.length;

    return api.success(res, {
      query: q.trim(),
      total,
      results: {
        members:      { count: members.length,      data: members },
        income:       { count: income.length,        data: income },
        expenses:     { count: expenses.length,      data: expenses },
        transactions: { count: transactions.length,  data: transactions },
        events:       { count: events.length,        data: events },
        assets:       { count: assets.length,        data: assets },
      },
    });
  } catch (err) { return api.error(res, err.message); }
};
