const { Fund } = require('../models');
const { sequelize } = require('../config/sequelize');
const logger = require('../utils/logger');

/**
 * Credit a fund when income is recorded
 */
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

/**
 * Debit a fund when expense is recorded
 */
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

/**
 * Reverse a credit (on income delete)
 */
const reverseCreditFund = async (fundId, amount, transaction = null) => {
  if (!fundId) return;
  await Fund.increment(
    { balance: -amount, totalIncome: -amount },
    { where: { id: fundId }, transaction }
  );
};

/**
 * Reverse a debit (on expense delete)
 */
const reverseDebitFund = async (fundId, amount, transaction = null) => {
  if (!fundId) return;
  await Fund.increment(
    { balance: amount, totalExpenses: -amount },
    { where: { id: fundId }, transaction }
  );
};

module.exports = { creditFund, debitFund, reverseCreditFund, reverseDebitFund };
