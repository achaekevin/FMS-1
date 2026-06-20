const { v4: uuidv4 } = require('uuid');
const QRCode = require('qrcode');
const { AttendanceSession, AttendanceRecord, Member, User } = require('../models');
const api   = require('../utils/apiResponse');
const audit = require('../services/auditService');
const { getPagination, buildDateFilter } = require('../utils/helpers');
const { Op, fn, col } = require('sequelize');

const SESSION_INCLUDE = [{ model: User, as: 'creator', attributes: ['id','name'] }];
const RECORD_INCLUDE  = [
  { model: Member, as: 'member', attributes: ['id','fullName','phone','email'], required: false },
  { model: User,   as: 'recorder', attributes: ['id','name'], required: false },
];

// ─── Sessions ─────────────────────────────────────────────

/** GET /api/attendance/sessions */
exports.getSessions = async (req, res) => {
  try {
    const { page = 1, limit = 20, serviceType, isOpen, startDate, endDate } = req.query;
    const { limit: lim, offset } = getPagination(page, limit);
    const where = { ...buildDateFilter(startDate, endDate, null, null, 'sessionDate') };
    if (serviceType) where.serviceType = serviceType;
    if (isOpen !== undefined) where.isOpen = isOpen === 'true';

    const { count, rows } = await AttendanceSession.findAndCountAll({
      where, limit: lim, offset,
      include: SESSION_INCLUDE,
      order: [['sessionDate','DESC'],['startTime','DESC']],
    });
    return api.paginate(res, rows, count, page, lim);
  } catch (err) { return api.error(res, err.message); }
};

/** GET /api/attendance/sessions/stats */
exports.getStats = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const dateWhere = buildDateFilter(startDate, endDate, null, null, 'sessionDate');

    const [totalSessions, byType, topAttended, recentSessions] = await Promise.all([
      AttendanceSession.count({ where: dateWhere }),

      AttendanceSession.findAll({
        where: dateWhere,
        attributes: ['serviceType', [fn('COUNT', col('AttendanceSession.id')), 'count']],
        include: [{ model: AttendanceRecord, as: 'records', attributes: [] }],
        group: ['serviceType'],
        raw: true,
      }),

      // Top 5 sessions by attendance
      AttendanceSession.findAll({
        where: dateWhere,
        attributes: [
          'id','title','serviceType','sessionDate',
          [fn('COUNT', col('records.id')), 'attendanceCount'],
        ],
        include: [{ model: AttendanceRecord, as: 'records', attributes: [] }],
        group: ['AttendanceSession.id'],
        order: [[fn('COUNT', col('records.id')), 'DESC']],
        limit: 5,
      }),

      // Last 8 sessions with counts for trend chart
      AttendanceSession.findAll({
        where: dateWhere,
        attributes: [
          'id','title','serviceType','sessionDate',
          [fn('COUNT', col('records.id')), 'attendanceCount'],
        ],
        include: [{ model: AttendanceRecord, as: 'records', attributes: [] }],
        group: ['AttendanceSession.id'],
        order: [['sessionDate','DESC']],
        limit: 8,
      }),
    ]);

    const totalAttendance = await AttendanceRecord.count({
      include: [{
        model: AttendanceSession, as: 'session',
        where: dateWhere, attributes: [],
      }],
    });

    return api.success(res, {
      totalSessions,
      totalAttendance,
      avgAttendance: totalSessions ? Math.round(totalAttendance / totalSessions) : 0,
      byType,
      topAttended,
      trend: recentSessions.reverse(),
    });
  } catch (err) { return api.error(res, err.message); }
};

/** GET /api/attendance/sessions/:id */
exports.getSession = async (req, res) => {
  try {
    const session = await AttendanceSession.findByPk(req.params.id, {
      include: [
        ...SESSION_INCLUDE,
        { model: AttendanceRecord, as: 'records', include: RECORD_INCLUDE },
      ],
    });
    if (!session) return api.notFound(res, 'Session not found');
    return api.success(res, session);
  } catch (err) { return api.error(res, err.message); }
};

/** POST /api/attendance/sessions */
exports.createSession = async (req, res) => {
  try {
    const { title, serviceType, sessionDate, startTime, endTime, location,
            description, expectedCount, notes, qrDurationMinutes } = req.body;

    // Generate QR token
    const qrToken = uuidv4().replace(/-/g,'');
    const qrExpiresAt = qrDurationMinutes
      ? new Date(Date.now() + Number(qrDurationMinutes) * 60 * 1000)
      : null;

    const session = await AttendanceSession.create({
      createdBy: req.user.id, title, serviceType, sessionDate,
      startTime: startTime || null, endTime: endTime || null,
      location: location || null, description: description || null,
      expectedCount: expectedCount || 0, notes: notes || null,
      qrToken, qrExpiresAt, isOpen: true,
    });

    await audit.log(req.user.id, 'CREATE', 'EVENT',
      `Created attendance session: "${title}" (${serviceType})`,
      { sessionId: session.id }, req, { after: session });

    const full = await AttendanceSession.findByPk(session.id, { include: SESSION_INCLUDE });
    return api.created(res, full, 'Attendance session created');
  } catch (err) { return api.error(res, err.message); }
};

/** PUT /api/attendance/sessions/:id */
exports.updateSession = async (req, res) => {
  try {
    const session = await AttendanceSession.findByPk(req.params.id);
    if (!session) return api.notFound(res, 'Session not found');
    const before = audit.snapshot(session);
    await session.update(req.body);
    await audit.log(req.user.id, 'UPDATE', 'EVENT',
      `Updated attendance session: "${session.title}"`,
      { sessionId: session.id }, req, { before, after: session });
    const full = await AttendanceSession.findByPk(session.id, { include: SESSION_INCLUDE });
    return api.success(res, full, 'Session updated');
  } catch (err) { return api.error(res, err.message); }
};

/** PATCH /api/attendance/sessions/:id/close */
exports.closeSession = async (req, res) => {
  try {
    const session = await AttendanceSession.findByPk(req.params.id);
    if (!session) return api.notFound(res, 'Session not found');
    await session.update({ isOpen: false });
    await audit.log(req.user.id, 'UPDATE', 'EVENT',
      `Closed attendance session: "${session.title}"`, { sessionId: session.id }, req);
    return api.success(res, session, 'Session closed');
  } catch (err) { return api.error(res, err.message); }
};

/** PATCH /api/attendance/sessions/:id/reopen */
exports.reopenSession = async (req, res) => {
  try {
    const session = await AttendanceSession.findByPk(req.params.id);
    if (!session) return api.notFound(res, 'Session not found');
    await session.update({ isOpen: true, qrExpiresAt: null });
    return api.success(res, session, 'Session reopened');
  } catch (err) { return api.error(res, err.message); }
};

/** DELETE /api/attendance/sessions/:id */
exports.deleteSession = async (req, res) => {
  try {
    const session = await AttendanceSession.findByPk(req.params.id);
    if (!session) return api.notFound(res, 'Session not found');
    await session.destroy(); // cascade deletes records
    await audit.log(req.user.id, 'DELETE', 'EVENT',
      `Deleted attendance session: "${session.title}"`, null, req);
    return api.success(res, null, 'Session deleted');
  } catch (err) { return api.error(res, err.message); }
};

/** GET /api/attendance/sessions/:id/qrcode — return QR as PNG data URL */
exports.getQrCode = async (req, res) => {
  try {
    const session = await AttendanceSession.findByPk(req.params.id);
    if (!session) return api.notFound(res, 'Session not found');

    const checkInUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/attendance/checkin/${session.qrToken}`;
    const dataUrl = await QRCode.toDataURL(checkInUrl, {
      width: 300, margin: 2,
      color: { dark: '#1c1c52', light: '#ffffff' },
    });

    return api.success(res, {
      qrCode:     dataUrl,
      checkInUrl,
      qrToken:    session.qrToken,
      expiresAt:  session.qrExpiresAt,
      sessionTitle: session.title,
    });
  } catch (err) { return api.error(res, err.message); }
};

// ─── Records ──────────────────────────────────────────────

/** POST /api/attendance/sessions/:id/checkin — manual check-in by admin/usher */
exports.manualCheckIn = async (req, res) => {
  try {
    const session = await AttendanceSession.findByPk(req.params.id);
    if (!session) return api.notFound(res, 'Session not found');
    if (!session.isOpen) return api.badRequest(res, 'This session is closed for check-ins');

    const { memberId, guestName, guestPhone, notes } = req.body;
    if (!memberId && !guestName) return api.badRequest(res, 'Provide memberId or guestName');

    // Prevent duplicate for known members
    if (memberId) {
      const existing = await AttendanceRecord.findOne({
        where: { sessionId: session.id, memberId },
      });
      if (existing) return api.badRequest(res, 'Member already checked in to this session');
    }

    const record = await AttendanceRecord.create({
      sessionId: session.id, memberId: memberId || null,
      guestName: guestName || null, guestPhone: guestPhone || null,
      checkInMethod: 'Manual', recordedBy: req.user.id,
      checkInTime: new Date(), notes: notes || null,
    });

    const full = await AttendanceRecord.findByPk(record.id, { include: RECORD_INCLUDE });
    return api.created(res, full, 'Check-in recorded');
  } catch (err) { return api.error(res, err.message); }
};

/** POST /api/attendance/checkin/:token — QR self check-in (public-ish, no strict auth needed) */
exports.qrCheckIn = async (req, res) => {
  try {
    const session = await AttendanceSession.findOne({
      where: { qrToken: req.params.token },
    });
    if (!session) return api.notFound(res, 'Invalid QR code');
    if (!session.isOpen) return api.badRequest(res, 'This session is closed');
    if (session.qrExpiresAt && new Date() > session.qrExpiresAt)
      return api.badRequest(res, 'This QR code has expired');

    const { memberId, guestName, guestPhone, notes } = req.body;
    if (!memberId && !guestName) return api.badRequest(res, 'Provide memberId or your name');

    if (memberId) {
      const existing = await AttendanceRecord.findOne({
        where: { sessionId: session.id, memberId },
      });
      if (existing) return api.badRequest(res, 'You have already checked in to this session');
    }

    const record = await AttendanceRecord.create({
      sessionId: session.id, memberId: memberId || null,
      guestName: guestName || null, guestPhone: guestPhone || null,
      checkInMethod: 'QR Code', recordedBy: null,
      checkInTime: new Date(), notes: notes || null,
    });

    const full = await AttendanceRecord.findByPk(record.id, { include: RECORD_INCLUDE });
    return api.created(res, full, `Welcome! You've been checked in to "${session.title}"`);
  } catch (err) { return api.error(res, err.message); }
};

/** DELETE /api/attendance/records/:id — remove a check-in record */
exports.removeRecord = async (req, res) => {
  try {
    const record = await AttendanceRecord.findByPk(req.params.id);
    if (!record) return api.notFound(res, 'Record not found');
    await record.destroy();
    await audit.log(req.user.id, 'DELETE', 'EVENT',
      `Removed attendance record #${record.id}`, null, req);
    return api.success(res, null, 'Record removed');
  } catch (err) { return api.error(res, err.message); }
};

// ─── Member history ───────────────────────────────────────

/** GET /api/attendance/member/:memberId — attendance history for a member */
exports.getMemberHistory = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const { limit: lim, offset } = getPagination(page, limit);

    const member = await Member.findByPk(req.params.memberId);
    if (!member) return api.notFound(res, 'Member not found');

    const { count, rows } = await AttendanceRecord.findAndCountAll({
      where: { memberId: req.params.memberId },
      limit: lim, offset,
      include: [{
        model: AttendanceSession, as: 'session',
        attributes: ['id','title','serviceType','sessionDate','location'],
      }],
      order: [['checkInTime','DESC']],
    });

    const summary = await AttendanceRecord.findAll({
      where: { memberId: req.params.memberId },
      attributes: [
        [fn('COUNT', col('id')), 'totalAttended'],
        [fn('COUNT', fn('DISTINCT', col('session.serviceType'))), 'serviceTypes'],
      ],
      include: [{
        model: AttendanceSession, as: 'session', attributes: ['serviceType'],
      }],
      group: ['session.serviceType'],
      raw: true,
    });

    return api.paginate(res, { member, records: rows, summary }, count, page, lim);
  } catch (err) { return api.error(res, err.message); }
};

// ─── Reports ──────────────────────────────────────────────

/** GET /api/attendance/report — CSV export of records for a session or date range */
exports.exportReport = async (req, res) => {
  try {
    const { sessionId, startDate, endDate, serviceType } = req.query;
    let where = {};
    if (sessionId) where.id = sessionId;
    if (serviceType) where.serviceType = serviceType;
    if (startDate || endDate) {
      Object.assign(where, buildDateFilter(startDate, endDate, null, null, 'sessionDate'));
    }

    const sessions = await AttendanceSession.findAll({
      where,
      include: [{
        model: AttendanceRecord, as: 'records',
        include: [{ model: Member, as: 'member', attributes: ['fullName','phone','email'], required: false }],
      }],
      order: [['sessionDate','DESC']],
    });

    const rows = [];
    for (const s of sessions) {
      for (const r of s.records) {
        rows.push([
          s.title, s.serviceType, s.sessionDate, s.location || '',
          r.member?.fullName || r.guestName || 'Guest',
          r.member?.phone || r.guestPhone || '',
          r.member?.email || '',
          r.checkInMethod,
          new Date(r.checkInTime).toLocaleTimeString('en-KE'),
          r.notes || '',
        ]);
      }
    }

    const escape = (v) => {
      const s = String(v ?? '').replace(/"/g, '""');
      return s.includes(',') || s.includes('"') ? `"${s}"` : s;
    };
    const header = ['Session','Service Type','Date','Location','Name','Phone','Email','Method','Check-In Time','Notes'];
    const csv = [header.join(','), ...rows.map(r => r.map(escape).join(','))].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="attendance-${Date.now()}.csv"`);
    return res.send(csv);
  } catch (err) { return api.error(res, err.message); }
};
