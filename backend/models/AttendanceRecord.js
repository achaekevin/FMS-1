const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/sequelize');

const AttendanceRecord = sequelize.define('AttendanceRecord', {
  id:        { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
  sessionId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  memberId:  { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
  guestName:  { type: DataTypes.STRING(150), allowNull: true },
  guestPhone: { type: DataTypes.STRING(20),  allowNull: true },
  checkInMethod: {
    type: DataTypes.ENUM('Manual','QR Code'),
    allowNull: false, defaultValue: 'Manual',
  },
  checkInTime: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
  recordedBy:  { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
  notes:       { type: DataTypes.STRING(500), allowNull: true },
}, { tableName: 'attendance_records' });

module.exports = AttendanceRecord;
