const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/sequelize');

const Document = sequelize.define('Document', {
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    primaryKey: true,
    autoIncrement: true,
  },
  uploadedBy: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false,
  },
  title: {
    type: DataTypes.STRING(200),
    allowNull: false,
  },
  category: {
    type: DataTypes.ENUM('Receipt', 'Invoice', 'Contract', 'Minutes', 'Report', 'Other'),
    allowNull: false,
    defaultValue: 'Other',
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  fileName: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  originalName: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  mimeType: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  fileSize: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false,
  },
  filePath: {
    type: DataTypes.STRING(500),
    allowNull: false,
  },
  tags: {
    type: DataTypes.STRING(500),
    allowNull: true,
  },
  relatedModule: {
    type: DataTypes.STRING(50),
    allowNull: true,
  },
  relatedId: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: true,
  },
  downloadCount: {
    type: DataTypes.INTEGER.UNSIGNED,
    defaultValue: 0,
  },
}, {
  tableName: 'documents',
});

module.exports = Document;
