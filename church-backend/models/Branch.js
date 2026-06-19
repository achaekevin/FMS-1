const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/sequelize');

const Branch = sequelize.define('Branch', {
  id:       { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
  name:     { type: DataTypes.STRING(150), allowNull: false, unique: true },
  location: { type: DataTypes.STRING(255), allowNull: true },
  pastor:   { type: DataTypes.STRING(150), allowNull: true },
  phone:    { type: DataTypes.STRING(20),  allowNull: true },
  email:    { type: DataTypes.STRING(150), allowNull: true },
  isMain:   { type: DataTypes.BOOLEAN, defaultValue: false },
  status:   { type: DataTypes.ENUM('active','inactive'), defaultValue: 'active' },
}, { tableName: 'branches' });

const BranchUser = sequelize.define('BranchUser', {
  id:       { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
  branchId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  userId:   { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  role:     { type: DataTypes.STRING(50), allowNull: true },
}, { tableName: 'branch_users' });

module.exports = { Branch, BranchUser };
