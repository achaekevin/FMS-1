'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('prayer_requests', {
      id: {
        type: Sequelize.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },
      memberId: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: true,
        references: { model: 'members', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
        comment: 'Null if submitted anonymously',
      },
      submittedBy: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
        comment: 'User who submitted (could be the member themselves or staff)',
      },
      assignedTo: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: true,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
        comment: 'Pastor/staff assigned to follow up',
      },
      requesterName: {
        type: Sequelize.STRING(150),
        allowNull: false,
        comment: 'Name of the person requesting prayer (denormalised for anonymous requests)',
      },
      category: {
        type: Sequelize.ENUM('Healing', 'Family', 'Employment', 'Thanksgiving', 'Other'),
        allowNull: false,
        defaultValue: 'Other',
      },
      title: {
        type: Sequelize.STRING(200),
        allowNull: false,
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      isAnonymous: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        comment: 'When true, member details are hidden from non-admin views',
      },
      isPrivate: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        comment: 'When true, only assigned pastor and admin can see the details',
      },
      status: {
        type: Sequelize.ENUM('Pending', 'In Progress', 'Answered', 'Closed'),
        defaultValue: 'Pending',
      },
      priority: {
        type: Sequelize.ENUM('High', 'Medium', 'Low'),
        defaultValue: 'Medium',
      },
      prayerCount: {
        type: Sequelize.INTEGER.UNSIGNED,
        defaultValue: 0,
        comment: 'Number of times this request has been prayed for',
      },
      resolvedAt: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      pastorNote: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Internal note from the assigned pastor – not visible to regular members',
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'),
      },
    });

    // Useful query indexes
    await queryInterface.addIndex('prayer_requests', ['status']);
    await queryInterface.addIndex('prayer_requests', ['category']);
    await queryInterface.addIndex('prayer_requests', ['memberId']);
    await queryInterface.addIndex('prayer_requests', ['assignedTo']);
    await queryInterface.addIndex('prayer_requests', ['submittedBy']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('prayer_requests');
  },
};
