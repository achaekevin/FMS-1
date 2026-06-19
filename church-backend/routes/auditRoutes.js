const express = require('express');
const router  = express.Router();
const { authenticate, adminOrTreasurer } = require('../middleware/auth');
const ctrl = require('../controllers/auditController');

router.use(authenticate, adminOrTreasurer);

router.get('/', ctrl.getAll);
router.get('/:id', ctrl.getById);

module.exports = router;
