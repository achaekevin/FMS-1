'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Replace the simple status enum with a full workflow enum
    await queryInterface.changeColumn('expenses', 'status', {
      type: Sequelize.ENUM(
        'pending_pastor',   // just created by treasurer
        'pending_admin',    // pastor approved, awaiting admin
        'approved',         // admin finalized
        'rejected'          // rejected at any stage
      ),
      allowNull: false,
      defaultValue: 'pending_pastor',
    });

    // Make approvedBy nullable — it will be filled by the workflow instead
    await queryInterface.changeColumn('expenses', 'approvedBy', {
      type: Sequelize.STRING(120),
      allowNull: true,
    });

    // Pastor approval columns
    await queryInterface.addColumn('expenses', 'pastorId', {
      type: Sequelize.INTEGER.UNSIGNED,
      allowNull: true,
      references: { model: 'users', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
      after: 'approvedBy',
    });
    await queryInterface.addColumn('expenses', 'pastorNote', {
      type: Sequelize.STRING(500),
      allowNull: true,
      after: 'pastorId',
    });
    await queryInterface.addColumn('expenses', 'pastorApprovedAt', {
      type: Sequelize.DATE,
      allowNull: true,
      after: 'pastorNote',
    });

    // Admin finalization columns
    await queryInterface.addColumn('expenses', 'adminId', {
      type: Sequelize.INTEGER.UNSIGNED,
      allowNull: true,
      references: { model: 'users', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
      after: 'pastorApprovedAt',
    });
    await queryInterface.addColumn('expenses', 'adminNote', {
      type: Sequelize.STRING(500),
      allowNull: true,
      after: 'adminId',
    });
    await queryInterface.addColumn('expenses', 'adminFinalizedAt', {
      type: Sequelize.DATE,
      allowNull: true,
      after: 'adminNote',
    });

    await queryInterface.addIndex('expenses', ['status']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeIndex('expenses', ['status']);
    await queryInterface.removeColumn('expenses', 'adminFinalizedAt');
    await queryInterface.removeColumn('expenses', 'adminNote');
    await queryInterface.removeColumn('expenses', 'adminId');
    await queryInterface.removeColumn('expenses', 'pastorApprovedAt');
    await queryInterface.removeColumn('expenses', 'pastorNote');
    await queryInterface.removeColumn('expenses', 'pastorId');

    await queryInterface.changeColumn('expenses', 'approvedBy', {
      type: Sequelize.STRING(120),
      allowNull: false,
    });
    await queryInterface.changeColumn('expenses', 'status', {
      type: Sequelize.ENUM('pending', 'approved', 'rejected'),
      allowNull: false,
      defaultValue: 'approved',
    });
  },
};
