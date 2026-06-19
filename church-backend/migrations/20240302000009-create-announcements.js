'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('announcements', {
      id:         { type: Sequelize.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
      createdBy:  { type: Sequelize.INTEGER.UNSIGNED, allowNull: false, references: { model: 'users', key: 'id' }, onDelete: 'RESTRICT' },
      title:      { type: Sequelize.STRING(200), allowNull: false },
      content:    { type: Sequelize.TEXT, allowNull: false },
      priority:   { type: Sequelize.ENUM('High','Medium','Low'), defaultValue: 'Medium' },
      expiryDate: { type: Sequelize.DATEONLY, allowNull: true },
      isActive:   { type: Sequelize.BOOLEAN, defaultValue: true },
      createdAt:  { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
      updatedAt:  { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
    });
    await queryInterface.addIndex('announcements', ['isActive']);
    await queryInterface.addIndex('announcements', ['expiryDate']);
  },
  down: async (queryInterface) => { await queryInterface.dropTable('announcements'); },
};
