const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/sequelize');

const Receipt = sequelize.define('Receipt', {
  id:            { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
  receiptNumber: { type: DataTypes.STRING(30), allowNull: false, unique: true },
  incomeId:      { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
  memberId:      { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
  generatedBy:   { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  memberName:    { type: DataTypes.STRING(150), allowNull: false },
  amount:        { type: DataTypes.DECIMAL(15,2), allowNull: false },
  paymentMethod: { type: DataTypes.STRING(30), allowNull: true },
  category:      { type: DataTypes.STRING(80), allowNull: true },
  fundName:      { type: DataTypes.STRING(80), allowNull: true },
  date:          { type: DataTypes.DATEONLY, allowNull: false },
  description:   { type: DataTypes.TEXT, allowNull: true },
  filePath:      { type: DataTypes.STRING(255), allowNull: true },
}, { tableName: 'receipts' });

module.exports = Receipt;
