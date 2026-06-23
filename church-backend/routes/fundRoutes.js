const express = require('express');
const router  = express.Router();
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const { authenticate, allRoles, adminOnly } = require('../middleware/auth');
const { branchScope } = require('../middleware/branchScope');
const ctrl = require('../controllers/fundController');

router.use(authenticate, branchScope, allRoles);

router.get('/', ctrl.getAll);
router.get('/:id', ctrl.getById);
router.get('/:id/report', ctrl.getFundReport);

router.post('/', adminOnly, [
  body('fundName').isIn(['General Fund', 'Building Fund', 'Welfare Fund', 'Mission Fund']).withMessage('Invalid fund name'),
], validate, ctrl.create);

router.put('/:id', adminOnly, ctrl.update);
router.delete('/:id', adminOnly, ctrl.remove);

module.exports = router;
