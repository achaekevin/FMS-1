'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('events', {
      id:                 { type: Sequelize.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
      createdBy:          { type: Sequelize.INTEGER.UNSIGNED, allowNull: false, references: { model: 'users', key: 'id' }, onDelete: 'RESTRICT' },
      title:              { type: Sequelize.STRING(200), allowNull: false },
      description:        { type: Sequelize.TEXT, allowNull: true },
      location:           { type: Sequelize.STRING(255), allowNull: true },
      eventDate:          { type: Sequelize.DATEONLY, allowNull: false },
      endDate:            { type: Sequelize.DATEONLY, allowNull: true },
      category:           { type: Sequelize.ENUM('Conference','Crusade','Fundraiser','Meeting','Service','Outreach','Training','Other'), allowNull: false },
      expectedAttendance: { type: Sequelize.INTEGER.UNSIGNED, defaultValue: 0 },
      budget:             { type: Sequelize.DECIMAL(15,2), defaultValue: 0.00 },
      status:             { type: Sequelize.ENUM('upcoming','ongoing','completed','cancelled'), defaultValue: 'upcoming' },
      createdAt:          { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
      updatedAt:          { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
    });
    await queryInterface.addIndex('events', ['eventDate']);
    await queryInterface.addIndex('events', ['category']);
    await queryInterface.addIndex('events', ['status']);
  },
  down: async (queryInterface) => { await queryInterface.dropTable('events'); },
};
