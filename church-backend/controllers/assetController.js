const { Asset, User } = require('../models');
const api   = require('../utils/apiResponse');
const audit = require('../services/auditService');
const excel = require('../services/excelService');
const { getPagination } = require('../utils/helpers');
const { fn, col } = require('sequelize');

const INCLUDE = [{ model: User, as: 'creator', attributes: ['id','name'] }];

exports.getAll = async (req, res) => {
  try {
    const { page = 1, limit = 20, category, status, condition } = req.query;
    const { limit: lim, offset } = getPagination(page, limit);
    const where = {};
    if (category)  where.category  = category;
    if (status)    where.status    = status;
    if (condition) where.condition = condition;

    const { count, rows } = await Asset.findAndCountAll({
      where, limit: lim, offset, include: INCLUDE, order: [['createdAt','DESC']],
    });
    const totalValue = await Asset.sum('value', { where }) || 0;
    return api.paginate(res, { assets: rows, totalValue }, count, page, lim);
  } catch (err) { return api.error(res, err.message); }
};

exports.getById = async (req, res) => {
  try {
    const a = await Asset.findByPk(req.params.id, { include: INCLUDE });
    if (!a) return api.notFound(res, 'Asset not found');
    return api.success(res, a);
  } catch (err) { return api.error(res, err.message); }
};

exports.create = async (req, res) => {
  try {
    const a = await Asset.create({ ...req.body, createdBy: req.user.id });
    await audit.log(req.user.id, 'CREATE', 'ASSET', `Added asset: ${a.assetName}`, { assetId: a.id }, req);
    const full = await Asset.findByPk(a.id, { include: INCLUDE });
    return api.created(res, full, 'Asset added');
  } catch (err) { return api.error(res, err.message); }
};

exports.update = async (req, res) => {
  try {
    const a = await Asset.findByPk(req.params.id);
    if (!a) return api.notFound(res, 'Asset not found');
    await a.update(req.body);
    await audit.log(req.user.id, 'UPDATE', 'ASSET', `Updated asset: ${a.assetName}`, { assetId: a.id }, req);
    return api.success(res, a, 'Asset updated');
  } catch (err) { return api.error(res, err.message); }
};

exports.remove = async (req, res) => {
  try {
    const a = await Asset.findByPk(req.params.id);
    if (!a) return api.notFound(res, 'Asset not found');
    await a.destroy();
    await audit.log(req.user.id, 'DELETE', 'ASSET', `Deleted asset: ${a.assetName}`, null, req);
    return api.success(res, null, 'Asset deleted');
  } catch (err) { return api.error(res, err.message); }
};

exports.getSummary = async (req, res) => {
  try {
    const byCategory = await Asset.findAll({
      attributes: ['category', [fn('COUNT','id'), 'count'], [fn('SUM', col('value')), 'totalValue']],
      group: ['category'], raw: true,
    });
    const byCondition = await Asset.findAll({
      attributes: ['condition', [fn('COUNT','id'), 'count']],
      group: ['condition'], raw: true,
    });
    const totalValue = await Asset.sum('value') || 0;
    return api.success(res, { byCategory, byCondition, totalValue });
  } catch (err) { return api.error(res, err.message); }
};

exports.exportExcel = async (req, res) => {
  try {
    const assets = await Asset.findAll({ include: INCLUDE, order: [['assetName','ASC']] });
    await audit.log(req.user.id, 'EXPORT', 'ASSET', 'Exported assets to Excel', null, req);
    return excel.generateAssetsExcel(res, assets);
  } catch (err) { return api.error(res, err.message); }
};
