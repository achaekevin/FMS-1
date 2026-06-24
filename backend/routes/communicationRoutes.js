const express  = require('express');
const router   = express.Router();
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const { authenticate, adminOnly, adminOrTreasurer } = require('../middleware/auth');
const ctrl = require('../controllers/communicationController');

router.use(authenticate, adminOrTreasurer);

// ── SMS ────────────────────────────────────────────────────
/**
 * POST /api/communications/sms/event-reminders
 * Body: { eventId, memberId? }
 */
router.post('/sms/event-reminders', [
  body('eventId').isInt({ min: 1 }).withMessage('eventId is required'),
  body('memberId').optional().isInt({ min: 1 }),
], validate, ctrl.sendEventReminders);

/**
 * POST /api/communications/sms/donation-confirmation
 * Body: { phone, name, amount, receiptNo }
 */
router.post('/sms/donation-confirmation', [
  body('phone').notEmpty().withMessage('Phone number is required'),
  body('name').notEmpty().withMessage('Name is required'),
  body('amount').isFloat({ min: 1 }).withMessage('Amount must be greater than 0'),
  body('receiptNo').notEmpty().withMessage('Receipt number is required'),
], validate, ctrl.sendDonationConfirmationSms);

/**
 * POST /api/communications/sms/custom
 * Body: { phones: string | string[], message }
 */
router.post('/sms/custom', adminOnly, [
  body('phones').notEmpty().withMessage('phones is required'),
  body('message').notEmpty().withMessage('Message is required')
    .isLength({ max: 160 }).withMessage('SMS message must be 160 characters or less'),
], validate, ctrl.sendCustomSms);

// ── Email ──────────────────────────────────────────────────
/**
 * POST /api/communications/email/announcement
 * Body: { announcementId, memberIds?: number[] }
 */
router.post('/email/announcement', [
  body('announcementId').isInt({ min: 1 }).withMessage('announcementId is required'),
  body('memberIds').optional().isArray(),
], validate, ctrl.sendAnnouncementEmail);

/**
 * POST /api/communications/email/statement
 * Body: { memberId?, startDate, endDate, period? }
 */
router.post('/email/statement', [
  body('startDate').isISO8601().withMessage('startDate must be a valid date'),
  body('endDate').isISO8601().withMessage('endDate must be a valid date'),
  body('memberId').optional().isInt({ min: 1 }),
  body('period').optional().isString(),
], validate, ctrl.sendStatement);

/**
 * POST /api/communications/email/custom
 * Body: { to: string | string[], subject, html?, text? }
 */
router.post('/email/custom', adminOnly, [
  body('to').notEmpty().withMessage('Recipient(s) required'),
  body('subject').notEmpty().withMessage('Subject is required'),
], validate, ctrl.sendCustomEmail);

// ── WhatsApp ───────────────────────────────────────────────
/**
 * POST /api/communications/whatsapp/announcement
 * Body: { announcementId, memberIds?: number[] }
 */
router.post('/whatsapp/announcement', [
  body('announcementId').isInt({ min: 1 }).withMessage('announcementId is required'),
  body('memberIds').optional().isArray(),
], validate, ctrl.sendWhatsAppAnnouncement);

/**
 * POST /api/communications/whatsapp/payment-confirmation
 * Body: { phone, name, amount, reference }
 */
router.post('/whatsapp/payment-confirmation', [
  body('phone').notEmpty().withMessage('Phone number is required'),
  body('name').notEmpty().withMessage('Name is required'),
  body('amount').isFloat({ min: 1 }).withMessage('Amount must be greater than 0'),
  body('reference').notEmpty().withMessage('Reference is required'),
], validate, ctrl.sendWhatsAppPaymentConfirmation);

/**
 * POST /api/communications/whatsapp/custom
 * Body: { phones: string | string[], message }
 */
router.post('/whatsapp/custom', adminOnly, [
  body('phones').notEmpty().withMessage('phones is required'),
  body('message').notEmpty().withMessage('Message is required'),
], validate, ctrl.sendCustomWhatsApp);

/**
 * POST /api/communications/whatsapp/test
 * Body: { phone }   — returns full Twilio response or exact error for diagnosis
 */
router.post('/whatsapp/test', adminOnly, [
  body('phone').notEmpty().withMessage('phone is required'),
], validate, ctrl.testWhatsApp);

/**
 * POST /api/communications/email/test
 * Body: { to } — sends a test email and returns full error if it fails
 */
router.post('/email/test', adminOnly, [
  body('to').isEmail().withMessage('Valid email address required'),
], validate, ctrl.testEmail);

module.exports = router;
