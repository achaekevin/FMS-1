const { Sequelize } = require('sequelize');
const dbConfig = require('./database');
const logger   = require('../utils/logger');

const env    = process.env.NODE_ENV || 'development';
const config = dbConfig[env];

const sequelize = new Sequelize(
  config.database,
  config.username,
  config.password,
  {
    ...config,
    logging: (msg) => logger.debug(msg),
  }
);

const connectDB = async () => {
  try {
    await sequelize.authenticate();
    logger.info('MySQL connected via Sequelize');
  } catch (err) {
    logger.error('DB connection failed:', err.message);
    process.exit(1);
  }
};

module.exports = { sequelize, connectDB };
