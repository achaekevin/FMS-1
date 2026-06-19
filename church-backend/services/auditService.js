const { AuditLog } = require('../models');
const logger = require('../utils/logger');

const VALID_ACTIONS = new Set([
  'CREATE','UPDATE','DELETE','LOGIN','LOGOUT',
  'EXPORT','MPESA','VIEW','APPROVE','REJECT',
]);

const VALID_MODULES = new Set([
  'AUTH','INCOME','EXPENSE','MEMBER','FUND','REPORT','MPESA','USER',
  'BUDGET','RECEIPT','EVENT','ASSET','PAYROLL','BRANCH',
  'ANNOUNCEMENT','SETTINGS','BACKUP','NOTIFICATION',
]);

/**
 * Log an audit entry. Never throws — errors are swallowed so callers are not affected.
 * @param {number}  userId
 * @param {string}  action  - must be in VALID_ACTIONS (falls back to 'CREATE')
 * @param {string}  module  - must be in VALID_MODULES (falls back to 'USER')
 * @param {string}  description
 * @param {object}  metadata
 * @param {object}  req     - Express request (for IP / UA)
 */
const log = async (userId, action, module, description, metadata = null, req = null) => {
  try {
    const safeAction = VALID_ACTIONS.has(action?.toUpperCase()) ? action.toUpperCase() : 'CREATE';
    const safeModule = VALID_MODULES.has(module?.toUpperCase()) ? module.toUpperCase() : 'USER';

    await AuditLog.create({
      userId:    userId || null,
      action:    safeAction,
      module:    safeModule,
      description: String(description || '').substring(0, 1000),
      metadata,
      ipAddress: req ? (req.ip || req.connection?.remoteAddress || null) : null,
      userAgent: req ? (req.headers?.['user-agent'] || '').substring(0, 255) : null,
    });
  } catch (err) {
    logger.error('auditService.log error:', err.message);
  }
};

module.exports = { log };
