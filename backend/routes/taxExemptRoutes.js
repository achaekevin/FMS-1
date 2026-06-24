'use strict';

const express = require('express');
const router  = express.Router();
const { query, body, param } = require('express-validator');
const validate = require('../middleware/validate');
const { authenticate, adminOrTreasurer } = require('../middleware/auth');
const ctrl = require('../controllers/taxExemptController');

// All endpoints require authentication + admin/treasurer role
router.use(authenticate, adminOrTreasurer);

// GET  /tax-statements/preview       — summary before batch generation
router.get('/preview', [
  query('year').optional().isInt({ min: 2000, max: 2100 }),
  query('quarter').optional().isInt({ min: 1, max: 4 }),
  query('startDate').optional().isISO8601(),
  query('endDate').optional().isISO8601(),
], validate, ctrl.preview);

// GET  /tax-statements/members       — list members with contribution totals
router.get('/members', [
  query('year').optional().isInt({ min: 2000, max: 2100 }),
  query('quarter').optional().isInt({ min: 1, max: 4 }),
  query('startDate').optional().isISO8601(),
  query('endDate').optional().isISO8601(),
  query('search').optional().isString().trim(),
], validate, ctrl.listMembers);

// GET  /tax-statements/:memberId/single  — stream single PDF
router.get('/:memberId/single', [
  param('memberId').isInt({ min: 1 }),
  query('year').optional().isInt({ min: 2000, max: 2100 }),
  query('quarter').optional().isInt({ min: 1, max: 4 }),
  query('startDate').optional().isISO8601(),
  query('endDate').optional().isISO8601(),
], validate, ctrl.singleStatement);

// POST /tax-statements/batch         — generate ZIP of multiple statements
router.post('/batch', [
  body('year').optional().isInt({ min: 2000, max: 2100 }),
  body('quarter').optional().isInt({ min: 1, max: 4 }),
  body('startDate').optional().isISO8601(),
  body('endDate').optional().isISO8601(),
  body('memberIds').optional().isArray(),
  body('memberIds.*').optional().isInt({ min: 1 }),
], validate, ctrl.batchGenerate);

module.exports = router;
