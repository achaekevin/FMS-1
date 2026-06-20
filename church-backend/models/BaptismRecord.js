const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/sequelize');

const BaptismRecord = sequelize.define('BaptismRecord', {
  id:           { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
  memberId:     { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
  visitorId:    { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
  recordedBy:   { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  personName:   { type: DataTypes.STRING(150), allowNull: false },
  baptismDate:  { type: DataTypes.DATEONLY, allowNull: false },
  pastor:       { type: DataTypes.STRING(120), allowNull: false },
  location:     { type: DataTypes.STRING(255), allowNull: false },
  baptismType:  {
    type: DataTypes.ENUM('water','holy_spirit','both'),
    defaultValue: 'water',
  },
  certificate:  { type: DataTypes.STRING(100), allowNull: true },
  witnesses:    { type: DataTypes.TEXT, allowNull: true },
  notes:        { type: DataTypes.TEXT, allowNull: true },
}, { tableName: 'baptism_records' });

module.exports = BaptismRecord;
