const express = require('express');
const router  = express.Router();
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const { authenticate, allRoles, adminOrTreasurer } = require('../middleware/auth');
const ctrl = require('../controllers/announcementController');

router.use(authenticate, allRoles);

router.get('/',    ctrl.getAll);
router.get('/:id', ctrl.getById);

router.post('/', adminOrTreasurer, [
  body('title').notEmpty().withMessage('Title is required'),
  body('content').notEmpty().withMessage('Content is required'),
  body('priority').optional().isIn(['High','Medium','Low']),
  body('expiryDate').optional().isISO8601(),
], validate, ctrl.create);

router.put('/:id', adminOrTreasurer, [
  body('title').optional().notEmpty(),
  body('priority').optional().isIn(['High','Medium','Low']),
  body('expiryDate').optional().isISO8601(),
], validate, ctrl.update);

router.delete('/:id', adminOrTreasurer, ctrl.remove);

module.exports = router;
