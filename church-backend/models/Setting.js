const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/sequelize');

const Setting = sequelize.define('Setting', {
  id:          { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
  key:         { type: DataTypes.STRING(100), allowNull: false, unique: true },
  value:       { type: DataTypes.TEXT, allowNull: true },
  description: { type: DataTypes.STRING(255), allowNull: true },
  updatedBy:   { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
}, { tableName: 'settings' });

module.exports = Setting;
