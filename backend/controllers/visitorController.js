const { Visitor, BaptismRecord, Member, User } = require('../models');
const api   = require('../utils/apiResponse');
const audit = require('../services/auditService');
const { getPagination, buildDateFilter } = require('../utils/helpers');
const { Op, fn, col } = require('sequelize');

const VISITOR_INCLUDE = [
  { model: User,   as: 'recorder',  attributes: ['id','name'] },
  { model: User,   as: 'counselor', attributes: ['id','name'], required: false },
  { model: Member, as: 'member',    attributes: ['id','fullName'], required: false },
];

const BAPTISM_INCLUDE = [
  { model: User,    as: 'recorder', attributes: ['id','name'] },
  { model: Member,  as: 'member',   attributes: ['id','fullName'], required: false },
  { model: Visitor, as: 'visitor',  attributes: ['id','fullName'], required: false },
];

exports.getVisitors = async (req, res) => {
  try {
    const { page = 1, limit = 20, search, followUpStatus, conversionStatus,
            becameMember, startDate, endDate } = req.query;
    const { limit: lim, offset } = getPagination(page, limit);
    const where = { ...buildDateFilter(startDate, endDate, null, null, 'visitDate') };
    if (followUpStatus)  where.followUpStatus  = followUpStatus;
    if (conversionStatus) where.conversionStatus = conversionStatus;
    if (becameMember !== undefined) where.becameMember = becameMember === 'true';
    if (search) {
      where[Op.or] = [
        { fullName: { [Op.like]: `%${search}%` } },
        { phone:    { [Op.like]: `%${search}%` } },
        { email:    { [Op.like]: `%${search}%` } },
      ];
    }
    const { count, rows } = await Visitor.findAndCountAll({
      where, limit: lim, offset, include: VISITOR_INCLUDE,
      order: [['visitDate','DESC']],
    });
    return api.paginate(res, rows, count, page, lim);
  } catch (err) { return api.error(res, err.message); }
};

exports.getVisitorStats = async (req, res) => {
  try {
    const [total, byFollowUp, byConversion, newThisMonth, becameMembers] = await Promise.all([
      Visitor.count(),
      Visitor.findAll({ attributes: ['followUpStatus', [fn('COUNT','*'),'count']], group: ['followUpStatus'], raw: true }),
      Visitor.findAll({ attributes: ['conversionStatus', [fn('COUNT','*'),'count']], group: ['conversionStatus'], raw: true }),
      Visitor.count({ where: {
        visitDate: { [Op.gte]: new Date(new Date().getFullYear(), new Date().getMonth(), 1) }
      }}),
      Visitor.count({ where: { becameMember: true } }),
    ]);
    return api.success(res, { total, byFollowUp, byConversion, newThisMonth, becameMembers });
  } catch (err) { return api.error(res, err.message); }
};

exports.getVisitor = async (req, res) => {
  try {
    const v = await Visitor.findByPk(req.params.id, { include: VISITOR_INCLUDE });
    if (!v) return api.notFound(res, 'Visitor not found');
    return api.success(res, v);
  } catch (err) { return api.error(res, err.message); }
};

exports.createVisitor = async (req, res) => {
  try {
    const v = await Visitor.create({ ...req.body, recordedBy: req.user.id });
    await audit.log(req.user.id, 'CREATE', 'MEMBER',
      `Visitor recorded: ${v.fullName}`, { visitorId: v.id }, req, { after: v });
    const full = await Visitor.findByPk(v.id, { include: VISITOR_INCLUDE });
    return api.created(res, full, 'Visitor recorded successfully');
  } catch (err) { return api.error(res, err.message); }
};

exports.updateVisitor = async (req, res) => {
  try {
    const v = await Visitor.findByPk(req.params.id);
    if (!v) return api.notFound(res, 'Visitor not found');
    const before = audit.snapshot(v);
    await v.update(req.body);
    await audit.log(req.user.id, 'UPDATE', 'MEMBER',
      `Visitor updated: ${v.fullName}`, { visitorId: v.id }, req, { before, after: v });
    const full = await Visitor.findByPk(v.id, { include: VISITOR_INCLUDE });
    return api.success(res, full, 'Visitor updated');
  } catch (err) { return api.error(res, err.message); }
};

exports.deleteVisitor = async (req, res) => {
  try {
    const v = await Visitor.findByPk(req.params.id);
    if (!v) return api.notFound(res, 'Visitor not found');
    const before = audit.snapshot(v);
    await v.destroy();
    await audit.log(req.user.id, 'DELETE', 'MEMBER',
      `Visitor deleted: ${v.fullName}`, null, req, { before });
    return api.success(res, null, 'Visitor deleted');
  } catch (err) { return api.error(res, err.message); }
};

exports.getBaptisms = async (req, res) => {
  try {
    const { page = 1, limit = 20, search, pastor, startDate, endDate, baptismType } = req.query;
    const { limit: lim, offset } = getPagination(page, limit);
    const where = { ...buildDateFilter(startDate, endDate, null, null, 'baptismDate') };
    if (pastor)      where.pastor      = { [Op.like]: `%${pastor}%` };
    if (baptismType) where.baptismType = baptismType;
    if (search) {
      where[Op.or] = [
        { personName: { [Op.like]: `%${search}%` } },
        { pastor:     { [Op.like]: `%${search}%` } },
        { location:   { [Op.like]: `%${search}%` } },
      ];
    }
    const { count, rows } = await BaptismRecord.findAndCountAll({
      where, limit: lim, offset, include: BAPTISM_INCLUDE,
      order: [['baptismDate','DESC']],
    });
    return api.paginate(res, rows, count, page, lim);
  } catch (err) { return api.error(res, err.message); }
};

exports.getBaptism = async (req, res) => {
  try {
    const b = await BaptismRecord.findByPk(req.params.id, { include: BAPTISM_INCLUDE });
    if (!b) return api.notFound(res, 'Baptism record not found');
    return api.success(res, b);
  } catch (err) { return api.error(res, err.message); }
};

exports.createBaptism = async (req, res) => {
  try {
    const b = await BaptismRecord.create({ ...req.body, recordedBy: req.user.id });
    await audit.log(req.user.id, 'CREATE', 'MEMBER',
      `Baptism recorded: ${b.personName} on ${b.baptismDate}`, { baptismId: b.id }, req, { after: b });
    const full = await BaptismRecord.findByPk(b.id, { include: BAPTISM_INCLUDE });
    return api.created(res, full, 'Baptism record created');
  } catch (err) { return api.error(res, err.message); }
};

exports.updateBaptism = async (req, res) => {
  try {
    const b = await BaptismRecord.findByPk(req.params.id);
    if (!b) return api.notFound(res, 'Baptism record not found');
    const before = audit.snapshot(b);
    await b.update(req.body);
    await audit.log(req.user.id, 'UPDATE', 'MEMBER',
      `Baptism updated: ${b.personName}`, { baptismId: b.id }, req, { before, after: b });
    const full = await BaptismRecord.findByPk(b.id, { include: BAPTISM_INCLUDE });
    return api.success(res, full, 'Baptism record updated');
  } catch (err) { return api.error(res, err.message); }
};

exports.deleteBaptism = async (req, res) => {
  try {
    const b = await BaptismRecord.findByPk(req.params.id);
    if (!b) return api.notFound(res, 'Baptism record not found');
    await b.destroy();
    await audit.log(req.user.id, 'DELETE', 'MEMBER', `Baptism deleted: ${b.personName}`, null, req);
    return api.success(res, null, 'Baptism record deleted');
  } catch (err) { return api.error(res, err.message); }
};
