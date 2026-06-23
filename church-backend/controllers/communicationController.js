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
