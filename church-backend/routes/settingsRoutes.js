const express = require('express');
const router  = express.Router();
const { authenticate, allRoles, adminOnly } = require('../middleware/auth');
const ctrl = require('../controllers/settingsController');

router.use(authenticate);

// Communication config status (which services are configured)
router.get('/comm-config', allRoles, (req, res) => {
  const api = require('../utils/apiResponse');
  return api.success(res, {
    sms:      !!(process.env.AT_API_KEY && process.env.AT_API_KEY !== 'sandbox' && process.env.AT_API_KEY !== 'your_africastalking_api_key'),
    email:    !!(process.env.SMTP_USER && process.env.SMTP_PASS && process.env.SMTP_USER !== 'your_email@gmail.com'),
    whatsapp: !!(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN &&
                 !process.env.TWILIO_ACCOUNT_SID.includes('your_') &&
                 !process.env.TWILIO_AUTH_TOKEN.includes('your_')),
  });
});

// All roles can read
router.get('/',     allRoles, ctrl.getAll);
router.get('/:key', allRoles, ctrl.getOne);

// Only admin can update
router.put('/', adminOnly, ctrl.updateAll);

module.exports = router;
