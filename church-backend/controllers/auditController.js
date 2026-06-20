const { AuditLog, User } = require('../models');
const api = require('../utils/apiResponse');
const { getPagination, buildDateFilter } = require('../utils/helpers');
const { Op, fn, col, literal } = require('sequelize');

// ─── Shared include ────────────────────────────────────────
const USER_INCLUDE = [{ model: User, as: 'user', attributes: ['id', 'name', 'email', 'role'] }];

// ─── Helpers ───────────────────────────────────────────────
const buildWhere = (query) => {
  const { userId, action, module, search, startDate, endDate } = query;
  const where = { ...buildDateFilter(startDate, endDate, null, null, 'createdAt') };
  if (userId) where.userId = userId;
  if (action) where.action = action.toUpperCase();
  if (module) where.module = module.toUpperCase();
  if (search) {
    where[Op.or] = [
      { description: { [Op.like]: `%${search}%` } },
    ];
  }
  return where;
};

/**
 * GET /api/audit
 * Full paginated list with filters: userId, action, module, search, startDate, endDate
 */
exports.getAll = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const { limit: lim, offset } = getPagination(page, limit);
    const where = buildWhere(req.query);

    const { count, rows } = await AuditLog.findAndCountAll({
      where, limit: lim, offset,
      include: USER_INCLUDE,
      order: [['createdAt', 'DESC']],
    });

    return api.paginate(res, rows, count, page, lim);
  } catch (err) {
    return api.error(res, err.message);
  }
};

/**
 * GET /api/audit/stats
 * Aggregated stats for the dashboard panel:
 * - total logs
 * - counts by action
 * - counts by module
 * - top users by activity (last 30 days)
 * - daily activity for the last 14 days
 */
exports.getStats = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const dateWhere = buildDateFilter(startDate, endDate, null, null, 'createdAt');

    const [
      total,
      byAction,
      byModule,
      topUsers,
      dailyActivity,
    ] = await Promise.all([
      AuditLog.count({ where: dateWhere }),

      AuditLog.findAll({
        where: dateWhere,
        attributes: ['action', [fn('COUNT', col('id')), 'count']],
        group: ['action'],
        raw: true,
      }),

      AuditLog.findAll({
        where: dateWhere,
        attributes: ['module', [fn('COUNT', col('id')), 'count']],
        group: ['module'],
        order: [[fn('COUNT', col('id')), 'DESC']],
        raw: true,
      }),

      AuditLog.findAll({
        where: dateWhere,
        attributes: [
          'userId',
          [fn('COUNT', col('AuditLog.id')), 'count'],
        ],
        include: [{ model: User, as: 'user', attributes: ['name', 'role'] }],
        group: ['userId', 'user.id', 'user.name', 'user.role'],
        order: [[fn('COUNT', col('AuditLog.id')), 'DESC']],
        limit: 5,
      }),

      AuditLog.findAll({
        where: {
          ...dateWhere,
          createdAt: {
            [Op.gte]: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
            ...(dateWhere.createdAt || {}),
          },
        },
        attributes: [
          [fn('DATE', col('createdAt')), 'date'],
          [fn('COUNT', col('id')), 'count'],
        ],
        group: [fn('DATE', col('createdAt'))],
        order:  [[fn('DATE', col('createdAt')), 'ASC']],
        raw: true,
      }),
    ]);

    return api.success(res, { total, byAction, byModule, topUsers, dailyActivity });
  } catch (err) {
    return api.error(res, err.message);
  }
};

/**
 * GET /api/audit/:id
 * Full detail including metadata (previousValues / newValues diff)
 */
exports.getById = async (req, res) => {
  try {
    const log = await AuditLog.findByPk(req.params.id, { include: USER_INCLUDE });
    if (!log) return api.notFound(res, 'Audit log not found');
    return api.success(res, log);
  } catch (err) {
    return api.error(res, err.message);
  }
};

/**
 * GET /api/audit/export
 * CSV export of filtered logs (max 5000 rows)
 */
exports.exportCsv = async (req, res) => {
  try {
    const where = buildWhere(req.query);

    const rows = await AuditLog.findAll({
      where, limit: 5000,
      include: USER_INCLUDE,
      order: [['createdAt', 'DESC']],
    });

    const escape = (v) => {
      if (v === null || v === undefined) return '';
      const s = String(v).replace(/"/g, '""');
      return s.includes(',') || s.includes('"') || s.includes('\n') ? `"${s}"` : s;
    };

    const header = ['ID', 'Date & Time', 'User', 'Role', 'Action', 'Module', 'Description', 'IP Address', 'Changed Fields'];
    const lines  = [header.join(',')];

    for (const r of rows) {
      const changedFields = r.metadata?.changedFields?.join('; ') || '';
      lines.push([
        r.id,
        escape(new Date(r.createdAt).toISOString()),
        escape(r.user?.name || `User #${r.userId}`),
        escape(r.user?.role || ''),
        r.action,
        r.module,
        escape(r.description),
        escape(r.ipAddress || ''),
        escape(changedFields),
      ].join(','));
    }

    const csv = lines.join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="audit-log-${Date.now()}.csv"`);
    return res.send(csv);
  } catch (err) {
    return api.error(res, err.message);
  }
};
