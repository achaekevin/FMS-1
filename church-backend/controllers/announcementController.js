const { Announcement, User, Member } = require('../models');
const api    = require('../utils/apiResponse');
const audit  = require('../services/auditService');
const comms  = require('../services/communicationService');
const { getPagination } = require('../utils/helpers');
const { Op } = require('sequelize');

const INCLUDE = [{ model: User, as: 'creator', attributes: ['id','name'] }];

exports.getAll = async (req, res) => {
  try {
    const { page = 1, limit = 20, priority, active } = req.query;
    const { limit: lim, offset } = getPagination(page, limit);
    const where = {};
    if (priority) where.priority = priority;
    if (active !== undefined) where.isActive = active === 'true';
    // Exclude expired ones by default unless caller asks for all
    if (active !== 'all') {
      where[Op.or] = [
        { expiryDate: null },
        { expiryDate: { [Op.gte]: new Date() } },
      ];
    }
    const { count, rows } = await Announcement.findAndCountAll({
      where, limit: lim, offset, include: INCLUDE,
      order: [['priority','ASC'],['createdAt','DESC']],
    });
    return api.paginate(res, rows, count, page, lim);
  } catch (err) { return api.error(res, err.message); }
};

exports.getById = async (req, res) => {
  try {
    const a = await Announcement.findByPk(req.params.id, { include: INCLUDE });
    if (!a) return api.notFound(res, 'Announcement not found');
    return api.success(res, a);
  } catch (err) { return api.error(res, err.message); }
};

exports.create = async (req, res) => {
  try {
    const a = await Announcement.create({ ...req.body, createdBy: req.user.id });
    await audit.log(req.user.id, 'CREATE', 'ANNOUNCEMENT', `Posted: ${a.title}`, { id: a.id }, req);
    const full = await Announcement.findByPk(a.id, { include: INCLUDE });

    // Auto-broadcast to all active members when notify flag is set
    if (req.body.notifyMembers) {
      const members = await Member.findAll({
        where: { status: 'active' },
        attributes: ['id', 'fullName', 'email', 'phone'],
      });
      comms.broadcastAnnouncement({ members, announcement: a }).catch(() => {});
    }

    return api.created(res, full, 'Announcement published');
  } catch (err) { return api.error(res, err.message); }
};

exports.update = async (req, res) => {
  try {
    const a = await Announcement.findByPk(req.params.id);
    if (!a) return api.notFound(res, 'Announcement not found');
    await a.update(req.body);
    await audit.log(req.user.id, 'UPDATE', 'ANNOUNCEMENT', `Updated: ${a.title}`, { id: a.id }, req);
    return api.success(res, a, 'Announcement updated');
  } catch (err) { return api.error(res, err.message); }
};

exports.remove = async (req, res) => {
  try {
    const a = await Announcement.findByPk(req.params.id);
    if (!a) return api.notFound(res, 'Announcement not found');
    await a.destroy();
    await audit.log(req.user.id, 'DELETE', 'ANNOUNCEMENT', `Deleted: ${a.title}`, null, req);
    return api.success(res, null, 'Announcement deleted');
  } catch (err) { return api.error(res, err.message); }
};
