'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // ── Branches ──────────────────────────────────────────
    const now = new Date();
    await queryInterface.bulkInsert('branches', [
      {
        name: 'Main Branch', location: 'Nairobi CBD, Kenya',
        pastor: 'Rev. James Mwangi', phone: '+254 700 000 000',
        email: 'main@gracelifechurch.org', isMain: true, status: 'active',
        createdAt: now, updatedAt: now,
      },
      {
        name: 'Westlands Branch', location: 'Westlands, Nairobi',
        pastor: 'Rev. Peter Odhiambo', phone: '+254 711 000 001',
        email: 'westlands@gracelifechurch.org', isMain: false, status: 'active',
        createdAt: now, updatedAt: now,
      },
      {
        name: 'Thika Road Branch', location: 'Thika Road, Nairobi',
        pastor: 'Rev. Grace Wanjiku', phone: '+254 722 000 002',
        email: 'thikaroad@gracelifechurch.org', isMain: false, status: 'active',
        createdAt: now, updatedAt: now,
      },
    ], { ignoreDuplicates: true });

    // ── Settings ──────────────────────────────────────────
    await queryInterface.bulkInsert('settings', [
      { key: 'church_name',    value: 'Grace Life Church',          description: 'Church display name',  createdAt: now, updatedAt: now },
      { key: 'church_address', value: 'Nairobi, Kenya',             description: 'Physical address',     createdAt: now, updatedAt: now },
      { key: 'church_phone',   value: '+254 700 000 000',           description: 'Contact phone',        createdAt: now, updatedAt: now },
      { key: 'church_email',   value: 'info@gracelifechurch.org',   description: 'Contact email',        createdAt: now, updatedAt: now },
      { key: 'currency',       value: 'KES',                        description: 'Default currency',     createdAt: now, updatedAt: now },
      { key: 'fiscal_year',    value: 'January - December',         description: 'Fiscal year period',   createdAt: now, updatedAt: now },
      { key: 'logo_url',       value: '',                           description: 'Church logo URL',      createdAt: now, updatedAt: now },
    ], { ignoreDuplicates: true });
  },

  down: async (queryInterface) => {
    await queryInterface.bulkDelete('settings', null, {});
    await queryInterface.bulkDelete('branches', null, {});
  },
};
