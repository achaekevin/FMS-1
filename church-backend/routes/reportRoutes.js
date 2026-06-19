const express = require('express');
const router  = express.Router();
const { authenticate, allRoles } = require('../middleware/auth');
const ctrl = require('../controllers/reportController');

router.use(authenticate, allRoles);

router.get('/income', ctrl.incomeReport);
router.get('/expenses', ctrl.expenseReport);
router.get('/funds', ctrl.fundReport);
router.get('/contributions', ctrl.contributionReport);
router.get('/member/:id/statement', ctrl.memberStatement);

module.exports = router;
