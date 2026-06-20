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

// Fields that should never appear in diffs (sensitive or noisy)
const EXCLUDED_FIELDS = new Set([
  'password','passwordHash','token','refreshToken','resetToken',
  'createdAt','updatedAt','deletedAt',
]);

/**
 * Build a clean snapshot of a Sequelize model instance for diff comparison.
 * Strips excluded fields and converts to plain object.
 */
const snapshot = (instance) => {
  if (!instance) return null;
  const raw = instance.get ? instance.get({ plain: true }) : { ...instance };
  return Object.fromEntries(
    Object.entries(raw).filter(([k]) => !EXCLUDED_FIELDS.has(k))
  );
};

/**
 * Compare two snapshots and return only the fields that changed.
 * Returns { previousValues, newValues } — both contain only the differing fields.
 */
const diff = (before, after) => {
  if (!before || !after) return { previousValues: before, newValues: after };

  const previousValues = {};
  const newValues      = {};

  const allKeys = new Set([...Object.keys(before), ...Object.keys(after)]);
  for (const key of allKeys) {
    const bVal = JSON.stringify(before[key]);
    const aVal = JSON.stringify(after[key]);
    if (bVal !== aVal) {
      previousValues[key] = before[key];
      newValues[key]      = after[key];
    }
  }

  return { previousValues, newValues };
};

/**
 * Log an audit entry. Never throws — errors are swallowed so callers are not affected.
 *
 * @param {number}  userId
 * @param {string}  action       - must be in VALID_ACTIONS
 * @param {string}  module       - must be in VALID_MODULES
 * @param {string}  description
 * @param {object}  metadata     - arbitrary extra context (e.g. { incomeId: 5 })
 * @param {object}  req          - Express request (for IP / UA)
 * @param {object}  [opts]
 * @param {object}  [opts.before]  - Sequelize instance or plain object BEFORE the change
 * @param {object}  [opts.after]   - Sequelize instance or plain object AFTER the change
 */
const log = async (userId, action, module, description, metadata = null, req = null, opts = {}) => {
  try {
    const safeAction = VALID_ACTIONS.has(action?.toUpperCase()) ? action.toUpperCase() : 'CREATE';
    const safeModule = VALID_MODULES.has(module?.toUpperCase()) ? module.toUpperCase() : 'USER';

    // Build diff when before/after are supplied
    let enrichedMeta = metadata ? { ...metadata } : {};

    if (opts.before || opts.after) {
      const beforeSnap = snapshot(opts.before);
      const afterSnap  = snapshot(opts.after);

      if (safeAction === 'UPDATE') {
        const changes = diff(beforeSnap, afterSnap);
        enrichedMeta = {
          ...enrichedMeta,
          previousValues: changes.previousValues,
          newValues:      changes.newValues,
          changedFields:  Object.keys(changes.newValues || {}),
        };
      } else if (safeAction === 'CREATE') {
        enrichedMeta = { ...enrichedMeta, newValues: afterSnap };
      } else if (safeAction === 'DELETE') {
        enrichedMeta = { ...enrichedMeta, previousValues: beforeSnap };
      }
    }

    await AuditLog.create({
      userId:      userId || null,
      action:      safeAction,
      module:      safeModule,
      description: String(description || '').substring(0, 1000),
      metadata:    Object.keys(enrichedMeta).length ? enrichedMeta : null,
      ipAddress:   req ? (req.ip || req.connection?.remoteAddress || null) : null,
      userAgent:   req ? (req.headers?.['user-agent'] || '').substring(0, 255) : null,
    });
  } catch (err) {
    logger.error('auditService.log error:', err.message);
  }
};

module.exports = { log, snapshot, diff };
