const express = require('express');
const router  = express.Router();
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const { authenticate, allRoles, adminOrTreasurer } = require('../middleware/auth');
const { branchScope } = require('../middleware/branchScope');
const ctrl = require('../controllers/memberController');

// ── PUBLIC: self-registration (no auth) ──────────────────
router.post('/self-register', [
  body('fullName').trim().notEmpty().withMessage('Full name is required').isLength({ min: 2, max: 150 }),
  body('phone').matches(/^(\+254|0)[17]\d{8}$/).withMessage('Valid Kenyan phone number is required (e.g. 0712345678)'),
  body('email').optional({ checkFalsy: true }).isEmail().withMessage('Please enter a valid email address'),
  body('gender').optional().isIn(['male', 'female', 'other']),
  body('dateOfBirth').optional({ checkFalsy: true }).isISO8601().withMessage('Valid date of birth required'),
  body('address').optional().isString().isLength({ max: 255 }),
  body('branchId').optional().isInt({ min: 1 }),
], validate, ctrl.selfRegister);

// ── All routes below require authentication ───────────────
router.use(authenticate, branchScope, allRoles);

router.get('/', ctrl.getAll);
router.get('/:id', ctrl.getById);
router.get('/:id/contributions', ctrl.getContributions);

router.post('/', adminOrTreasurer, [
  body('fullName').notEmpty().withMessage('Full name is required'),
  body('phone').matches(/^(\+254|0)[17]\d{8}$/).withMessage('Valid Kenyan phone number is required'),
  body('email').optional().isEmail(),
], validate, ctrl.create);

router.put('/:id', adminOrTreasurer, [
  body('fullName').optional().notEmpty(),
  body('phone').optional().matches(/^(\+254|0)[17]\d{8}$/),
  body('email').optional().isEmail(),
], validate, ctrl.update);

// Approve a pending (self-registered) member
router.patch('/:id/approve', adminOrTreasurer, ctrl.approve);

router.delete('/:id', adminOrTreasurer, ctrl.remove);

module.exports = router;
