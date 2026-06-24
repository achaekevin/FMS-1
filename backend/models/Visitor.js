const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/sequelize');

const Visitor = sequelize.define('Visitor', {
  id:           { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
  recordedBy:   { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  fullName:     { type: DataTypes.STRING(150), allowNull: false },
  phone:        { type: DataTypes.STRING(20),  allowNull: true  },
  email:        { type: DataTypes.STRING(150), allowNull: true  },
  address:      { type: DataTypes.TEXT,         allowNull: true  },
  gender:       { type: DataTypes.ENUM('male','female','other'), allowNull: true },
  dateOfBirth:  { type: DataTypes.DATEONLY, allowNull: true },
  visitDate:    { type: DataTypes.DATEONLY, allowNull: false },
  howHeard:     { type: DataTypes.STRING(120), allowNull: true },
  notes:        { type: DataTypes.TEXT, allowNull: true },
  followUpStatus: {
    type: DataTypes.ENUM('pending','contacted','visited','no_response','completed'),
    defaultValue: 'pending',
  },
  followUpDate:    { type: DataTypes.DATEONLY, allowNull: true },
  followUpNotes:   { type: DataTypes.TEXT, allowNull: true },
  assignedCounselor: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
  conversionStatus: {
    type: DataTypes.ENUM('not_yet','converted','backslid','rededicated'),
    defaultValue: 'not_yet',
  },
  conversionDate: { type: DataTypes.DATEONLY, allowNull: true },
  becameMember:   { type: DataTypes.BOOLEAN, defaultValue: false },
  memberId:       { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
}, { tableName: 'visitors' });

module.exports = Visitor;
