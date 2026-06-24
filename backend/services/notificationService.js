const { Notification } = require('../models');
const logger = require('../utils/logger');

/**
 * Create a notification for a user (or broadcast if userId is null)
 */
const create = async (userId, title, message, type = 'info', module = null, metadata = null) => {
  try {
    return await Notification.create({ userId, title, message, type, module, metadata });
  } catch (err) {
    logger.error('notificationService.create error:', err.message);
  }
};

/**
 * Broadcast a notification to multiple users
 */
const broadcast = async (userIds, title, message, type = 'info', module = null) => {
  try {
    const records = userIds.map(uid => ({ userId: uid, title, message, type, module }));
    return await Notification.bulkCreate(records);
  } catch (err) {
    logger.error('notificationService.broadcast error:', err.message);
  }
};

module.exports = { create, broadcast };
