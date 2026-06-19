const express = require('express');
const router  = express.Router();
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const { authenticate, allRoles } = require('../middleware/auth');
const ctrl = require('../controllers/mpesaController');

// Callback must be public (Safaricom calls this directly, no JWT)
router.post('/callback', ctrl.callback);

router.use(authenticate, allRoles);

router.post('/stkpush', [
  body('phone').matches(/^(\+254|0)[17]\d{8}$/).withMessage('Valid Kenyan phone number is required'),
  body('amount').isFloat({ min: 1 }).withMessage('Amount must be greater than 0'),
], validate, ctrl.stkPush);

router.get('/status/:checkoutRequestId', ctrl.getStatus);
router.get('/transactions', ctrl.getTransactions);

module.exports = router;
