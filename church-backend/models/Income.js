const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/sequelize');

const Income = sequelize.define('Income', {
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    autoIncrement: true,
    primaryKey: true,
  },
  memberId: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: true,
    references: { model: 'members', key: 'id' },
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
  type: {
    type: DataTypes.ENUM('Tithe', 'Offering', 'Donation', 'Building Fund', 'Mission Offering', 'Welfare', 'Special Collection', 'Other'),
    allowNull: false,
  },
  amount: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false,
    validate: { min: 1 },
  },
  paymentMethod: {
    type: DataTypes.ENUM('Cash', 'M-Pesa', 'Bank Transfer', 'Cheque'),
    allowNull: false,
    defaultValue: 'Cash',
  },
  mpesaRef: {
    type: DataTypes.STRING(30),
    allowNull: true,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  date: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
  branchId: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: true,
    references: { model: 'branches', key: 'id' },
  },
}, {
  tableName: 'income',
});

module.exports = Income;
