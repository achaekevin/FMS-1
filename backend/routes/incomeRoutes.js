const express = require('express');
const router  = express.Router();
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const { authenticate, allRoles, adminOrTreasurer } = require('../middleware/auth');
const { branchScope } = require('../middleware/branchScope');
const ctrl = require('../controllers/incomeController');

router.use(authenticate, branchScope, allRoles);

router.get('/', ctrl.getAll);
router.get('/summary', ctrl.getSummary);
router.get('/:id', ctrl.getById);

const incomeRules = [
  body('type').isIn(['Tithe', 'Offering', 'Donation', 'Building Fund', 'Mission Offering', 'Welfare', 'Special Collection', 'Other'])
    .withMessage('Invalid income type'),
  body('amount').isFloat({ min: 1 }).withMessage('Amount must be greater than 0'),
  body('paymentMethod').isIn(['Cash', 'M-Pesa', 'Bank Transfer', 'Cheque']).withMessage('Invalid payment method'),
  body('date').isISO8601().withMessage('Valid date is required'),
];

router.post('/', adminOrTreasurer, incomeRules, validate, ctrl.create);
router.put('/:id', adminOrTreasurer, incomeRules, validate, ctrl.update);
router.delete('/:id', adminOrTreasurer, ctrl.remove);

module.exports = router;
