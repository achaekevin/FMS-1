'use strict';
const bcrypt = require('bcryptjs');

module.exports = {
  up: async (queryInterface) => {
    const hash = (pwd) => bcrypt.hashSync(pwd, 12);

    await queryInterface.bulkInsert('users', [
      {
        name: 'Administrator',
        email: 'admin@ktpag.org',
        password: hash('admin123'),
        role: 'administrator',
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: 'Pastor',
        email: 'pastor@ktpag.org',
        password: hash('pastor123'),
        role: 'pastor',
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: 'Treasurer',
        email: 'treasurer@ktpag.org',
        password: hash('treasurer123'),
        role: 'treasurer',
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);
  },

  down: async (queryInterface) => {
    await queryInterface.bulkDelete('users', null, {});
  },
};
