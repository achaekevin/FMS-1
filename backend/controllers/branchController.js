const { Branch, BranchUser, User, Income, Expense, Member } = require('../models');
const api   = require('../utils/apiResponse');
const audit = require('../services/auditService');
const { getPagination } = require('../utils/helpers');
const { fn, col } = require('sequelize');

const INCLUDE = [
  { model: BranchUser, as: 'branchUsers',
    include: [{ model: User, as: 'user', attributes: ['id','name','email','role'] }] },
];

exports.getAll = async (req, res) => {
  try {
    const { status } = req.query;
    const where = {};
    if (status) where.status = status;
    const branches = await Branch.findAll({ where, include: INCLUDE, order: [['isMain','DESC'],['name','ASC']] });
    return api.success(res, branches);
  } catch (err) { return api.error(res, err.message); }
};

exports.getById = async (req, res) => {
  try {
    const b = await Branch.findByPk(req.params.id, { include: INCLUDE });
    if (!b) return api.notFound(res, 'Branch not found');
    return api.success(res, b);
  } catch (err) { return api.error(res, err.message); }
};

exports.create = async (req, res) => {
  try {
    const b = await Branch.create(req.body);
    await audit.log(req.user.id, 'CREATE', 'BRANCH', `Created branch: ${b.name}`, { branchId: b.id }, req);
    return api.created(res, b, 'Branch created');
  } catch (err) { return api.error(res, err.message); }
};

exports.update = async (req, res) => {
  try {
    const b = await Branch.findByPk(req.params.id);
    if (!b) return api.notFound(res, 'Branch not found');
    await b.update(req.body);
    await audit.log(req.user.id, 'UPDATE', 'BRANCH', `Updated branch: ${b.name}`, { branchId: b.id }, req);
    return api.success(res, b, 'Branch updated');
  } catch (err) { return api.error(res, err.message); }
};

exports.remove = async (req, res) => {
  try {
    const b = await Branch.findByPk(req.params.id);
    if (!b) return api.notFound(res, 'Branch not found');
    if (b.isMain) return api.badRequest(res, 'Cannot delete the main branch');
    await b.update({ status: 'inactive' });
    await audit.log(req.user.id, 'DELETE', 'BRANCH', `Deactivated branch: ${b.name}`, null, req);
    return api.success(res, null, 'Branch deactivated');
  } catch (err) { return api.error(res, err.message); }
};

/** POST /branches/:id/users — assign a user to a branch */
exports.addUser = async (req, res) => {
  try {
    const { userId, role } = req.body;
    const b = await Branch.findByPk(req.params.id);
    if (!b) return api.notFound(res, 'Branch not found');
    const u = await User.findByPk(userId);
    if (!u) return api.notFound(res, 'User not found');
    const existing = await BranchUser.findOne({ where: { branchId: b.id, userId } });
    if (existing) return api.badRequest(res, 'User already assigned to this branch');
    const bu = await BranchUser.create({ branchId: b.id, userId, role });
    await audit.log(req.user.id, 'UPDATE', 'BRANCH', `Assigned ${u.name} to ${b.name}`, null, req);
    return api.created(res, bu, 'User assigned to branch');
  } catch (err) { return api.error(res, err.message); }
};

/** DELETE /branches/:id/users/:userId */
exports.removeUser = async (req, res) => {
  try {
    const bu = await BranchUser.findOne({ where: { branchId: req.params.id, userId: req.params.userId } });
    if (!bu) return api.notFound(res, 'Assignment not found');
    await bu.destroy();
    return api.success(res, null, 'User removed from branch');
  } catch (err) { return api.error(res, err.message); }
};

/** GET /branches/:id/stats */
exports.getStats = async (req, res) => {
  try {
    const b = await Branch.findByPk(req.params.id);
    if (!b) return api.notFound(res, 'Branch not found');
    const totalIncome   = await Income.sum('amount')  || 0;
    const totalExpenses = await Expense.sum('amount') || 0;
    const totalMembers  = await Member.count({ where: { status: 'active' } });
    return api.success(res, {
      branch: b,
      totalIncome, totalExpenses,
      netBalance: totalIncome - totalExpenses,
      totalMembers,
    });
  } catch (err) { return api.error(res, err.message); }
};
