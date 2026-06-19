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
    type: DataTypes.ENUM(
      'Salaries', 'Utilities', 'Maintenance', 'Ministry',
      'Welfare', 'Missions', 'Equipment', 'Stationery', 'Transport', 'Other'
    ),
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
  // Legacy field kept for backward compat — populated by workflow
  approvedBy: {
    type: DataTypes.STRING(120),
    allowNull: true,
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

  // ── Approval workflow ─────────────────────────────────────
  status: {
    type: DataTypes.ENUM('pending_pastor', 'pending_admin', 'approved', 'rejected'),
    allowNull: false,
    defaultValue: 'pending_pastor',
  },

  // Stage 1 – Pastor
  pastorId: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: true,
    references: { model: 'users', key: 'id' },
  },
  pastorNote: {
    type: DataTypes.STRING(500),
    allowNull: true,
  },
  pastorApprovedAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },

  // Stage 2 – Admin
  adminId: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: true,
    references: { model: 'users', key: 'id' },
  },
  adminNote: {
    type: DataTypes.STRING(500),
    allowNull: true,
  },
  adminFinalizedAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
}, {
  tableName: 'expenses',
});

module.exports = Expense;
