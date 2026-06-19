const express = require('express');
const router  = express.Router();
const { authenticate, adminOnly } = require('../middleware/auth');
const ctrl = require('../controllers/backupController');

router.use(authenticate, adminOnly);

router.get('/list',                ctrl.list);
router.post('/create',             ctrl.create);
router.get('/download/:filename',  ctrl.download);
router.delete('/:filename',        ctrl.remove);

module.exports = router;
