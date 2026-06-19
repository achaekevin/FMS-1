'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('funds', {
      id: { type: Sequelize.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
      fundName: { type: Sequelize.ENUM('General Fund', 'Building Fund', 'Welfare Fund', 'Mission Fund'), allowNull: false, unique: true },
      description: { type: Sequelize.TEXT, allowNull: true },
      balance: { type: Sequelize.DECIMAL(15, 2), defaultValue: 0.00 },
      totalIncome: { type: Sequelize.DECIMAL(15, 2), defaultValue: 0.00 },
      totalExpenses: { type: Sequelize.DECIMAL(15, 2), defaultValue: 0.00 },
      isActive: { type: Sequelize.BOOLEAN, defaultValue: true },
      createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
      updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
    });
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable('funds');
  },
};
