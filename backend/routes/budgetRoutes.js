const express = require('express');
const router  = express.Router();
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const { authenticate, allRoles, adminOrTreasurer } = require('../middleware/auth');
const ctrl = require('../controllers/budgetController');

router.use(authenticate, allRoles);

router.get('/',           ctrl.getAll);
router.get('/:id',        ctrl.getById);
router.post('/recalc-all', adminOrTreasurer, ctrl.recalcAll);

router.post('/', adminOrTreasurer, [
  body('title').notEmpty().withMessage('Title is required'),
  body('category').notEmpty().withMessage('Category is required'),
  body('amount').isFloat({ min: 1 }).withMessage('Amount must be > 0'),
  body('startDate').isISO8601().withMessage('Valid start date required'),
  body('period').optional().isIn(['Monthly','Quarterly','Annual']),
], validate, ctrl.create);

router.put('/:id', adminOrTreasurer, [
  body('amount').optional().isFloat({ min: 1 }),
  body('startDate').optional().isISO8601(),
], validate, ctrl.update);

router.delete('/:id', adminOrTreasurer, ctrl.remove);

module.exports = router;
