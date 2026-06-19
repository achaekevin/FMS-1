const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/sequelize');

const Announcement = sequelize.define('Announcement', {
  id:         { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
  createdBy:  { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  title:      { type: DataTypes.STRING(200), allowNull: false, validate: { notEmpty: true } },
  content:    { type: DataTypes.TEXT, allowNull: false },
  priority:   { type: DataTypes.ENUM('High','Medium','Low'), defaultValue: 'Medium' },
  expiryDate: { type: DataTypes.DATEONLY, allowNull: true },
  isActive:   { type: DataTypes.BOOLEAN, defaultValue: true },
}, { tableName: 'announcements' });

module.exports = Announcement;
