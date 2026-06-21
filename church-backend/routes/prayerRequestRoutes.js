const express = require('express');
const router  = express.Router();
const { body, param, query } = require('express-validator');
const validate = require('../middleware/validate');
const { authenticate, authorize, adminOrPastor, allRoles } = require('../middleware/auth');
const ctrl = require('../controllers/prayerRequestController');

const CATEGORIES = ['Healing', 'Family', 'Employment', 'Thanksgiving', 'Other'];
const STATUSES   = ['Pending', 'In Progress', 'Answered', 'Closed'];
const PRIORITIES = ['High', 'Medium', 'Low'];

// ── PUBLIC: no auth required ──────────────────────────────────────────────────
// Anyone (member, visitor, anonymous) can submit a prayer request via this endpoint
router.post('/public', [
  body('requesterName').trim().notEmpty().withMessage('Your name is required').isLength({ min: 2, max: 150 }),
  body('title').trim().notEmpty().withMessage('Title is required').isLength({ max: 200 }),
  body('description').trim().notEmpty().withMessage('Please describe your prayer request'),
  body('category').isIn(CATEGORIES).withMessage(`Category must be one of: ${CATEGORIES.join(', ')}`),
  body('email').optional({ checkFalsy: true }).isEmail().withMessage('Please enter a valid email address'),
  body('phone').optional({ checkFalsy: true }).isString().isLength({ max: 20 }),
  body('priority').optional().isIn(PRIORITIES),
  body('isAnonymous').optional().isBoolean(),
], validate, ctrl.publicSubmit);

// ── Statistics (admin / pastor only) ─────────────────────────────────────────
// All routes below this line require authentication
router.use(authenticate);

router.get('/stats', adminOrPastor, ctrl.getStats);

// ── List all (all authenticated roles, with visibility filtering in controller) ──
router.get('/', allRoles, [
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
  query('status').optional().isIn(STATUSES),
  query('category').optional().isIn(CATEGORIES),
  query('priority').optional().isIn(PRIORITIES),
  query('assignedTo').optional().isInt({ min: 1 }).toInt(),
  query('memberId').optional().isInt({ min: 1 }).toInt(),
], validate, ctrl.getAll);

// ── Get single request ────────────────────────────────────────────────────────
router.get('/:id', allRoles, [
  param('id').isInt({ min: 1 }).withMessage('Invalid prayer request ID'),
], validate, ctrl.getById);

// ── Submit a new request ──────────────────────────────────────────────────────
router.post('/', allRoles, [
  body('title')
    .trim().notEmpty().withMessage('Title is required')
    .isLength({ max: 200 }).withMessage('Title must be 200 characters or less'),
  body('description')
    .trim().notEmpty().withMessage('Description is required'),
  body('category')
    .isIn(CATEGORIES).withMessage(`Category must be one of: ${CATEGORIES.join(', ')}`),
  body('requesterName')
    .optional().trim().isLength({ min: 2, max: 150 }),
  body('memberId')
    .optional().isInt({ min: 1 }).withMessage('memberId must be a positive integer'),
  body('priority')
    .optional().isIn(PRIORITIES),
  body('isAnonymous')
    .optional().isBoolean(),
  body('isPrivate')
    .optional().isBoolean(),
], validate, ctrl.create);

// ── Update a request ──────────────────────────────────────────────────────────
router.put('/:id', allRoles, [
  param('id').isInt({ min: 1 }),
  body('title').optional().trim().notEmpty().isLength({ max: 200 }),
  body('description').optional().trim().notEmpty(),
  body('category').optional().isIn(CATEGORIES),
  body('priority').optional().isIn(PRIORITIES),
  body('status').optional().isIn(STATUSES),
  body('isAnonymous').optional().isBoolean(),
  body('isPrivate').optional().isBoolean(),
  body('assignedTo').optional().isInt({ min: 1 }),
  body('pastorNote').optional().isString().isLength({ max: 2000 }),
], validate, ctrl.update);

// ── Assign to a pastor / admin (admin & pastor only) ─────────────────────────
router.patch('/:id/assign', adminOrPastor, [
  param('id').isInt({ min: 1 }),
  body('assignedTo')
    .notEmpty().withMessage('assignedTo (user ID) is required')
    .isInt({ min: 1 }),
], validate, ctrl.assign);

// ── Record a prayer (all authenticated users) ─────────────────────────────────
router.patch('/:id/pray', allRoles, [
  param('id').isInt({ min: 1 }),
], validate, ctrl.incrementPrayerCount);

// ── Delete (owner or admin) ───────────────────────────────────────────────────
router.delete('/:id', allRoles, [
  param('id').isInt({ min: 1 }),
], validate, ctrl.remove);

module.exports = router;
