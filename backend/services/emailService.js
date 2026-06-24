const nodemailer = require('nodemailer');
const logger = require('../utils/logger');

/**
 * Build transporter — tries the configured port first,
 * with a 10-second connection timeout so it fails fast instead of hanging.
 */
const getTransporter = () => {
  const port   = parseInt(process.env.SMTP_PORT) || 587;
  const secure = port === 465 || process.env.SMTP_SECURE === 'true';

  return nodemailer.createTransport({
    host:   process.env.SMTP_HOST || 'smtp.gmail.com',
    port,
    secure,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    // Fail fast — don't wait 2 minutes for a blocked port
    connectionTimeout: 10000,   // 10 seconds
    greetingTimeout:   8000,
    socketTimeout:     10000,
    tls: {
      rejectUnauthorized: false,   // avoids cert issues on some networks
    },
  });
};

const FROM = `"${process.env.CHURCH_NAME || 'Grace Life Church'}" <${process.env.SMTP_USER}>`;

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

const sendAnnouncementEmail = async (recipient, announcement) => {
  const priorityColor = { High: '#dc2626', Medium: '#d97706', Low: '#059669' };
  const color = priorityColor[announcement.priority] || '#4f4fe8';
  const html = `
    <div style="font-family:sans-serif;max-width:560px;margin:auto;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden">
      <div style="background:#1c1c52;padding:24px;text-align:center">
        <h2 style="color:#f5c842;margin:0">${process.env.CHURCH_NAME || 'Grace Life Church'}</h2>
        <p style="color:#a5bafd;margin:4px 0 0">Announcement</p>
      </div>
      <div style="padding:24px">
        <span style="display:inline-block;padding:3px 10px;border-radius:999px;font-size:12px;font-weight:600;background:${color}22;color:${color};margin-bottom:12px">${announcement.priority || 'General'}</span>
        <h3 style="color:#1c1c52;margin:0 0 12px">${announcement.title}</h3>
        <p style="color:#374151;line-height:1.6">${announcement.content}</p>
        ${announcement.expiryDate ? `<p style="color:#9ca3af;font-size:12px;margin-top:16px">Valid until: ${new Date(announcement.expiryDate).toLocaleDateString('en-KE',{dateStyle:'long'})}</p>` : ''}
      </div>
      <div style="background:#f9fafb;padding:16px;text-align:center;font-size:12px;color:#9ca3af">
        ${process.env.CHURCH_NAME || 'Grace Life Church'} · Nairobi, Kenya
      </div>
    </div>`;
  return send({ to: recipient.email, subject: `📢 ${announcement.title}`, html });
};

const sendStatementEmail = async (member, statement) => {
  const rows = (statement.items || []).map((item, i) => `
    <tr style="background:${i % 2 === 0 ? '#f9fafb' : '#fff'}">
      <td style="padding:8px;color:#374151;border-bottom:1px solid #f3f4f6">${new Date(item.date).toLocaleDateString('en-KE')}</td>
      <td style="padding:8px;color:#374151;border-bottom:1px solid #f3f4f6">${item.type || item.category || '—'}</td>
      <td style="padding:8px;color:#374151;border-bottom:1px solid #f3f4f6">${item.paymentMethod || '—'}</td>
      <td style="padding:8px;font-weight:600;color:#059669;border-bottom:1px solid #f3f4f6;text-align:right">KES ${Number(item.amount).toLocaleString()}</td>
    </tr>`).join('');

  const html = `
    <div style="font-family:sans-serif;max-width:620px;margin:auto;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden">
      <div style="background:#1c1c52;padding:24px;text-align:center">
        <h2 style="color:#f5c842;margin:0">${process.env.CHURCH_NAME || 'Grace Life Church'}</h2>
        <p style="color:#a5bafd;margin:4px 0 0">Giving Statement · ${statement.period}</p>
      </div>
      <div style="padding:24px">
        <p>Dear <strong>${member.fullName}</strong>,</p>
        <p>Here is your giving statement for <strong>${statement.period}</strong>:</p>
        <div style="display:flex;gap:16px;margin:20px 0;flex-wrap:wrap">
          <div style="flex:1;min-width:140px;background:#f0fdf4;border-radius:8px;padding:16px;text-align:center">
            <div style="font-size:22px;font-weight:700;color:#059669">KES ${Number(statement.totalDonations).toLocaleString()}</div>
            <div style="color:#6b7280;font-size:12px;margin-top:4px">Total Giving</div>
          </div>
          <div style="flex:1;min-width:140px;background:#eff6ff;border-radius:8px;padding:16px;text-align:center">
            <div style="font-size:22px;font-weight:700;color:#3b82f6">${statement.donationCount || 0}</div>
            <div style="color:#6b7280;font-size:12px;margin-top:4px">Transactions</div>
          </div>
        </div>
        ${rows ? `
        <table style="width:100%;border-collapse:collapse;margin-top:8px">
          <thead>
            <tr style="background:#1c1c52">
              <th style="padding:10px 8px;color:white;text-align:left;font-size:12px">Date</th>
              <th style="padding:10px 8px;color:white;text-align:left;font-size:12px">Category</th>
              <th style="padding:10px 8px;color:white;text-align:left;font-size:12px">Method</th>
              <th style="padding:10px 8px;color:white;text-align:right;font-size:12px">Amount</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>` : '<p style="color:#9ca3af;text-align:center">No transactions in this period.</p>'}
        <p style="color:#6b7280;font-size:13px;margin-top:20px">Thank you for your faithful giving. God bless you!</p>
      </div>
      <div style="background:#f9fafb;padding:16px;text-align:center;font-size:12px;color:#9ca3af">
        ${process.env.CHURCH_NAME || 'Grace Life Church'} · Nairobi, Kenya
      </div>
    </div>`;
  return send({ to: member.email, subject: `Your Giving Statement — ${statement.period}`, html });
};

const sendPrayerAnsweredEmail = async (request) => {  const church = process.env.CHURCH_NAME || 'Grace Life Church';
  const html = `
    <div style="font-family:sans-serif;max-width:520px;margin:auto;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden">
      <div style="background:#1c1c52;padding:24px;text-align:center">
        <h2 style="color:#f5c842;margin:0">${church}</h2>
        <p style="color:#a5bafd;margin:4px 0 0">Prayer Request Update</p>
      </div>
      <div style="padding:24px">
        <div style="text-align:center;margin-bottom:20px">
          <span style="font-size:48px">🙏</span>
          <h3 style="color:#059669;margin:8px 0">Your Prayer Has Been Answered!</h3>
        </div>
        <p>Dear <strong>${request.requesterName}</strong>,</p>
        <p>We are delighted to share that your prayer request has been marked as <strong style="color:#059669">Answered</strong>.</p>
        <div style="background:#f0fdf4;border-left:4px solid #059669;padding:14px 16px;border-radius:6px;margin:16px 0">
          <div style="font-weight:600;color:#374151;margin-bottom:4px">${request.title}</div>
          <div style="color:#6b7280;font-size:13px">${request.description}</div>
        </div>
        ${request.pastorNote ? `
        <div style="background:#eff6ff;border-left:4px solid #3b82f6;padding:14px 16px;border-radius:6px;margin:16px 0">
          <div style="font-size:12px;font-weight:600;color:#3b82f6;margin-bottom:4px">Message from your Pastor</div>
          <div style="color:#374151;font-size:13px">${request.pastorNote}</div>
        </div>` : ''}
        <p style="color:#6b7280;font-size:13px;line-height:1.6">
          We give thanks to God for His faithfulness. The church has been praying alongside you and we celebrate this answered prayer with you.
        </p>
        <p style="color:#6b7280;font-size:13px">God bless you! 🌟</p>
      </div>
      <div style="background:#f9fafb;padding:16px;text-align:center;font-size:12px;color:#9ca3af">
        ${church} · Nairobi, Kenya
      </div>
    </div>`;
  return send({
    to: request.email,
    subject: `🙏 Your Prayer Has Been Answered — ${church}`,
    html,
  });
};

module.exports = { send, sendReceiptEmail, sendPasswordResetEmail, sendPaymentConfirmation, sendAnnouncementEmail, sendStatementEmail, sendPrayerAnsweredEmail, sendMemberWelcomeEmail, sendNewMemberAlertEmail };

// ── Member registration emails ────────────────────────────

function sendMemberWelcomeEmail(member) {
  // Only send if member has an email
  if (!member.email) return Promise.resolve({ skipped: true });
  const church = process.env.CHURCH_NAME || 'Grace Life Church';
  const html = `
    <div style="font-family:sans-serif;max-width:520px;margin:auto;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden">
      <div style="background:#1c1c52;padding:28px;text-align:center">
        <h2 style="color:#f5c842;margin:0;font-size:22px">${church}</h2>
        <p style="color:#a5bafd;margin:6px 0 0;font-size:13px">Member Registration</p>
      </div>
      <div style="padding:28px">
        <div style="text-align:center;margin-bottom:24px">
          <span style="font-size:52px">🎉</span>
          <h3 style="color:#1c1c52;margin:12px 0 4px">Welcome, ${member.fullName}!</h3>
          <p style="color:#6b7280;font-size:14px;margin:0">You have successfully registered as a member of ${church}.</p>
        </div>
        <div style="background:#f0f4ff;border-radius:10px;padding:18px;margin-bottom:20px">
          <p style="font-weight:700;color:#1c1c52;margin:0 0 12px;font-size:14px">Your Details</p>
          <table style="width:100%;font-size:13px">
            <tr><td style="color:#6b7280;padding:4px 0">Name</td><td style="color:#374151;font-weight:600;text-align:right">${member.fullName}</td></tr>
            <tr><td style="color:#6b7280;padding:4px 0">Phone</td><td style="color:#374151;font-weight:600;text-align:right">${member.phone}</td></tr>
            ${member.email ? `<tr><td style="color:#6b7280;padding:4px 0">Email</td><td style="color:#374151;font-weight:600;text-align:right">${member.email}</td></tr>` : ''}
            <tr><td style="color:#6b7280;padding:4px 0">Joined</td><td style="color:#374151;font-weight:600;text-align:right">${new Date().toLocaleDateString('en-KE',{dateStyle:'long'})}</td></tr>
          </table>
        </div>
        <p style="color:#6b7280;font-size:13px;line-height:1.7;text-align:center">
          We are glad to have you with us. Come and worship with us every Sunday and be part of our growing family.
        </p>
        <p style="color:#6b7280;font-size:13px;text-align:center;margin-top:8px">God bless you! 🙏</p>
      </div>
      <div style="background:#f9fafb;padding:14px;text-align:center;font-size:11px;color:#9ca3af">
        ${church} · ${process.env.CHURCH_ADDRESS || 'Kenya'} · ${process.env.CHURCH_PHONE || ''}
      </div>
    </div>`;
  return send({ to: member.email, subject: `Welcome to ${church}! 🎉`, html });
}

function sendNewMemberAlertEmail(adminEmail, member) {
  if (!adminEmail) return Promise.resolve({ skipped: true });
  const church   = process.env.CHURCH_NAME || 'Grace Life Church';
  const adminUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/members`;
  const html = `
    <div style="font-family:sans-serif;max-width:500px;margin:auto;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden">
      <div style="background:#1c1c52;padding:24px">
        <h2 style="color:#f5c842;margin:0;font-size:18px">${church}</h2>
        <p style="color:#a5bafd;margin:4px 0 0;font-size:12px">New Member Registration Alert</p>
      </div>
      <div style="padding:24px">
        <p style="color:#374151;font-size:14px">A new member has self-registered and is <strong style="color:#d97706">awaiting approval</strong>:</p>
        <div style="background:#fffbeb;border:1px solid #fde68a;border-radius:8px;padding:16px;margin:16px 0">
          <table style="width:100%;font-size:13px">
            <tr><td style="color:#92400e;padding:3px 0;width:80px">Name</td><td style="color:#374151;font-weight:700">${member.fullName}</td></tr>
            <tr><td style="color:#92400e;padding:3px 0">Phone</td><td style="color:#374151;font-weight:700">${member.phone}</td></tr>
            ${member.email ? `<tr><td style="color:#92400e;padding:3px 0">Email</td><td style="color:#374151">${member.email}</td></tr>` : ''}
            ${member.gender ? `<tr><td style="color:#92400e;padding:3px 0">Gender</td><td style="color:#374151;text-transform:capitalize">${member.gender}</td></tr>` : ''}
            <tr><td style="color:#92400e;padding:3px 0">Registered</td><td style="color:#374151">${new Date().toLocaleString('en-KE')}</td></tr>
          </table>
        </div>
        <a href="${adminUrl}?status=pending" style="display:inline-block;background:#4f4fe8;color:white;padding:11px 22px;border-radius:8px;text-decoration:none;font-weight:600;font-size:13px">
          Review in Admin Panel →
        </a>
      </div>
      <div style="background:#f9fafb;padding:12px;text-align:center;font-size:11px;color:#9ca3af">${church}</div>
    </div>`;
  return send({ to: adminEmail, subject: `🆕 New Member Registration — ${member.fullName}`, html });
}
