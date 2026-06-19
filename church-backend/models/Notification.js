const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/sequelize');

const Notification = sequelize.define('Notification', {
  id:       { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
  userId:   { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
  title:    { type: DataTypes.STRING(200), allowNull: false },
  message:  { type: DataTypes.TEXT, allowNull: false },
  type:     { type: DataTypes.ENUM('info','success','warning','error'), defaultValue: 'info' },
  isRead:   { type: DataTypes.BOOLEAN, defaultValue: false },
  module:   { type: DataTypes.STRING(50), allowNull: true },
  metadata: { type: DataTypes.JSON, allowNull: true },
}, { tableName: 'notifications' });

module.exports = Notification;
