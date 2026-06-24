const express = require('express');
const router  = express.Router();
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const { authenticate, allRoles, adminOnly } = require('../middleware/auth');
const ctrl = require('../controllers/notificationController');

router.use(authenticate, allRoles);

router.get('/',              ctrl.getAll);
router.put('/read-all',      ctrl.markAllRead);
router.put('/:id/read',      ctrl.markRead);
router.delete('/:id',        ctrl.remove);

// Admins can broadcast
router.post('/', adminOnly, [
  body('title').notEmpty().withMessage('Title is required'),
  body('message').notEmpty().withMessage('Message is required'),
  body('type').optional().isIn(['info','success','warning','error']),
], validate, ctrl.create);

module.exports = router;
