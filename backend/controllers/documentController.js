const path = require('path');
const fs   = require('fs');
const { Document, User } = require('../models');
const api   = require('../utils/apiResponse');
const audit = require('../services/auditService');
const { getPagination, buildDateFilter } = require('../utils/helpers');
const { Op } = require('sequelize');

const INCLUDE = [{ model: User, as: 'uploader', attributes: ['id', 'name', 'role'] }];

// ─── Helpers ───────────────────────────────────────────────
const formatBytes = (bytes) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

/**
 * GET /api/documents
 * Paginated list with filters: category, search (title/tags/description), startDate, endDate
 */
exports.getAll = async (req, res) => {
  try {
    const { page = 1, limit = 20, category, search, startDate, endDate, relatedModule, relatedId } = req.query;
    const { limit: lim, offset } = getPagination(page, limit);

    const where = { ...buildDateFilter(startDate, endDate, null, null, 'createdAt') };
    if (category)      where.category      = category;
    if (relatedModule) where.relatedModule = relatedModule;
    if (relatedId)     where.relatedId     = relatedId;
    if (search) {
      where[Op.or] = [
        { title:       { [Op.like]: `%${search}%` } },
        { description: { [Op.like]: `%${search}%` } },
        { tags:        { [Op.like]: `%${search}%` } },
        { originalName:{ [Op.like]: `%${search}%` } },
      ];
    }

    const { count, rows } = await Document.findAndCountAll({
      where, limit: lim, offset,
      include: INCLUDE,
      order: [['createdAt', 'DESC']],
    });

    return api.paginate(res, rows, count, page, lim);
  } catch (err) {
    return api.error(res, err.message);
  }
};

/**
 * GET /api/documents/stats
 * Counts by category and total storage used
 */
exports.getStats = async (req, res) => {
  try {
    const total = await Document.count();

    const byCategory = await Document.findAll({
      attributes: [
        'category',
        [require('sequelize').fn('COUNT', require('sequelize').col('id')), 'count'],
        [require('sequelize').fn('SUM', require('sequelize').col('fileSize')), 'totalSize'],
      ],
      group: ['category'],
      raw: true,
    });

    const sizeRow = await Document.findOne({
      attributes: [[require('sequelize').fn('SUM', require('sequelize').col('fileSize')), 'totalSize']],
      raw: true,
    });

    const totalSize = Number(sizeRow?.totalSize || 0);

    return api.success(res, {
      total,
      totalSize,
      totalSizeFormatted: formatBytes(totalSize),
      byCategory,
    });
  } catch (err) {
    return api.error(res, err.message);
  }
};

/**
 * GET /api/documents/:id
 */
exports.getById = async (req, res) => {
  try {
    const doc = await Document.findByPk(req.params.id, { include: INCLUDE });
    if (!doc) return api.notFound(res, 'Document not found');
    return api.success(res, doc);
  } catch (err) {
    return api.error(res, err.message);
  }
};

/**
 * POST /api/documents
 * Upload a new document (multipart/form-data, field: file)
 */
exports.upload = async (req, res) => {
  try {
    if (!req.file) return api.badRequest(res, 'No file uploaded');

    const { title, category, description, tags, relatedModule, relatedId } = req.body;
    if (!title) return api.badRequest(res, 'Title is required');

    const doc = await Document.create({
      uploadedBy:   req.user.id,
      title:        title.trim(),
      category:     category || 'Other',
      description:  description || null,
      fileName:     req.file.filename,
      originalName: req.file.originalname,
      mimeType:     req.file.mimetype,
      fileSize:     req.file.size,
      filePath:     req.file.path,
      tags:         tags || null,
      relatedModule: relatedModule || null,
      relatedId:    relatedId ? Number(relatedId) : null,
      downloadCount: 0,
    });

    await audit.log(req.user.id, 'CREATE', 'SETTINGS',
      `Uploaded document: "${doc.title}" (${doc.category})`,
      { documentId: doc.id, fileSize: formatBytes(doc.fileSize) }, req,
      { after: doc });

    const full = await Document.findByPk(doc.id, { include: INCLUDE });
    return api.created(res, full, 'Document uploaded successfully');
  } catch (err) {
    return api.error(res, err.message);
  }
};

/**
 * PUT /api/documents/:id
 * Update metadata (title, category, description, tags) — does NOT replace file
 */
exports.update = async (req, res) => {
  try {
    const doc = await Document.findByPk(req.params.id);
    if (!doc) return api.notFound(res, 'Document not found');

    // Only uploader or admin can edit
    if (req.user.role !== 'administrator' && doc.uploadedBy !== req.user.id)
      return api.forbidden(res, 'You can only edit your own documents');

    const beforeSnap = audit.snapshot(doc);
    const { title, category, description, tags, relatedModule, relatedId } = req.body;

    await doc.update({
      title:        title        ?? doc.title,
      category:     category     ?? doc.category,
      description:  description  ?? doc.description,
      tags:         tags         ?? doc.tags,
      relatedModule: relatedModule ?? doc.relatedModule,
      relatedId:    relatedId    ? Number(relatedId) : doc.relatedId,
    });

    await audit.log(req.user.id, 'UPDATE', 'SETTINGS',
      `Updated document metadata: "${doc.title}"`,
      { documentId: doc.id }, req,
      { before: beforeSnap, after: doc });

    const full = await Document.findByPk(doc.id, { include: INCLUDE });
    return api.success(res, full, 'Document updated');
  } catch (err) {
    return api.error(res, err.message);
  }
};

/**
 * GET /api/documents/:id/download
 * Stream file to the browser and increment download counter
 */
exports.download = async (req, res) => {
  try {
    const doc = await Document.findByPk(req.params.id);
    if (!doc) return api.notFound(res, 'Document not found');

    if (!fs.existsSync(doc.filePath))
      return api.notFound(res, 'File not found on disk. It may have been moved or deleted.');

    // Increment counter (fire and forget)
    doc.increment('downloadCount').catch(() => {});

    await audit.log(req.user.id, 'EXPORT', 'SETTINGS',
      `Downloaded document: "${doc.title}"`,
      { documentId: doc.id }, req);

    res.setHeader('Content-Type', doc.mimeType);
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${encodeURIComponent(doc.originalName)}"`
    );
    res.setHeader('Content-Length', doc.fileSize);

    return fs.createReadStream(doc.filePath).pipe(res);
  } catch (err) {
    return api.error(res, err.message);
  }
};

/**
 * DELETE /api/documents/:id
 * Remove record and delete file from disk
 */
exports.remove = async (req, res) => {
  try {
    const doc = await Document.findByPk(req.params.id);
    if (!doc) return api.notFound(res, 'Document not found');

    if (req.user.role !== 'administrator' && doc.uploadedBy !== req.user.id)
      return api.forbidden(res, 'You can only delete your own documents');

    const beforeSnap = audit.snapshot(doc);

    // Delete file from disk (best-effort)
    if (fs.existsSync(doc.filePath)) {
      try { fs.unlinkSync(doc.filePath); } catch (_) {}
    }

    await doc.destroy();

    await audit.log(req.user.id, 'DELETE', 'SETTINGS',
      `Deleted document: "${doc.title}"`,
      null, req,
      { before: beforeSnap });

    return api.success(res, null, 'Document deleted');
  } catch (err) {
    return api.error(res, err.message);
  }
};
