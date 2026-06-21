const logger  = require('../utils/logger');
const smsSvc  = require('./smsService');
const emailSvc = require('./emailService');
const waSvc   = require('./whatsappService 
                        
const fireAll = async (label, tasks) => {
  const results = await Promise.allSettled(tasks);
  results.forEach((r, i) => {
    if (r.status === 'rejected')
      logger.warn(`communicationService [${label}] task ${i} failed: ${r.reason?.message}`);
  });
};
───────────────────────────────────────────────────────
const sendDonationConfirmation = async ({ member, receipt }) => {
  const tasks = [];

  if (member?.phone)
    tasks.push(smsSvc.sendDonationConfirmation(member.phone, member.fullName, receipt.amount, receipt.receiptNumber));

  if (member?.phone)
    tasks.push(waSvc.sendDonationConfirmation(member.phone, member.fullName, receipt.amount, receipt.receiptNumber));

  if (member?.email)
    tasks.push(emailSvc.sendReceiptEmail(member, receipt));

  await fireAll('DonationConfirmation', tasks);
};
────────────────────────────────────────────────────────
const sendEventReminder = async ({ member, event }) => {
  const eventDate = new Date(event.eventDate).toLocaleDateString('en-KE', { dateStyle: 'full' });
  const tasks     = [];

  if (member?.phone) {
    tasks.push(smsSvc.sendEventReminder(member.phone, member.fullName, event.title, eventDate));
    tasks.push(waSvc.sendEventReminder(member.phone, member.fullName, event.title, eventDate, event.location));
  }

  await fireAll('EventReminder', tasks);
};

// ─────────────────────────────────────────────────────────
// PAYMENT CONFIRMATION (M-Pesa)
// Triggered after M-Pesa callback is processed.
// Channels: SMS + WhatsApp + Email
// ─────────────────────────────────────────────────────────
const sendPaymentConfirmation = async ({ member, transaction }) => {
  const ref   = transaction.mpesaReceiptNumber || transaction.reference || transaction.id;
  const tasks = [];

  if (member?.phone) {
    tasks.push(smsSvc.sendPaymentConfirmation(member.phone, member.fullName, transaction.amount, ref));
    tasks.push(waSvc.sendPaymentConfirmation(member.phone, member.fullName, transaction.amount, ref));
  }
  if (member?.email)
    tasks.push(emailSvc.sendPaymentConfirmation(member, transaction));

  await fireAll('PaymentConfirmation', tasks);
};

───────────────────────────────────────────────────────
const broadcastAnnouncement = async ({ members, announcement }) => {
  const tasks = members.flatMap(member => {
    const ch = [];
    if (member.email)
      ch.push(emailSvc.sendAnnouncementEmail(member, announcement));
    if (member.phone) {
      ch.push(smsSvc.sendAnnouncement(member.phone, member.fullName, announcement.title, announcement.content));
      ch.push(waSvc.sendAnnouncement(member.phone, announcement.title, announcement.content));
    }
    return ch;
  });

  await fireAll('AnnouncementBroadcast', tasks);
};
───────────────────────────────────────────────────────
const sendMemberStatement = async ({ member, statement }) => {
  if (!member?.email) {
    logger.warn(`sendMemberStatement: member ${member?.id} has no email`);
    return;
  }
  await fireAll('MemberStatement', [emailSvc.sendStatementEmail(member, statement)]);
};

module.exports = {
  sendDonationConfirmation,
  sendEventReminder,
  sendPaymentConfirmation,
  broadcastAnnouncement,
  sendMemberStatement,
};
