'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('income', {
      id: { type: Sequelize.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
      memberId: {
        type: Sequelize.INTEGER.UNSIGNED, allowNull: true,
        references: { model: 'members', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'SET NULL',
      },
      recordedBy: {
        type: Sequelize.INTEGER.UNSIGNED, allowNull: false,
        references: { model: 'users', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'RESTRICT',
      },
      fundId: {
        type: Sequelize.INTEGER.UNSIGNED, allowNull: true,
        references: { model: 'funds', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'SET NULL',
      },
      type: {
        type: Sequelize.ENUM('Tithe', 'Offering', 'Donation', 'Building Fund', 'Mission Offering', 'Welfare', 'Special Collection', 'Other'),
        allowNull: false,
      },
      amount: { type: Sequelize.DECIMAL(15, 2), allowNull: false },
      paymentMethod: { type: Sequelize.ENUM('Cash', 'M-Pesa', 'Bank Transfer', 'Cheque'), allowNull: false, defaultValue: 'Cash' },
      mpesaRef: { type: Sequelize.STRING(30), allowNull: true },
      description: { type: Sequelize.TEXT, allowNull: true },
      date: { type: Sequelize.DATEONLY, allowNull: false, defaultValue: Sequelize.NOW },
      createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
      updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
    });
    await queryInterface.addIndex('income', ['date']);
    await queryInterface.addIndex('income', ['type']);
    await queryInterface.addIndex('income', ['memberId']);
    await queryInterface.addIndex('income', ['fundId']);
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable('income');
  },
};
