'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('receipts', {
      id:            { type: Sequelize.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
      receiptNumber: { type: Sequelize.STRING(30), allowNull: false, unique: true },
      incomeId:      { type: Sequelize.INTEGER.UNSIGNED, allowNull: true, references: { model: 'income', key: 'id' }, onDelete: 'SET NULL' },
      memberId:      { type: Sequelize.INTEGER.UNSIGNED, allowNull: true, references: { model: 'members', key: 'id' }, onDelete: 'SET NULL' },
      generatedBy:   { type: Sequelize.INTEGER.UNSIGNED, allowNull: false, references: { model: 'users', key: 'id' }, onDelete: 'RESTRICT' },
      memberName:    { type: Sequelize.STRING(150), allowNull: false },
      amount:        { type: Sequelize.DECIMAL(15,2), allowNull: false },
      paymentMethod: { type: Sequelize.STRING(30), allowNull: true },
      category:      { type: Sequelize.STRING(80), allowNull: true },
      fundName:      { type: Sequelize.STRING(80), allowNull: true },
      date:          { type: Sequelize.DATEONLY, allowNull: false },
      description:   { type: Sequelize.TEXT, allowNull: true },
      filePath:      { type: Sequelize.STRING(255), allowNull: true },
      createdAt:     { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
      updatedAt:     { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
    });
    await queryInterface.addIndex('receipts', ['receiptNumber']);
    await queryInterface.addIndex('receipts', ['memberId']);
  },
  down: async (queryInterface) => { await queryInterface.dropTable('receipts'); },
};
