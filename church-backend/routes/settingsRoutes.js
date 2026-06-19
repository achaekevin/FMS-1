const express = require('express');
const router  = express.Router();
const { authenticate, allRoles, adminOnly } = require('../middleware/auth');
const ctrl = require('../controllers/settingsController');

router.use(authenticate);

// All roles can read
router.get('/',     allRoles, ctrl.getAll);
router.get('/:key', allRoles, ctrl.getOne);

// Only admin can update
router.put('/', adminOnly, ctrl.updateAll);

module.exports = router;
