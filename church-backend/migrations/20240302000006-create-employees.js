'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('employees', {
      id:          { type: Sequelize.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
      createdBy:   { type: Sequelize.INTEGER.UNSIGNED, allowNull: false, references: { model: 'users', key: 'id' }, onDelete: 'RESTRICT' },
      name:        { type: Sequelize.STRING(150), allowNull: false },
      role:        { type: Sequelize.STRING(100), allowNull: false },
      department:  { type: Sequelize.STRING(80),  allowNull: false },
      phone:       { type: Sequelize.STRING(20),  allowNull: true },
      email:       { type: Sequelize.STRING(150), allowNull: true },
      basicSalary: { type: Sequelize.DECIMAL(15,2), allowNull: false, defaultValue: 0.00 },
      hireDate:    { type: Sequelize.DATEONLY, allowNull: true },
      status:      { type: Sequelize.ENUM('active','inactive'), defaultValue: 'active' },
      createdAt:   { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
      updatedAt:   { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
    });
    await queryInterface.addIndex('employees', ['status']);
  },
  down: async (queryInterface) => { await queryInterface.dropTable('employees'); },
};
