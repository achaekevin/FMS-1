const express = require('express');
const router  = express.Router();
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const { authenticate, allRoles, adminOnly, adminOrTreasurer } = require('../middleware/auth');
const ctrl = require('../controllers/branchController');

router.use(authenticate, allRoles);

router.get('/',              ctrl.getAll);
router.get('/:id',           ctrl.getById);
router.get('/:id/stats',     ctrl.getStats);

router.post('/', adminOnly, [
  body('name').notEmpty().withMessage('Branch name is required'),
], validate, ctrl.create);

router.put('/:id',  adminOnly, ctrl.update);
router.delete('/:id', adminOnly, ctrl.remove);

// Branch user assignments
router.post('/:id/users', adminOnly, [
  body('userId').isInt({ min: 1 }).withMessage('Valid userId required'),
], validate, ctrl.addUser);
router.delete('/:id/users/:userId', adminOnly, ctrl.removeUser);

module.exports = router;
