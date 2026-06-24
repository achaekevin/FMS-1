const { exec } = require('child_process');
const path   = require('path');
const fs     = require('fs');
const logger = require('../utils/logger');

const BACKUP_DIR = path.join(__dirname, '../backups');

const ensureDir = () => {
  if (!fs.existsSync(BACKUP_DIR)) fs.mkdirSync(BACKUP_DIR, { recursive: true });
};

const formatBytes = (bytes) => {
  if (bytes < 1024)           return `${bytes} B`;
  if (bytes < 1024 * 1024)    return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

/**
 * Create a MySQL dump backup.
 * Returns metadata object { filename, filePath, size, sizeFormatted, createdAt }
 */
const createBackup = (label = 'manual') => {
  return new Promise((resolve, reject) => {
    ensureDir();

    const ts       = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `backup-${label}-${ts}.sql`;
    const filePath = path.join(BACKUP_DIR, filename);

    const { DB_USER, DB_PASSWORD, DB_HOST, DB_PORT, DB_NAME } = process.env;
    const host    = DB_HOST     || '127.0.0.1';
    const port    = DB_PORT     || 3306;
    const user    = DB_USER     || 'root';
    const db      = DB_NAME     || 'church_finance';
    const passArg = DB_PASSWORD ? `-p"${DB_PASSWORD}"` : '';

    const cmd = `mysqldump -h ${host} -P ${port} -u ${user} ${passArg} --single-transaction --routines --triggers ${db} > "${filePath}"`;

    exec(cmd, { shell: true }, (err, stdout, stderr) => {
      if (err) {
        logger.error('Backup failed:', err.message, stderr);
        // Clean up empty file if created
        try { if (fs.existsSync(filePath)) fs.unlinkSync(filePath); } catch (_) {}
        return reject(new Error('Database backup failed. Ensure mysqldump is installed and credentials are correct.'));
      }
      const stat = fs.statSync(filePath);
      const meta = {
        filename,
        filePath,
        size:          stat.size,
        sizeFormatted: formatBytes(stat.size),
        createdAt:     stat.birthtime,
        label,
      };
      logger.info(`Backup created: ${filename} (${meta.sizeFormatted})`);
      resolve(meta);
    });
  });
};

/**
 * Restore database from a .sql dump file.
 * @param {string} filePath  Absolute path to the .sql file
 */
const restoreBackup = (filePath) => {
  return new Promise((resolve, reject) => {
    if (!fs.existsSync(filePath))
      return reject(new Error('Backup file not found on disk'));

    const { DB_USER, DB_PASSWORD, DB_HOST, DB_PORT, DB_NAME } = process.env;
    const host    = DB_HOST     || '127.0.0.1';
    const port    = DB_PORT     || 3306;
    const user    = DB_USER     || 'root';
    const db      = DB_NAME     || 'church_finance';
    const passArg = DB_PASSWORD ? `-p"${DB_PASSWORD}"` : '';

    const cmd = `mysql -h ${host} -P ${port} -u ${user} ${passArg} ${db} < "${filePath}"`;

    exec(cmd, { shell: true }, (err, stdout, stderr) => {
      if (err) {
        logger.error('Restore failed:', err.message, stderr);
        return reject(new Error('Database restore failed. Check that the backup file is a valid MySQL dump.'));
      }
      logger.info(`Database restored from: ${path.basename(filePath)}`);
      resolve();
    });
  });
};

/**
 * List existing backup files sorted newest-first.
 */
const listBackups = () => {
  ensureDir();
  return fs.readdirSync(BACKUP_DIR)
    .filter(f => f.endsWith('.sql'))
    .map(f => {
      const full = path.join(BACKUP_DIR, f);
      const stat = fs.statSync(full);
      // Parse label from filename  backup-<label>-<ts>.sql
      const match = f.match(/^backup-([^-]+(?:-[^-]+)*)-\d{4}-\d{2}/);
      const label = match ? match[1] : 'manual';
      return {
        filename:      f,
        filePath:      full,
        size:          stat.size,
        sizeFormatted: formatBytes(stat.size),
        createdAt:     stat.birthtime,
        label,
        isAuto:        label === 'auto',
      };
    })
    .sort((a, b) => b.createdAt - a.createdAt);
};

/**
 * Delete a backup file by filename (basename only — no path traversal).
 */
const deleteBackup = (filename) => {
  const file = path.join(BACKUP_DIR, path.basename(filename));
  if (!fs.existsSync(file)) throw new Error('Backup file not found');
  fs.unlinkSync(file);
};

/**
 * Purge backups older than `retainDays` days, keeping at least `minKeep` files.
 */
const pruneOldBackups = (retainDays = 30, minKeep = 5) => {
  const all    = listBackups();
  const cutoff = new Date(Date.now() - retainDays * 24 * 60 * 60 * 1000);
  const toDelete = all.slice(minKeep).filter(b => b.createdAt < cutoff);
  for (const b of toDelete) {
    try { fs.unlinkSync(b.filePath); logger.info(`Pruned old backup: ${b.filename}`); }
    catch (_) {}
  }
  return toDelete.length;
};

module.exports = { createBackup, restoreBackup, listBackups, deleteBackup, pruneOldBackups, BACKUP_DIR, formatBytes };
