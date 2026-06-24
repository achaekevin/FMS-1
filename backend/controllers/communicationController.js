const { Member, Event, Announcement, Income } = require('../models');
const api      = require('../utils/apiResponse');
const audit    = require('../services/auditService');
const comms    = require('../services/communicationService');
const smsSvc   = require('../services/smsService');
const waSvc    = require('../services/whatsappService');
const emailSvc = require('../services/emailService');
const { Op }   = require('sequelize');
const { buildDateFilter } = require('../utils/helpers');

// ─────────────────────────────────────────────────────────
// SMS
// ─────────────────────────────────────────────────────────

exports.sendEventReminders = async (req, res) => {
  try {
    const { eventId, memberId } = req.body;
    const event = await Event.findByPk(eventId);
    if (!event) return api.notFound(res, 'Event not found');
    const where = { status: 'active' };
    if (memberId) where.id = memberId;
    const members = await Member.findAll({ where, attributes: ['id','fullName','phone','email'] });
    if (!members.length) return api.badRequest(res, 'No active members found');
    Promise.allSettled(members.map(m => comms.sendEventReminder({ member: m, event })));
    await audit.log(req.user.id, 'CREATE', 'NOTIFICATION', `Event reminders triggered for "${event.title}" to ${members.length} member(s)`, null, req);
    return api.success(res, { queued: members.length, event: event.title }, `Event reminders queued for ${members.length} member(s)`);
  } catch (err) { return api.error(res, err.message); }
};

exports.sendDonationConfirmationSms = async (req, res) => {
  try {
    const { phone, name, amount, receiptNo } = req.body;
    await smsSvc.sendDonationConfirmation(phone, name, amount, receiptNo);
    await audit.log(req.user.id, 'CREATE', 'NOTIFICATION', `Donation confirmation SMS sent to ${phone}`, null, req);
    return api.success(res, null, 'Donation confirmation SMS sent');
  } catch (err) { return api.error(res, `SMS failed: ${err.message}`); }
};

exports.sendCustomSms = async (req, res) => {
  try {
    const { phones, message } = req.body;
    const targets = Array.isArray(phones) ? phones : [phones];
    const results = await Promise.allSettled(targets.map(p => smsSvc.send(p, message)));
    const sent    = results.filter(r => r.status === 'fulfilled').length;
    const failed  = results.filter(r => r.status === 'rejected').length;
    await audit.log(req.user.id, 'CREATE', 'NOTIFICATION', `Custom SMS sent to ${sent}/${targets.length} recipients`, null, req);
    return api.success(res, { sent, failed }, `SMS sent to ${sent} of ${targets.length} recipients`);
  } catch (err) { return api.error(res, err.message); }
};

// ─────────────────────────────────────────────────────────
// EMAIL
// ─────────────────────────────────────────────────────────

exports.sendAnnouncementEmail = async (req, res) => {
  try {
    const { announcementId, memberIds } = req.body;
    const announcement = await Announcement.findByPk(announcementId);
    if (!announcement) return api.notFound(res, 'Announcement not found');
    const where = { status: 'active', email: { [Op.ne]: null } };
    if (memberIds?.length) where.id = { [Op.in]: memberIds };
    const members = await Member.findAll({ where, attributes: ['id','fullName','email'] });
    if (!members.length) return api.badRequest(res, 'No members with email addresses found');
    Promise.allSettled(members.map(m => emailSvc.sendAnnouncementEmail(m, announcement)));
    await audit.log(req.user.id, 'CREATE', 'NOTIFICATION', `Announcement email "${announcement.title}" queued for ${members.length} member(s)`, null, req);
    return api.success(res, { queued: members.length }, `Announcement email queued for ${members.length} member(s)`);
  } catch (err) { return api.error(res, err.message); }
};

exports.sendStatement = async (req, res) => {
  try {
    const { memberId, startDate, endDate, period } = req.body;
    const where = { status: 'active', email: { [Op.ne]: null } };
    if (memberId) where.id = memberId;
    const members = await Member.findAll({ where, attributes: ['id','fullName','email'] });
    if (!members.length) return api.badRequest(res, 'No members with email addresses found');
    const dateFilter = buildDateFilter(startDate, endDate);
    const tasks = members.map(async (member) => {
      const incomes = await Income.findAll({
        where: { memberId: member.id, ...dateFilter },
        attributes: ['id','amount','type','paymentMethod','date','description'],
        order: [['date', 'DESC']], raw: true,
      });
      const totalDonations = incomes.reduce((sum, i) => sum + parseFloat(i.amount || 0), 0);
      return emailSvc.sendStatementEmail(member, {
        period: period || `${startDate} to ${endDate}`,
        totalDonations, donationCount: incomes.length,
        lastDonation: incomes[0]?.date || null, items: incomes,
      });
    });
    Promise.allSettled(tasks);
    await audit.log(req.user.id, 'EXPORT', 'REPORT', `Giving statements emailed to ${members.length} member(s)`, null, req);
    return api.success(res, { queued: members.length }, `Giving statements queued for ${members.length} member(s)`);
  } catch (err) { return api.error(res, err.message); }
};

exports.sendCustomEmail = async (req, res) => {
  try {
    const { to, subject, html, text } = req.body;
    const targets = Array.isArray(to) ? to : [to];
    const results = await Promise.allSettled(targets.map(addr => emailSvc.send({ to: addr, subject, html, text })));
    const sent    = results.filter(r => r.status === 'fulfilled').length;
    const failed  = results.filter(r => r.status === 'rejected').length;
    await audit.log(req.user.id, 'CREATE', 'NOTIFICATION', `Custom email "${subject}" sent to ${sent}/${targets.length}`, null, req);
    return api.success(res, { sent, failed }, `Email sent to ${sent} of ${targets.length} recipients`);
  } catch (err) { return api.error(res, err.message); }
};

// ─────────────────────────────────────────────────────────
// WHATSAPP
// ─────────────────────────────────────────────────────────

exports.sendWhatsAppAnnouncement = async (req, res) => {
  try {
    const { announcementId, memberIds } = req.body;
    const announcement = await Announcement.findByPk(announcementId);
    if (!announcement) return api.notFound(res, 'Announcement not found');
    const where = { status: 'active', phone: { [Op.ne]: null } };
    if (memberIds?.length) where.id = { [Op.in]: memberIds };
    const members = await Member.findAll({ where, attributes: ['id','fullName','phone'] });
    if (!members.length) return api.badRequest(res, 'No members with phone numbers found');
    const phones = members.map(m => m.phone);
    Promise.allSettled([waSvc.broadcast(phones, `📢 *${announcement.title}*\n\n${announcement.content}`)]);
    await audit.log(req.user.id, 'CREATE', 'NOTIFICATION', `WhatsApp announcement "${announcement.title}" queued for ${members.length} member(s)`, null, req);
    return api.success(res, { queued: members.length }, `WhatsApp announcement queued for ${members.length} member(s)`);
  } catch (err) { return api.error(res, err.message); }
};

exports.sendWhatsAppPaymentConfirmation = async (req, res) => {
  try {
    const { phone, name, amount, reference } = req.body;
    await waSvc.sendPaymentConfirmation(phone, name, amount, reference);
    await audit.log(req.user.id, 'CREATE', 'NOTIFICATION', `WhatsApp payment confirmation sent to ${phone}`, null, req);
    return api.success(res, null, 'WhatsApp payment confirmation sent');
  } catch (err) { return api.error(res, `WhatsApp failed: ${err.message}`); }
};

exports.sendCustomWhatsApp = async (req, res) => {
  try {
    const { phones, message } = req.body;
    const targets = Array.isArray(phones) ? phones : [phones];
    const results = await waSvc.broadcast(targets, message);
    const sent    = results.filter(r => r.status === 'fulfilled').length;
    const failed  = results.filter(r => r.status === 'rejected').length;
    await audit.log(req.user.id, 'CREATE', 'NOTIFICATION', `Custom WhatsApp sent to ${sent}/${targets.length}`, null, req);
    return api.success(res, { sent, failed }, `WhatsApp sent to ${sent} of ${targets.length} recipients`);
  } catch (err) { return api.error(res, err.message); }
};

// ── Diagnosis helper ──────────────────────────────────────

const getDiagnosis = (code) => {
  const codes = {
    21608: '❌ Recipient not verified in sandbox. They must send "join <keyword>" to +14155238886 first.',
    21614: '❌ "To" number is not a valid mobile number.',
    21211: '❌ Invalid "To" phone number format.',
    63016: '❌ WhatsApp channel not enabled for this Twilio number.',
    63007: '❌ Account not authorized for WhatsApp. Check Sandbox settings in Twilio Console.',
    20003: '❌ Authentication failed — check TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN.',
    21606: '❌ "From" number is not a valid Twilio WhatsApp number. Use +14155238886 for sandbox.',
  };
  return codes[code] || `Unknown error code ${code}. See: https://www.twilio.com/docs/api/errors/${code}`;
};

/**
 * POST /communications/whatsapp/test
 * Returns full Twilio response OR exact error code + human diagnosis.
 */
exports.testWhatsApp = async (req, res) => {
  try {
    const { phone } = req.body;
    if (!phone) return api.badRequest(res, 'phone is required');

    const sid   = process.env.TWILIO_ACCOUNT_SID   || 'NOT SET';
    const token = process.env.TWILIO_AUTH_TOKEN     || 'NOT SET';
    const from  = process.env.TWILIO_WHATSAPP_FROM  || 'NOT SET';

    const toFormatted = (() => {
      let p = phone.replace(/\s+/g, '');
      if (p.startsWith('+254')) return `whatsapp:${p}`;
      if (p.startsWith('0'))    return `whatsapp:+254${p.slice(1)}`;
      return `whatsapp:${p}`;
    })();

    const config = {
      TWILIO_ACCOUNT_SID:   sid.slice(0, 8) + '…',
      TWILIO_AUTH_TOKEN:    token !== 'NOT SET' ? token.slice(0, 6) + '…' : 'NOT SET',
      TWILIO_WHATSAPP_FROM: from,
      fromFormatted:        `whatsapp:${from.replace('whatsapp:', '')}`,
      toFormatted,
    };

    try {
      const result = await waSvc.send(phone,
        `🧪 Test from ${process.env.CHURCH_NAME || 'Church FMS'} — WhatsApp is working!`);
      return api.success(res, { config, twilioResponse: { sid: result.sid, status: result.status } },
        'WhatsApp test sent successfully ✅');
    } catch (twilioErr) {
      return api.success(res, {
        config,
        error: {
          message:  twilioErr.message,
          code:     twilioErr.code,
          status:   twilioErr.status,
          moreInfo: twilioErr.moreInfo,
        },
        diagnosis: getDiagnosis(twilioErr.code),
      }, 'WhatsApp test failed — see error details below');
    }
  } catch (err) { return api.error(res, err.message); }
};

/**
 * POST /communications/email/test
 * Sends a test email and returns the exact error if it fails — for diagnosis.
 */
exports.testEmail = async (req, res) => {
  const { to } = req.body;

  const config = {
    SMTP_HOST:   process.env.SMTP_HOST   || 'NOT SET',
    SMTP_PORT:   process.env.SMTP_PORT   || 'NOT SET',
    SMTP_SECURE: process.env.SMTP_SECURE || 'NOT SET',
    SMTP_USER:   process.env.SMTP_USER   || 'NOT SET',
    SMTP_PASS:   process.env.SMTP_PASS
      ? `${process.env.SMTP_PASS.slice(0,4)}…` : 'NOT SET',
  };

  // Step 1: verify connection first so we get a fast diagnostic
  const port   = parseInt(process.env.SMTP_PORT) || 587;

  // Send directly — verify() is redundant when we're about to send anyway
  // and doing both doubles the round-trip time, which causes frontend timeouts.
  try {
    const result = await emailSvc.send({
      to,
      subject: `✅ Test Email — ${process.env.CHURCH_NAME || 'Church FMS'}`,
      html: `<p>This is a test email from your Church Finance System.</p>
             <p>If you receive this, email is working correctly! ✅</p>
             <p><small>Sent: ${new Date().toLocaleString('en-KE')}</small></p>`,
    });

    return api.success(res, {
      config,
      result: { messageId: result.messageId || 'sent', accepted: result.accepted },
    }, `Test email sent to ${to} ✅ — check your inbox (and spam folder)`);
  } catch (err) {
    return api.success(res, {
      config,
      step:      'SEND',
      error:     err.message,
      code:      err.code,
      diagnosis: getEmailDiagnosis(err),
      fix: port === 587
        ? 'Try changing SMTP_PORT=465 and SMTP_SECURE=true in your .env and restart the server.'
        : 'Try changing SMTP_PORT=587 and SMTP_SECURE=false in your .env and restart the server.',
    }, 'SMTP send failed — see error details');
  }
};

const getEmailDiagnosis = (err) => {
  const msg = err.message?.toLowerCase() || '';
  const code = err.code || '';

  if (code === 'EAUTH' || msg.includes('invalid login') || msg.includes('username and password'))
    return '❌ Authentication failed. For Gmail: you must use an App Password, not your regular password. See fix below.';
  if (msg.includes('less secure') || msg.includes('application-specific'))
    return '❌ Gmail is blocking the login. You need to generate an App Password.';
  if (code === 'ECONNREFUSED')
    return '❌ Cannot connect to SMTP server. Check SMTP_HOST and SMTP_PORT.';
  if (code === 'ETIMEDOUT' || msg.includes('timeout'))
    return '❌ Connection timed out. Your network may be blocking port 587. Try SMTP_PORT=465 with SMTP_SECURE=true.';
  if (msg.includes('self signed') || msg.includes('certificate'))
    return '❌ SSL certificate error. Try setting SMTP_SECURE=false.';
  if (msg.includes('quota') || msg.includes('rate limit'))
    return '❌ Gmail sending limit reached. Wait 24 hours or use a different email service.';
  return `Unknown error. Full message: ${err.message}`;
};
