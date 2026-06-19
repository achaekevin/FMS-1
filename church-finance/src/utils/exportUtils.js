import { formatCurrency, formatDate, CHURCH_NAME } from './mockData'

export const exportToExcel = (data, filename) => {
  import('xlsx').then(XLSX => {
    const ws = XLSX.utils.json_to_sheet(data)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Report')
    XLSX.writeFile(wb, `${filename}.xlsx`)
  })
}

export const exportToPDF = (title, columns, rows, filename) => {
  import('jspdf').then(({ default: jsPDF }) => {
    import('jspdf-autotable').then(({ default: autoTable }) => {
      const doc = new jsPDF()
      doc.setFontSize(16)
      doc.text(CHURCH_NAME, 14, 15)
      doc.setFontSize(12)
      doc.text(title, 14, 23)
      doc.setFontSize(9)
      doc.setTextColor(100)
      doc.text(`Generated: ${new Date().toLocaleDateString('en-KE')}`, 14, 30)
      autoTable(doc, {
        startY: 35,
        head: [columns],
        body: rows,
        styles: { fontSize: 8, cellPadding: 3 },
        headStyles: { fillColor: [79, 79, 232], textColor: 255, fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [248, 249, 250] },
        margin: { top: 35 },
      })
      doc.save(`${filename}.pdf`)
    })
  })
}

export const exportIncomeReport = (income, title = 'Income Report') => {
  const columns = ['Date', 'Member', 'Category', 'Amount (KES)', 'Payment Method', 'Fund', 'Description']
  const rows = income.map(i => [
    formatDate(i.date), i.memberName, i.category,
    Number(i.amount).toLocaleString(), i.paymentMethod, i.fund, i.description
  ])
  exportToPDF(title, columns, rows, 'income-report')
}

export const exportExpenseReport = (expenses, title = 'Expense Report') => {
  const columns = ['Date', 'Category', 'Amount (KES)', 'Fund', 'Approved By', 'Description']
  const rows = expenses.map(e => [
    formatDate(e.date), e.category,
    Number(e.amount).toLocaleString(), e.fund, e.approvedBy, e.description
  ])
  exportToPDF(title, columns, rows, 'expense-report')
}

export const exportMemberReport = (members, title = 'Member Contributions') => {
  const columns = ['Name', 'Phone', 'Email', 'Total Contributions (KES)', 'Join Date']
  const rows = members.map(m => [
    m.name, m.phone, m.email,
    Number(m.totalContributions).toLocaleString(), formatDate(m.joinDate)
  ])
  exportToPDF(title, columns, rows, 'member-report')
}

export const generateReceipt = (record) => {
  import('jspdf').then(({ default: jsPDF }) => {
    const doc = new jsPDF({ format: 'a5' })
    const receiptNo = `GLC-${String(record.id).slice(-6).toUpperCase()}`

    // Header
    doc.setFillColor(79, 79, 232)
    doc.rect(0, 0, 148, 30, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(14)
    doc.text(CHURCH_NAME, 10, 12)
    doc.setFontSize(9)
    doc.text('Official Receipt', 10, 20)
    doc.text(`Receipt No: ${receiptNo}`, 80, 20)

    // Body
    doc.setTextColor(30, 30, 30)
    doc.setFontSize(11)
    doc.text('PAYMENT RECEIPT', 74, 44, { align: 'center' })

    doc.setFontSize(9)
    const fields = [
      ['Receipt Number', receiptNo],
      ['Member Name', record.memberName || '—'],
      ['Amount', formatCurrency(record.amount)],
      ['Payment Method', record.paymentMethod || '—'],
      ['Fund', record.fund || '—'],
      ['Category', record.category || '—'],
      ['Date', formatDate(record.date)],
      ['Description', record.description || '—'],
    ]
    let y = 55
    fields.forEach(([label, val]) => {
      doc.setFont(undefined, 'bold')
      doc.text(label + ':', 10, y)
      doc.setFont(undefined, 'normal')
      doc.text(String(val), 55, y)
      y += 9
    })

    // Footer
    doc.setDrawColor(200, 200, 200)
    doc.line(10, y + 5, 138, y + 5)
    doc.setFontSize(8)
    doc.setTextColor(120, 120, 120)
    doc.text('This is a computer-generated receipt. No signature required.', 74, y + 12, { align: 'center' })
    doc.text(CHURCH_NAME + ' · Nairobi, Kenya', 74, y + 18, { align: 'center' })

    doc.save(`receipt-${receiptNo}.pdf`)
  })
}

export const generateMemberStatement = (member, contributions) => {
  import('jspdf').then(({ default: jsPDF }) => {
    import('jspdf-autotable').then(({ default: autoTable }) => {
      const doc = new jsPDF()
      const total = contributions.reduce((s, c) => s + Number(c.amount), 0)

      doc.setFillColor(79, 79, 232)
      doc.rect(0, 0, 210, 28, 'F')
      doc.setTextColor(255, 255, 255)
      doc.setFontSize(14)
      doc.text(CHURCH_NAME, 14, 12)
      doc.setFontSize(10)
      doc.text('Member Contribution Statement', 14, 22)

      doc.setTextColor(30, 30, 30)
      doc.setFontSize(10)
      doc.text(`Member: ${member.name}`, 14, 38)
      doc.text(`Phone: ${member.phone}`, 14, 45)
      doc.text(`Email: ${member.email}`, 14, 52)
      doc.text(`Join Date: ${formatDate(member.joinDate)}`, 14, 59)
      doc.text(`Total Contributed: ${formatCurrency(total)}`, 14, 66)
      doc.text(`Generated: ${new Date().toLocaleDateString('en-KE')}`, 140, 38)

      autoTable(doc, {
        startY: 74,
        head: [['Date', 'Category', 'Fund', 'Payment Method', 'Amount (KES)']],
        body: contributions.map(c => [
          formatDate(c.date), c.category, c.fund || '—', c.paymentMethod || '—',
          Number(c.amount).toLocaleString()
        ]),
        styles: { fontSize: 8, cellPadding: 3 },
        headStyles: { fillColor: [79, 79, 232], textColor: 255 },
        alternateRowStyles: { fillColor: [248, 249, 250] },
      })

      const finalY = doc.lastAutoTable.finalY + 10
      doc.setFontSize(10)
      doc.text(`Total Contributions: ${formatCurrency(total)}`, 14, finalY)

      doc.save(`statement-${member.name.replace(/\s+/g, '-')}.pdf`)
    })
  })
}
