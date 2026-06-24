const express = require('express');
const router  = express.Router();
const { authenticate, allRoles } = require('../middleware/auth');
const { branchScope } = require('../middleware/branchScope');
const ctrl = require('../controllers/dashboardController');

router.use(authenticate, branchScope, allRoles);

router.get('/stats',                ctrl.getStats);
router.get('/monthly-stats',        ctrl.getMonthlyStats);
router.get('/contribution-trends',  ctrl.getContributionTrends);
router.get('/top-contributors',     ctrl.getTopContributors);
router.get('/fund-overview',        ctrl.getFundOverview);
router.get('/recent-transactions',  ctrl.getRecentTransactions);
router.get('/yearly-comparison',    ctrl.getYearlyComparison);
router.get('/branches-overview',    ctrl.getBranchesOverview);

module.exports = router;
