const express = require('express');
const router  = express.Router();
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const { authenticate, allRoles, adminOrTreasurer } = require('../middleware/auth');
const ctrl = require('../controllers/memberController');

router.use(authenticate, allRoles);

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

router.delete('/:id', adminOrTreasurer, ctrl.remove);

module.exports = router;
