const express = require('express');
const router  = express.Router();
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const { authenticate, allRoles, adminOrTreasurer } = require('../middleware/auth');
const ctrl = require('../controllers/receiptController');

router.use(authenticate, allRoles);

router.get('/',                 ctrl.getAll);
router.get('/:id',              ctrl.getById);
router.get('/:id/download',     ctrl.download);

router.post('/generate', adminOrTreasurer, [
  body('memberName').optional().notEmpty(),
  body('amount').if(body('incomeId').not().exists()).isFloat({ min: 1 }).withMessage('Amount required when no incomeId'),
  body('date').optional().isISO8601(),
], validate, ctrl.generate);

module.exports = router;
