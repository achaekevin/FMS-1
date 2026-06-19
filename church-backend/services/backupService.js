const { exec } = require('child_process');
const path = require('path');
const fs   = require('fs');
const logger = require('../utils/logger');

const BACKUP_DIR = path.join(__dirname, '../backups');

const ensureDir = () => {
  if (!fs.existsSync(BACKUP_DIR)) fs.mkdirSync(BACKUP_DIR, { recursive: true });
};

/**
 * Create a MySQL dump backup file
 * Returns the file path on success
 */
const createBackup = () => {
  return new Promise((resolve, reject) => {
    ensureDir();
    const ts   = new Date().toISOString().replace(/[:.]/g, '-');
    const file = path.join(BACKUP_DIR, `backup-${ts}.sql`);

    const { DB_USER, DB_PASSWORD, DB_HOST, DB_PORT, DB_NAME } = process.env;
    const passArg = DB_PASSWORD ? `-p${DB_PASSWORD}` : '';
    const cmd = `mysqldump -h ${DB_HOST || '127.0.0.1'} -P ${DB_PORT || 3306} -u ${DB_USER || 'root'} ${passArg} ${DB_NAME || 'church_finance'} > "${file}"`;

    exec(cmd, (err) => {
      if (err) {
        logger.error('Backup failed:', err.message);
        return reject(new Error('Database backup failed. Ensure mysqldump is installed and credentials are correct.'));
      }
      logger.info(`Backup created: ${file}`);
      resolve(file);
    });
  });
};

/**
 * List existing backup files
 */
const listBackups = () => {
  ensureDir();
  return fs.readdirSync(BACKUP_DIR)
    .filter(f => f.endsWith('.sql'))
    .map(f => {
      const full = path.join(BACKUP_DIR, f);
      const stat = fs.statSync(full);
      return { name: f, path: full, size: stat.size, createdAt: stat.birthtime };
    })
    .sort((a, b) => b.createdAt - a.createdAt);
};

/**
 * Delete a backup file
 */
const deleteBackup = (filename) => {
  const file = path.join(BACKUP_DIR, filename);
  if (!fs.existsSync(file)) throw new Error('Backup file not found');
  fs.unlinkSync(file);
};

module.exports = { createBackup, listBackups, deleteBackup, BACKUP_DIR };
