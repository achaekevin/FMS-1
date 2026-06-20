const express  = require('express');
const router   = express.Router();
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const { authenticate, allRoles, adminOrTreasurer } = require('../middleware/auth');
const { uploadDocument } = require('../middleware/upload');
const ctrl = require('../controllers/documentController');

// All routes require authentication
router.use(authenticate, allRoles);

/**
 * GET /api/documents/stats
 */
router.get('/stats', ctrl.getStats);

/**
 * GET /api/documents
 * ?page, limit, category, search, startDate, endDate, relatedModule, relatedId
 */
router.get('/', ctrl.getAll);

/**
 * GET /api/documents/:id
 */
router.get('/:id', ctrl.getById);

/**
 * GET /api/documents/:id/download
 */
router.get('/:id/download', ctrl.download);

/**
 * POST /api/documents
 * Multipart upload — field name: "file"
 */
router.post('/',
  adminOrTreasurer,
  uploadDocument.single('file'),
  [body('title').trim().notEmpty().withMessage('Title is required')],
  validate,
  ctrl.upload
);

/**
 * PUT /api/documents/:id
 * Update metadata only
 */
router.put('/:id',
  adminOrTreasurer,
  [body('title').optional().trim().notEmpty().withMessage('Title cannot be empty')],
  validate,
  ctrl.update
);

/**
 * DELETE /api/documents/:id
 */
router.delete('/:id', adminOrTreasurer, ctrl.remove);

module.exports = router;
