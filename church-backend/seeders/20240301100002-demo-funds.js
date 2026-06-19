'use strict';

// Seeds the four standard fund accounts with zero balances.
// Balances populate automatically as income/expenses are recorded
// against each fund (see services/fundService.js).

module.exports = {
  up: async (queryInterface) => {
    await queryInterface.bulkInsert('funds', [
      {
        fundName: 'General Fund',
        description: 'Day-to-day church operations',
        balance: 0.00,
        totalIncome: 0.00,
        totalExpenses: 0.00,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        fundName: 'Building Fund',
        description: 'Construction and maintenance projects',
        balance: 0.00,
        totalIncome: 0.00,
        totalExpenses: 0.00,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        fundName: 'Welfare Fund',
        description: 'Member and community support',
        balance: 0.00,
        totalIncome: 0.00,
        totalExpenses: 0.00,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        fundName: 'Mission Fund',
        description: 'Evangelism and outreach programs',
        balance: 0.00,
        totalIncome: 0.00,
        totalExpenses: 0.00,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);
  },

  down: async (queryInterface) => {
    await queryInterface.bulkDelete('funds', null, {});
  },
};
