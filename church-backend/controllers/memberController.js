const { Member, Income } = require('../models');
const api    = require('../utils/apiResponse');
const audit  = require('../services/auditService');
const { getPagination, buildDateFilter } = require('../utils/helpers');
const { Op, fn, col, literal } = require('sequelize');

exports.getAll = async (req, res) => {
  try {
    const { page = 1, limit = 10, search, status } = req.query;
    const { limit: lim, offset } = getPagination(page, limit);
    const where = {};
    if (search) where[Op.or] = [
      { fullName: { [Op.like]: `%${search}%` } },
      { phone:    { [Op.like]: `%${search}%` } },
      { email:    { [Op.like]: `%${search}%` } },
    ];
    if (status) where.status = status;

    const { count, rows } = await Member.findAndCountAll({
      where, limit: lim, offset, order: [['fullName', 'ASC']],
    });
    return api.paginate(res, rows, count, page, lim);
  } catch (err) {
    return api.error(res, err.message);
  }
};

exports.getById = async (req, res) => {
  try {
    const member = await Member.findByPk(req.params.id);
    if (!member) return api.notFound(res, 'Member not found');
    return api.success(res, member);
  } catch (err) {
    return api.error(res, err.message);
  }
};

exports.create = async (req, res) => {
  try {
    const member = await Member.create(req.body);
    await audit.log(req.user.id, 'CREATE', 'MEMBER', `Added member: ${member.fullName}`, { memberId: member.id }, req);
    return api.created(res, member, 'Member added successfully');
  } catch (err) {
    return api.error(res, err.message);
  }
};

exports.update = async (req, res) => {
  try {
    const member = await Member.findByPk(req.params.id);
    if (!member) return api.notFound(res, 'Member not found');
    await member.update(req.body);
    await audit.log(req.user.id, 'UPDATE', 'MEMBER', `Updated member: ${member.fullName}`, { memberId: member.id }, req);
    return api.success(res, member, 'Member updated');
  } catch (err) {
    return api.error(res, err.message);
  }
};

exports.remove = async (req, res) => {
  try {
    const member = await Member.findByPk(req.params.id);
    if (!member) return api.notFound(res, 'Member not found');
    await member.update({ status: 'inactive' });
    await audit.log(req.user.id, 'DELETE', 'MEMBER', `Deactivated member: ${member.fullName}`, null, req);
    return api.success(res, null, 'Member deactivated');
  } catch (err) {
    return api.error(res, err.message);
  }
};

exports.getContributions = async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 20, startDate, endDate, month, year } = req.query;
    const { limit: lim, offset } = getPagination(page, limit);

    const member = await Member.findByPk(id);
    if (!member) return api.notFound(res, 'Member not found');

    const dateFilter = buildDateFilter(startDate, endDate, month, year);
    const { count, rows } = await Income.findAndCountAll({
      where: { memberId: id, ...dateFilter },
      limit: lim, offset, order: [['date', 'DESC']],
    });

    const totals = await Income.findAll({
      where: { memberId: id, ...dateFilter },
      attributes: [
        'type',
        [fn('SUM', col('amount')), 'total'],
        [fn('COUNT', col('id')), 'count'],
      ],
      group: ['type'],
      raw: true,
    });

    const grandTotal = totals.reduce((s, t) => s + parseFloat(t.total), 0);

    return api.paginate(res, { member, contributions: rows, totals, grandTotal }, count, page, lim);
  } catch (err) {
    return api.error(res, err.message);
  }
};
