'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('members', {
      id: { type: Sequelize.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
      fullName: { type: Sequelize.STRING(150), allowNull: false },
      phone: { type: Sequelize.STRING(20), allowNull: false },
      email: { type: Sequelize.STRING(150), allowNull: true },
      address: { type: Sequelize.TEXT, allowNull: true },
      gender: { type: Sequelize.ENUM('male', 'female', 'other'), allowNull: true },
      dateOfBirth: { type: Sequelize.DATEONLY, allowNull: true },
      joinDate: { type: Sequelize.DATEONLY, defaultValue: Sequelize.NOW },
      status: { type: Sequelize.ENUM('active', 'inactive', 'transferred'), defaultValue: 'active' },
      createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
      updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
    });
    await queryInterface.addIndex('members', ['phone']);
    await queryInterface.addIndex('members', ['fullName']);
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable('members');
  },
};
