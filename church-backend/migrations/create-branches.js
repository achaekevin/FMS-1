'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('branches', {
      id:        { type: Sequelize.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
      name:      { type: Sequelize.STRING(150), allowNull: false, unique: true },
      location:  { type: Sequelize.STRING(255), allowNull: true },
      pastor:    { type: Sequelize.STRING(150), allowNull: true },
      phone:     { type: Sequelize.STRING(20),  allowNull: true },
      email:     { type: Sequelize.STRING(150), allowNull: true },
      isMain:    { type: Sequelize.BOOLEAN, defaultValue: false },
      status:    { type: Sequelize.ENUM('active','inactive'), defaultValue: 'active' },
      createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
      updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
    });
    await queryInterface.createTable('branch_users', {
      id:        { type: Sequelize.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
      branchId:  { type: Sequelize.INTEGER.UNSIGNED, allowNull: false, references: { model: 'branches', key: 'id' }, onDelete: 'CASCADE' },
      userId:    { type: Sequelize.INTEGER.UNSIGNED, allowNull: false, references: { model: 'users', key: 'id' }, onDelete: 'CASCADE' },
      role:      { type: Sequelize.STRING(50), allowNull: true },
      createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
      updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
    });
  },
  down: async (queryInterface) => {
    await queryInterface.dropTable('branch_users');
    await queryInterface.dropTable('branches');
  },
};
