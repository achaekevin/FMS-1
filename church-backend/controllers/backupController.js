const path = require('path');
const fs   = require('fs');
const backup = require('../services/backupService');
const api    = require('../utils/apiResponse');
const audit  = require('../services/auditService');

/** POST /backup/create */
exports.create = async (req, res) => {
  try {
    const filePath = await backup.createBackup();
    const stat = fs.statSync(filePath);
    await audit.log(req.user.id, 'EXPORT', 'BACKUP',
      `Created database backup: ${path.basename(filePath)}`, null, req);
    return api.success(res, {
      filename: path.basename(filePath),
      size:     stat.size,
      createdAt: stat.birthtime,
    }, 'Backup created successfully');
  } catch (err) { return api.error(res, err.message); }
};

/** GET /backup/list */
exports.list = async (req, res) => {
  try {
    const files = backup.listBackups();
    return api.success(res, files);
  } catch (err) { return api.error(res, err.message); }
};

/** GET /backup/download/:filename */
exports.download = async (req, res) => {
  try {
    const filename = req.params.filename;
    // Sanitise — no path traversal
    if (filename.includes('..') || filename.includes('/') || filename.includes('\\'))
      return api.badRequest(res, 'Invalid filename');

    const filePath = path.join(backup.BACKUP_DIR, filename);
    if (!fs.existsSync(filePath))
      return api.notFound(res, 'Backup file not found');

    await audit.log(req.user.id, 'EXPORT', 'BACKUP', `Downloaded backup: ${filename}`, null, req);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Type', 'application/octet-stream');
    return fs.createReadStream(filePath).pipe(res);
  } catch (err) { return api.error(res, err.message); }
};

/** DELETE /backup/:filename */
exports.remove = async (req, res) => {
  try {
    const filename = req.params.filename;
    if (filename.includes('..') || filename.includes('/') || filename.includes('\\'))
      return api.badRequest(res, 'Invalid filename');
    backup.deleteBackup(filename);
    await audit.log(req.user.id, 'DELETE', 'BACKUP', `Deleted backup: ${filename}`, null, req);
    return api.success(res, null, 'Backup deleted');
  } catch (err) { return api.error(res, err.message); }
};
