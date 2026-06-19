const path = require('path');
const { Receipt, Income, Member, User } = require('../models');
const api    = require('../utils/apiResponse');
const audit  = require('../services/auditService');
const { generateReceiptPDF } = require('../services/receiptPdfService');
const comms  = require('../services/communicationService');
const { getPagination } = require('../utils/helpers');
const { Op } = require('sequelize');

const RECEIPT_DIR = path.join(__dirname, '../uploads/receipts');

/** Generate unique receipt number:  GLC-YYYYMMDD-XXXXX */
const makeReceiptNumber = () => {
  const date = new Date().toISOString().slice(0,10).replace(/-/g,'');
  const rand = Math.random().toString(36).substring(2,7).toUpperCase();
  return `GLC-${date}-${rand}`;
};

const INCLUDE = [
  { model: User,   as: 'generator', attributes: ['id','name'] },
  { model: Member, as: 'member',    attributes: ['id','fullName','email','phone'] },
];

exports.getAll = async (req, res) => {
  try {
    const { page = 1, limit = 20, memberId } = req.query;
    const { limit: lim, offset } = getPagination(page, limit);
    const where = {};
    if (memberId) where.memberId = memberId;
    const { count, rows } = await Receipt.findAndCountAll({
      where, limit: lim, offset, include: INCLUDE, order: [['createdAt','DESC']],
    });
    return api.paginate(res, rows, count, page, lim);
  } catch (err) { return api.error(res, err.message); }
};

exports.getById = async (req, res) => {
  try {
    const r = await Receipt.findByPk(req.params.id, { include: INCLUDE });
    if (!r) return api.notFound(res, 'Receipt not found');
    return api.success(res, r);
  } catch (err) { return api.error(res, err.message); }
};

/** POST /receipts/generate — generate from income record or raw data */
exports.generate = async (req, res) => {
  try {
    const { incomeId, memberId, memberName, amount, paymentMethod, category,
            fundName, date, description, sendEmail, sendSms } = req.body;

    // If incomeId supplied, pull data from it
    let incomeData = {};
    if (incomeId) {
      const inc = await Income.findByPk(incomeId, {
        include: [
          { model: Member, as: 'member', attributes: ['id','fullName','email','phone'] },
          { model: require('../models').Fund, as: 'fund', attributes: ['fundName'] },
        ],
      });
      if (!inc) return api.notFound(res, 'Income record not found');
      incomeData = {
        memberId:     inc.memberId,
        memberName:   inc.member?.fullName || 'Anonymous',
        amount:       inc.amount,
        paymentMethod:inc.paymentMethod,
        category:     inc.type,
        fundName:     inc.fund?.fundName,
        date:         inc.date,
        description:  inc.description,
        memberEmail:  inc.member?.email,
        memberPhone:  inc.member?.phone,
      };
    }

    const receiptNumber = makeReceiptNumber();
    const filePath = path.join(RECEIPT_DIR, `${receiptNumber}.pdf`);
    const finalData = {
      receiptNumber,
      incomeId:      incomeId || null,
      memberId:      incomeData.memberId || memberId || null,
      generatedBy:   req.user.id,
      memberName:    incomeData.memberName || memberName || 'Anonymous',
      amount:        incomeData.amount     || amount,
      paymentMethod: incomeData.paymentMethod || paymentMethod,
      category:      incomeData.category   || category,
      fundName:      incomeData.fundName   || fundName,
      date:          incomeData.date       || date || new Date().toISOString().split('T')[0],
      description:   incomeData.description|| description,
    };

    // Save PDF to disk
    await generateReceiptPDF({ ...finalData, filePath: null }, null, filePath);
    finalData.filePath = filePath;

    const receipt = await Receipt.create(finalData);

    await audit.log(req.user.id, 'CREATE', 'RECEIPT',
      `Generated receipt ${receiptNumber} for ${finalData.memberName}`, { receiptId: receipt.id }, req);

    // Optional comms — unified service handles SMS + Email + WhatsApp
    if ((sendEmail || sendSms) && incomeData.memberId) {
      const member = await Member.findByPk(incomeData.memberId,
        { attributes: ['id','fullName','email','phone'] });
      if (member) {
        comms.sendDonationConfirmation({ member, receipt: { ...finalData, ...receipt.dataValues } })
          .catch(() => {});
      }
    }

    const full = await Receipt.findByPk(receipt.id, { include: INCLUDE });
    return api.created(res, full, `Receipt ${receiptNumber} generated`);
  } catch (err) { return api.error(res, err.message); }
};

/** GET /receipts/:id/download — stream PDF to browser */
exports.download = async (req, res) => {
  try {
    const r = await Receipt.findByPk(req.params.id, { include: INCLUDE });
    if (!r) return api.notFound(res, 'Receipt not found');

    await audit.log(req.user.id, 'EXPORT', 'RECEIPT',
      `Downloaded receipt ${r.receiptNumber}`, { receiptId: r.id }, req);

    // If PDF file exists on disk, stream it
    if (r.filePath && require('fs').existsSync(r.filePath)) {
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="receipt-${r.receiptNumber}.pdf"`);
      return require('fs').createReadStream(r.filePath).pipe(res);
    }

    // Otherwise generate on-the-fly
    return generateReceiptPDF(r, res);
  } catch (err) { return api.error(res, err.message); }
};
