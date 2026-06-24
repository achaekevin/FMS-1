const express  = require('express');
const router   = express.Router();
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const { authenticate, allRoles, adminOrTreasurer, adminOnly } = require('../middleware/auth');
const ctrl = require('../controllers/visitorController');

router.use(authenticate, allRoles);

// ─── Visitor stats ─────────────────────────────────────────
router.get('/visitors/stats', ctrl.getVisitorStats);

// ─── Visitors ──────────────────────────────────────────────
router.get('/visitors',      ctrl.getVisitors);
router.get('/visitors/:id',  ctrl.getVisitor);

router.post('/visitors', adminOrTreasurer, [
  body('fullName').trim().notEmpty().withMessage('Full name is required'),
  body('visitDate').isISO8601().withMessage('Valid visit date required'),
], validate, ctrl.createVisitor);

router.put('/visitors/:id',    adminOrTreasurer, ctrl.updateVisitor);
router.delete('/visitors/:id', adminOnly,        ctrl.deleteVisitor);

// ─── Baptism records ───────────────────────────────────────
router.get('/baptisms',      ctrl.getBaptisms);
router.get('/baptisms/:id',  ctrl.getBaptism);

router.post('/baptisms', adminOrTreasurer, [
  body('personName').trim().notEmpty().withMessage('Person name is required'),
  body('baptismDate').isISO8601().withMessage('Valid baptism date required'),
  body('pastor').trim().notEmpty().withMessage('Pastor name is required'),
  body('location').trim().notEmpty().withMessage('Location is required'),
], validate, ctrl.createBaptism);

router.put('/baptisms/:id',    adminOrTreasurer, ctrl.updateBaptism);
router.delete('/baptisms/:id', adminOnly,        ctrl.deleteBaptism);

module.exports = router;
