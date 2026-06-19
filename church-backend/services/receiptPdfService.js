const PDFDocument = require('pdfkit');
const path = require('path');
const fs   = require('fs');
const { formatDate } = require('../utils/helpers');

const CHURCH = () => process.env.CHURCH_NAME || 'Grace Life Church';
const BRAND  = '#4f4fe8';
const GOLD   = '#e9b828';
const DARK   = '#1c1c52';
const GRAY   = '#6b7280';

const fmt = (v) =>
  'KES ' + Number(v || 0).toLocaleString('en-KE', { minimumFractionDigits: 0 });

/* ─────────────────────────────────────────────────────────
 * Receipt PDF
 * ───────────────────────────────────────────────────────── */
const generateReceiptPDF = (receipt, res = null, filePath = null) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: 'A5', margin: 40 });

      if (res) {
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition',
          `attachment; filename="receipt-${receipt.receiptNumber}.pdf"`);
        doc.pipe(res);
      } else if (filePath) {
        const dir = path.dirname(filePath);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        doc.pipe(fs.createWriteStream(filePath));
      }

      // Header band
      doc.rect(0, 0, doc.page.width, 60).fill(DARK);
      doc.fill(GOLD).fontSize(15).font('Helvetica-Bold').text(CHURCH(), 40, 14);
      doc.fill('white').fontSize(9).font('Helvetica').text('OFFICIAL RECEIPT', 40, 34);
      doc.fill('#a5bafd').fontSize(8)
        .text(`Receipt No: ${receipt.receiptNumber}`, 40, 34,
          { width: doc.page.width - 80, align: 'right' });
      doc.rect(0, 60, doc.page.width, 3).fill(GOLD);

      doc.y = 80;
      doc.fill(DARK).fontSize(13).font('Helvetica-Bold')
        .text('PAYMENT RECEIPT', { align: 'center' });
      doc.y += 8;

      const fields = [
        ['Receipt Number',  receipt.receiptNumber],
        ['Member Name',     receipt.memberName  || '—'],
        ['Amount',          fmt(receipt.amount)],
        ['Payment Method',  receipt.paymentMethod || '—'],
        ['Fund',            receipt.fundName    || '—'],
        ['Category',        receipt.category    || '—'],
        ['Date',            formatDate(receipt.date)],
        ['Description',     receipt.description || '—'],
      ];

      fields.forEach(([label, val], i) => {
        const y = doc.y;
        if (i % 2 === 0) doc.rect(40, y, doc.page.width - 80, 20).fill('#f9fafb');
        doc.fill(GRAY).fontSize(8).font('Helvetica')
          .text(label, 46, y + 6, { width: 120 });
        doc.fill(DARK).font('Helvetica-Bold')
          .text(String(val), 170, y + 6, { width: doc.page.width - 215 });
        doc.y += 20;
      });

      doc.y += 16;
      doc.rect(40, doc.y, doc.page.width - 80, 1).fill('#e5e7eb');
      doc.y += 8;
      doc.fill(GRAY).fontSize(8).font('Helvetica')
        .text('This is a computer-generated receipt. No signature required.',
          { align: 'center' });
      doc.text(`${CHURCH()} · Nairobi, Kenya`, { align: 'center' });

      doc.on('end', resolve);
      doc.on('error', reject);
      doc.end();
    } catch (err) { reject(err); }
  });
};

/* ─────────────────────────────────────────────────────────
 * Payslip PDF
 * ───────────────────────────────────────────────────────── */
const generatePayslipPDF = (slip, employee, res = null, filePath = null) => {
  return new Promise((resolve, reject) => {
    try {
      const empName = employee?.name || 'Employee';
      const doc = new PDFDocument({ size: 'A5', margin: 40 });

      if (res) {
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition',
          `attachment; filename="payslip-${empName.replace(/\s+/g, '-')}-${slip.month}-${slip.year}.pdf"`);
        doc.pipe(res);
      } else if (filePath) {
        const dir = path.dirname(filePath);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        doc.pipe(fs.createWriteStream(filePath));
      }

      // Header
      doc.rect(0, 0, doc.page.width, 60).fill(DARK);
      doc.fill(GOLD).fontSize(15).font('Helvetica-Bold').text(CHURCH(), 40, 14);
      doc.fill('white').fontSize(9).font('Helvetica').text('PAYSLIP', 40, 34);
      doc.fill('#a5bafd').fontSize(8)
        .text(`${slip.month} ${slip.year}`, 40, 34,
          { width: doc.page.width - 80, align: 'right' });
      doc.rect(0, 60, doc.page.width, 3).fill(GOLD);

      doc.y = 80;
      doc.fill(DARK).fontSize(11).font('Helvetica-Bold')
        .text('SALARY STATEMENT', { align: 'center' });
      doc.y += 10;

      doc.fill(GRAY).fontSize(8).font('Helvetica');
      doc.text(`Employee:   ${empName}`, 40);
      doc.text(`Role:       ${employee?.role || '—'}  |  Department: ${employee?.department || '—'}`, 40);
      doc.text(`Period:     ${slip.month} ${slip.year}`, 40);
      doc.y += 10;

      // Table header
      doc.rect(40, doc.y, doc.page.width - 80, 18).fill(BRAND);
      doc.fill('white').fontSize(8).font('Helvetica-Bold')
        .text('DESCRIPTION', 46, doc.y + 5, { width: 140 });
      doc.fill('white').fontSize(8).font('Helvetica-Bold')
        .text('AMOUNT (KES)', 40, doc.y + 5,
          { width: doc.page.width - 85, align: 'right' });
      doc.y += 18;

      const rows = [
        ['Basic Salary', parseFloat(slip.basicSalary  || 0), false],
        ['Allowances',   parseFloat(slip.allowances   || 0), false],
        ['Deductions',   parseFloat(slip.deductions   || 0), true ],
      ];

      rows.forEach(([label, val, isDeduction], i) => {
        const y = doc.y;
        if (i % 2 === 0) doc.rect(40, y, doc.page.width - 80, 18).fill('#f9fafb');
        doc.fill(GRAY).fontSize(8).font('Helvetica').text(label, 46, y + 5, { width: 140 });
        doc.fill(isDeduction ? '#dc2626' : DARK).font('Helvetica-Bold')
          .text((isDeduction ? '- ' : '') + fmt(val), 40, y + 5,
            { width: doc.page.width - 85, align: 'right' });
        doc.y += 18;
      });

      // Net salary bar
      doc.rect(40, doc.y, doc.page.width - 80, 22).fill(DARK);
      doc.fill(GOLD).fontSize(9).font('Helvetica-Bold')
        .text('NET SALARY', 46, doc.y + 6, { width: 140 });
      doc.fill(GOLD).fontSize(9).font('Helvetica-Bold')
        .text(fmt(slip.netSalary), 40, doc.y + 6,
          { width: doc.page.width - 85, align: 'right' });
      doc.y += 30;

      if (slip.notes) {
        doc.fill(GRAY).fontSize(7).font('Helvetica').text(`Notes: ${slip.notes}`, 40);
      }

      doc.y += 20;
      doc.fill(GRAY).fontSize(7).font('Helvetica')
        .text('Computer-generated payslip. No signature required.',
          { align: 'center' });

      doc.on('end', resolve);
      doc.on('error', reject);
      doc.end();
    } catch (err) { reject(err); }
  });
};

module.exports = { generateReceiptPDF, generatePayslipPDF };
