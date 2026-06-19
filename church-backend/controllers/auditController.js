const { AuditLog, User } = require('../models');
const api = require('../utils/apiResponse');
const { getPagination, buildDateFilter } = require('../utils/helpers');
const { Op } = require('sequelize');

exports.getAll = async (req, res) => {
  try {
    const { page = 1, limit = 20, userId, action, module, startDate, endDate } = req.query;
    const { limit: lim, offset } = getPagination(page, limit);

    const where = { ...buildDateFilter(startDate, endDate, null, null, 'createdAt') };
    if (userId) where.userId = userId;
    if (action) where.action = action;
    if (module) where.module = module;

    const { count, rows } = await AuditLog.findAndCountAll({
      where, limit: lim, offset,
      include: [{ model: User, as: 'user', attributes: ['id', 'name', 'email', 'role'] }],
      order: [['createdAt', 'DESC']],
    });

    return api.paginate(res, rows, count, page, lim);
  } catch (err) {
    return api.error(res, err.message);
  }
};

exports.getById = async (req, res) => {
  try {
    const log = await AuditLog.findByPk(req.params.id, {
      include: [{ model: User, as: 'user', attributes: ['id', 'name', 'email'] }],
    });
    if (!log) return api.notFound(res, 'Audit log not found');
    return api.success(res, log);
  } catch (err) {
    return api.error(res, err.message);
  }
};
