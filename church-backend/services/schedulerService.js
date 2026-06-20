/**
 * schedulerService.js
 *
 * Manages the automatic backup cron job using node-cron.
 * Schedule config is persisted to a JSON file so it survives restarts.
 */
const cron   = require('node-cron');
const fs     = require('fs');
const path   = require('path');
const logger = require('../utils/logger');

const CONFIG_FILE = path.join(__dirname, '../backups/.schedule.json');

// Default schedule: daily at 02:00
const DEFAULT_SCHEDULE = {
  enabled:    false,
  frequency:  'daily',    // daily | weekly | monthly
  time:       '02:00',    // HH:MM (24h)
  dayOfWeek:  0,          // 0=Sunday (used when frequency=weekly)
  dayOfMonth: 1,          // 1-28  (used when frequency=monthly)
  retainDays: 30,         // how many days to keep backups
};

let currentJob = null;
let currentSchedule = { ...DEFAULT_SCHEDULE };

// ── Persist / load ────────────────────────────────────────
const saveConfig = (cfg) => {
  try {
    const dir = path.dirname(CONFIG_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(cfg, null, 2));
  } catch (e) { logger.warn('Could not save backup schedule config:', e.message); }
};

const loadConfig = () => {
  try {
    if (fs.existsSync(CONFIG_FILE))
      return { ...DEFAULT_SCHEDULE, ...JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8')) };
  } catch (e) { logger.warn('Could not load backup schedule config:', e.message); }
  return { ...DEFAULT_SCHEDULE };
};

// ── Build cron expression from schedule settings ──────────
const buildCronExpr = ({ frequency, time, dayOfWeek, dayOfMonth }) => {
  const [h, m] = (time || '02:00').split(':').map(Number);
  switch (frequency) {
    case 'hourly':  return `0 * * * *`;
    case 'weekly':  return `${m} ${h} * * ${dayOfWeek ?? 0}`;
    case 'monthly': return `${m} ${h} ${dayOfMonth ?? 1} * *`;
    default:        return `${m} ${h} * * *`; // daily
  }
};

// ── Start/stop the cron job ───────────────────────────────
const applySchedule = (cfg) => {
  // Stop existing job
  if (currentJob) { currentJob.stop(); currentJob = null; }

  if (!cfg.enabled) {
    logger.info('Auto-backup disabled');
    return;
  }

  const expr = buildCronExpr(cfg);
  if (!cron.validate(expr)) {
    logger.error(`Invalid cron expression: ${expr}`);
    return;
  }

  currentJob = cron.schedule(expr, async () => {
    logger.info('Auto-backup triggered by scheduler');
    try {
      const { createBackup, pruneOldBackups } = require('./backupService');
      const meta = await createBackup('auto');
      logger.info(`Auto-backup complete: ${meta.filename} (${meta.sizeFormatted})`);
      const pruned = pruneOldBackups(cfg.retainDays || 30);
      if (pruned > 0) logger.info(`Pruned ${pruned} old backup(s)`);
    } catch (err) {
      logger.error('Auto-backup failed:', err.message);
    }
  }, { timezone: 'Africa/Nairobi' });

  logger.info(`Auto-backup scheduled: ${expr} (Africa/Nairobi)`);
};

// ── Public API ────────────────────────────────────────────
const getSchedule = () => ({ ...currentSchedule });

const setSchedule = (updates) => {
  currentSchedule = { ...currentSchedule, ...updates };
  saveConfig(currentSchedule);
  applySchedule(currentSchedule);
  return { ...currentSchedule };
};

// ── Bootstrap on module load ──────────────────────────────
const init = () => {
  currentSchedule = loadConfig();
  applySchedule(currentSchedule);
};

init();

module.exports = { scheduler: { getSchedule, setSchedule, init } };
