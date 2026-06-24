const ExcelJS = require('exceljs');
const { formatDate } = require('../utils/helpers');

const BRAND_COLOR  = '4F4FE8';
const HEADER_FONT  = { bold: true, color: { argb: 'FFFFFFFF' }, size: 10 };
const HEADER_FILL  = { type: 'pattern', pattern: 'solid', fgColor: { argb: BRAND_COLOR } };
const BORDER = {
  top:    { style: 'thin', color: { argb: 'FFE5E7EB' } },
  left:   { style: 'thin', color: { argb: 'FFE5E7EB' } },
  bottom: { style: 'thin', color: { argb: 'FFE5E7EB' } },
  right:  { style: 'thin', color: { argb: 'FFE5E7EB' } },
};

const styleHeaderRow = (row) => {
  row.eachCell(cell => {
    cell.font = HEADER_FONT;
    cell.fill = HEADER_FILL;
    cell.border = BORDER;
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
  });
  row.height = 22;
};

const styleDataRow = (row, isEven) => {
  row.eachCell(cell => {
    cell.border = BORDER;
    cell.alignment = { vertical: 'middle' };
    if (isEven) cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF9FAFB' } };
  });
  row.height = 18;
};

const addChurchHeader = (sheet, title, cols) => {
  const churchName = process.env.CHURCH_NAME || 'Grace Life Church';
  sheet.mergeCells(1, 1, 1, cols);
  const titleCell = sheet.getCell('A1');
  titleCell.value = churchName + ' – ' + title;
  titleCell.font  = { bold: true, size: 13, color: { argb: '1C1C52' } };
  titleCell.fill  = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE0EAFF' } };
  titleCell.alignment = { horizontal: 'center' };
  sheet.getRow(1).height = 28;

  sheet.mergeCells(2, 1, 2, cols);
  const subCell = sheet.getCell('A2');
  subCell.value = `Generated: ${new Date().toLocaleDateString('en-KE', { dateStyle: 'full' })}`;
  subCell.font  = { size: 9, color: { argb: 'FF6B7280' } };
  subCell.alignment = { horizontal: 'center' };
};

// ── Income Report ─────────────────────────────────────────
const generateIncomeExcel = async (res, records) => {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'Church Finance System';

  const ws = wb.addWorksheet('Income Report', { views: [{ state: 'frozen', ySplit: 4 }] });
  ws.columns = [
    { header: 'Date',           key: 'date',    width: 14 },
    { header: 'Member',         key: 'member',  width: 24 },
    { header: 'Type',           key: 'type',    width: 18 },
    { header: 'Payment Method', key: 'payment', width: 18 },
    { header: 'Fund',           key: 'fund',    width: 18 },
    { header: 'Amount (KES)',   key: 'amount',  width: 16 },
    { header: 'M-Pesa Ref',     key: 'mpesaRef',width: 16 },
    { header: 'Description',    key: 'desc',    width: 30 },
  ];

  addChurchHeader(ws, 'Income Report', 8);

  const headerRow = ws.getRow(3);
  ws.columns.forEach((col, i) => { headerRow.getCell(i + 1).value = col.header; });
  styleHeaderRow(headerRow);

  let total = 0;
  records.forEach((r, i) => {
    const amount = parseFloat(r.amount || 0);
    total += amount;
    const row = ws.addRow({
      date:     formatDate(r.date),
      member:   r.member?.fullName || 'Anonymous',
      type:     r.type,
      payment:  r.paymentMethod,
      fund:     r.fund?.fundName || '—',
      amount,
      mpesaRef: r.mpesaRef || '—',
      desc:     r.description || '—',
    });
    styleDataRow(row, i % 2 === 0);
    row.getCell(6).numFmt = '#,##0.00';
  });

  // Total row
  const totalRow = ws.addRow(['', '', '', '', 'TOTAL', total, '', '']);
  totalRow.eachCell(cell => {
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '1C1C52' } };
  });
  totalRow.getCell(6).numFmt = '#,##0.00';

  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', 'attachment; filename="income-report.xlsx"');
  await wb.xlsx.write(res);
};

// ── Expense Report ────────────────────────────────────────
const generateExpenseExcel = async (res, records) => {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet('Expense Report', { views: [{ state: 'frozen', ySplit: 4 }] });
  ws.columns = [
    { header: 'Date',         key: 'date',     width: 14 },
    { header: 'Category',     key: 'category', width: 18 },
    { header: 'Amount (KES)', key: 'amount',   width: 16 },
    { header: 'Fund',         key: 'fund',     width: 18 },
    { header: 'Approved By',  key: 'approved', width: 22 },
    { header: 'Status',       key: 'status',   width: 12 },
    { header: 'Description',  key: 'desc',     width: 35 },
  ];

  addChurchHeader(ws, 'Expense Report', 7);
  const headerRow = ws.getRow(3);
  ws.columns.forEach((col, i) => { headerRow.getCell(i + 1).value = col.header; });
  styleHeaderRow(headerRow);

  let total = 0;
  records.forEach((r, i) => {
    const amount = parseFloat(r.amount || 0);
    total += amount;
    const row = ws.addRow({
      date:     formatDate(r.date),
      category: r.category,
      amount,
      fund:     r.fund?.fundName || '—',
      approved: r.approvedBy,
      status:   r.status,
      desc:     r.description || '—',
    });
    styleDataRow(row, i % 2 === 0);
    row.getCell(3).numFmt = '#,##0.00';
  });

  const totalRow = ws.addRow(['', 'TOTAL', total, '', '', '', '']);
  totalRow.eachCell(cell => {
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'DC2626' } };
  });
  totalRow.getCell(3).numFmt = '#,##0.00';

  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', 'attachment; filename="expense-report.xlsx"');
  await wb.xlsx.write(res);
};

// ── Member Contributions ──────────────────────────────────
const generateMembersExcel = async (res, members) => {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet('Member Contributions', { views: [{ state: 'frozen', ySplit: 4 }] });
  ws.columns = [
    { header: '#',               key: 'num',   width: 6 },
    { header: 'Full Name',       key: 'name',  width: 24 },
    { header: 'Phone',           key: 'phone', width: 16 },
    { header: 'Email',           key: 'email', width: 24 },
    { header: 'Total (KES)',     key: 'total', width: 16 },
    { header: 'Contributions',   key: 'count', width: 14 },
    { header: 'Join Date',       key: 'join',  width: 14 },
    { header: 'Status',          key: 'status',width: 12 },
  ];

  addChurchHeader(ws, 'Member Contributions', 8);
  const headerRow = ws.getRow(3);
  ws.columns.forEach((col, i) => { headerRow.getCell(i + 1).value = col.header; });
  styleHeaderRow(headerRow);

  members.forEach((m, i) => {
    const total = m.incomes?.reduce((s, r) => s + parseFloat(r.amount || 0), 0) || 0;
    const row = ws.addRow({
      num:    i + 1,
      name:   m.fullName,
      phone:  m.phone,
      email:  m.email || '—',
      total,
      count:  m.incomes?.length || 0,
      join:   formatDate(m.joinDate),
      status: m.status,
    });
    styleDataRow(row, i % 2 === 0);
    row.getCell(5).numFmt = '#,##0.00';
  });

  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', 'attachment; filename="member-contributions.xlsx"');
  await wb.xlsx.write(res);
};

// exports extended at end of file

// ── Asset Report ──────────────────────────────────────────
const generateAssetsExcel = async (res, assets) => {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet('Assets', { views: [{ state: 'frozen', ySplit: 4 }] });
  ws.columns = [
    { header: '#',             key: 'num',      width: 5 },
    { header: 'Asset Name',    key: 'name',     width: 24 },
    { header: 'Category',      key: 'cat',      width: 20 },
    { header: 'Purchase Date', key: 'date',     width: 14 },
    { header: 'Value (KES)',   key: 'value',    width: 16 },
    { header: 'Condition',     key: 'cond',     width: 14 },
    { header: 'Status',        key: 'status',   width: 16 },
    { header: 'Location',      key: 'location', width: 22 },
    { header: 'Serial No.',    key: 'serial',   width: 18 },
  ];
  addChurchHeader(ws, 'Asset Register', 9);
  const headerRow = ws.getRow(3);
  ws.columns.forEach((col, i) => { headerRow.getCell(i + 1).value = col.header; });
  styleHeaderRow(headerRow);

  let total = 0;
  assets.forEach((a, i) => {
    const val = parseFloat(a.value || 0);
    total += val;
    const row = ws.addRow({
      num: i + 1, name: a.assetName, cat: a.category,
      date: formatDate(a.purchaseDate), value: val, cond: a.condition,
      status: a.status, location: a.location || '—', serial: a.serialNumber || '—',
    });
    styleDataRow(row, i % 2 === 0);
    row.getCell(5).numFmt = '#,##0.00';
  });

  const totalRow = ws.addRow(['', '', '', 'TOTAL VALUE', total, '', '', '', '']);
  totalRow.eachCell(cell => {
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '1C1C52' } };
  });
  totalRow.getCell(5).numFmt = '#,##0.00';

  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', 'attachment; filename="asset-register.xlsx"');
  await wb.xlsx.write(res);
};

module.exports = { generateIncomeExcel, generateExpenseExcel, generateMembersExcel, generateAssetsExcel };
