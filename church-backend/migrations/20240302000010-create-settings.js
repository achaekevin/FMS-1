'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('settings', {
      id:          { type: Sequelize.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
      key:         { type: Sequelize.STRING(100), allowNull: false, unique: true },
      value:       { type: Sequelize.TEXT, allowNull: true },
      description: { type: Sequelize.STRING(255), allowNull: true },
      updatedBy:   { type: Sequelize.INTEGER.UNSIGNED, allowNull: true, references: { model: 'users', key: 'id' }, onDelete: 'SET NULL' },
      createdAt:   { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
      updatedAt:   { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
    });
  },
  down: async (queryInterface) => { await queryInterface.dropTable('settings'); },
};
