const { Setting } = require('../models');
const api   = require('../utils/apiResponse');
const audit = require('../services/auditService');

const DEFAULT_SETTINGS = [
  { key: 'church_name',    value: 'Grace Life Church',          description: 'Church display name' },
  { key: 'church_address', value: 'Nairobi, Kenya',             description: 'Physical address' },
  { key: 'church_phone',   value: '+254 700 000 000',           description: 'Contact phone' },
  { key: 'church_email',   value: 'info@gracelifechurch.org',   description: 'Contact email' },
  { key: 'currency',       value: 'KES',                        description: 'Default currency' },
  { key: 'fiscal_year',    value: 'January - December',         description: 'Fiscal year period' },
  { key: 'logo_url',       value: null,                         description: 'Church logo URL' },
];

/** GET /settings — returns all as key-value map */
exports.getAll = async (req, res) => {
  try {
    const rows = await Setting.findAll({ order: [['key','ASC']] });
    if (rows.length === 0) {
      // Seed defaults on first load
      await Setting.bulkCreate(DEFAULT_SETTINGS, { ignoreDuplicates: true });
      const seeded = await Setting.findAll({ order: [['key','ASC']] });
      const map = Object.fromEntries(seeded.map(s => [s.key, s.value]));
      return api.success(res, map);
    }
    const map = Object.fromEntries(rows.map(s => [s.key, s.value]));
    return api.success(res, map);
  } catch (err) { return api.error(res, err.message); }
};

/** PUT /settings — bulk upsert key-value pairs */
exports.updateAll = async (req, res) => {
  try {
    const updates = req.body; // { church_name: '...', currency: '...' }
    if (typeof updates !== 'object') return api.badRequest(res, 'Body must be a JSON object');

    for (const [key, value] of Object.entries(updates)) {
      await Setting.upsert({ key, value, updatedBy: req.user.id });
    }
    await audit.log(req.user.id, 'UPDATE', 'SETTINGS', `Updated settings: ${Object.keys(updates).join(', ')}`, null, req);

    const all = await Setting.findAll({ order: [['key','ASC']] });
    const map = Object.fromEntries(all.map(s => [s.key, s.value]));
    return api.success(res, map, 'Settings updated');
  } catch (err) { return api.error(res, err.message); }
};

/** GET /settings/:key */
exports.getOne = async (req, res) => {
  try {
    const s = await Setting.findOne({ where: { key: req.params.key } });
    if (!s) return api.notFound(res, 'Setting not found');
    return api.success(res, { key: s.key, value: s.value });
  } catch (err) { return api.error(res, err.message); }
};
