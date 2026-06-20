const express  = require('express');
const router   = express.Router();
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const { authenticate, adminOnly } = require('../middleware/auth');
const ctrl = require('../controllers/backupController');

router.use(authenticate, adminOnly);

// List & stats
router.get('/stats',                  ctrl.stats);
router.get('/list',                   ctrl.list);

// Manual backup
router.post('/create',                ctrl.create);

// Download & delete
router.get('/download/:filename',     ctrl.download);
router.delete('/:filename',           ctrl.remove);

// Restore — upload .sql file from client
router.post('/restore/upload',        ctrl.restore);

// Restore — from a file already on the server
router.post('/restore/:filename',     ctrl.restoreFromFile);

// Auto-backup schedule
router.get('/schedule',               ctrl.getSchedule);
router.put('/schedule', [
  body('enabled').isBoolean(),
  body('frequency').isIn(['hourly','daily','weekly','monthly']),
  body('time').optional().matches(/^\d{2}:\d{2}$/),
  body('retainDays').optional().isInt({ min: 1, max: 365 }),
], validate, ctrl.setSchedule);

module.exports = router;
