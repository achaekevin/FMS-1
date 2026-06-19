'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('mpesa_transactions', {
      id: { type: Sequelize.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
      initiatedBy: {
        type: Sequelize.INTEGER.UNSIGNED, allowNull: false,
        references: { model: 'users', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'RESTRICT',
      },
      memberId: {
        type: Sequelize.INTEGER.UNSIGNED, allowNull: true,
        references: { model: 'members', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'SET NULL',
      },
      checkoutRequestId: { type: Sequelize.STRING(100), allowNull: true },
      merchantRequestId: { type: Sequelize.STRING(100), allowNull: true },
      phone: { type: Sequelize.STRING(20), allowNull: false },
      amount: { type: Sequelize.DECIMAL(15, 2), allowNull: false },
      category: { type: Sequelize.STRING(50), allowNull: true },
      description: { type: Sequelize.TEXT, allowNull: true },
      mpesaReceiptNumber: { type: Sequelize.STRING(30), allowNull: true },
      status: { type: Sequelize.ENUM('pending', 'completed', 'failed', 'cancelled'), defaultValue: 'pending' },
      resultCode: { type: Sequelize.STRING(10), allowNull: true },
      resultDesc: { type: Sequelize.TEXT, allowNull: true },
      transactionDate: { type: Sequelize.DATE, allowNull: true },
      createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
      updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
    });
    await queryInterface.addIndex('mpesa_transactions', ['checkoutRequestId']);
    await queryInterface.addIndex('mpesa_transactions', ['status']);
    await queryInterface.addIndex('mpesa_transactions', ['phone']);
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable('mpesa_transactions');
  },
};
