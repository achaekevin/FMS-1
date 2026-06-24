'use strict';

/**
 * Adds branchId to income, expenses, members, and funds tables.
 * NULL = belongs to main/global scope (pre-migration records).
 * A non-null value restricts the record to that branch.
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    const col = {
      type: Sequelize.INTEGER.UNSIGNED,
      allowNull: true,
      references: { model: 'branches', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    };

    // Income
    await queryInterface.addColumn('income', 'branchId', { ...col, after: 'fundId',
      comment: 'NULL = main branch / global; set for branch-level scoping' });
    await queryInterface.addIndex('income', ['branchId']);

    // Expenses
    await queryInterface.addColumn('expenses', 'branchId', { ...col, after: 'fundId',
      comment: 'NULL = main branch / global; set for branch-level scoping' });
    await queryInterface.addIndex('expenses', ['branchId']);

    // Members
    await queryInterface.addColumn('members', 'branchId', { ...col, after: 'status',
      comment: 'NULL = main branch / global; set for branch-level scoping' });
    await queryInterface.addIndex('members', ['branchId']);

    // Funds
    await queryInterface.addColumn('funds', 'branchId', { ...col, after: 'isActive',
      comment: 'NULL = shared/global fund; set for branch-specific funds' });
    await queryInterface.addIndex('funds', ['branchId']);
  },

  async down(queryInterface) {
    await queryInterface.removeIndex('income',   ['branchId']);
    await queryInterface.removeIndex('expenses', ['branchId']);
    await queryInterface.removeIndex('members',  ['branchId']);
    await queryInterface.removeIndex('funds',    ['branchId']);

    await queryInterface.removeColumn('income',   'branchId');
    await queryInterface.removeColumn('expenses', 'branchId');
    await queryInterface.removeColumn('members',  'branchId');
    await queryInterface.removeColumn('funds',    'branchId');
  },
};
