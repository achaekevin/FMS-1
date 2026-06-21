const { PrayerRequest, User, Member } = require('../models');
const api    = require('../utils/apiResponse');
const audit  = require('../services/auditService');
const comms  = require('../services/communicationService');
const { getPagination } = require('../utils/helpers');
const { Op, literal } = require('sequelize');

// ── Association includes ──────────────────────────────────────────────────────

const SUBMITTER_INCLUDE = { model: User,   as: 'submitter', attributes: ['id', 'name'] };
const ASSIGNEE_INCLUDE  = { model: User,   as: 'assignee',  attributes: ['id', 'name'] };
const MEMBER_INCLUDE    = { model: Member, as: 'member',    attributes: ['id', 'fullName', 'phone', 'email'] };

const buildInclude = (user) => {
  const canSeePII = ['administrator', 'pastor'].includes(user?.role);
  return [
    SUBMITTER_INCLUDE,
    ASSIGNEE_INCLUDE,
    ...(canSeePII ? [MEMBER_INCLUDE] : []),
  ];
};

const canAccessPrivate = (user, request) => {
  if (!user) return false;
  if (user.role === 'administrator') return true;
  if (user.role === 'pastor' && request.assignedTo === user.id) return true;
  if (request.submittedBy === user.id) return true;
  return false;
};

// ── Public: submit without login ──────────────────────────────────────────────
// POST /prayer-requests/public

exports.publicSubmit = async (req, res) => {
  try {
    const {
      requesterName, email, phone, category, title, description,
      isAnonymous = false, priority = 'Medium',
    } = req.body;

    const pr = await PrayerRequest.create({
      memberId:      null,
      submittedBy:   null,  // public submission — no user account
      requesterName: requesterName.trim(),
      email:         email   ? email.toLowerCase().trim()  : null,
      phone:         phone   ? phone.trim()                : null,
      category,
      title:         title.trim(),
      description:   description.trim(),
      isAnonymous,
      isPrivate:     false,
      priority,
      status:        'Pending',
    });

    return api.created(res, {
      id: pr.id,
      title: pr.title,
      category: pr.category,
      status: pr.status,
    }, 'Your prayer request has been submitted. We will be praying for you!');
  } catch (err) { return api.error(res, err.message); }
};

// ── GET /prayer-requests ──────────────────────────────────────────────────────

exports.getAll = async (req, res) => {
  try {
    const { page = 1, limit = 20, status, category, priority, assignedTo, memberId } = req.query;
    const { limit: lim, offset } = getPagination(page, limit);

    const where = {};
    if (status)     where.status    = status;
    if (category)   where.category  = category;
    if (priority)   where.priority  = priority;
    if (assignedTo) where.assignedTo = assignedTo;
    if (memberId)   where.memberId   = memberId;

    const isPrivileged = ['administrator', 'pastor'].includes(req.user.role);
    if (!isPrivileged) {
      where[Op.or] = [
        { isPrivate: false },
        { submittedBy: req.user.id },
      ];
    }

    const { count, rows } = await PrayerRequest.findAndCountAll({
      where, limit: lim, offset,
      include: buildInclude(req.user),
      order: [['priority', 'ASC'], ['createdAt', 'DESC']],
    });

    const sanitised = rows.map(r => sanitiseRequest(r, req.user));
    return api.paginate(res, sanitised, count, page, lim);
  } catch (err) { return api.error(res, err.message); }
};

// ── GET /prayer-requests/:id ──────────────────────────────────────────────────

exports.getById = async (req, res) => {
  try {
    const r = await PrayerRequest.findByPk(req.params.id, { include: buildInclude(req.user) });
    if (!r) return api.notFound(res, 'Prayer request not found');

    if (r.isPrivate && !canAccessPrivate(req.user, r))
      return api.forbidden(res, 'This prayer request is private');

    return api.success(res, sanitiseRequest(r, req.user));
  } catch (err) { return api.error(res, err.message); }
};

// ── POST /prayer-requests (authenticated) ─────────────────────────────────────

exports.create = async (req, res) => {
  try {
    const {
      memberId, requesterName, email, phone, category, title, description,
      isAnonymous = false, isPrivate = false, priority = 'Medium',
    } = req.body;

    const pr = await PrayerRequest.create({
      memberId:      memberId || null,
      submittedBy:   req.user.id,
      requesterName: requesterName || req.user.name,
      email:         email  ? email.toLowerCase().trim()  : null,
      phone:         phone  ? phone.trim()                : null,
      category, title, description, isAnonymous, isPrivate, priority, status: 'Pending',
    });

    await audit.log(req.user.id, 'CREATE', 'PRAYER_REQUEST', `New prayer request: ${title}`, { id: pr.id }, req);
    const full = await PrayerRequest.findByPk(pr.id, { include: buildInclude(req.user) });
    return api.created(res, full, 'Prayer request submitted successfully');
  } catch (err) { return api.error(res, err.message); }
};

// ── PUT /prayer-requests/:id ──────────────────────────────────────────────────

exports.update = async (req, res) => {
  try {
    const r = await PrayerRequest.findByPk(req.params.id);
    if (!r) return api.notFound(res, 'Prayer request not found');

    const isAdmin  = req.user.role === 'administrator';
    const isPastor = req.user.role === 'pastor';
    const isOwner  = r.submittedBy === req.user.id;

    if (!isAdmin && !isPastor && !isOwner)
      return api.forbidden(res, 'You are not authorised to edit this prayer request');

    const allowed          = ['title', 'description', 'category', 'priority', 'isPrivate', 'isAnonymous', 'email', 'phone'];
    const privilegedFields = ['status', 'assignedTo', 'pastorNote', 'resolvedAt'];

    const updates = {};
    allowed.forEach(f => { if (req.body[f] !== undefined) updates[f] = req.body[f]; });

    const previousStatus = r.status;

    if (isAdmin || isPastor) {
      privilegedFields.forEach(f => { if (req.body[f] !== undefined) updates[f] = req.body[f]; });
      if (['Answered', 'Closed'].includes(updates.status) && !r.resolvedAt) {
        updates.resolvedAt = new Date();
      }
      if (['Pending', 'In Progress'].includes(updates.status)) {
        updates.resolvedAt = null;
      }
    }

    await r.update(updates);
    await audit.log(req.user.id, 'UPDATE', 'PRAYER_REQUEST', `Updated: ${r.title}`, { id: r.id }, req);

    // ── Notify submitter when status becomes "Answered" ──────────────────────
    if (updates.status === 'Answered' && previousStatus !== 'Answered') {
      const fresh = await PrayerRequest.findByPk(r.id);
      const notifyPayload = {
        id:            fresh.id,
        requesterName: fresh.requesterName,
        title:         fresh.title,
        description:   fresh.description,
        email:         fresh.email,
        phone:         fresh.phone,
        pastorNote:    fresh.pastorNote,
      };

      // Also check if linked member has contact details
      if (!notifyPayload.email && fresh.memberId) {
        const member = await Member.findByPk(fresh.memberId, { attributes: ['email', 'phone', 'fullName'] });
        if (member) {
          notifyPayload.email = member.email;
          notifyPayload.phone = notifyPayload.phone || member.phone;
        }
      }

      comms.sendPrayerRequestAnswered({ request: notifyPayload }).catch(() => {});
    }

    const updated = await PrayerRequest.findByPk(r.id, { include: buildInclude(req.user) });
    return api.success(res, sanitiseRequest(updated, req.user), 'Prayer request updated');
  } catch (err) { return api.error(res, err.message); }
};

// ── PATCH /prayer-requests/:id/assign ────────────────────────────────────────

exports.assign = async (req, res) => {
  try {
    const r = await PrayerRequest.findByPk(req.params.id);
    if (!r) return api.notFound(res, 'Prayer request not found');

    const { assignedTo } = req.body;
    if (!assignedTo) return api.badRequest(res, 'assignedTo is required');

    const pastor = await User.findOne({
      where: { id: assignedTo, role: { [Op.in]: ['pastor', 'administrator'] }, status: 'active' },
    });
    if (!pastor) return api.notFound(res, 'Target pastor/admin user not found or inactive');

    await r.update({ assignedTo, status: r.status === 'Pending' ? 'In Progress' : r.status });
    await audit.log(req.user.id, 'UPDATE', 'PRAYER_REQUEST', `Assigned "${r.title}" to user ${assignedTo}`, { id: r.id, assignedTo }, req);

    const updated = await PrayerRequest.findByPk(r.id, { include: buildInclude(req.user) });
    return api.success(res, updated, `Prayer request assigned to ${pastor.name}`);
  } catch (err) { return api.error(res, err.message); }
};

// ── PATCH /prayer-requests/:id/pray ──────────────────────────────────────────

exports.incrementPrayerCount = async (req, res) => {
  try {
    const r = await PrayerRequest.findByPk(req.params.id);
    if (!r) return api.notFound(res, 'Prayer request not found');

    if (r.isPrivate && !canAccessPrivate(req.user, r))
      return api.forbidden(res, 'This prayer request is private');

    await r.increment('prayerCount');
    await r.reload();
    return api.success(res, { id: r.id, prayerCount: r.prayerCount }, 'Prayer recorded');
  } catch (err) { return api.error(res, err.message); }
};

// ── DELETE /prayer-requests/:id ───────────────────────────────────────────────

exports.remove = async (req, res) => {
  try {
    const r = await PrayerRequest.findByPk(req.params.id);
    if (!r) return api.notFound(res, 'Prayer request not found');

    const isAdmin = req.user.role === 'administrator';
    const isOwner = r.submittedBy === req.user.id;

    if (!isAdmin && !isOwner)
      return api.forbidden(res, 'You are not authorised to delete this prayer request');

    await r.destroy();
    await audit.log(req.user.id, 'DELETE', 'PRAYER_REQUEST', `Deleted: ${r.title}`, null, req);
    return api.success(res, null, 'Prayer request deleted');
  } catch (err) { return api.error(res, err.message); }
};

// ── GET /prayer-requests/stats ────────────────────────────────────────────────

exports.getStats = async (req, res) => {
  try {
    const [byStatus, byCategory] = await Promise.all([
      PrayerRequest.findAll({ attributes: ['status', [literal('COUNT(*)'), 'count']], group: ['status'], raw: true }),
      PrayerRequest.findAll({ attributes: ['category', [literal('COUNT(*)'), 'count']], group: ['category'], raw: true }),
    ]);
    const total = await PrayerRequest.count();
    return api.success(res, { total, byStatus, byCategory });
  } catch (err) { return api.error(res, err.message); }
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function sanitiseRequest(record, user) {
  const plain = record.toJSON ? record.toJSON() : record;
  const canSeePII = ['administrator', 'pastor'].includes(user?.role);

  if (plain.isAnonymous && !canSeePII) {
    plain.requesterName = 'Anonymous';
    plain.member        = undefined;
    plain.memberId      = undefined;
    plain.email         = undefined;
    plain.phone         = undefined;
  }
  if (!canSeePII) {
    delete plain.pastorNote;
    // Hide contact details from non-privileged viewers
    if (!plain.isAnonymous) {
      delete plain.email;
      delete plain.phone;
    }
  }
  return plain;
}
