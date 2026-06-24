const { Event, User } = require('../models');
const api   = require('../utils/apiResponse');
const audit = require('../services/auditService');
const { getPagination, buildDateFilter } = require('../utils/helpers');
const { Op } = require('sequelize');

const INCLUDE = [{ model: User, as: 'creator', attributes: ['id','name'] }];

exports.getAll = async (req, res) => {
  try {
    const { page = 1, limit = 20, category, status, upcoming } = req.query;
    const { limit: lim, offset } = getPagination(page, limit);
    const where = {};
    if (category) where.category = category;
    if (status)   where.status   = status;
    if (upcoming === 'true') where.eventDate = { [Op.gte]: new Date() };

    const { count, rows } = await Event.findAndCountAll({
      where, limit: lim, offset, include: INCLUDE, order: [['eventDate','ASC']],
    });
    return api.paginate(res, rows, count, page, lim);
  } catch (err) { return api.error(res, err.message); }
};

exports.getById = async (req, res) => {
  try {
    const e = await Event.findByPk(req.params.id, { include: INCLUDE });
    if (!e) return api.notFound(res, 'Event not found');
    return api.success(res, e);
  } catch (err) { return api.error(res, err.message); }
};

exports.create = async (req, res) => {
  try {
    const e = await Event.create({ ...req.body, createdBy: req.user.id });
    await audit.log(req.user.id, 'CREATE', 'EVENT', `Created event: ${e.title}`, { eventId: e.id }, req);
    const full = await Event.findByPk(e.id, { include: INCLUDE });
    return api.created(res, full, 'Event created');
  } catch (err) { return api.error(res, err.message); }
};

exports.update = async (req, res) => {
  try {
    const e = await Event.findByPk(req.params.id);
    if (!e) return api.notFound(res, 'Event not found');
    await e.update(req.body);
    await audit.log(req.user.id, 'UPDATE', 'EVENT', `Updated event: ${e.title}`, { eventId: e.id }, req);
    const full = await Event.findByPk(e.id, { include: INCLUDE });
    return api.success(res, full, 'Event updated');
  } catch (err) { return api.error(res, err.message); }
};

exports.remove = async (req, res) => {
  try {
    const e = await Event.findByPk(req.params.id);
    if (!e) return api.notFound(res, 'Event not found');
    await e.destroy();
    await audit.log(req.user.id, 'DELETE', 'EVENT', `Deleted event: ${e.title}`, null, req);
    return api.success(res, null, 'Event deleted');
  } catch (err) { return api.error(res, err.message); }
};

exports.getUpcoming = async (req, res) => {
  try {
    const { limit = 5 } = req.query;
    const events = await Event.findAll({
      where: { eventDate: { [Op.gte]: new Date() }, status: { [Op.ne]: 'cancelled' } },
      order: [['eventDate','ASC']],
      limit: parseInt(limit),
    });
    return api.success(res, events);
  } catch (err) { return api.error(res, err.message); }
};
