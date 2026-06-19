const logger = require('../utils/logger');

let AT = null;
const getAT = () => {
  if (!AT) {
    try {
      const AfricasTalking = require('africastalking');
      AT = AfricasTalking({
        apiKey:   process.env.AT_API_KEY   || 'sandbox',
        username: process.env.AT_USERNAME  || 'sandbox',
      });
    } catch (e) {
      logger.warn('Africa\'s Talking not initialised:', e.message);
    }
  }
  return AT;
};

const normalizePhone = (phone) => {
  if (!phone) return null;
  const p = phone.replace(/\s+/g, '');
  if (p.startsWith('+254')) return p;
  if (p.startsWith('0'))    return '+254' + p.slice(1);
  if (p.startsWith('254'))  return '+' + p;
  return p;
};

/**
 * Send a single SMS
 */
const send = async (to, message) => {
  try {
    if (!process.env.AT_API_KEY || process.env.AT_API_KEY === 'sandbox') {
      logger.warn(`SMS (sandbox) to ${to}: ${message}`);
      return { sandbox: true, to, message };
    }
    const at  = getAT();
    const sms = at.SMS;
    const res = await sms.send({
      to:      [normalizePhone(to)],
      message,
      from:    process.env.AT_SENDER_ID || undefined,
    });
    logger.info(`SMS sent to ${to}`);
    return res;
  } catch (err) {
    logger.error('smsService.send error:', err.message);
    throw err;
  }
};

/** Donation confirmation */
const sendDonationConfirmation = (phone, name, amount, receiptNo) =>
  send(phone, `Hi ${name}, your donation of KES ${Number(amount).toLocaleString()} has been received. Receipt: ${receiptNo}. God bless you! - Grace Life Church`);

/** Event reminder */
const sendEventReminder = (phone, name, eventTitle, eventDate) =>
  send(phone, `Hi ${name}, reminder: "${eventTitle}" is on ${eventDate}. We look forward to seeing you! - Grace Life Church`);

/** Payment confirmation */
const sendPaymentConfirmation = (phone, name, amount, mpesaRef) =>
  send(phone, `Hi ${name}, M-Pesa payment of KES ${Number(amount).toLocaleString()} confirmed. Ref: ${mpesaRef}. Thank you! - Grace Life Church`);

module.exports = { send, sendDonationConfirmation, sendEventReminder, sendPaymentConfirmation };
