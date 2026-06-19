const { Employee, SalaryRecord, User } = require('../models');
const api    = require('../utils/apiResponse');
const audit  = require('../services/auditService');
const { generatePayslipPDF } = require('../services/receiptPdfService');
const emailSvc = require('../services/emailService');
const { getPagination } = require('../utils/helpers');
const { fn, col } = require('sequelize');
const path = require('path');

const EMP_INCLUDE = [{ model: User, as: 'creator', attributes: ['id','name'] }];
const SLIP_INCLUDE = [
  { model: Employee, as: 'employee', attributes: ['id','name','role','department','email'] },
  { model: User, as: 'generator', attributes: ['id','name'] },
];

// ── Employees ─────────────────────────────────────────────
exports.getAllEmployees = async (req, res) => {
  try {
    const { page = 1, limit = 20, status, department } = req.query;
    const { limit: lim, offset } = getPagination(page, limit);
    const where = {};
    if (status)     where.status     = status;
    if (department) where.department = department;
    const { count, rows } = await Employee.findAndCountAll({ where, limit: lim, offset, include: EMP_INCLUDE, order: [['name','ASC']] });
    return api.paginate(res, rows, count, page, lim);
  } catch (err) { return api.error(res, err.message); }
};

exports.getEmployeeById = async (req, res) => {
  try {
    const e = await Employee.findByPk(req.params.id, {
      include: [...EMP_INCLUDE, { model: SalaryRecord, as: 'salaryRecords', limit: 12, order: [['year','DESC'],['month','DESC']] }],
    });
    if (!e) return api.notFound(res, 'Employee not found');
    return api.success(res, e);
  } catch (err) { return api.error(res, err.message); }
};

exports.createEmployee = async (req, res) => {
  try {
    const e = await Employee.create({ ...req.body, createdBy: req.user.id });
    await audit.log(req.user.id, 'CREATE', 'PAYROLL', `Added employee: ${e.name}`, { employeeId: e.id }, req);
    return api.created(res, e, 'Employee added');
  } catch (err) { return api.error(res, err.message); }
};

exports.updateEmployee = async (req, res) => {
  try {
    const e = await Employee.findByPk(req.params.id);
    if (!e) return api.notFound(res, 'Employee not found');
    await e.update(req.body);
    await audit.log(req.user.id, 'UPDATE', 'PAYROLL', `Updated employee: ${e.name}`, { employeeId: e.id }, req);
    return api.success(res, e, 'Employee updated');
  } catch (err) { return api.error(res, err.message); }
};

exports.removeEmployee = async (req, res) => {
  try {
    const e = await Employee.findByPk(req.params.id);
    if (!e) return api.notFound(res, 'Employee not found');
    await e.update({ status: 'inactive' });
    await audit.log(req.user.id, 'DELETE', 'PAYROLL', `Deactivated employee: ${e.name}`, null, req);
    return api.success(res, null, 'Employee deactivated');
  } catch (err) { return api.error(res, err.message); }
};

// ── Salary Records / Payslips ─────────────────────────────
exports.getAllPayslips = async (req, res) => {
  try {
    const { page = 1, limit = 20, employeeId, month, year } = req.query;
    const { limit: lim, offset } = getPagination(page, limit);
    const where = {};
    if (employeeId) where.employeeId = employeeId;
    if (month)      where.month      = month;
    if (year)       where.year       = year;
    const { count, rows } = await SalaryRecord.findAndCountAll({
      where, limit: lim, offset, include: SLIP_INCLUDE, order: [['year','DESC'],['createdAt','DESC']],
    });
    return api.paginate(res, rows, count, page, lim);
  } catch (err) { return api.error(res, err.message); }
};

exports.issuePayslip = async (req, res) => {
  try {
    const { employeeId, month, year, basicSalary, allowances, deductions, notes, sendEmail: doEmail } = req.body;

    const emp = await Employee.findByPk(employeeId);
    if (!emp) return api.notFound(res, 'Employee not found');

    // Prevent duplicate for same month/year
    const existing = await SalaryRecord.findOne({ where: { employeeId, month, year } });
    if (existing) return api.badRequest(res, `Payslip for ${month} ${year} already issued for this employee`);

    const netSalary = parseFloat(basicSalary || emp.basicSalary) + parseFloat(allowances || 0) - parseFloat(deductions || 0);
    const slip = await SalaryRecord.create({
      employeeId, generatedBy: req.user.id,
      month, year,
      basicSalary: basicSalary || emp.basicSalary,
      allowances: allowances || 0,
      deductions: deductions || 0,
      netSalary, notes,
    });

    // Generate PDF on disk
    const filePath = path.join(__dirname, '../uploads/payslips', `payslip-${emp.name.replace(/\s+/g,'-')}-${month}-${year}.pdf`);
    await generatePayslipPDF(slip, emp, null, filePath).catch(() => {});
    await slip.update({ payslipPath: filePath });

    await audit.log(req.user.id, 'CREATE', 'PAYROLL',
      `Issued payslip for ${emp.name} — ${month} ${year}`, { slipId: slip.id }, req);

    // Optional email
    if (doEmail && emp.email) {
      emailSvc.send({
        to: emp.email,
        subject: `Your Payslip — ${month} ${year}`,
        html: `<p>Hi ${emp.name}, your payslip for ${month} ${year} has been issued. Net Salary: KES ${netSalary.toLocaleString()}.</p>`,
      }).catch(() => {});
    }

    const full = await SalaryRecord.findByPk(slip.id, { include: SLIP_INCLUDE });
    return api.created(res, full, 'Payslip issued');
  } catch (err) { return api.error(res, err.message); }
};

exports.downloadPayslip = async (req, res) => {
  try {
    const slip = await SalaryRecord.findByPk(req.params.id, { include: SLIP_INCLUDE });
    if (!slip) return api.notFound(res, 'Payslip not found');
    const fs = require('fs');
    if (slip.payslipPath && fs.existsSync(slip.payslipPath)) {
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="payslip-${slip.employee?.name || slip.id}-${slip.month}-${slip.year}.pdf"`);
      return fs.createReadStream(slip.payslipPath).pipe(res);
    }
    return generatePayslipPDF(slip, slip.employee, res);
  } catch (err) { return api.error(res, err.message); }
};

exports.getPayrollSummary = async (req, res) => {
  try {
    const { year } = req.query;
    const where = year ? { year } : {};
    const byMonth = await SalaryRecord.findAll({
      where,
      attributes: ['month', 'year',
        [fn('SUM', col('netSalary')), 'totalNet'],
        [fn('COUNT', col('id')), 'count'],
      ],
      group: ['year', 'month'],
      order: [['year','DESC'],['month','DESC']],
      raw: true,
    });
    const totalPayroll = await SalaryRecord.sum('netSalary', { where }) || 0;
    return api.success(res, { byMonth, totalPayroll });
  } catch (err) { return api.error(res, err.message); }
};
