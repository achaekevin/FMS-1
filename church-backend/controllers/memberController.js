const { Member, Income } = require('../models');
const api    = require('../utils/apiResponse');
const audit  = require('../services/auditService');
const { buildBranchFilter } = require('../middleware/branchScope');
const { getPagination, buildDateFilter } = require('../utils/helpers');
const { Op, fn, col, literal } = require('sequelize');

exports.getAll = async (req, res) => {
  try {
    const { page = 1, limit = 10, search, status } = req.query;
    const { limit: lim, offset } = getPagination(page, limit);
    const where = { ...buildBranchFilter(req.branchScope) };
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
    const branchId = req.branchScope?.isGlobal ? (req.body.branchId || null) : req.branchScope?.branchId;
    const member = await Member.create({ ...req.body, branchId });
    await audit.log(req.user.id, 'CREATE', 'MEMBER',
      `Added member: ${member.fullName}`,
      { memberId: member.id }, req,
      { after: member });
    return api.created(res, member, 'Member added successfully');
  } catch (err) {
    return api.error(res, err.message);
  }
};

/**
 * POST /members/self-register  — PUBLIC, no auth required
 * Member fills in their own details via the /join form.
 * Creates with status 'active' and marks as pending review.
 */
exports.selfRegister = async (req, res) => {
  try {
    const {
      fullName, phone, email, gender, dateOfBirth,
      address, branchId,
    } = req.body;

    // Prevent duplicate phone registrations
    const existing = await Member.findOne({ where: { phone } });
    if (existing) {
      return api.conflict(res,
        'A member with this phone number already exists. Please contact the church office if you need help.');
    }

    const member = await Member.create({
      fullName: fullName.trim(),
      phone:    phone.trim(),
      email:    email?.trim()       || null,
      gender:   gender              || null,
      dateOfBirth: dateOfBirth      || null,
      address:  address?.trim()     || null,
      branchId: branchId            || null,
      status:   'active',
      joinDate: new Date(),
    });

    return api.created(res, {
      id:       member.id,
      fullName: member.fullName,
      phone:    member.phone,
    }, `Welcome to ${process.env.CHURCH_NAME || 'Grace Life Church'}, ${member.fullName}! Your registration is complete.`);
  } catch (err) {
    return api.error(res, err.message);
  }
};

exports.update = async (req, res) => {
  try {
    const member = await Member.findByPk(req.params.id);
    if (!member) return api.notFound(res, 'Member not found');
    const beforeSnap = audit.snapshot(member);
    await member.update(req.body);
    await audit.log(req.user.id, 'UPDATE', 'MEMBER',
      `Updated member: ${member.fullName}`,
      { memberId: member.id }, req,
      { before: beforeSnap, after: member });
    return api.success(res, member, 'Member updated');
  } catch (err) {
    return api.error(res, err.message);
  }
};

exports.remove = async (req, res) => {
  try {
    const member = await Member.findByPk(req.params.id);
    if (!member) return api.notFound(res, 'Member not found');
    const beforeSnap = audit.snapshot(member);
    await member.update({ status: 'inactive' });
    await audit.log(req.user.id, 'DELETE', 'MEMBER',
      `Deactivated member: ${member.fullName}`,
      null, req,
      { before: beforeSnap });
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
