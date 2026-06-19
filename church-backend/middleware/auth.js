const jwt     = require('jsonwebtoken');
const { User } = require('../models');
const api     = require('../utils/apiResponse');
const logger  = require('../utils/logger');

const authenticate = async (req, res, next) => {
  try {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer '))
      return api.unauthorized(res, 'No token provided');

    const token = header.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findOne({
      where: { id: decoded.id, status: 'active' },
      attributes: { exclude: ['password'] },
    });
    if (!user) return api.unauthorized(res, 'User not found or inactive');

    req.user = user;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError')
      return api.unauthorized(res, 'Token expired');
    if (err.name === 'JsonWebTokenError')
      return api.unauthorized(res, 'Invalid token');
    logger.error('Auth middleware error:', err);
    return api.error(res, 'Authentication error');
  }
};

const authorize = (...roles) => (req, res, next) => {
  if (!req.user) return api.unauthorized(res);
  if (!roles.includes(req.user.role))
    return api.forbidden(res, `Role '${req.user.role}' is not authorized for this action`);
  next();
};

// Convenience role guards
const adminOnly      = authorize('administrator');
const adminOrPastor  = authorize('administrator', 'pastor');
const adminOrTreasurer = authorize('administrator', 'treasurer');
const allRoles       = authorize('administrator', 'pastor', 'treasurer');

module.exports = { authenticate, authorize, adminOnly, adminOrPastor, adminOrTreasurer, allRoles };
