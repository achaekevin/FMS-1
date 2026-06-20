require('dotenv').config();
const app = require('./app');
const { sequelize, connectDB } = require('./config/sequelize');
require('./models'); // load associations
const logger = require('./utils/logger');
require('./services/schedulerService'); // start auto-backup scheduler

const PORT = process.env.PORT || 5000;

const start = async () => {
  await connectDB();

  // Sync models in development only — use migrations in production
  if (process.env.NODE_ENV !== 'production') {
    await sequelize.sync({ alter: false });
    logger.info('Models synchronized');
  }

  app.listen(PORT, () => {
    logger.info(`Server running on port ${PORT} [${process.env.NODE_ENV || 'development'}]`);
    logger.info(`API docs available at http://localhost:${PORT}/api-docs`);
  });
};

process.on('unhandledRejection', (err) => {
  logger.error('UNHANDLED REJECTION:', err);
});

process.on('uncaughtException', (err) => {
  logger.error('UNCAUGHT EXCEPTION:', err);
  process.exit(1);
});

// Friendly message when port is already in use
process.on('uncaughtException', (err) => {
  if (err.code === 'EADDRINUSE') {
    logger.error(`Port ${PORT} is already in use. Run: taskkill /F /IM node.exe  then restart.`);
    process.exit(1);
  }
  logger.error('UNCAUGHT EXCEPTION:', err);
  process.exit(1);
});

start();
