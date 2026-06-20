'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {

    // ── 1. Extend members status ENUM & add membership fields ──
    await queryInterface.changeColumn('members', 'status', {
      type: Sequelize.ENUM('active', 'inactive', 'transferred', 'deceased'),
      allowNull: false,
      defaultValue: 'active',
    });

    await queryInterface.addColumn('members', 'membershipStatus', {
      type: Sequelize.ENUM('active', 'inactive', 'transferred', 'deceased'),
      allowNull: false,
      defaultValue: 'active',
      after: 'status',
    });

    await queryInterface.addColumn('members', 'membershipDate', {
      type: Sequelize.DATEONLY,
      allowNull: true,
      after: 'membershipStatus',
    });

    await queryInterface.addColumn('members', 'transferDetails', {
      type: Sequelize.STRING(255),
      allowNull: true,
      after: 'membershipDate',
      comment: 'Transfer destination church / reason',
    });

    // ── 2. visitors ────────────────────────────────────────
    await queryInterface.createTable('visitors', {
      id: { type: Sequelize.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
      recordedBy: {
        type: Sequelize.INTEGER.UNSIGNED, allowNull: false,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE', onDelete: 'RESTRICT',
      },
      // Personal details
      fullName:    { type: Sequelize.STRING(150), allowNull: false },
      phone:       { type: Sequelize.STRING(20),  allowNull: true  },
      email:       { type: Sequelize.STRING(150), allowNull: true  },
      address:     { type: Sequelize.TEXT,         allowNull: true  },
      gender:      { type: Sequelize.ENUM('male','female','other'), allowNull: true },
      dateOfBirth: { type: Sequelize.DATEONLY, allowNull: true },
      // Visit info
      visitDate:   { type: Sequelize.DATEONLY, allowNull: false },
      howHeard:    { type: Sequelize.STRING(120), allowNull: true, comment: 'How they heard about the church' },
      notes:       { type: Sequelize.TEXT, allowNull: true },
      // Follow-up
      followUpStatus: {
        type: Sequelize.ENUM('pending','contacted','visited','no_response','completed'),
        defaultValue: 'pending',
      },
      followUpDate:    { type: Sequelize.DATEONLY, allowNull: true },
      followUpNotes:   { type: Sequelize.TEXT, allowNull: true },
      assignedCounselor: {
        type: Sequelize.INTEGER.UNSIGNED, allowNull: true,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE', onDelete: 'SET NULL',
      },
      // Conversion
      conversionStatus: {
        type: Sequelize.ENUM('not_yet','converted','backslid','rededicated'),
        defaultValue: 'not_yet',
      },
      conversionDate: { type: Sequelize.DATEONLY, allowNull: true },
      // Membership
      becameMember:  { type: Sequelize.BOOLEAN, defaultValue: false },
      memberId: {
        type: Sequelize.INTEGER.UNSIGNED, allowNull: true,
        references: { model: 'members', key: 'id' },
        onUpdate: 'CASCADE', onDelete: 'SET NULL',
        comment: 'Set if visitor joined as a member',
      },
      createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
      updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
    });

    await queryInterface.addIndex('visitors', ['visitDate']);
    await queryInterface.addIndex('visitors', ['followUpStatus']);
    await queryInterface.addIndex('visitors', ['conversionStatus']);
    await queryInterface.addIndex('visitors', ['assignedCounselor']);
    await queryInterface.addIndex('visitors', ['becameMember']);

    // ── 3. baptism_records ─────────────────────────────────
    await queryInterface.createTable('baptism_records', {
      id: { type: Sequelize.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
      memberId: {
        type: Sequelize.INTEGER.UNSIGNED, allowNull: true,
        references: { model: 'members', key: 'id' },
        onUpdate: 'CASCADE', onDelete: 'SET NULL',
      },
      visitorId: {
        type: Sequelize.INTEGER.UNSIGNED, allowNull: true,
        references: { model: 'visitors', key: 'id' },
        onUpdate: 'CASCADE', onDelete: 'SET NULL',
        comment: 'Set if baptism was for a visitor not yet a member',
      },
      recordedBy: {
        type: Sequelize.INTEGER.UNSIGNED, allowNull: false,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE', onDelete: 'RESTRICT',
      },
      // Core fields
      personName:     { type: Sequelize.STRING(150), allowNull: false },
      baptismDate:    { type: Sequelize.DATEONLY, allowNull: false },
      pastor:         { type: Sequelize.STRING(120), allowNull: false, comment: 'Name of officiating pastor' },
      location:       { type: Sequelize.STRING(255), allowNull: false },
      baptismType:    {
        type: Sequelize.ENUM('water','holy_spirit','both'),
        defaultValue: 'water',
      },
      certificate:    { type: Sequelize.STRING(100), allowNull: true, comment: 'Certificate number if issued' },
      witnesses:      { type: Sequelize.TEXT, allowNull: true, comment: 'Comma-separated witness names' },
      notes:          { type: Sequelize.TEXT, allowNull: true },
      createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
      updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
    });

    await queryInterface.addIndex('baptism_records', ['baptismDate']);
    await queryInterface.addIndex('baptism_records', ['memberId']);
    await queryInterface.addIndex('baptism_records', ['pastor']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('baptism_records');
    await queryInterface.dropTable('visitors');
    await queryInterface.removeColumn('members', 'transferDetails');
    await queryInterface.removeColumn('members', 'membershipDate');
    await queryInterface.removeColumn('members', 'membershipStatus');
    await queryInterface.changeColumn('members', 'status', {
      type: Sequelize.ENUM('active', 'inactive', 'transferred'),
      allowNull: false,
      defaultValue: 'active',
    });
  },
};
