const express = require('express');
const router  = express.Router();
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const { authenticate, adminOnly } = require('../middleware/auth');
const ctrl = require('../controllers/userController');

router.use(authenticate, adminOnly);

router.get('/', ctrl.getAll);
router.get('/:id', ctrl.getById);

router.post('/', [
  body('name').notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('role').isIn(['administrator', 'pastor', 'treasurer']).withMessage('Invalid role'),
], validate, ctrl.create);

router.put('/:id', [
  body('email').optional().isEmail(),
  body('role').optional().isIn(['administrator', 'pastor', 'treasurer']),
  body('status').optional().isIn(['active', 'inactive']),
], validate, ctrl.update);

router.delete('/:id', ctrl.remove);

module.exports = router;
