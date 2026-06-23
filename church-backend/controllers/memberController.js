const { Member, Income, User } = require('../models');
const api    = require('../utils/apiResponse');
const audit  = require('../services/auditService');
const emailSvc = require('../services/emailService');
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
 * Creates with status 'pending' — admin must approve before active.
 * Sends welcome email to member + alert email to all admins.
 */
exports.selfRegister = async (req, res) => {
  try {
    const { fullName, phone, email, gender, dateOfBirth, address, branchId } = req.body;

    // Prevent duplicate phone registrations
    const existing = await Member.findOne({ where: { phone } });
    if (existing) {
      return api.conflict(res,
        'A member with this phone number is already registered. Please contact the church office if you need help.');
    }

    const member = await Member.create({
      fullName:    fullName.trim(),
      phone:       phone.trim(),
      email:       email?.trim()    || null,
      gender:      gender           || null,
      dateOfBirth: dateOfBirth      || null,
      address:     address?.trim()  || null,
      branchId:    branchId         || null,
      status:      'inactive',      // pending approval — shown as inactive until approved
      joinDate:    new Date(),
    });

    // Fire emails in background — non-blocking
    emailSvc.sendMemberWelcomeEmail(member).catch(() => {});

    // Alert all admin users
    User.findAll({ where: { role: 'administrator', status: 'active' }, attributes: ['email'], raw: true })
      .then(admins => admins.forEach(a => emailSvc.sendNewMemberAlertEmail(a.email, member).catch(() => {})))
      .catch(() => {});

    return api.created(res, {
      id:       member.id,
      fullName: member.fullName,
      phone:    member.phone,
    }, `Thank you ${member.fullName}! Your registration has been received. The church office will review and activate your account shortly.`);
  } catch (err) {
    return api.error(res, err.message);
  }
};

/**
 * PATCH /members/:id/approve  — Admin only
 * Approves a pending (inactive) self-registered member → sets status to active.
 */
exports.approve = async (req, res) => {
  try {
    const member = await Member.findByPk(req.params.id);
    if (!member) return api.notFound(res, 'Member not found');
    if (member.status === 'active') return api.badRequest(res, 'Member is already active');

    const beforeSnap = audit.snapshot(member);
    await member.update({ status: 'active' });

    await audit.log(req.user.id, 'UPDATE', 'MEMBER',
      `Approved member registration: ${member.fullName}`,
      { memberId: member.id }, req,
      { before: beforeSnap, after: member });

    // Send approval confirmation email to member
    if (member.email) {
      const church = process.env.CHURCH_NAME || 'Grace Life Church';
      emailSvc.send({
        to:      member.email,
        subject: `✅ Your membership has been approved — ${church}`,
        html: `
          <div style="font-family:sans-serif;max-width:480px;margin:auto;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden">
            <div style="background:#1c1c52;padding:24px;text-align:center">
              <h2 style="color:#f5c842;margin:0">${church}</h2>
            </div>
            <div style="padding:24px;text-align:center">
              <span style="font-size:48px">✅</span>
              <h3 style="color:#059669;margin:12px 0 4px">Membership Approved!</h3>
              <p style="color:#6b7280;font-size:14px">Dear <strong>${member.fullName}</strong>, your membership at ${church} has been approved. You are now an active member!</p>
              <p style="color:#6b7280;font-size:13px;margin-top:16px">God bless you and welcome to the family! 🙏</p>
            </div>
            <div style="background:#f9fafb;padding:12px;text-align:center;font-size:11px;color:#9ca3af">${church}</div>
          </div>`,
      }).catch(() => {});
    }

    return api.success(res, member, `${member.fullName} has been approved and is now an active member`);
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
