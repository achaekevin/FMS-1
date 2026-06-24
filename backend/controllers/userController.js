const { User }  = require('../models');
const api       = require('../utils/apiResponse');
const audit     = require('../services/auditService');
const { getPagination } = require('../utils/helpers');
const { Op }    = require('sequelize');

exports.getAll = async (req, res) => {
  try {
    const { page = 1, limit = 10, search, role, status } = req.query;
    const { limit: lim, offset } = getPagination(page, limit);
    const where = {};
    if (search) where[Op.or] = [
      { name:  { [Op.like]: `%${search}%` } },
      { email: { [Op.like]: `%${search}%` } },
    ];
    if (role)   where.role   = role;
    if (status) where.status = status;

    const { count, rows } = await User.findAndCountAll({
      where, limit: lim, offset,
      attributes: { exclude: ['password'] },
      order: [['createdAt', 'DESC']],
    });
    return api.paginate(res, rows, count, page, lim);
  } catch (err) {
    return api.error(res, err.message);
  }
};

exports.getById = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id, { attributes: { exclude: ['password'] } });
    if (!user) return api.notFound(res, 'User not found');
    return api.success(res, user);
  } catch (err) {
    return api.error(res, err.message);
  }
};

exports.create = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    const exists = await User.findOne({ where: { email } });
    if (exists) return api.badRequest(res, 'Email already registered');
    const user = await User.create({ name, email: email.toLowerCase(), password, role });
    await audit.log(req.user.id, 'CREATE', 'USER', `Created user: ${name} (${role})`, { userId: user.id }, req);
    return api.created(res, user.toSafeJSON(), 'User created successfully');
  } catch (err) {
    return api.error(res, err.message);
  }
};

exports.update = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return api.notFound(res, 'User not found');
    const { name, email, role, status } = req.body;
    await user.update({ name, email, role, status });
    await audit.log(req.user.id, 'UPDATE', 'USER', `Updated user: ${user.name}`, { userId: user.id }, req);
    return api.success(res, user.toSafeJSON(), 'User updated');
  } catch (err) {
    return api.error(res, err.message);
  }
};

exports.remove = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return api.notFound(res, 'User not found');
    if (user.id === req.user.id) return api.badRequest(res, 'Cannot delete your own account');
    await user.update({ status: 'inactive' });
    await audit.log(req.user.id, 'DELETE', 'USER', `Deactivated user: ${user.name}`, null, req);
    return api.success(res, null, 'User deactivated');
  } catch (err) {
    return api.error(res, err.message);
  }
};
