'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('notifications', {
      id:        { type: Sequelize.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
      userId:    { type: Sequelize.INTEGER.UNSIGNED, allowNull: true, references: { model: 'users', key: 'id' }, onDelete: 'CASCADE' },
      title:     { type: Sequelize.STRING(200), allowNull: false },
      message:   { type: Sequelize.TEXT, allowNull: false },
      type:      { type: Sequelize.ENUM('info','success','warning','error'), defaultValue: 'info' },
      isRead:    { type: Sequelize.BOOLEAN, defaultValue: false },
      module:    { type: Sequelize.STRING(50), allowNull: true },
      metadata:  { type: Sequelize.JSON, allowNull: true },
      createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
      updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
    });
    await queryInterface.addIndex('notifications', ['userId']);
    await queryInterface.addIndex('notifications', ['isRead']);
  },
  down: async (queryInterface) => { await queryInterface.dropTable('notifications'); },
};
