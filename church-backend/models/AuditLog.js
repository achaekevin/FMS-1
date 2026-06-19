const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/sequelize');

const AuditLog = sequelize.define('AuditLog', {
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    autoIncrement: true,
    primaryKey: true,
  },
  userId: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: true,
    references: { model: 'users', key: 'id' },
  },
  action: {
    type: DataTypes.ENUM(
      'CREATE','UPDATE','DELETE','LOGIN','LOGOUT',
      'EXPORT','MPESA','VIEW','APPROVE','REJECT'
    ),
    allowNull: false,
  },
  module: {
    type: DataTypes.ENUM(
      'AUTH','INCOME','EXPENSE','MEMBER','FUND','REPORT','MPESA','USER',
      'BUDGET','RECEIPT','EVENT','ASSET','PAYROLL','BRANCH',
      'ANNOUNCEMENT','SETTINGS','BACKUP','NOTIFICATION'
    ),
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  metadata: {
    type: DataTypes.JSON,
    allowNull: true,
  },
  ipAddress: {
    type: DataTypes.STRING(45),
    allowNull: true,
  },
  userAgent: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
}, {
  tableName: 'audit_logs',
  updatedAt: false,
});

module.exports = AuditLog;
