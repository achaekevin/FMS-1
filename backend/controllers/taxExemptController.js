'use strict';

const path = require('path');
const fs   = require('fs');
const { Income, Member } = require('../models');
const api    = require('../utils/apiResponse');
const audit  = require('../services/auditService');
const { generateTaxStatement, generateBatchStatements } = require('../services/taxExemptService');
const { buildDateFilter } = require('../utils/helpers');
const { Op } = require('sequelize');

const BATCH_DIR = path.join(__dirname, '../uploads/tax-statements');

// ── GET /tax-statements/preview ───────────────────────────────────────────────
// Returns JSON summary of what will be generated — for the batch UI

exports.preview = async (req, res) => {
  try {
    const { year, quarter, startDate, endDate } = req.query;
    const dateFilter = buildDateRange({ year, quarter, startDate, endDate });

    const members = await Member.findAll({
      where: { status: 'active' },
      attributes: ['id', 'fullName', 'phone', 'email', 'address'],
      order: [['fullName', 'ASC']],
    });

    const summary = await Promise.all(members.map(async m => {
      const total = await Income.sum('amount', { where: { memberId: m.id, ...dateFilter } }) || 0;
      const count = await Income.count({ where: { memberId: m.id, ...dateFilter } });
      return { id: m.id, fullName: m.fullName, phone: m.phone, email: m.email, total, count };
    }));

    const withContribs = summary.filter(m => m.count > 0);
    const grandTotal   = withContribs.reduce((s, m) => s + m.total, 0);

    return api.success(res, {
      period:       buildPeriodLabel({ year, quarter, startDate, endDate }),
      totalMembers: withContribs.length,
      grandTotal,
      members:      withContribs,
    });
  } catch (err) { return api.error(res, err.message); }
};

// ── GET /tax-statements/:memberId/single ──────────────────────────────────────
// Stream a single member's PDF

exports.singleStatement = async (req, res) => {
  try {
    const { memberId } = req.params;
    const { year, quarter, startDate, endDate } = req.query;
    const dateFilter = buildDateRange({ year, quarter, startDate, endDate });

    const member = await Member.findByPk(memberId);
    if (!member) return api.notFound(res, 'Member not found');

    const records = await Income.findAll({
      where: { memberId, ...dateFilter },
      order: [['date', 'ASC']],
      raw: true,
    });

    if (!records.length) return api.badRequest(res, 'No contributions found for this member in the selected period');

    const opts = buildOpts({ year, quarter, startDate, endDate });
    await audit.log(req.user.id, 'EXPORT', 'TAX_STATEMENT',
      `Downloaded tax statement for ${member.fullName} — ${opts.period}`, { memberId }, req);

    return generateTaxStatement(member.toJSON(), records, opts, { res });
  } catch (err) { return api.error(res, err.message); }
};

// ── POST /tax-statements/batch ────────────────────────────────────────────────
// Generate statements for multiple (or all) members, return a ZIP

exports.batchGenerate = async (req, res) => {
  try {
    const { year, quarter, startDate, endDate, memberIds } = req.body;
    const dateFilter = buildDateRange({ year, quarter, startDate, endDate });
    const opts = buildOpts({ year, quarter, startDate, endDate });

    // Resolve members
    const whereClause = { status: 'active' };
    if (memberIds?.length) whereClause.id = { [Op.in]: memberIds };

    const members = await Member.findAll({
      where: whereClause,
      attributes: ['id', 'fullName', 'phone', 'email', 'address'],
      order: [['fullName', 'ASC']],
    });

    if (!members.length) return api.notFound(res, 'No matching members found');

    // Fetch income for each
    const membersData = await Promise.all(members.map(async m => ({
      member:  m.toJSON(),
      records: await Income.findAll({ where: { memberId: m.id, ...dateFilter }, order: [['date', 'ASC']], raw: true }),
    })));

    const withData = membersData.filter(md => md.records.length > 0);
    if (!withData.length) return api.badRequest(res, 'No contribution records found for the selected members and period');

    if (!fs.existsSync(BATCH_DIR)) fs.mkdirSync(BATCH_DIR, { recursive: true });
    const zipName = `tax-statements-${opts.year || 'period'}-${Date.now()}.zip`;
    const zipPath = path.join(BATCH_DIR, zipName);

    const results = await generateBatchStatements(withData, opts, zipPath);

    await audit.log(req.user.id, 'EXPORT', 'TAX_STATEMENT',
      `Batch tax statements — ${opts.period} — ${results.length} members`,
      { count: results.length, year: opts.year }, req);

    // Stream the zip
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="${zipName}"`);
    const stream = fs.createReadStream(zipPath);
    stream.pipe(res);
    stream.on('end', () => {
      fs.unlink(zipPath, () => {}); // clean up after send
    });
  } catch (err) { return api.error(res, err.message); }
};

// ── GET /tax-statements/members ───────────────────────────────────────────────
// List all active members with a quick contribution total for the given period

exports.listMembers = async (req, res) => {
  try {
    const { year, quarter, startDate, endDate, search } = req.query;
    const dateFilter = buildDateRange({ year, quarter, startDate, endDate });

    const whereClause = { status: 'active' };
    if (search) whereClause.fullName = { [Op.like]: `%${search}%` };

    const members = await Member.findAll({
      where: whereClause,
      attributes: ['id', 'fullName', 'phone', 'email'],
      order: [['fullName', 'ASC']],
    });

    const enriched = await Promise.all(members.map(async m => {
      const total = await Income.sum('amount', { where: { memberId: m.id, ...dateFilter } }) || 0;
      const count = await Income.count({ where: { memberId: m.id, ...dateFilter } });
      return { id: m.id, fullName: m.fullName, phone: m.phone, email: m.email, total, count };
    }));

    return api.success(res, enriched.filter(m => m.count > 0));
  } catch (err) { return api.error(res, err.message); }
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function buildDateRange({ year, quarter, startDate, endDate }) {
  if (startDate && endDate) {
    return buildDateFilter(startDate, endDate, null, null);
  }
  if (quarter && year) {
    const qStart = [
      `${year}-01-01`, `${year}-04-01`, `${year}-07-01`, `${year}-10-01`,
    ][parseInt(quarter) - 1];
    const qEnd = [
      `${year}-03-31`, `${year}-06-30`, `${year}-09-30`, `${year}-12-31`,
    ][parseInt(quarter) - 1];
    return buildDateFilter(qStart, qEnd, null, null);
  }
  if (year) return buildDateFilter(null, null, null, year);
  return {};
}

function buildPeriodLabel({ year, quarter, startDate, endDate }) {
  if (startDate && endDate) return `${startDate} to ${endDate}`;
  if (quarter && year) return `Q${quarter} ${year}`;
  if (year) return `Full Year ${year}`;
  return 'All Time';
}

function buildOpts({ year, quarter, startDate, endDate }) {
  const period = buildPeriodLabel({ year, quarter, startDate, endDate });
  return {
    period,
    year:      year      || new Date().getFullYear(),
    quarter:   quarter   || null,
    startDate: startDate || null,
    endDate:   endDate   || null,
  };
}
