'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('assets', {
      id:           { type: Sequelize.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
      createdBy:    { type: Sequelize.INTEGER.UNSIGNED, allowNull: false, references: { model: 'users', key: 'id' }, onDelete: 'RESTRICT' },
      assetName:    { type: Sequelize.STRING(200), allowNull: false },
      category:     { type: Sequelize.ENUM('Land & Buildings','Vehicles','Electronics','Furniture','Musical Instruments','Other'), allowNull: false },
      purchaseDate: { type: Sequelize.DATEONLY, allowNull: false },
      value:        { type: Sequelize.DECIMAL(15,2), defaultValue: 0.00 },
      condition:    { type: Sequelize.ENUM('Excellent','Good','Fair','Poor','Disposed'), defaultValue: 'Good' },
      status:       { type: Sequelize.ENUM('Active','Under Maintenance','Inactive','Disposed'), defaultValue: 'Active' },
      location:     { type: Sequelize.STRING(255), allowNull: true },
      serialNumber: { type: Sequelize.STRING(100), allowNull: true },
      description:  { type: Sequelize.TEXT, allowNull: true },
      createdAt:    { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
      updatedAt:    { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
    });
    await queryInterface.addIndex('assets', ['category']);
    await queryInterface.addIndex('assets', ['status']);
  },
  down: async (queryInterface) => { await queryInterface.dropTable('assets'); },
};
