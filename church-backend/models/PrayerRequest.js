const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/sequelize');

const PrayerRequest = sequelize.define('PrayerRequest', {
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    autoIncrement: true,
    primaryKey: true,
  },
  memberId: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: true,
  },
  submittedBy: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false,
  },
  assignedTo: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: true,
  },
  requesterName: {
    type: DataTypes.STRING(150),
    allowNull: false,
    validate: { notEmpty: true, len: [2, 150] },
  },
  email: {
    type: DataTypes.STRING(150),
    allowNull: true,
    validate: { isEmail: true },
  },
  phone: {
    type: DataTypes.STRING(20),
    allowNull: true,
  },
  category: {
    type: DataTypes.ENUM('Healing', 'Family', 'Employment', 'Thanksgiving', 'Other'),
    allowNull: false,
    defaultValue: 'Other',
  },
  title: {
    type: DataTypes.STRING(200),
    allowNull: false,
    validate: { notEmpty: true, len: [3, 200] },
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false,
    validate: { notEmpty: true },
  },
  isAnonymous: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  isPrivate: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  status: {
    type: DataTypes.ENUM('Pending', 'In Progress', 'Answered', 'Closed'),
    defaultValue: 'Pending',
  },
  priority: {
    type: DataTypes.ENUM('High', 'Medium', 'Low'),
    defaultValue: 'Medium',
  },
  prayerCount: {
    type: DataTypes.INTEGER.UNSIGNED,
    defaultValue: 0,
  },
  resolvedAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  pastorNote: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
}, {
  tableName: 'prayer_requests',
});

module.exports = PrayerRequest;
