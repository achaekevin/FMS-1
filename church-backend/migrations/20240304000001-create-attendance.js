'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // ── attendance_sessions ──────────────────────────────
    await queryInterface.createTable('attendance_sessions', {
      id: { type: Sequelize.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
      createdBy: {
        type: Sequelize.INTEGER.UNSIGNED, allowNull: false,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE', onDelete: 'RESTRICT',
      },
      title:       { type: Sequelize.STRING(200), allowNull: false },
      serviceType: {
        type: Sequelize.ENUM('Sunday Service','Midweek Service','Cell Group','Conference','Special Event','Other'),
        allowNull: false, defaultValue: 'Sunday Service',
      },
      sessionDate: { type: Sequelize.DATEONLY, allowNull: false },
      startTime:   { type: Sequelize.TIME, allowNull: true },
      endTime:     { type: Sequelize.TIME, allowNull: true },
      location:    { type: Sequelize.STRING(255), allowNull: true },
      description: { type: Sequelize.TEXT, allowNull: true },
      qrToken:     { type: Sequelize.STRING(64), allowNull: true, unique: true, comment: 'UUID used in QR code URL' },
      qrExpiresAt: { type: Sequelize.DATE, allowNull: true, comment: 'When QR code stops accepting check-ins' },
      isOpen:      { type: Sequelize.BOOLEAN, defaultValue: true, comment: 'Whether session is still accepting attendance' },
      expectedCount: { type: Sequelize.INTEGER.UNSIGNED, defaultValue: 0 },
      notes:       { type: Sequelize.TEXT, allowNull: true },
      createdAt:   { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
      updatedAt:   { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
    });

    await queryInterface.addIndex('attendance_sessions', ['sessionDate']);
    await queryInterface.addIndex('attendance_sessions', ['serviceType']);
    await queryInterface.addIndex('attendance_sessions', ['qrToken']);
    await queryInterface.addIndex('attendance_sessions', ['isOpen']);

    // ── attendance_records ───────────────────────────────
    await queryInterface.createTable('attendance_records', {
      id: { type: Sequelize.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
      sessionId: {
        type: Sequelize.INTEGER.UNSIGNED, allowNull: false,
        references: { model: 'attendance_sessions', key: 'id' },
        onUpdate: 'CASCADE', onDelete: 'CASCADE',
      },
      memberId: {
        type: Sequelize.INTEGER.UNSIGNED, allowNull: true,
        references: { model: 'members', key: 'id' },
        onUpdate: 'CASCADE', onDelete: 'SET NULL',
        comment: 'NULL for walk-in / non-member guests',
      },
      guestName:   { type: Sequelize.STRING(150), allowNull: true, comment: 'For non-members / walk-ins' },
      guestPhone:  { type: Sequelize.STRING(20),  allowNull: true },
      checkInMethod: {
        type: Sequelize.ENUM('Manual','QR Code'),
        allowNull: false, defaultValue: 'Manual',
      },
      checkInTime: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
      recordedBy:  {
        type: Sequelize.INTEGER.UNSIGNED, allowNull: true,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE', onDelete: 'SET NULL',
        comment: 'User who did manual check-in; NULL for self QR check-in',
      },
      notes:       { type: Sequelize.STRING(500), allowNull: true },
      createdAt:   { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
      updatedAt:   { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
    });

    await queryInterface.addIndex('attendance_records', ['sessionId']);
    await queryInterface.addIndex('attendance_records', ['memberId']);
    await queryInterface.addIndex('attendance_records', ['checkInTime']);
    // Prevent duplicate check-in for the same member in the same session
    await queryInterface.addIndex('attendance_records', ['sessionId', 'memberId'], {
      unique: true,
      where: { memberId: { [Symbol.for('ne')]: null } },
      name: 'unique_member_session',
    });
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable('attendance_records');
    await queryInterface.dropTable('attendance_sessions');
  },
};
