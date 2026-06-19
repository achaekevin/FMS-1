const { Notification, User } = require('../models');
const api = require('../utils/apiResponse');
const { getPagination } = require('../utils/helpers');
const { Op } = require('sequelize');

/** GET /notifications  — user sees only their own */
exports.getAll = async (req, res) => {
  try {
    const { page = 1, limit = 20, isRead, type } = req.query;
    const { limit: lim, offset } = getPagination(page, limit);
    const where = {};
    if (req.user.role !== 'administrator') where.userId = req.user.id;
    if (isRead !== undefined) where.isRead = isRead === 'true';
    if (type)   where.type = type;

    const { count, rows } = await Notification.findAndCountAll({
      where, limit: lim, offset,
      order: [['createdAt', 'DESC']],
    });
    const unread = await Notification.count({ where: { ...where, isRead: false } });
    return api.paginate(res, { notifications: rows, unreadCount: unread }, count, page, lim);
  } catch (err) { return api.error(res, err.message); }
};

/** PUT /notifications/:id/read */
exports.markRead = async (req, res) => {
  try {
    const n = await Notification.findByPk(req.params.id);
    if (!n) return api.notFound(res, 'Notification not found');
    if (n.userId && n.userId !== req.user.id && req.user.role !== 'administrator')
      return api.forbidden(res);
    await n.update({ isRead: true });
    return api.success(res, n, 'Marked as read');
  } catch (err) { return api.error(res, err.message); }
};

/** PUT /notifications/read-all */
exports.markAllRead = async (req, res) => {
  try {
    const where = req.user.role === 'administrator' ? {} : { userId: req.user.id };
    await Notification.update({ isRead: true }, { where: { ...where, isRead: false } });
    return api.success(res, null, 'All notifications marked as read');
  } catch (err) { return api.error(res, err.message); }
};

/** DELETE /notifications/:id */
exports.remove = async (req, res) => {
  try {
    const n = await Notification.findByPk(req.params.id);
    if (!n) return api.notFound(res, 'Notification not found');
    await n.destroy();
    return api.success(res, null, 'Notification deleted');
  } catch (err) { return api.error(res, err.message); }
};

/** POST /notifications  — admin broadcast */
exports.create = async (req, res) => {
  try {
    const { title, message, type, userId, module: mod, metadata } = req.body;
    const n = await Notification.create({ userId: userId || null, title, message, type, module: mod, metadata });
    return api.created(res, n, 'Notification created');
  } catch (err) { return api.error(res, err.message); }
};
