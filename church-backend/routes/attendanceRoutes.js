const express  = require('express');
const router   = express.Router();
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const { authenticate, allRoles, adminOrTreasurer, adminOnly } = require('../middleware/auth');
const ctrl = require('../controllers/attendanceController');

// ── QR self check-in — authenticate optional (members scan with their app)
router.post('/checkin/:token', ctrl.qrCheckIn);

// ── All other routes require auth ─────────────────────────
router.use(authenticate);

// Stats & reports
router.get('/stats',        allRoles,          ctrl.getStats);
router.get('/report',       adminOrTreasurer,  ctrl.exportReport);

// Member history
router.get('/member/:memberId', allRoles,      ctrl.getMemberHistory);

// Sessions
router.get('/sessions',     allRoles,          ctrl.getSessions);
router.get('/sessions/:id', allRoles,          ctrl.getSession);

router.get('/sessions/:id/qrcode', allRoles,   ctrl.getQrCode);

router.post('/sessions', adminOrTreasurer, [
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('serviceType').isIn(['Sunday Service','Midweek Service','Cell Group','Conference','Special Event','Other']),
  body('sessionDate').isISO8601().withMessage('Valid date required'),
  body('qrDurationMinutes').optional().isInt({ min: 1 }),
], validate, ctrl.createSession);

router.put('/sessions/:id',           adminOrTreasurer, ctrl.updateSession);
router.patch('/sessions/:id/close',   adminOrTreasurer, ctrl.closeSession);
router.patch('/sessions/:id/reopen',  adminOrTreasurer, ctrl.reopenSession);
router.delete('/sessions/:id',        adminOnly,        ctrl.deleteSession);

// Manual check-in
router.post('/sessions/:id/checkin', adminOrTreasurer, [
  body('memberId').optional().isInt({ min: 1 }),
  body('guestName').optional().isString(),
], validate, ctrl.manualCheckIn);

// Remove record
router.delete('/records/:id', adminOrTreasurer, ctrl.removeRecord);

module.exports = router;
