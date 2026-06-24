const express = require('express');
const router  = express.Router();
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const { authenticate, allRoles, adminOrTreasurer, adminOnly } = require('../middleware/auth');
const ctrl = require('../controllers/payrollController');

router.use(authenticate, allRoles);

// Employees
router.get('/employees',          ctrl.getAllEmployees);
router.get('/employees/:id',      ctrl.getEmployeeById);
router.post('/employees', adminOrTreasurer, [
  body('name').notEmpty().withMessage('Name is required'),
  body('role').notEmpty().withMessage('Role is required'),
  body('department').notEmpty().withMessage('Department is required'),
  body('basicSalary').isFloat({ min: 0 }).withMessage('Basic salary must be >= 0'),
  body('email').optional().isEmail(),
], validate, ctrl.createEmployee);
router.put('/employees/:id',    adminOrTreasurer, ctrl.updateEmployee);
router.delete('/employees/:id', adminOrTreasurer, ctrl.removeEmployee);

// Payslips
router.get('/payslips',             ctrl.getAllPayslips);
router.get('/payslips/summary',     ctrl.getPayrollSummary);
router.get('/payslips/:id/download',ctrl.downloadPayslip);
router.post('/payslips', adminOrTreasurer, [
  body('employeeId').isInt({ min: 1 }).withMessage('Employee ID required'),
  body('month').notEmpty().withMessage('Month is required'),
  body('year').isInt({ min: 2000 }).withMessage('Valid year required'),
  body('basicSalary').optional().isFloat({ min: 0 }),
  body('allowances').optional().isFloat({ min: 0 }),
  body('deductions').optional().isFloat({ min: 0 }),
], validate, ctrl.issuePayslip);

module.exports = router;
