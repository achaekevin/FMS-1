const logger = require('../utils/logger');
const api    = require('../utils/apiResponse');

const errorHandler = (err, req, res, next) => {
  logger.error(`${err.name}: ${err.message}`, { stack: err.stack, url: req.originalUrl, method: req.method });

  // Sequelize validation
  if (err.name === 'SequelizeValidationError') {
    const errors = err.errors.map(e => ({ field: e.path, message: e.message }));
    return api.badRequest(res, 'Database validation error', errors);
  }

  // Sequelize unique constraint
  if (err.name === 'SequelizeUniqueConstraintError') {
    const field = err.errors[0]?.path;
    return api.badRequest(res, `${field} already exists`);
  }

  // Sequelize FK constraint
  if (err.name === 'SequelizeForeignKeyConstraintError')
    return api.badRequest(res, 'Invalid reference: related record not found');

  // JWT
  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError')
    return api.unauthorized(res, err.message);

  // Multer
  if (err.code === 'LIMIT_FILE_SIZE')
    return api.badRequest(res, 'File too large. Maximum size is 5MB');

  // Generic
  const status  = err.statusCode || err.status || 500;
  const message = status < 500 ? err.message : 'Internal server error';
  return api.error(res, message, status);
};

const notFoundHandler = (req, res) =>
  api.notFound(res, `Route ${req.method} ${req.originalUrl} not found`);

module.exports = { errorHandler, notFoundHandler };
