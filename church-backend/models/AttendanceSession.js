const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/sequelize');

const AttendanceSession = sequelize.define('AttendanceSession', {
  id:          { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
  createdBy:   { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  title:       { type: DataTypes.STRING(200), allowNull: false },
  serviceType: {
    type: DataTypes.ENUM('Sunday Service','Midweek Service','Cell Group','Conference','Special Event','Other'),
    allowNull: false, defaultValue: 'Sunday Service',
  },
  sessionDate:   { type: DataTypes.DATEONLY, allowNull: false },
  startTime:     { type: DataTypes.TIME, allowNull: true },
  endTime:       { type: DataTypes.TIME, allowNull: true },
  location:      { type: DataTypes.STRING(255), allowNull: true },
  description:   { type: DataTypes.TEXT, allowNull: true },
  qrToken:       { type: DataTypes.STRING(64), allowNull: true, unique: true },
  qrExpiresAt:   { type: DataTypes.DATE, allowNull: true },
  isOpen:        { type: DataTypes.BOOLEAN, defaultValue: true },
  expectedCount: { type: DataTypes.INTEGER.UNSIGNED, defaultValue: 0 },
  notes:         { type: DataTypes.TEXT, allowNull: true },
}, { tableName: 'attendance_sessions' });

module.exports = AttendanceSession;
