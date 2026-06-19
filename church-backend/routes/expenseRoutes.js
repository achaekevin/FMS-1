const express  = require('express');
const router   = express.Router();
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const { authenticate, authorize, adminOnly, adminOrTreasurer } = require('../middleware/auth');
const upload   = require('../middleware/upload');
const ctrl     = require('../controllers/expenseController');

router.use(authenticate);

// ── Read (all authenticated roles) ────────────────────────
router.get('/',        ctrl.getAll);
router.get('/summary', ctrl.getSummary);
router.get('/:id',     ctrl.getById);

// ── Create (treasurer or admin) ───────────────────────────
const expenseRules = [
  body('category')
    .isIn(['Salaries','Utilities','Maintenance','Ministry','Welfare','Missions','Equipment','Stationery','Transport','Other'])
    .withMessage('Invalid expense category'),
  body('amount').isFloat({ min: 1 }).withMessage('Amount must be greater than 0'),
  body('date').isISO8601().withMessage('Valid date is required'),
];

router.post('/',
  adminOrTreasurer,
  upload.single('receipt'),
  expenseRules,
  validate,
  ctrl.create
);

// ── Edit (treasurer — only while pending_pastor) ──────────
router.put('/:id',
  adminOrTreasurer,
  upload.single('receipt'),
  expenseRules,
  validate,
  ctrl.update
);

// ── Approval workflow ──────────────────────────────────────

/**
 * PATCH /api/expenses/:id/approve
 * Pastor approves → moves to pending_admin
 */
router.patch('/:id/approve',
  authorize('pastor', 'administrator'),
  [body('note').optional().isString().isLength({ max: 500 })],
  validate,
  ctrl.approve
);

/**
 * PATCH /api/expenses/:id/finalize
 * Admin finalizes → moves to approved, debits fund
 */
router.patch('/:id/finalize',
  adminOnly,
  [body('note').optional().isString().isLength({ max: 500 })],
  validate,
  ctrl.finalize
);

/**
 * PATCH /api/expenses/:id/reject
 * Pastor or Admin can reject (with a required reason)
 */
router.patch('/:id/reject',
  authorize('pastor', 'administrator'),
  [body('note').notEmpty().withMessage('Rejection reason is required').isLength({ max: 500 })],
  validate,
  ctrl.reject
);

// ── Delete (only pending/rejected expenses) ───────────────
router.delete('/:id', adminOrTreasurer, ctrl.remove);

module.exports = router;
