const { Op } = require('sequelize');

/**
 * Build date range filter for Sequelize queries
 */
const buildDateFilter = (startDate, endDate, month, year, field = 'date') => {
  const where = {};

  if (startDate && endDate) {
    where[field] = { [Op.between]: [new Date(startDate), new Date(endDate)] };
  } else if (startDate) {
    where[field] = { [Op.gte]: new Date(startDate) };
  } else if (endDate) {
    where[field] = { [Op.lte]: new Date(endDate) };
  } else if (month && year) {
    const start = new Date(year, month - 1, 1);
    const end   = new Date(year, month, 0, 23, 59, 59);
    where[field] = { [Op.between]: [start, end] };
  } else if (year) {
    const start = new Date(year, 0, 1);
    const end   = new Date(year, 11, 31, 23, 59, 59);
    where[field] = { [Op.between]: [start, end] };
  }

  return where;
};

/**
 * Pagination helper
 */
const getPagination = (page = 1, limit = 10) => {
  const p = Math.max(1, parseInt(page));
  const l = Math.min(100, Math.max(1, parseInt(limit)));
  return { limit: l, offset: (p - 1) * l };
};

/**
 * Format currency in KES
 */
const formatCurrency = (amount) =>
  new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES', minimumFractionDigits: 2 }).format(amount);

/**
 * Format date
 */
const formatDate = (date) =>
  new Date(date).toLocaleDateString('en-KE', { year: 'numeric', month: 'long', day: 'numeric' });

/**
 * Generate M-Pesa timestamp
 */
const getMpesaTimestamp = () => {
  const now  = new Date();
  const pad  = (n) => String(n).padStart(2, '0');
  return `${now.getFullYear()}${pad(now.getMonth()+1)}${pad(now.getDate())}${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
};

/**
 * Generate M-Pesa password
 */
const getMpesaPassword = (shortcode, passkey, timestamp) => {
  const str = `${shortcode}${passkey}${timestamp}`;
  return Buffer.from(str).toString('base64');
};

module.exports = { buildDateFilter, getPagination, formatCurrency, formatDate, getMpesaTimestamp, getMpesaPassword };
