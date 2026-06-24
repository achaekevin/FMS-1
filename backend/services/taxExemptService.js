/**
 * Tax-Exempt Contribution Statement PDF Generator
 * Produces an A4 PDF per member summarising their contributions
 * for a given period — suitable for KRA tax relief claims.
 */

'use strict';

const PDFDocument = require('pdfkit');
const path        = require('path');
const fs          = require('fs');
const archiver    = require('archiver');
const { formatDate, formatCurrency } = require('../utils/helpers');

const CHURCH = () => process.env.CHURCH_NAME    || 'Grace Life Church';
const REG    = () => process.env.CHURCH_REG_NO  || 'NGO/REG/2024/001';
const ADDR   = () => process.env.CHURCH_ADDRESS || 'Nairobi, Kenya';
const PIN    = () => process.env.CHURCH_KRA_PIN || 'P000000000A';

const DARK  = '#1c1c52';
const GOLD  = '#e9b828';
const BRAND = '#4f4fe8';
const GRAY  = '#6b7280';
const LGRAY = '#f3f4f6';
const GREEN = '#059669';

const fmt = (v) =>
  'KES ' + Number(v || 0).toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/* ─────────────────────────────────────────────────────────────────────────────
 * Generate a single member's Tax-Exempt Statement PDF
 *
 * @param {Object} member   - { id, fullName, phone, email, address }
 * @param {Array}  records  - Income rows [ { date, type, paymentMethod, amount, mpesaRef, description } ]
 * @param {Object} opts     - { period, year, quarter, startDate, endDate }
 * @param {Object} dest     - { res }  stream to HTTP  OR  { filePath }  write to disk
 * ─────────────────────────────────────────────────────────────────────────── */
const generateTaxStatement = (member, records, opts = {}, dest = {}) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: 'A4', margin: 45, info: {
        Title:    `Tax-Exempt Statement — ${member.fullName}`,
        Author:   CHURCH(),
        Subject:  'Annual Contribution Statement for Tax Relief',
        Creator:  `${CHURCH()} FMS`,
      }});

      // ── Pipe destination ──────────────────────────────────────────────────
      if (dest.res) {
        const filename = `tax-statement-${member.id}-${opts.year || 'period'}.pdf`;
        dest.res.setHeader('Content-Type', 'application/pdf');
        dest.res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        doc.pipe(dest.res);
      } else if (dest.filePath) {
        const dir = path.dirname(dest.filePath);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        doc.pipe(fs.createWriteStream(dest.filePath));
      }

      const W = doc.page.width;
      const M = 45;         // margin
      const TW = W - M * 2; // table width

      // ── Header band ───────────────────────────────────────────────────────
      doc.rect(0, 0, W, 90).fill(DARK);

      // Church name + reg
      doc.fill(GOLD).fontSize(18).font('Helvetica-Bold')
        .text(CHURCH(), M, 18);
      doc.fill('white').fontSize(9).font('Helvetica')
        .text('TAX-EXEMPT CONTRIBUTION STATEMENT', M, 42);
      doc.fill('#a5bafd').fontSize(8)
        .text(`Registration No: ${REG()}  ·  KRA PIN: ${PIN()}`, M, 56);
      doc.fill('#a5bafd').fontSize(8)
        .text(`Generated: ${new Date().toLocaleDateString('en-KE', { dateStyle: 'full' })}`,
          M, 70);

      // Gold accent bar
      doc.rect(0, 90, W, 4).fill(GOLD);
      doc.y = 108;

      // ── Document title ────────────────────────────────────────────────────
      doc.fill(DARK).fontSize(13).font('Helvetica-Bold')
        .text('ANNUAL CONTRIBUTION STATEMENT', { align: 'center' });
      doc.fill(GRAY).fontSize(9).font('Helvetica')
        .text(`For Tax Relief Claims under Income Tax Act — ${opts.period || opts.year || 'All Period'}`,
          { align: 'center' });
      doc.y += 14;

      // ── Two-column member info + period info ──────────────────────────────
      const infoY = doc.y;
      const colW  = (TW - 20) / 2;

      // Left: Member details
      doc.rect(M, infoY, colW, 80).fill('#f0f4ff').stroke(BRAND);
      doc.fill(BRAND).fontSize(8).font('Helvetica-Bold')
        .text('MEMBER DETAILS', M + 8, infoY + 8);
      const mLines = [
        ['Name',     member.fullName],
        ['Phone',    member.phone || '—'],
        ['Email',    member.email || '—'],
        ['Address',  member.address || ADDR()],
      ];
      mLines.forEach(([k, v], i) => {
        doc.fill(GRAY).font('Helvetica').fontSize(8)
          .text(`${k}:`, M + 8, infoY + 22 + i * 14, { width: 45 });
        doc.fill(DARK).font('Helvetica-Bold').fontSize(8)
          .text(v, M + 55, infoY + 22 + i * 14, { width: colW - 65 });
      });

      // Right: Statement period
      const rX = M + colW + 20;
      doc.rect(rX, infoY, colW, 80).fill('#fff7ed').stroke(GOLD);
      doc.fill(GOLD).fontSize(8).font('Helvetica-Bold')
        .text('STATEMENT PERIOD', rX + 8, infoY + 8);
      const pLines = [
        ['Period',    opts.period || 'Full Year'],
        ['Year',      String(opts.year || new Date().getFullYear())],
        ['From',      opts.startDate ? formatDate(opts.startDate) : '—'],
        ['To',        opts.endDate   ? formatDate(opts.endDate)   : '—'],
      ];
      pLines.forEach(([k, v], i) => {
        doc.fill(GRAY).font('Helvetica').fontSize(8)
          .text(`${k}:`, rX + 8, infoY + 22 + i * 14, { width: 45 });
        doc.fill(DARK).font('Helvetica-Bold').fontSize(8)
          .text(v, rX + 55, infoY + 22 + i * 14, { width: colW - 65 });
      });

      doc.y = infoY + 92;

      // ── Contributions table ───────────────────────────────────────────────
      doc.fill(DARK).fontSize(10).font('Helvetica-Bold').text('CONTRIBUTION DETAILS');
      doc.y += 4;

      const cols = [
        { label: 'No.',           width: 28,  align: 'right'  },
        { label: 'Date',          width: 85,  align: 'left'   },
        { label: 'Type',          width: 110, align: 'left'   },
        { label: 'Payment Method',width: 100, align: 'left'   },
        { label: 'Reference',     width: 90,  align: 'left'   },
        { label: 'Amount (KES)',  width: 92,  align: 'right'  },
      ];

      const drawColHeader = () => {
        doc.rect(M, doc.y, TW, 20).fill(DARK);
        let x = M + 4;
        cols.forEach(c => {
          doc.fill('white').fontSize(7.5).font('Helvetica-Bold')
            .text(c.label, x, doc.y - 14, { width: c.width - 4, align: c.align });
          x += c.width;
        });
        doc.y += 6;
      };

      drawColHeader();

      let grandTotal = 0;
      const byType = {};

      records.forEach((r, idx) => {
        const rowH = 16;
        if (doc.y + rowH > doc.page.height - 80) {
          doc.addPage();
          doc.y = 40;
          drawColHeader();
        }

        const rowY = doc.y;
        if (idx % 2 === 0) doc.rect(M, rowY, TW, rowH).fill(LGRAY);

        const cells = [
          String(idx + 1),
          formatDate(r.date),
          r.type,
          r.paymentMethod,
          r.mpesaRef || r.description?.slice(0, 14) || '—',
          parseFloat(r.amount || 0).toLocaleString('en-KE', { minimumFractionDigits: 2 }),
        ];

        let x = M + 4;
        cells.forEach((cell, ci) => {
          doc.fill(ci === 5 ? GREEN : '#374151')
            .font(ci === 5 ? 'Helvetica-Bold' : 'Helvetica')
            .fontSize(7.5)
            .text(cell, x, rowY + 4, { width: cols[ci].width - 4, align: cols[ci].align });
          x += cols[ci].width;
        });

        doc.y = rowY + rowH;
        grandTotal += parseFloat(r.amount || 0);
        byType[r.type] = (byType[r.type] || 0) + parseFloat(r.amount || 0);
      });

      // ── Totals row ────────────────────────────────────────────────────────
      doc.y += 2;
      doc.rect(M, doc.y, TW, 22).fill(DARK);
      doc.fill(GOLD).fontSize(9).font('Helvetica-Bold')
        .text('TOTAL CONTRIBUTIONS', M + 8, doc.y - 16, { width: TW - 100 });
      doc.fill(GOLD).fontSize(9).font('Helvetica-Bold')
        .text(fmt(grandTotal), M, doc.y - 16, { width: TW - 4, align: 'right' });
      doc.y += 8;

      // ── Breakdown by type ─────────────────────────────────────────────────
      if (Object.keys(byType).length > 0) {
        doc.y += 14;
        if (doc.y > doc.page.height - 130) { doc.addPage(); doc.y = 40; }

        doc.fill(DARK).fontSize(10).font('Helvetica-Bold').text('BREAKDOWN BY CONTRIBUTION TYPE');
        doc.y += 6;

        const bW = (TW - 10) / Math.min(Object.keys(byType).length, 4);
        let bX = M; let bY = doc.y; let col = 0;

        Object.entries(byType).forEach(([type, total]) => {
          if (col > 0 && col % 4 === 0) { bX = M; bY += 42; }
          doc.rect(bX, bY, bW - 6, 36).fill('#f0fdf4').stroke('#bbf7d0');
          doc.fill(GRAY).fontSize(7).font('Helvetica').text(type, bX + 6, bY + 6, { width: bW - 14 });
          doc.fill(GREEN).fontSize(11).font('Helvetica-Bold')
            .text(fmt(total), bX + 6, bY + 18, { width: bW - 14 });
          bX += bW; col++;
        });
        doc.y = bY + 50;
      }

      // ── Legal declaration ─────────────────────────────────────────────────
      if (doc.y > doc.page.height - 150) { doc.addPage(); doc.y = 40; }
      doc.y += 10;
      doc.rect(M, doc.y, TW, 70).fill('#fffbeb').stroke('#fde68a');
      const lY = doc.y;
      doc.fill('#92400e').fontSize(8.5).font('Helvetica-Bold')
        .text('OFFICIAL DECLARATION', M + 8, lY + 8);
      doc.fill('#78350f').fontSize(8).font('Helvetica')
        .text(
          `This is to certify that the above contributions were received by ${CHURCH()} ` +
          `(Registration No: ${REG()}, KRA PIN: ${PIN()}) in the period stated above. ` +
          `This statement is issued for tax relief purposes under the Income Tax Act (Cap 470) of Kenya. ` +
          `${CHURCH()} is a duly registered non-profit religious organisation.`,
          M + 8, lY + 22, { width: TW - 16 }
        );
      doc.y = lY + 72;

      // ── Signature line ────────────────────────────────────────────────────
      doc.y += 16;
      doc.rect(M, doc.y, 160, 1).fill(DARK);
      doc.rect(W - M - 160, doc.y, 160, 1).fill(DARK);
      const sigY = doc.y + 6;
      doc.fill(DARK).fontSize(8).font('Helvetica-Bold')
        .text('Authorised Signatory', M, sigY);
      doc.text('Date', W - M - 160, sigY, { width: 160, align: 'center' });
      doc.fill(GRAY).fontSize(7.5).font('Helvetica')
        .text(CHURCH(), M, sigY + 12)
        .text(new Date().toLocaleDateString('en-KE'), W - M - 160, sigY + 12, { width: 160, align: 'center' });

      // ── Footer ────────────────────────────────────────────────────────────
      const footY = doc.page.height - 35;
      doc.rect(0, footY - 4, W, 39).fill(DARK);
      doc.fill('#a5bafd').fontSize(7.5).font('Helvetica')
        .text(
          `${CHURCH()} · ${ADDR()} · Tel: ${process.env.CHURCH_PHONE || '+254 700 000 000'} · ${process.env.CHURCH_EMAIL || 'info@church.org'}`,
          0, footY + 2, { width: W, align: 'center' }
        );
      doc.fill(GOLD).fontSize(7)
        .text('This is a computer-generated document. No handwritten signature required.', 0, footY + 14, { width: W, align: 'center' });

      doc.on('end', () => resolve({ total: grandTotal, count: records.length }));
      doc.on('error', reject);
      doc.end();
    } catch (err) { reject(err); }
  });
};

/* ─────────────────────────────────────────────────────────────────────────────
 * Batch: generate statements for multiple members and zip them
 * ─────────────────────────────────────────────────────────────────────────── */
const generateBatchStatements = async (membersData, opts, zipPath) => {
  const tmpDir = path.join(path.dirname(zipPath), '_tmp_tax_' + Date.now());
  fs.mkdirSync(tmpDir, { recursive: true });

  const results = [];

  for (const { member, records } of membersData) {
    if (!records.length) continue;
    const filename = `tax-statement-${member.fullName.replace(/\s+/g, '-')}-${opts.year || 'period'}.pdf`;
    const filePath = path.join(tmpDir, filename);
    const res = await generateTaxStatement(member, records, opts, { filePath });
    results.push({ memberId: member.id, fullName: member.fullName, ...res, filename });
  }

  // Zip all PDFs
  await new Promise((resolve, reject) => {
    const output  = fs.createWriteStream(zipPath);
    const archive = archiver('zip', { zlib: { level: 6 } });
    output.on('close', resolve);
    archive.on('error', reject);
    archive.pipe(output);
    archive.directory(tmpDir, false);
    archive.finalize();
  });

  // Clean up tmp
  fs.rmSync(tmpDir, { recursive: true, force: true });
  return results;
};

module.exports = { generateTaxStatement, generateBatchStatements };
