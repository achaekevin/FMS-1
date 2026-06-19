const { Member, Event, Announcement, Income } = require('../models');
const api     = require('../utils/apiResponse');
const audit   = require('../services/auditService');
const comms   = require('../services/communicationService');
const smsSvc  = require('../services/smsService');
const waSvc   = require('../services/whatsappService');
const emailSvc = require('../services/emailService');
const { Op }  = require('sequelize');
const { buildDateFilter } = require('../utils/helpers');

// ─────────────────────────────────────────────────────────
// SMS
// ─────────────────────────────────────────────────────────

/**
 * POST /communications/sms/event-reminders
 * Send event reminders to all active members (or a specific member)
 */
exports.sendEventReminders = async (req, res) => {
  try {
    const { eventId, memberId } = req.body;

    const event = await Event.findByPk(eventId);
    if (!event) return api.notFound(res, 'Event not found');

    const where = { status: 'active' };
    if (memberId) where.id = memberId;

    const members = await Member.findAll({ where, attributes: ['id','fullName','phone','email'] });
    if (!members.length) return api.badRequest(res, 'No active members found');

    // Fire concurrently, don't await to keep the HTTP response fast
    Promise.allSettled(
      members.map(m => comms.sendEventReminder({ member: m, event }))
    );

    await audit.log(req.user.id, 'CREATE', 'NOTIFICATION',
      `Event reminders triggered for "${event.title}" to ${members.length} member(s)`, null, req);

    return api.success(res, { queued: members.length, event: event.title },
      `Event reminders queued for ${members.length} member(s)`);
  } catch (err) {
    return api.error(res, err.message);
  }
};

/**
 * POST /communications/sms/donation-confirmation
 * Manually resend a donation confirmation SMS to a member
 */
exports.sendDonationConfirmationSms = async (req, res) => {
  try {
    const { phone, name, amount, receiptNo } = req.body;
    await smsSvc.sendDonationConfirmation(phone, name, amount, receiptNo);
    await audit.log(req.user.id, 'CREATE', 'NOTIFICATION',
      `Donation confirmation SMS sent to ${phone}`, null, req);
    return api.success(res, null, 'Donation confirmation SMS sent');
  } catch (err) {
    return api.error(res, `SMS failed: ${err.message}`);
  }
};

/**
 * POST /communications/sms/custom
 * Send a custom SMS to one or more phone numbers
 */
exports.sendCustomSms = async (req, res) => {
  try {
    const { phones, message } = req.body;
    const targets = Array.isArray(phones) ? phones : [phones];

    const results = await Promise.allSettled(
      targets.map(p => smsSvc.send(p, message))
    );
    const sent   = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;

    await audit.log(req.user.id, 'CREATE', 'NOTIFICATION',
      `Custom SMS sent to ${sent}/${targets.length} recipients`, null, req);
    return api.success(res, { sent, failed }, `SMS sent to ${sent} of ${targets.length} recipients`);
  } catch (err) {
    return api.error(res, err.message);
  }
};

// ─────────────────────────────────────────────────────────
// EMAIL
// ─────────────────────────────────────────────────────────

/**
 * POST /communications/email/announcement
 * Send an announcement email to all active members (or filter by ids)
 */
exports.sendAnnouncementEmail = async (req, res) => {
  try {
    const { announcementId, memberIds } = req.body;

    const announcement = await Announcement.findByPk(announcementId);
    if (!announcement) return api.notFound(res, 'Announcement not found');

    const where = { status: 'active', email: { [Op.ne]: null } };
    if (memberIds?.length) where.id = { [Op.in]: memberIds };

    const members = await Member.findAll({ where, attributes: ['id','fullName','email'] });
    if (!members.length) return api.badRequest(res, 'No members with email addresses found');

    Promise.allSettled(
      members.map(m => emailSvc.sendAnnouncementEmail(m, announcement))
    );

    await audit.log(req.user.id, 'CREATE', 'NOTIFICATION',
      `Announcement email "${announcement.title}" queued for ${members.length} member(s)`, null, req);

    return api.success(res, { queued: members.length },
      `Announcement email queued for ${members.length} member(s)`);
  } catch (err) {
    return api.error(res, err.message);
  }
};

/**
 * POST /communications/email/statement
 * Send a giving statement email to one or all members for a period
 */
exports.sendStatement = async (req, res) => {
  try {
    const { memberId, startDate, endDate, period } = req.body;

    const where = { status: 'active', email: { [Op.ne]: null } };
    if (memberId) where.id = memberId;

    const members = await Member.findAll({ where, attributes: ['id','fullName','email'] });
    if (!members.length) return api.badRequest(res, 'No members with email addresses found');

    const dateFilter = buildDateFilter(startDate, endDate);

    // Build statement for each member
    const tasks = members.map(async (member) => {
      const incomes = await Income.findAll({
        where: { memberId: member.id, ...dateFilter },
        attributes: ['id','amount','type','paymentMethod','date','description'],
        order: [['date', 'DESC']],
        raw: true,
      });

      const totalDonations = incomes.reduce((sum, i) => sum + parseFloat(i.amount || 0), 0);

      const statement = {
        period:         period || `${startDate} to ${endDate}`,
        totalDonations,
        donationCount:  incomes.length,
        lastDonation:   incomes[0]?.date || null,
        items:          incomes,
      };

      return emailSvc.sendStatementEmail(member, statement);
    });

    Promise.allSettled(tasks);

    await audit.log(req.user.id, 'EXPORT', 'REPORT',
      `Giving statements emailed to ${members.length} member(s) for ${period || startDate + ' – ' + endDate}`,
      null, req);

    return api.success(res, { queued: members.length },
      `Giving statements queued for ${members.length} member(s)`);
  } catch (err) {
    return api.error(res, err.message);
  }
};

/**
 * POST /communications/email/custom
 * Send a custom plain email to specific addresses
 */
exports.sendCustomEmail = async (req, res) => {
  try {
    const { to, subject, html, text } = req.body;
    const targets = Array.isArray(to) ? to : [to];

    const results = await Promise.allSettled(
      targets.map(addr => emailSvc.send({ to: addr, subject, html, text }))
    );
    const sent   = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;

    await audit.log(req.user.id, 'CREATE', 'NOTIFICATION',
      `Custom email "${subject}" sent to ${sent}/${targets.length}`, null, req);
    return api.success(res, { sent, failed }, `Email sent to ${sent} of ${targets.length} recipients`);
  } catch (err) {
    return api.error(res, err.message);
  }
};

// ─────────────────────────────────────────────────────────
// WHATSAPP
// ─────────────────────────────────────────────────────────

/**
 * POST /communications/whatsapp/announcement
 * WhatsApp-broadcast an announcement to all active members with phone numbers
 */
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
    const body   = `📢 *${announcement.title}*\n\n${announcement.content}`;

    Promise.allSettled([waSvc.broadcast(phones, body)]);

    await audit.log(req.user.id, 'CREATE', 'NOTIFICATION',
      `WhatsApp announcement "${announcement.title}" queued for ${members.length} member(s)`, null, req);

    return api.success(res, { queued: members.length },
      `WhatsApp announcement queued for ${members.length} member(s)`);
  } catch (err) {
    return api.error(res, err.message);
  }
};

/**
 * POST /communications/whatsapp/payment-confirmation
 * Manually send a WhatsApp payment confirmation
 */
exports.sendWhatsAppPaymentConfirmation = async (req, res) => {
  try {
    const { phone, name, amount, reference } = req.body;
    await waSvc.sendPaymentConfirmation(phone, name, amount, reference);
    await audit.log(req.user.id, 'CREATE', 'NOTIFICATION',
      `WhatsApp payment confirmation sent to ${phone}`, null, req);
    return api.success(res, null, 'WhatsApp payment confirmation sent');
  } catch (err) {
    return api.error(res, `WhatsApp failed: ${err.message}`);
  }
};

/**
 * POST /communications/whatsapp/custom
 * Send a custom WhatsApp message to a list of numbers
 */
exports.sendCustomWhatsApp = async (req, res) => {
  try {
    const { phones, message } = req.body;
    const targets = Array.isArray(phones) ? phones : [phones];

    const results = await waSvc.broadcast(targets, message);
    const sent    = results.filter(r => r.status === 'fulfilled').length;
    const failed  = results.filter(r => r.status === 'rejected').length;

    await audit.log(req.user.id, 'CREATE', 'NOTIFICATION',
      `Custom WhatsApp sent to ${sent}/${targets.length}`, null, req);
    return api.success(res, { sent, failed }, `WhatsApp sent to ${sent} of ${targets.length} recipients`);
  } catch (err) {
    return api.error(res, err.message);
  }
};
