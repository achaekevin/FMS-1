const path   = require('path');
const fs     = require('fs');
const multer = require('multer');
const backup = require('../services/backupService');
const api    = require('../utils/apiResponse');
const audit  = require('../services/auditService');
const { scheduler } = require('../services/schedulerService');

// ── Multer — accept only .sql uploads for restore ─────────
const restoreUpload = multer({
  dest: require('os').tmpdir(),
  fileFilter: (req, file, cb) => {
    if (file.originalname.endsWith('.sql')) cb(null, true);
    else cb(new Error('Only .sql files are accepted for restore'), false);
  },
  limits: { fileSize: 200 * 1024 * 1024 }, // 200 MB
}).single('file');

// ─── List ─────────────────────────────────────────────────
exports.list = async (req, res) => {
  try {
    const files = backup.listBackups();
    return api.success(res, files);
  } catch (err) { return api.error(res, err.message); }
};

// ─── Stats ────────────────────────────────────────────────
exports.stats = async (req, res) => {
  try {
    const files    = backup.listBackups();
    const totalSize = files.reduce((s, f) => s + f.size, 0);
    const schedule  = scheduler.getSchedule();
    return api.success(res, {
      count:            files.length,
      totalSize:        totalSize,
      totalSizeFormatted: backup.formatBytes(totalSize),
      latest:           files[0]  || null,
      oldest:           files[files.length - 1] || null,
      autoEnabled:      schedule.enabled,
      schedule:         schedule,
    });
  } catch (err) { return api.error(res, err.message); }
};

// ─── Manual create ────────────────────────────────────────
exports.create = async (req, res) => {
  try {
    const meta = await backup.createBackup('manual');
    await audit.log(req.user.id, 'EXPORT', 'BACKUP',
      `Manual backup created: ${meta.filename} (${meta.sizeFormatted})`, null, req);
    return api.success(res, meta, 'Backup created successfully');
  } catch (err) { return api.error(res, err.message); }
};

// ─── Download ─────────────────────────────────────────────
exports.download = async (req, res) => {
  try {
    const filename = path.basename(req.params.filename); // sanitise
    if (!filename.endsWith('.sql'))
      return api.badRequest(res, 'Invalid file type');

    const filePath = path.join(backup.BACKUP_DIR, filename);
    if (!fs.existsSync(filePath))
      return api.notFound(res, 'Backup file not found');

    await audit.log(req.user.id, 'EXPORT', 'BACKUP',
      `Downloaded backup: ${filename}`, null, req);

    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('Content-Length', fs.statSync(filePath).size);
    return fs.createReadStream(filePath).pipe(res);
  } catch (err) { return api.error(res, err.message); }
};

// ─── Delete ───────────────────────────────────────────────
exports.remove = async (req, res) => {
  try {
    const filename = path.basename(req.params.filename);
    backup.deleteBackup(filename);
    await audit.log(req.user.id, 'DELETE', 'BACKUP',
      `Deleted backup: ${filename}`, null, req);
    return api.success(res, null, 'Backup deleted');
  } catch (err) { return api.error(res, err.message); }
};

// ─── Restore (upload .sql file) ───────────────────────────
exports.restore = (req, res) => {
  restoreUpload(req, res, async (err) => {
    if (err) return api.badRequest(res, err.message);
    if (!req.file) return api.badRequest(res, 'No .sql file uploaded');

    const tmpPath = req.file.path;
    try {
      await backup.restoreBackup(tmpPath);
      await audit.log(req.user.id, 'UPDATE', 'BACKUP',
        `Database restored from uploaded file: ${req.file.originalname}`, null, req);
      return api.success(res, null, 'Database restored successfully. The server may need a restart for all changes to take effect.');
    } catch (restoreErr) {
      return api.error(res, restoreErr.message);
    } finally {
      // Always delete the temp file
      try { fs.unlinkSync(tmpPath); } catch (_) {}
    }
  });
};

// ─── Restore from existing backup file on server ─────────
exports.restoreFromFile = async (req, res) => {
  try {
    const filename = path.basename(req.params.filename);
    if (!filename.endsWith('.sql'))
      return api.badRequest(res, 'Invalid file type');

    const filePath = path.join(backup.BACKUP_DIR, filename);
    if (!fs.existsSync(filePath))
      return api.notFound(res, 'Backup file not found on server');

    await backup.restoreBackup(filePath);
    await audit.log(req.user.id, 'UPDATE', 'BACKUP',
      `Database restored from server backup: ${filename}`, null, req);
    return api.success(res, null, `Database restored from ${filename}`);
  } catch (err) { return api.error(res, err.message); }
};

// ─── Auto-backup schedule ─────────────────────────────────
exports.getSchedule = (req, res) => {
  return api.success(res, scheduler.getSchedule());
};

exports.setSchedule = async (req, res) => {
  try {
    const { enabled, frequency, time, retainDays } = req.body;
    const schedule = scheduler.setSchedule({ enabled, frequency, time, retainDays });
    await audit.log(req.user.id, 'UPDATE', 'SETTINGS',
      `Auto-backup schedule updated: ${enabled ? `${frequency} at ${time}` : 'disabled'}`, null, req);
    return api.success(res, schedule, 'Auto-backup schedule updated');
  } catch (err) { return api.error(res, err.message); }
};
