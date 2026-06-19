const jwt     = require('jsonwebtoken');
const { User } = require('../models');
const api      = require('../utils/apiResponse');
const audit    = require('../services/auditService');
const logger   = require('../utils/logger');

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });

/**
 * @swagger
 * /auth/register:
 *   post:
 *     tags: [Auth]
 *     summary: Register a new user account
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, email, password]
 *             properties:
 *               name:     { type: string, example: "John Doe" }
 *               email:    { type: string, example: "john@church.org" }
 *               password: { type: string, minLength: 6, example: "secret123" }
 *               role:
 *                 type: string
 *                 enum: [administrator, pastor, treasurer]
 *                 default: treasurer
 *     responses:
 *       201: { description: Account created and token returned }
 *       409: { description: Email already registered }
 */
exports.register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    const exists = await User.findOne({ where: { email: email.toLowerCase().trim() } });
    if (exists) return api.conflict(res, 'Email is already registered');

    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password,
      role: role || 'treasurer',
      status: 'active',
    });

    const token = signToken(user.id);
    await audit.log(user.id, 'CREATE', 'AUTH', `New user registered: ${user.name} (${user.role})`, null, req);
    logger.info(`Register: ${user.email} (${user.role})`);

    return api.created(res, { token, user: user.toSafeJSON() }, 'Account created successfully');
  } catch (err) {
    logger.error('register error:', err);
    return api.error(res, 'Registration failed');
  }
};

/**
 * @swagger
 * /auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: Login
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:    { type: string }
 *               password: { type: string }
 *     responses:
 *       200: { description: Login successful }
 *       401: { description: Invalid credentials }
 */
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ where: { email: email.toLowerCase().trim() } });
    if (!user || !(await user.validatePassword(password)))
      return api.unauthorized(res, 'Invalid email or password');

    if (user.status !== 'active')
      return api.forbidden(res, 'Your account is inactive. Contact the administrator.');

    await user.update({ lastLogin: new Date() });
    const token = signToken(user.id);
    await audit.log(user.id, 'LOGIN', 'AUTH', `User ${user.name} logged in`, null, req);

    logger.info(`Login: ${user.email} (${user.role})`);
    return api.success(res, { token, user: user.toSafeJSON() }, 'Login successful');
  } catch (err) {
    logger.error('login error:', err);
    return api.error(res, 'Login failed');
  }
};

/**
 * @swagger
 * /auth/logout:
 *   post:
 *     tags: [Auth]
 *     summary: Logout
 *     responses:
 *       200: { description: Logged out }
 */
exports.logout = async (req, res) => {
  await audit.log(req.user.id, 'LOGOUT', 'AUTH', `User ${req.user.name} logged out`, null, req);
  return api.success(res, null, 'Logged out successfully');
};

/**
 * @swagger
 * /auth/me:
 *   get:
 *     tags: [Auth]
 *     summary: Get current user
 *     responses:
 *       200: { description: Current user }
 */
exports.getMe = async (req, res) => {
  return api.success(res, req.user.toSafeJSON ? req.user.toSafeJSON() : req.user);
};

/**
 * @swagger
 * /auth/change-password:
 *   put:
 *     tags: [Auth]
 *     summary: Change password
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [currentPassword, newPassword]
 *             properties:
 *               currentPassword: { type: string }
 *               newPassword:     { type: string }
 *     responses:
 *       200: { description: Password changed }
 */
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findByPk(req.user.id);
    if (!(await user.validatePassword(currentPassword)))
      return api.badRequest(res, 'Current password is incorrect');
    await user.update({ password: newPassword });
    await audit.log(req.user.id, 'UPDATE', 'AUTH', 'Password changed', null, req);
    return api.success(res, null, 'Password changed successfully');
  } catch (err) {
    logger.error('changePassword error:', err);
    return api.error(res);
  }
};
