const express = require('express');
const router  = express.Router();
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const { authenticate, allRoles, adminOrTreasurer } = require('../middleware/auth');
const upload  = require('../middleware/upload');
const ctrl    = require('../controllers/expenseController');

router.use(authenticate, allRoles);

router.get('/', ctrl.getAll);
router.get('/summary', ctrl.getSummary);
router.get('/:id', ctrl.getById);

const expenseRules = [
  body('category').isIn(['Salaries', 'Utilities', 'Maintenance', 'Ministry', 'Welfare', 'Missions', 'Equipment', 'Stationery', 'Transport', 'Other'])
    .withMessage('Invalid expense category'),
  body('amount').isFloat({ min: 1 }).withMessage('Amount must be greater than 0'),
  body('approvedBy').notEmpty().withMessage('Approved by is required'),
  body('date').isISO8601().withMessage('Valid date is required'),
];

router.post('/', adminOrTreasurer, upload.single('receipt'), expenseRules, validate, ctrl.create);
router.put('/:id', adminOrTreasurer, upload.single('receipt'), expenseRules, validate, ctrl.update);
router.delete('/:id', adminOrTreasurer, ctrl.remove);

module.exports = router;
