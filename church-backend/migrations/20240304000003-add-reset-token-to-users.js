'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('users', 'resetToken', {
      type: Sequelize.STRING(64), allowNull: true, after: 'avatar',
    });
    await queryInterface.addColumn('users', 'resetTokenExpiry', {
      type: Sequelize.DATE, allowNull: true, after: 'resetToken',
    });
    await queryInterface.addIndex('users', ['resetToken']);
  },
  down: async (queryInterface) => {
    await queryInterface.removeIndex('users', ['resetToken']);
    await queryInterface.removeColumn('users', 'resetTokenExpiry');
    await queryInterface.removeColumn('users', 'resetToken');
  },
};
