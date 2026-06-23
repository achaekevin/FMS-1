'use strict';

/**
 * Branch-Level Scoping Middleware (Maker-Checker / RLS)
 * ======================================================
 *
 * Attaches req.branchScope to every authenticated request:
 *
 *   req.branchScope = {
 *     branchId:   number | null,   // null = global (admin/pastor), number = scoped (treasurer)
 *     isGlobal:   boolean,         // true for admin/pastor
 *     branchIds:  number[] | null, // all branches the user belongs to (treasurer may be in many)
 *     branch:     object | null,   // the primary branch object
 *   }
 *
 * Usage in controllers:
 *   const { branchId, isGlobal } = req.branchScope;
 *   if (!isGlobal && branchId) where.branchId = branchId;
 *
 * Requires authenticate() to run first so req.user is available.
 */

const { BranchUser, Branch } = require('../models');
const api    = require('../utils/apiResponse');
const logger = require('../utils/logger');

// Roles that see ALL data (no branch restriction)
const GLOBAL_ROLES = new Set(['administrator', 'pastor']);

const branchScope = async (req, res, next) => {
  try {
    if (!req.user) return api.unauthorized(res, 'Authentication required');

    // Global roles — no filtering
    if (GLOBAL_ROLES.has(req.user.role)) {
      req.branchScope = {
        branchId:  null,
        isGlobal:  true,
        branchIds: null,
        branch:    null,
      };
      return next();
    }

    // Scoped roles (treasurer, etc.) — look up their branch assignment(s)
    const assignments = await BranchUser.findAll({
      where:   { userId: req.user.id },
      include: [{ model: Branch, as: 'branch', where: { status: 'active' }, required: true }],
    });

    if (!assignments.length) {
      // Treasurer not assigned to any branch yet — deny data access gracefully
      req.branchScope = {
        branchId:  -1,        // sentinel: no branch → queries will return empty
        isGlobal:  false,
        branchIds: [],
        branch:    null,
      };
      logger.warn(`branchScope: user ${req.user.id} (${req.user.role}) has no branch assignment`);
      return next();
    }

    // Primary branch = first assignment (or the one marked as main if available)
    const primary = assignments.find(a => a.branch?.isMain) || assignments[0];
    const branchIds = assignments.map(a => a.branchId);

    req.branchScope = {
      branchId:  primary.branchId,
      isGlobal:  false,
      branchIds,                    // array — supports treasurer in multiple branches
      branch:    primary.branch.toJSON(),
    };

    next();
  } catch (err) {
    logger.error('branchScope middleware error:', err.message);
    return api.error(res, 'Failed to resolve branch scope');
  }
};

/**
 * Helper used inside controllers.
 * Returns the Sequelize WHERE clause fragment for branch filtering.
 * - Global users    → {} (no restriction)
 * - Scoped users    → { branchId: { [Op.in]: branchIds } }
 *                     or { branchId: singleId }
 * - No branch user  → { branchId: -9999 } (returns nothing)
 */
const { Op } = require('sequelize');

const buildBranchFilter = (branchScope) => {
  if (!branchScope || branchScope.isGlobal) return {};

  const { branchIds } = branchScope;
  if (!branchIds || branchIds.length === 0) return { branchId: -9999 };
  if (branchIds.length === 1) return { branchId: branchIds[0] };

  // Treasurer assigned to multiple branches — see all of them
  return { branchId: { [Op.in]: branchIds } };
};

module.exports = { branchScope, buildBranchFilter };
