const winston = require('winston');
require('winston-daily-rotate-file');
const path = require('path');

const logDir = path.join(__dirname, '../logs');

const { combine, timestamp, printf, colorize, errors } = winston.format;

const logFormat = printf(({ level, message, timestamp, stack }) => {
  return `${timestamp} [${level.toUpperCase()}]: ${stack || message}`;
});

const fileTransport = (filename, level) =>
  new winston.transports.DailyRotateFile({
    filename:     path.join(logDir, `${filename}-%DATE%.log`),
    datePattern:  'YYYY-MM-DD',
    zippedArchive: true,
    maxSize:      '20m',
    maxFiles:     '30d',
    level,
  });

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: combine(
    errors({ stack: true }),
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    logFormat
  ),
  transports: [
    fileTransport('app',   'info'),
    fileTransport('error', 'error'),
  ],
  exceptionHandlers: [fileTransport('exceptions', 'error')],
  rejectionHandlers: [fileTransport('rejections', 'error')],
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: combine(
      colorize({ all: true }),
      timestamp({ format: 'HH:mm:ss' }),
      logFormat
    ),
  }));
}

module.exports = logger;
