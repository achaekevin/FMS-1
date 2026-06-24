const express = require('express');
const router  = express.Router();
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const { authenticate, allRoles, adminOrTreasurer } = require('../middleware/auth');
const ctrl = require('../controllers/eventController');

router.use(authenticate, allRoles);

router.get('/',          ctrl.getAll);
router.get('/upcoming',  ctrl.getUpcoming);
router.get('/:id',       ctrl.getById);

const eventRules = [
  body('title').notEmpty().withMessage('Title is required'),
  body('eventDate').isISO8601().withMessage('Valid event date is required'),
  body('category').isIn(['Conference','Crusade','Fundraiser','Meeting','Service','Outreach','Training','Other'])
    .withMessage('Invalid category'),
];

router.post('/',    adminOrTreasurer, eventRules, validate, ctrl.create);
router.put('/:id',  adminOrTreasurer, [
  body('eventDate').optional().isISO8601(),
  body('category').optional().isIn(['Conference','Crusade','Fundraiser','Meeting','Service','Outreach','Training','Other']),
], validate, ctrl.update);
router.delete('/:id', adminOrTreasurer, ctrl.remove);

module.exports = router;
