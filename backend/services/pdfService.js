const PDFDocument = require('pdfkit');
const { formatCurrency, formatDate } = require('../utils/helpers');

const BRAND  = '#4f4fe8';
const GOLD   = '#e9b828';
const DARK   = '#1c1c52';
const GRAY   = '#6b7280';
const LGRAY  = '#f3f4f6';

/**
 * Draw page header
 */
const drawHeader = (doc, title, subtitle) => {
  const churchName = process.env.CHURCH_NAME || 'Grace Life Church';
  doc.rect(0, 0, doc.page.width, 80).fill(DARK);
  doc.fill(GOLD).fontSize(18).font('Helvetica-Bold').text(churchName, 50, 18);
  doc.fill('white').fontSize(11).font('Helvetica').text(title, 50, 42);
  if (subtitle) doc.fill('#a5bafd').fontSize(9).text(subtitle, 50, 58);
  doc.fill(GRAY).fontSize(8).text(`Generated: ${new Date().toLocaleDateString('en-KE', { dateStyle: 'full' })}`, doc.page.width - 200, 58, { width: 150, align: 'right' });
  doc.y = 100;
};

/**
 * Draw table header row
 */
const drawTableHeader = (doc, columns) => {
  const tableLeft = 40;
  const rowHeight = 20;
  doc.rect(tableLeft, doc.y, doc.page.width - 80, rowHeight).fill(BRAND);
  let x = tableLeft + 5;
  doc.fill('white').fontSize(8).font('Helvetica-Bold');
  columns.forEach(col => {
    doc.text(col.label, x, doc.y - rowHeight + 6, { width: col.width - 4, align: col.align || 'left' });
    x += col.width;
  });
  doc.y += 5;
};

/**
 * Draw table row
 */
const drawTableRow = (doc, columns, row, index) => {
  const tableLeft = 40;
  const rowHeight = 18;
  if (index % 2 === 0) doc.rect(tableLeft, doc.y, doc.page.width - 80, rowHeight).fill(LGRAY);
  let x = tableLeft + 5;
  doc.fill('#374151').fontSize(8).font('Helvetica');
  columns.forEach((col, i) => {
    doc.text(String(row[i] ?? ''), x, doc.y + 5, { width: col.width - 4, align: col.align || 'left' });
    x += col.width;
  });
  doc.y += rowHeight;
};

/**
 * Draw summary box
 */
const drawSummary = (doc, items) => {
  doc.y += 15;
  const boxY = doc.y;
  doc.rect(40, boxY, 200, 20 + items.length * 16).fill('#f0f4ff').stroke(BRAND);
  doc.fill(DARK).fontSize(9).font('Helvetica-Bold').text('SUMMARY', 50, boxY + 6);
  items.forEach((item, i) => {
    doc.fill(GRAY).font('Helvetica').text(item.label + ':', 50, boxY + 22 + i * 16, { width: 100 });
    doc.fill(DARK).font('Helvetica-Bold').text(item.value, 155, boxY + 22 + i * 16);
  });
};

// ── Report generators ─────────────────────────────────────

const generateIncomeReport = (res, records, filters = {}) => {
  const doc = new PDFDocument({ margin: 40, size: 'A4', layout: 'landscape' });
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', 'attachment; filename="income-report.pdf"');
  doc.pipe(res);

  drawHeader(doc, 'Income Report', buildFilterLabel(filters));

  const columns = [
    { label: 'Date',           width: 70 },
    { label: 'Member',         width: 130 },
    { label: 'Type',           width: 90 },
    { label: 'Payment',        width: 80 },
    { label: 'Fund',           width: 100 },
    { label: 'Amount (KES)',   width: 90, align: 'right' },
    { label: 'Description',    width: 150 },
  ];

  doc.y += 10;
  drawTableHeader(doc, columns);

  let total = 0;
  records.forEach((r, i) => {
    if (doc.y > doc.page.height - 60) { doc.addPage(); drawTableHeader(doc, columns); }
    total += parseFloat(r.amount || 0);
    drawTableRow(doc, columns, [
      formatDate(r.date),
      r.member?.fullName || 'Anonymous',
      r.type,
      r.paymentMethod,
      r.fund?.fundName || '—',
      parseFloat(r.amount).toLocaleString(),
      r.description || '—',
    ], i);
  });

  drawSummary(doc, [
    { label: 'Total Records', value: String(records.length) },
    { label: 'Total Amount',  value: `KES ${total.toLocaleString()}` },
  ]);

  doc.end();
};

const generateExpenseReport = (res, records, filters = {}) => {
  const doc = new PDFDocument({ margin: 40, size: 'A4', layout: 'landscape' });
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', 'attachment; filename="expense-report.pdf"');
  doc.pipe(res);

  drawHeader(doc, 'Expense Report', buildFilterLabel(filters));

  const columns = [
    { label: 'Date',          width: 80 },
    { label: 'Category',      width: 100 },
    { label: 'Amount (KES)',  width: 100, align: 'right' },
    { label: 'Fund',          width: 110 },
    { label: 'Approved By',   width: 130 },
    { label: 'Description',   width: 190 },
  ];

  doc.y += 10;
  drawTableHeader(doc, columns);

  let total = 0;
  records.forEach((r, i) => {
    if (doc.y > doc.page.height - 60) { doc.addPage(); drawTableHeader(doc, columns); }
    total += parseFloat(r.amount || 0);
    drawTableRow(doc, columns, [
      formatDate(r.date), r.category,
      parseFloat(r.amount).toLocaleString(),
      r.fund?.fundName || '—', r.approvedBy, r.description || '—',
    ], i);
  });

  drawSummary(doc, [
    { label: 'Total Records', value: String(records.length) },
    { label: 'Total Spent',   value: `KES ${total.toLocaleString()}` },
  ]);

  doc.end();
};

const generateMemberStatement = (res, member, records) => {
  const doc = new PDFDocument({ margin: 40, size: 'A4' });
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="statement-${member.id}.pdf"`);
  doc.pipe(res);

  drawHeader(doc, 'Member Contribution Statement', `Member: ${member.fullName}`);

  doc.y += 10;
  doc.fill(GRAY).fontSize(9).font('Helvetica');
  doc.text(`Name: ${member.fullName}`, 40, doc.y);
  doc.text(`Phone: ${member.phone}`, 40);
  doc.text(`Email: ${member.email || 'N/A'}`, 40);
  doc.text(`Join Date: ${formatDate(member.joinDate)}`, 40);
  doc.y += 15;

  const columns = [
    { label: 'Date',         width: 90 },
    { label: 'Type',         width: 110 },
    { label: 'Payment',      width: 90 },
    { label: 'Amount (KES)', width: 100, align: 'right' },
    { label: 'Description',  width: 140 },
  ];
  drawTableHeader(doc, columns);

  let total = 0;
  records.forEach((r, i) => {
    if (doc.y > doc.page.height - 60) { doc.addPage(); drawTableHeader(doc, columns); }
    total += parseFloat(r.amount || 0);
    drawTableRow(doc, columns, [
      formatDate(r.date), r.type, r.paymentMethod,
      parseFloat(r.amount).toLocaleString(), r.description || '—',
    ], i);
  });

  drawSummary(doc, [
    { label: 'Contributions', value: String(records.length) },
    { label: 'Total Given',   value: `KES ${total.toLocaleString()}` },
  ]);

  doc.end();
};

const buildFilterLabel = (f) => {
  if (f.startDate && f.endDate) return `Period: ${formatDate(f.startDate)} – ${formatDate(f.endDate)}`;
  if (f.month && f.year) return `Month: ${new Date(f.year, f.month - 1).toLocaleString('en-KE', { month: 'long', year: 'numeric' })}`;
  if (f.year) return `Year: ${f.year}`;
  return 'All Records';
};

module.exports = { generateIncomeReport, generateExpenseReport, generateMemberStatement };
