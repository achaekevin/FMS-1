const express = require('express');
const router  = express.Router();
const { query } = require('express-validator');
const validate = require('../middleware/validate');
const { authenticate, allRoles } = require('../middleware/auth');
const ctrl = require('../controllers/searchController');

router.use(authenticate, allRoles);

router.get('/', [
  query('q').notEmpty().withMessage('Search query (q) is required'),
  query('limit').optional().isInt({ min: 1, max: 20 }),
], validate, ctrl.globalSearch);

module.exports = router;
