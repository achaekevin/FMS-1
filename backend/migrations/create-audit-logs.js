'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('audit_logs', {
      id: { type: Sequelize.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
      userId: {
        type: Sequelize.INTEGER.UNSIGNED, allowNull: true,
        references: { model: 'users', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'SET NULL',
      },
      action: { type: Sequelize.ENUM('CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'EXPORT', 'MPESA', 'VIEW'), allowNull: false },
      module: { type: Sequelize.ENUM('AUTH', 'INCOME', 'EXPENSE', 'MEMBER', 'FUND', 'REPORT', 'MPESA', 'USER'), allowNull: false },
      description: { type: Sequelize.TEXT, allowNull: false },
      metadata: { type: Sequelize.JSON, allowNull: true },
      ipAddress: { type: Sequelize.STRING(45), allowNull: true },
      userAgent: { type: Sequelize.STRING(255), allowNull: true },
      createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
    });
    await queryInterface.addIndex('audit_logs', ['userId']);
    await queryInterface.addIndex('audit_logs', ['module']);
    await queryInterface.addIndex('audit_logs', ['action']);
    await queryInterface.addIndex('audit_logs', ['createdAt']);
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable('audit_logs');
  },
};
