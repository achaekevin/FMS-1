const nodemailer = require('nodemailer');
const logger = require('../utils/logger');

const getTransporter = () => {
  return nodemailer.createTransport({
    host:   process.env.SMTP_HOST   || 'smtp.gmail.com',
    port:   parseInt(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
};

const FROM = `"${process.env.CHURCH_NAME || 'Grace Life Church'}" <${process.env.SMTP_USER}>`;

/**
 * Send a plain email
 */
const send = async ({ to, subject, html, text }) => {
  try {
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      logger.warn('Email not configured — skipping send');
      return { skipped: true };
    }
    const transporter = getTransporter();
    const info = await transporter.sendMail({ from: FROM, to, subject, html, text });
    logger.info(`Email sent to ${to}: ${info.messageId}`);
    return info;
  } catch (err) {
    logger.error('emailService.send error:', err.message);
    throw err;
  }
};

/**
 * Send donation/receipt confirmation email
 */
const sendReceiptEmail = async (member, receipt) => {
  const html = `
    <div style="font-family:sans-serif;max-width:500px;margin:auto;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden">
      <div style="background:#1c1c52;padding:24px;text-align:center">
        <h2 style="color:#f5c842;margin:0">${process.env.CHURCH_NAME || 'Grace Life Church'}</h2>
        <p style="color:#a5bafd;margin:4px 0 0">Donation Receipt</p>
      </div>
      <div style="padding:24px">
        <p>Dear <strong>${member.fullName || member}</strong>,</p>
        <p>Thank you for your generous contribution. Your receipt details are below:</p>
        <table style="width:100%;border-collapse:collapse;margin:16px 0">
          <tr><td style="padding:8px;color:#6b7280;border-bottom:1px solid #f3f4f6">Receipt No.</td><td style="padding:8px;font-weight:600;border-bottom:1px solid #f3f4f6">${receipt.receiptNumber}</td></tr>
          <tr><td style="padding:8px;color:#6b7280;border-bottom:1px solid #f3f4f6">Amount</td><td style="padding:8px;font-weight:600;color:#059669;border-bottom:1px solid #f3f4f6">KES ${Number(receipt.amount).toLocaleString()}</td></tr>
          <tr><td style="padding:8px;color:#6b7280;border-bottom:1px solid #f3f4f6">Category</td><td style="padding:8px;border-bottom:1px solid #f3f4f6">${receipt.category || '—'}</td></tr>
          <tr><td style="padding:8px;color:#6b7280;border-bottom:1px solid #f3f4f6">Payment Method</td><td style="padding:8px;border-bottom:1px solid #f3f4f6">${receipt.paymentMethod || '—'}</td></tr>
          <tr><td style="padding:8px;color:#6b7280">Date</td><td style="padding:8px">${new Date(receipt.date).toLocaleDateString('en-KE',{dateStyle:'long'})}</td></tr>
        </table>
        <p style="color:#6b7280;font-size:13px">God bless you for your faithfulness.</p>
      </div>
      <div style="background:#f9fafb;padding:16px;text-align:center;font-size:12px;color:#9ca3af">
        ${process.env.CHURCH_NAME || 'Grace Life Church'} · Nairobi, Kenya
      </div>
    </div>`;
  return send({ to: member.email, subject: `Donation Receipt — ${receipt.receiptNumber}`, html });
};

/**
 * Send password reset email
 */
const sendPasswordResetEmail = async (user, resetToken) => {
  const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${resetToken}`;
  const html = `
    <div style="font-family:sans-serif;max-width:480px;margin:auto">
      <h2 style="color:#1c1c52">Password Reset Request</h2>
      <p>Hi ${user.name},</p>
      <p>We received a request to reset your password. Click the button below to proceed:</p>
      <a href="${resetUrl}" style="display:inline-block;margin:16px 0;padding:12px 24px;background:#4f4fe8;color:white;border-radius:8px;text-decoration:none;font-weight:600">Reset Password</a>
      <p style="color:#6b7280;font-size:13px">This link expires in 1 hour. If you did not request this, please ignore this email.</p>
    </div>`;
  return send({ to: user.email, subject: 'Password Reset — Grace Life Church FMS', html });
};

/**
 * Send payment confirmation (M-Pesa)
 */
const sendPaymentConfirmation = async (member, transaction) => {
  const html = `
    <div style="font-family:sans-serif;max-width:480px;margin:auto">
      <h2 style="color:#1c1c52">Payment Confirmation</h2>
      <p>Hi ${member.fullName || member},</p>
      <p>Your M-Pesa payment has been received successfully:</p>
      <ul>
        <li><strong>Amount:</strong> KES ${Number(transaction.amount).toLocaleString()}</li>
        <li><strong>M-Pesa Ref:</strong> ${transaction.mpesaReceiptNumber || transaction.reference || '—'}</li>
        <li><strong>Date:</strong> ${new Date().toLocaleDateString('en-KE',{dateStyle:'long'})}</li>
      </ul>
      <p style="color:#6b7280;font-size:13px">Thank you. God bless you!</p>
    </div>`;
  return send({ to: member.email, subject: 'M-Pesa Payment Confirmed', html });
};

module.exports = { send, sendReceiptEmail, sendPasswordResetEmail, sendPaymentConfirmation };
