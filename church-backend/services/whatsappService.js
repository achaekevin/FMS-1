/**
 * WhatsApp Service — powered by Twilio WhatsApp Business API
 *
 * Setup:
 *  1. Create a Twilio account at https://twilio.com
 *  2. Enable WhatsApp Sandbox (or production number) in the Twilio Console
 *  3. Add TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_WHATSAPP_FROM to .env
 *
 * Sandbox prefix: "whatsapp:+14155238886"
 * Production:     "whatsapp:+<your verified Twilio number>"
 */
const logger = require('../utils/logger');

let twilioClient = null;

const getClient = () => {
  if (!twilioClient) {
    try {
      const twilio = require('twilio');
      const sid    = process.env.TWILIO_ACCOUNT_SID;
      const token  = process.env.TWILIO_AUTH_TOKEN;
      if (!sid || !token) {
        logger.warn('WhatsApp: TWILIO_ACCOUNT_SID / TWILIO_AUTH_TOKEN not set — running in sandbox log mode');
        return null;
      }
      twilioClient = twilio(sid, token);
    } catch (e) {
      logger.warn('WhatsApp: twilio package not found — install with: npm install twilio');
      return null;
    }
  }
  return twilioClient;
};

/** Normalize a Kenyan phone to E.164 with whatsapp: prefix */
const toWhatsApp = (phone) => {
  if (!phone) return null;
  let p = phone.replace(/\s+/g, '');
  if (p.startsWith('+254')) return `whatsapp:${p}`;
  if (p.startsWith('0'))    return `whatsapp:+254${p.slice(1)}`;
  if (p.startsWith('254'))  return `whatsapp:+${p}`;
  return `whatsapp:${p}`;
};

const FROM = () =>
  process.env.TWILIO_WHATSAPP_FROM
    ? `whatsapp:${process.env.TWILIO_WHATSAPP_FROM.replace('whatsapp:', '')}`
    : 'whatsapp:+14155238886'; // Twilio sandbox default

/**
 * Send a WhatsApp message to a single recipient.
 * Falls back to logging when not configured.
 */
const send = async (to, body) => {
  try {
    const client = getClient();
    const dest   = toWhatsApp(to);
    if (!dest) throw new Error('Invalid phone number');

    if (!client) {
      logger.warn(`WhatsApp (not configured) → ${dest}: ${body}`);
      return { sandbox: true, to: dest, body };
    }

    const msg = await client.messages.create({
      from: FROM(),
      to:   dest,
      body,
    });
    logger.info(`WhatsApp sent to ${dest} — SID: ${msg.sid}`);
    return msg;
  } catch (err) {
    logger.error('whatsappService.send error:', err.message);
    throw err;
  }
};

/**
 * Broadcast to multiple phone numbers (fire-and-forget per recipient)
 */
const broadcast = async (phones, body) => {
  const results = await Promise.allSettled(
    phones.filter(Boolean).map(phone => send(phone, body))
  );
  const failed = results.filter(r => r.status === 'rejected').length;
  if (failed) logger.warn(`WhatsApp broadcast: ${failed}/${phones.length} failed`);
  return results;
};

// ── Pre-built message templates ────────────────────────────

/** Announcement broadcast */
const sendAnnouncement = (phone, title, content) =>
  send(phone, `📢 *${process.env.CHURCH_NAME || 'Grace Life Church'}*\n\n*${title}*\n\n${content}`);

/** Payment / M-Pesa confirmation */
const sendPaymentConfirmation = (phone, name, amount, reference) =>
  send(phone,
    `✅ *Payment Confirmed*\n\nHi ${name}, your payment of *KES ${Number(amount).toLocaleString()}* has been received.\nRef: *${reference}*\n\nThank you! 🙏\n_${process.env.CHURCH_NAME || 'Grace Life Church'}_`
  );

/** Donation confirmation with receipt number */
const sendDonationConfirmation = (phone, name, amount, receiptNo) =>
  send(phone,
    `🙏 *Donation Received*\n\nDear ${name}, thank you for your generous giving of *KES ${Number(amount).toLocaleString()}*.\nReceipt No: *${receiptNo}*\n\nMay God bless you!\n_${process.env.CHURCH_NAME || 'Grace Life Church'}_`
  );

/** Event reminder */
const sendEventReminder = (phone, name, eventTitle, eventDate, location) =>
  send(phone,
    `📅 *Event Reminder*\n\nHi ${name}!\n\n*${eventTitle}*\n🗓 ${eventDate}${location ? `\n📍 ${location}` : ''}\n\nWe look forward to seeing you!\n_${process.env.CHURCH_NAME || 'Grace Life Church'}_`
  );

module.exports = {
  send,
  broadcast,
  sendAnnouncement,
  sendPaymentConfirmation,
  sendDonationConfirmation,
  sendEventReminder,
};
