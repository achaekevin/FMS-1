const { Fund } = require('../models');
const { sequelize } = require('../config/sequelize');
const logger = require('../utils/logger');

const creditFund = async (fundId, amount, transaction = null) => {
  if (!fundId) return;
  try {
    await Fund.increment(
      { balance: amount, totalIncome: amount },
      { where: { id: fundId }, transaction }
    );
  } catch (err) {
    logger.error('fundService.creditFund error:', err.message);
    throw err;
  }
};

const debitFund = async (fundId, amount, transaction = null) => {
  if (!fundId) return;
  try {
    const fund = await Fund.findByPk(fundId, { transaction });
    if (!fund) throw new Error('Fund not found');
    if (parseFloat(fund.balance) < parseFloat(amount))
      throw new Error(`Insufficient balance in ${fund.fundName}. Available: KES ${fund.balance}`);

    await Fund.increment(
      { balance: -amount, totalExpenses: amount },
      { where: { id: fundId }, transaction }
    );
  } catch (err) {
    logger.error('fundService.debitFund error:', err.message);
    throw err;
  }
};

const reverseCreditFund = async (fundId, amount, transaction = null) => {
  if (!fundId) return;
  await Fund.increment(
    { balance: -amount, totalIncome: -amount },
    { where: { id: fundId }, transaction }
  );
};

const reverseDebitFund = async (fundId, amount, transaction = null) => {
  if (!fundId) return;
  await Fund.increment(
    { balance: amount, totalExpenses: -amount },
    { where: { id: fundId }, transaction }
  );
};

module.exports = { creditFund, debitFund, reverseCreditFund, reverseDebitFund };
