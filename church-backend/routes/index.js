const express = require('express');
const router  = express.Router();

// ── Existing modules ──────────────────────────────────────
router.use('/auth',          require('./authRoutes'));
router.use('/users',         require('./userRoutes'));
router.use('/members',       require('./memberRoutes'));
router.use('/income',        require('./incomeRoutes'));
router.use('/expenses',      require('./expenseRoutes'));
router.use('/funds',         require('./fundRoutes'));
router.use('/reports',       require('./reportRoutes'));
router.use('/audit',         require('./auditRoutes'));
router.use('/mpesa',         require('./mpesaRoutes'));
router.use('/dashboard',     require('./dashboardRoutes'));

// ── New modules ───────────────────────────────────────────
router.use('/notifications', require('./notificationRoutes'));
router.use('/budgets',       require('./budgetRoutes'));
router.use('/receipts',      require('./receiptRoutes'));
router.use('/events',        require('./eventRoutes'));
router.use('/assets',        require('./assetRoutes'));
router.use('/payroll',       require('./payrollRoutes'));
router.use('/branches',      require('./branchRoutes'));
router.use('/announcements', require('./announcementRoutes'));
router.use('/settings',      require('./settingsRoutes'));
router.use('/search',        require('./searchRoutes'));
router.use('/backup',        require('./backupRoutes'));
router.use('/communications', require('./communicationRoutes'));
router.use('/documents',     require('./documentRoutes'));
router.use('/attendance',    require('./attendanceRoutes'));
router.use('/visitors',     require('./visitorRoutes'));
router.use('/prayer-requests', require('./prayerRequestRoutes'));
router.use('/tax-statements',  require('./taxExemptRoutes'));

// ── Health check ──────────────────────────────────────────
router.get('/health', (req, res) => res.json({
  success: true,
  message: 'Grace Life Church Finance API is healthy',
  timestamp: new Date(),
  version: '2.0.0',
}));

module.exports = router;
