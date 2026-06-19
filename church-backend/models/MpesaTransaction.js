const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/sequelize');

const MpesaTransaction = sequelize.define('MpesaTransaction', {
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    autoIncrement: true,
    primaryKey: true,
  },
  initiatedBy: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false,
    references: { model: 'users', key: 'id' },
  },
  memberId: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: true,
    references: { model: 'members', key: 'id' },
  },
  checkoutRequestId: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  merchantRequestId: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  phone: {
    type: DataTypes.STRING(20),
    allowNull: false,
  },
  amount: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false,
  },
  category: {
    type: DataTypes.STRING(50),
    allowNull: true,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  mpesaReceiptNumber: {
    type: DataTypes.STRING(30),
    allowNull: true,
  },
  status: {
    type: DataTypes.ENUM('pending', 'completed', 'failed', 'cancelled'),
    defaultValue: 'pending',
  },
  resultCode: {
    type: DataTypes.STRING(10),
    allowNull: true,
  },
  resultDesc: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  transactionDate: {
    type: DataTypes.DATE,
    allowNull: true,
  },
}, {
  tableName: 'mpesa_transactions',
});

module.exports = MpesaTransaction;
