'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('salary_records', {
      id:           { type: Sequelize.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
      employeeId:   { type: Sequelize.INTEGER.UNSIGNED, allowNull: false, references: { model: 'employees', key: 'id' }, onDelete: 'CASCADE' },
      generatedBy:  { type: Sequelize.INTEGER.UNSIGNED, allowNull: false, references: { model: 'users', key: 'id' }, onDelete: 'RESTRICT' },
      month:        { type: Sequelize.STRING(20), allowNull: false },
      year:         { type: Sequelize.INTEGER.UNSIGNED, allowNull: false },
      basicSalary:  { type: Sequelize.DECIMAL(15,2), allowNull: false, defaultValue: 0.00 },
      allowances:   { type: Sequelize.DECIMAL(15,2), defaultValue: 0.00 },
      deductions:   { type: Sequelize.DECIMAL(15,2), defaultValue: 0.00 },
      netSalary:    { type: Sequelize.DECIMAL(15,2), allowNull: false, defaultValue: 0.00 },
      notes:        { type: Sequelize.TEXT, allowNull: true },
      payslipPath:  { type: Sequelize.STRING(255), allowNull: true },
      createdAt:    { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
      updatedAt:    { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
    });
    await queryInterface.addIndex('salary_records', ['employeeId']);
    await queryInterface.addIndex('salary_records', ['year', 'month']);
  },
  down: async (queryInterface) => { await queryInterface.dropTable('salary_records'); },
};
