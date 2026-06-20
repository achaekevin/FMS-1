'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('budgets', {
      id:              { type: Sequelize.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
      createdBy:       { type: Sequelize.INTEGER.UNSIGNED, allowNull: false, references: { model: 'users', key: 'id' }, onDelete: 'RESTRICT' },
      fundId:          { type: Sequelize.INTEGER.UNSIGNED, allowNull: true,  references: { model: 'funds', key: 'id' }, onDelete: 'SET NULL' },
      title:           { type: Sequelize.STRING(200), allowNull: false },
      category:        { type: Sequelize.STRING(80),  allowNull: false },
      amount:          { type: Sequelize.DECIMAL(15,2), allowNull: false },
      spentAmount:     { type: Sequelize.DECIMAL(15,2), defaultValue: 0.00 },
      remainingAmount: { type: Sequelize.DECIMAL(15,2), defaultValue: 0.00 },
      period:          { type: Sequelize.ENUM('Monthly','Quarterly','Annual'), defaultValue: 'Monthly' },
      startDate:       { type: Sequelize.DATEONLY, allowNull: false },
      endDate:         { type: Sequelize.DATEONLY, allowNull: true },
      description:     { type: Sequelize.TEXT, allowNull: true },
      status:          { type: Sequelize.ENUM('active','closed','exceeded'), defaultValue: 'active' },
      createdAt:       { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
      updatedAt:       { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
    });
    await queryInterface.addIndex('budgets', ['createdBy']);
    await queryInterface.addIndex('budgets', ['status']);
  },
  down: async (queryInterface) => { await queryInterface.dropTable('budgets'); },
};
