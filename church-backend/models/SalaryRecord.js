const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/sequelize');

const SalaryRecord = sequelize.define('SalaryRecord', {
  id:          { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
  employeeId:  { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  generatedBy: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  month:       { type: DataTypes.STRING(20), allowNull: false },
  year:        { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  basicSalary: { type: DataTypes.DECIMAL(15,2), allowNull: false, defaultValue: 0.00 },
  allowances:  { type: DataTypes.DECIMAL(15,2), defaultValue: 0.00 },
  deductions:  { type: DataTypes.DECIMAL(15,2), defaultValue: 0.00 },
  netSalary:   { type: DataTypes.DECIMAL(15,2), allowNull: false, defaultValue: 0.00 },
  notes:       { type: DataTypes.TEXT, allowNull: true },
  payslipPath: { type: DataTypes.STRING(255), allowNull: true },
}, { tableName: 'salary_records' });

module.exports = SalaryRecord;
