'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('prayer_requests', 'email', {
      type: Sequelize.STRING(150),
      allowNull: true,
      after: 'requesterName',
      comment: 'Contact email for public (non-member) submissions — used for answer notification',
    });
    await queryInterface.addColumn('prayer_requests', 'phone', {
      type: Sequelize.STRING(20),
      allowNull: true,
      after: 'email',
      comment: 'Contact phone for SMS notification when request is answered',
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('prayer_requests', 'email');
    await queryInterface.removeColumn('prayer_requests', 'phone');
  },
};
