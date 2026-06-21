const { PrayerRequest, User, Member } = require('../models');
const api    = require('../utils/apiResponse');
const audit  = require('../services/auditService');
const { getPagination } = require('../utils/helpers');
const { Op, literal } = require('sequelize');

// ── Association includes ──────────────────────────────────────────────────────

const SUBMITTER_INCLUDE = { model: User, as: 'submitter', attributes: ['id', 'name'] };
const ASSIGNEE_INCLUDE  = { model: User, as: 'assignee',  attributes: ['id', 'name'] };
const MEMBER_INCLUDE    = { model: Member, as: 'member',  attributes: ['id', 'fullName', 'phone', 'email'] };

/** Build include array – hides member details for anonymous requests unless admin/pastor */
const buildInclude = (user) => {
  const canSeePII = ['administrator', 'pastor'].includes(user.role);
  return [
    SUBMITTER_INCLUDE,
    ASSIGNEE_INCLUDE,
    ...(canSeePII ? [MEMBER_INCLUDE] : []),
  ];
};

/** Determine whether a user can see a private prayer request */
const canAccessPrivate = (user, request) => {
  if (['administrator'].includes(user.role)) return true;
  if (user.role === 'pastor' && request.assignedTo === user.id) return true;
  if (request.submittedBy === user.id) return true;
  return false;
};

// ── GET /prayer-requests ──────────────────────────────────────────────────────

exports.getAll = async (req, res) => {
  try {
    const { page = 1, limit = 20, status, category, priority, assignedTo, memberId } = req.query;
    const { limit: lim, offset } = getPagination(page, limit);

    const where = {};
    if (status)     where.status   = status;
    if (category)   where.category = category;
    if (priority)   where.priority = priority;
    if (assignedTo) where.assignedTo = assignedTo;
    if (memberId)   where.memberId   = memberId;

    // Non-admins and non-pastors only see public requests + their own
    const isPrivileged = ['administrator', 'pastor'].includes(req.user.role);
    if (!isPrivileged) {
      where[Op.or] = [
        { isPrivate: false },
        { submittedBy: req.user.id },
      ];
    }

    const { count, rows } = await PrayerRequest.findAndCountAll({
      where,
      limit: lim,
      offset,
      include: buildInclude(req.user),
      order: [
        ['priority', 'ASC'],   // High < Medium < Low (alphabetical ENUM sort)
        ['createdAt', 'DESC'],
      ],
    });

    // Strip sensitive fields from anonymous requests for non-privileged users
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

// ── POST /prayer-requests ─────────────────────────────────────────────────────

exports.create = async (req, res) => {
  try {
    const {
      memberId, requesterName, category, title, description,
      isAnonymous = false, isPrivate = false, priority = 'Medium',
    } = req.body;

    const pr = await PrayerRequest.create({
      memberId:      memberId || null,
      submittedBy:   req.user.id,
      requesterName: requesterName || req.user.name,
      category,
      title,
      description,
      isAnonymous,
      isPrivate,
      priority,
      status: 'Pending',
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

    const isAdmin    = req.user.role === 'administrator';
    const isPastor   = req.user.role === 'pastor';
    const isOwner    = r.submittedBy === req.user.id;

    if (!isAdmin && !isPastor && !isOwner)
      return api.forbidden(res, 'You are not authorised to edit this prayer request');

    // Fields anyone (owner/pastor/admin) can update
    const allowed = ['title', 'description', 'category', 'priority', 'isPrivate', 'isAnonymous'];

    // Pastor/admin-only fields
    const privilegedFields = ['status', 'assignedTo', 'pastorNote', 'resolvedAt'];

    const updates = {};
    allowed.forEach(f => { if (req.body[f] !== undefined) updates[f] = req.body[f]; });

    if (isAdmin || isPastor) {
      privilegedFields.forEach(f => { if (req.body[f] !== undefined) updates[f] = req.body[f]; });

      // Auto-set resolvedAt when status flips to Answered/Closed
      if (['Answered', 'Closed'].includes(updates.status) && !r.resolvedAt) {
        updates.resolvedAt = new Date();
      }
      // Clear resolvedAt if status is reset to Pending/In Progress
      if (['Pending', 'In Progress'].includes(updates.status)) {
        updates.resolvedAt = null;
      }
    }

    await r.update(updates);
    await audit.log(req.user.id, 'UPDATE', 'PRAYER_REQUEST', `Updated prayer request: ${r.title}`, { id: r.id }, req);

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

    // Verify the target user exists and has an appropriate role
    const pastor = await User.findOne({
      where: { id: assignedTo, role: { [Op.in]: ['pastor', 'administrator'] }, status: 'active' },
    });
    if (!pastor) return api.notFound(res, 'Target pastor/admin user not found or inactive');

    await r.update({ assignedTo, status: r.status === 'Pending' ? 'In Progress' : r.status });
    await audit.log(
      req.user.id, 'UPDATE', 'PRAYER_REQUEST',
      `Assigned prayer request "${r.title}" to user ${assignedTo}`,
      { id: r.id, assignedTo }, req,
    );

    const updated = await PrayerRequest.findByPk(r.id, { include: buildInclude(req.user) });
    return api.success(res, updated, `Prayer request assigned to ${pastor.name}`);
  } catch (err) { return api.error(res, err.message); }
};

// ── PATCH /prayer-requests/:id/pray ──────────────────────────────────────────
/** Increment the prayer count – any authenticated user can click "I prayed for this" */

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
    await audit.log(req.user.id, 'DELETE', 'PRAYER_REQUEST', `Deleted prayer request: ${r.title}`, null, req);
    return api.success(res, null, 'Prayer request deleted');
  } catch (err) { return api.error(res, err.message); }
};

// ── GET /prayer-requests/stats ────────────────────────────────────────────────

exports.getStats = async (req, res) => {
  try {
    const [byStatus, byCategory] = await Promise.all([
      PrayerRequest.findAll({
        attributes: ['status', [literal('COUNT(*)'), 'count']],
        group: ['status'],
        raw: true,
      }),
      PrayerRequest.findAll({
        attributes: ['category', [literal('COUNT(*)'), 'count']],
        group: ['category'],
        raw: true,
      }),
    ]);

    const total = await PrayerRequest.count();
    return api.success(res, { total, byStatus, byCategory }, 'Prayer request statistics');
  } catch (err) { return api.error(res, err.message); }
};

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Hide requester PII for anonymous requests when the viewer lacks privileges.
 * Also hide pastorNote from non-privileged viewers.
 */
function sanitiseRequest(record, user) {
  const plain = record.toJSON ? record.toJSON() : record;
  const canSeePII = ['administrator', 'pastor'].includes(user.role);

  if (plain.isAnonymous && !canSeePII) {
    plain.requesterName = 'Anonymous';
    plain.member        = undefined;
    plain.memberId      = undefined;
  }
  if (!canSeePII) {
    delete plain.pastorNote;
  }
  return plain;
}
