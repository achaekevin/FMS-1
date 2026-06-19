const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/sequelize');

const Asset = sequelize.define('Asset', {
  id:           { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
  createdBy:    { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  assetName:    { type: DataTypes.STRING(200), allowNull: false, validate: { notEmpty: true } },
  category:     { type: DataTypes.ENUM('Land & Buildings','Vehicles','Electronics','Furniture','Musical Instruments','Other'), allowNull: false },
  purchaseDate: { type: DataTypes.DATEONLY, allowNull: false },
  value:        { type: DataTypes.DECIMAL(15,2), defaultValue: 0.00 },
  condition:    { type: DataTypes.ENUM('Excellent','Good','Fair','Poor','Disposed'), defaultValue: 'Good' },
  status:       { type: DataTypes.ENUM('Active','Under Maintenance','Inactive','Disposed'), defaultValue: 'Active' },
  location:     { type: DataTypes.STRING(255), allowNull: true },
  serialNumber: { type: DataTypes.STRING(100), allowNull: true },
  description:  { type: DataTypes.TEXT, allowNull: true },
}, { tableName: 'assets' });

module.exports = Asset;
