const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/sequelize');

const Event = sequelize.define('Event', {
  id:                 { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
  createdBy:          { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  title:              { type: DataTypes.STRING(200), allowNull: false, validate: { notEmpty: true } },
  description:        { type: DataTypes.TEXT, allowNull: true },
  location:           { type: DataTypes.STRING(255), allowNull: true },
  eventDate:          { type: DataTypes.DATEONLY, allowNull: false },
  endDate:            { type: DataTypes.DATEONLY, allowNull: true },
  category:           { type: DataTypes.ENUM('Conference','Crusade','Fundraiser','Meeting','Service','Outreach','Training','Other'), allowNull: false },
  expectedAttendance: { type: DataTypes.INTEGER.UNSIGNED, defaultValue: 0 },
  budget:             { type: DataTypes.DECIMAL(15,2), defaultValue: 0.00 },
  status:             { type: DataTypes.ENUM('upcoming','ongoing','completed','cancelled'), defaultValue: 'upcoming' },
}, { tableName: 'events' });

module.exports = Event;
