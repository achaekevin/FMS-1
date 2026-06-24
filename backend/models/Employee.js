const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/sequelize');

const Employee = sequelize.define('Employee', {
  id:          { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
  createdBy:   { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  name:        { type: DataTypes.STRING(150), allowNull: false, validate: { notEmpty: true } },
  role:        { type: DataTypes.STRING(100), allowNull: false },
  department:  { type: DataTypes.STRING(80),  allowNull: false },
  phone:       { type: DataTypes.STRING(20),  allowNull: true },
  email:       { type: DataTypes.STRING(150), allowNull: true, validate: { isEmail: true } },
  basicSalary: { type: DataTypes.DECIMAL(15,2), allowNull: false, defaultValue: 0.00, validate: { min: 0 } },
  hireDate:    { type: DataTypes.DATEONLY, allowNull: true },
  status:      { type: DataTypes.ENUM('active','inactive'), defaultValue: 'active' },
}, { tableName: 'employees' });

module.exports = Employee;
