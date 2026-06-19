'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('expenses', {
      id: { type: Sequelize.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
      recordedBy: {
        type: Sequelize.INTEGER.UNSIGNED, allowNull: false,
        references: { model: 'users', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'RESTRICT',
      },
      fundId: {
        type: Sequelize.INTEGER.UNSIGNED, allowNull: true,
        references: { model: 'funds', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'SET NULL',
      },
      category: {
        type: Sequelize.ENUM('Salaries', 'Utilities', 'Maintenance', 'Ministry', 'Welfare', 'Missions', 'Equipment', 'Stationery', 'Transport', 'Other'),
        allowNull: false,
      },
      amount: { type: Sequelize.DECIMAL(15, 2), allowNull: false },
      description: { type: Sequelize.TEXT, allowNull: true },
      approvedBy: { type: Sequelize.STRING(120), allowNull: false },
      receiptPath: { type: Sequelize.STRING(255), allowNull: true },
      date: { type: Sequelize.DATEONLY, allowNull: false, defaultValue: Sequelize.NOW },
      status: { type: Sequelize.ENUM('pending', 'approved', 'rejected'), defaultValue: 'approved' },
      createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
      updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
    });
    await queryInterface.addIndex('expenses', ['date']);
    await queryInterface.addIndex('expenses', ['category']);
    await queryInterface.addIndex('expenses', ['fundId']);
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable('expenses');
  },
};
