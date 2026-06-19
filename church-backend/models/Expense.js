const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/sequelize');

const Expense = sequelize.define('Expense', {
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    autoIncrement: true,
    primaryKey: true,
  },
  recordedBy: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false,
    references: { model: 'users', key: 'id' },
  },
  fundId: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: true,
    references: { model: 'funds', key: 'id' },
  },
  category: {
    type: DataTypes.ENUM('Salaries', 'Utilities', 'Maintenance', 'Ministry', 'Welfare', 'Missions', 'Equipment', 'Stationery', 'Transport', 'Other'),
    allowNull: false,
  },
  amount: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false,
    validate: { min: 1 },
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  approvedBy: {
    type: DataTypes.STRING(120),
    allowNull: false,
  },
  receiptPath: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  date: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
  status: {
    type: DataTypes.ENUM('pending', 'approved', 'rejected'),
    defaultValue: 'approved',
  },
}, {
  tableName: 'expenses',
});

module.exports = Expense;
