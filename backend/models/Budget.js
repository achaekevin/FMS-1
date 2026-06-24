const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/sequelize');

const Budget = sequelize.define('Budget', {
  id:              { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
  createdBy:       { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  fundId:          { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
  title:           { type: DataTypes.STRING(200), allowNull: false, validate: { notEmpty: true } },
  category:        { type: DataTypes.STRING(80),  allowNull: false },
  amount:          { type: DataTypes.DECIMAL(15,2), allowNull: false, validate: { min: 1 } },
  spentAmount:     { type: DataTypes.DECIMAL(15,2), defaultValue: 0.00 },
  remainingAmount: { type: DataTypes.DECIMAL(15,2), defaultValue: 0.00 },
  period:          { type: DataTypes.ENUM('Monthly','Quarterly','Annual'), defaultValue: 'Monthly' },
  startDate:       { type: DataTypes.DATEONLY, allowNull: false },
  endDate:         { type: DataTypes.DATEONLY, allowNull: true },
  description:     { type: DataTypes.TEXT, allowNull: true },
  status:          { type: DataTypes.ENUM('active','closed','exceeded'), defaultValue: 'active' },
}, { tableName: 'budgets' });

module.exports = Budget;
