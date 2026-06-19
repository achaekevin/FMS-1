const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/sequelize');

const Fund = sequelize.define('Fund', {
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    autoIncrement: true,
    primaryKey: true,
  },
  fundName: {
    type: DataTypes.ENUM('General Fund', 'Building Fund', 'Welfare Fund', 'Mission Fund'),
    allowNull: false,
    unique: true,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  balance: {
    type: DataTypes.DECIMAL(15, 2),
    defaultValue: 0.00,
    validate: { min: 0 },
  },
  totalIncome: {
    type: DataTypes.DECIMAL(15, 2),
    defaultValue: 0.00,
  },
  totalExpenses: {
    type: DataTypes.DECIMAL(15, 2),
    defaultValue: 0.00,
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
}, {
  tableName: 'funds',
});

module.exports = Fund;
