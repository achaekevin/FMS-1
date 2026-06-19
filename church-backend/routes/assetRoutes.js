const express = require('express');
const router  = express.Router();
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const { authenticate, allRoles, adminOrTreasurer } = require('../middleware/auth');
const ctrl = require('../controllers/assetController');

router.use(authenticate, allRoles);

router.get('/',           ctrl.getAll);
router.get('/summary',    ctrl.getSummary);
router.get('/export',     ctrl.exportExcel);
router.get('/:id',        ctrl.getById);

const assetRules = [
  body('assetName').notEmpty().withMessage('Asset name is required'),
  body('category').isIn(['Land & Buildings','Vehicles','Electronics','Furniture','Musical Instruments','Other'])
    .withMessage('Invalid category'),
  body('purchaseDate').isISO8601().withMessage('Valid purchase date required'),
  body('value').isFloat({ min: 0 }).withMessage('Value must be >= 0'),
];

router.post('/',   adminOrTreasurer, assetRules, validate, ctrl.create);
router.put('/:id', adminOrTreasurer, [
  body('value').optional().isFloat({ min: 0 }),
  body('condition').optional().isIn(['Excellent','Good','Fair','Poor','Disposed']),
  body('status').optional().isIn(['Active','Under Maintenance','Inactive','Disposed']),
], validate, ctrl.update);
router.delete('/:id', adminOrTreasurer, ctrl.remove);

module.exports = router;
