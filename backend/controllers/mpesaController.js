const { MpesaTransaction, Income, Member } = require('../models');
const api     = require('../utils/apiResponse');
const audit   = require('../services/auditService');
const mpesa   = require('../services/mpesaService');
const fundSvc = require('../services/fundService');
const logger  = require('../utils/logger');
const { getPagination } = require('../utils/helpers');

/**
 * POST /mpesa/stkpush
 */
exports.stkPush = async (req, res) => {
  try {
    const { phone, amount, memberId, category, description } = req.body;

    const response = await mpesa.stkPush({
      phone, amount,
      accountRef: category || 'Church Contribution',
      description: description || 'Church Contribution',
    });

    const tx = await MpesaTransaction.create({
      initiatedBy: req.user.id,
      memberId: memberId || null,
      checkoutRequestId: response.CheckoutRequestID,
      merchantRequestId: response.MerchantRequestID,
      phone, amount, category, description,
      status: 'pending',
    });

    await audit.log(req.user.id, 'MPESA', 'MPESA',
      `Initiated STK Push to ${phone} for KES ${amount}`, { transactionId: tx.id }, req);

    return api.success(res, {
      transactionId: tx.id,
      checkoutRequestId: response.CheckoutRequestID,
      merchantRequestId: response.MerchantRequestID,
      customerMessage: response.CustomerMessage,
    }, 'STK Push initiated. Check your phone to complete payment.');
  } catch (err) {
    logger.error('STK Push error:', err.response?.data || err.message);
    return api.error(res, err.response?.data?.errorMessage || 'Failed to initiate STK push');
  }
};

/**
 * POST /mpesa/callback  (Safaricom Daraja calls this — no auth)
 */
exports.callback = async (req, res) => {
  try {
    const body = req.body?.Body?.stkCallback;
    if (!body) return res.status(200).json({ ResultCode: 0, ResultDesc: 'Accepted' });

    const { CheckoutRequestID, ResultCode, ResultDesc, CallbackMetadata } = body;

    const tx = await MpesaTransaction.findOne({ where: { checkoutRequestId: CheckoutRequestID } });
    if (!tx) {
      logger.warn(`M-Pesa callback: no matching transaction for ${CheckoutRequestID}`);
      return res.status(200).json({ ResultCode: 0, ResultDesc: 'Accepted' });
    }

    if (ResultCode === 0) {
      const items = CallbackMetadata?.Item || [];
      const get = (name) => items.find(i => i.Name === name)?.Value;

      await tx.update({
        status: 'completed',
        resultCode: String(ResultCode),
        resultDesc: ResultDesc,
        mpesaReceiptNumber: get('MpesaReceiptNumber'),
        transactionDate: new Date(),
      });

      // Auto-create income record
      const income = await Income.create({
        memberId: tx.memberId,
        recordedBy: tx.initiatedBy,
        type: tx.category || 'Offering',
        amount: tx.amount,
        paymentMethod: 'M-Pesa',
        mpesaRef: get('MpesaReceiptNumber'),
        description: tx.description || 'M-Pesa contribution',
        date: new Date(),
      });

      await audit.log(tx.initiatedBy, 'MPESA', 'MPESA',
        `M-Pesa payment completed: KES ${tx.amount} (${get('MpesaReceiptNumber')})`, { incomeId: income.id });
    } else {
      await tx.update({ status: 'failed', resultCode: String(ResultCode), resultDesc: ResultDesc });
      await audit.log(tx.initiatedBy, 'MPESA', 'MPESA', `M-Pesa payment failed: ${ResultDesc}`);
    }

    return res.status(200).json({ ResultCode: 0, ResultDesc: 'Accepted' });
  } catch (err) {
    logger.error('M-Pesa callback error:', err.message);
    return res.status(200).json({ ResultCode: 0, ResultDesc: 'Accepted' });
  }
};

/**
 * GET /mpesa/status/:checkoutRequestId
 */
exports.getStatus = async (req, res) => {
  try {
    const { checkoutRequestId } = req.params;
    const tx = await MpesaTransaction.findOne({ where: { checkoutRequestId } });
    if (!tx) return api.notFound(res, 'Transaction not found');

    // If still pending, query Safaricom directly
    if (tx.status === 'pending') {
      try {
        const query = await mpesa.stkQuery(checkoutRequestId);
        if (query.ResultCode === '0') await tx.update({ status: 'completed', resultCode: query.ResultCode, resultDesc: query.ResultDesc });
        else if (query.ResultCode) await tx.update({ status: 'failed', resultCode: query.ResultCode, resultDesc: query.ResultDesc });
      } catch (e) {
        // Query may fail if still processing — return current DB status
      }
    }

    return api.success(res, tx);
  } catch (err) {
    return api.error(res, err.message);
  }
};

/**
 * GET /mpesa/transactions
 */
exports.getTransactions = async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const { limit: lim, offset } = getPagination(page, limit);
    const where = {};
    if (status) where.status = status;

    const { count, rows } = await MpesaTransaction.findAndCountAll({
      where, limit: lim, offset,
      include: [{ model: Member, as: 'member', attributes: ['id', 'fullName'] }],
      order: [['createdAt', 'DESC']],
    });

    return api.paginate(res, rows, count, page, lim);
  } catch (err) {
    return api.error(res, err.message);
  }
};
