'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('documents', {
      id: {
        type: Sequelize.INTEGER.UNSIGNED,
        primaryKey: true,
        autoIncrement: true,
      },
      uploadedBy: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      title: {
        type: Sequelize.STRING(200),
        allowNull: false,
      },
      category: {
        type: Sequelize.ENUM('Receipt', 'Invoice', 'Contract', 'Minutes', 'Report', 'Other'),
        allowNull: false,
        defaultValue: 'Other',
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      fileName: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      originalName: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      mimeType: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      fileSize: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
      },
      filePath: {
        type: Sequelize.STRING(500),
        allowNull: false,
      },
      tags: {
        type: Sequelize.STRING(500),
        allowNull: true,
        comment: 'Comma-separated tags for search',
      },
      relatedModule: {
        type: Sequelize.STRING(50),
        allowNull: true,
        comment: 'e.g. INCOME, EXPENSE, MEMBER',
      },
      relatedId: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: true,
        comment: 'ID of the related record',
      },
      downloadCount: {
        type: Sequelize.INTEGER.UNSIGNED,
        defaultValue: 0,
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
    });

    await queryInterface.addIndex('documents', ['uploadedBy']);
    await queryInterface.addIndex('documents', ['category']);
    await queryInterface.addIndex('documents', ['relatedModule', 'relatedId']);
    await queryInterface.addIndex('documents', ['createdAt']);
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable('documents');
  },
};
