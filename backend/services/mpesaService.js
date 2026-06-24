const axios  = require('axios');
const logger = require('../utils/logger');
const { getMpesaTimestamp, getMpesaPassword } = require('../utils/helpers');

const BASE_URL = process.env.MPESA_ENV === 'production'
  ? 'https://api.safaricom.co.ke'
  : 'https://sandbox.safaricom.co.ke';

/**
 * Get Daraja OAuth token
 */
const getAccessToken = async () => {
  const key    = process.env.MPESA_CONSUMER_KEY;
  const secret = process.env.MPESA_CONSUMER_SECRET;
  const auth   = Buffer.from(`${key}:${secret}`).toString('base64');

  const { data } = await axios.get(
    `${BASE_URL}/oauth/v1/generate?grant_type=client_credentials`,
    { headers: { Authorization: `Basic ${auth}` } }
  );
  return data.access_token;
};

/**
 * Initiate STK Push
 */
const stkPush = async ({ phone, amount, accountRef, description }) => {
  const token     = await getAccessToken();
  const shortcode = process.env.MPESA_SHORTCODE;
  const passkey   = process.env.MPESA_PASSKEY;
  const timestamp = getMpesaTimestamp();
  const password  = getMpesaPassword(shortcode, passkey, timestamp);

  // Normalize phone: 0712... → 254712...
  const normalized = phone.startsWith('0') ? `254${phone.slice(1)}` : phone.replace('+', '');

  const payload = {
    BusinessShortCode: shortcode,
    Password:          password,
    Timestamp:         timestamp,
    TransactionType:   'CustomerPayBillOnline',
    Amount:            Math.ceil(amount),
    PartyA:            normalized,
    PartyB:            shortcode,
    PhoneNumber:       normalized,
    CallBackURL:       process.env.MPESA_CALLBACK_URL,
    AccountReference:  accountRef || 'Church Finance',
    TransactionDesc:   description || 'Church Contribution',
  };

  const { data } = await axios.post(
    `${BASE_URL}/mpesa/stkpush/v1/processrequest`,
    payload,
    { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } }
  );

  return data;
};

/**
 * Query STK Push status
 */
const stkQuery = async (checkoutRequestId) => {
  const token     = await getAccessToken();
  const shortcode = process.env.MPESA_SHORTCODE;
  const passkey   = process.env.MPESA_PASSKEY;
  const timestamp = getMpesaTimestamp();
  const password  = getMpesaPassword(shortcode, passkey, timestamp);

  const { data } = await axios.post(
    `${BASE_URL}/mpesa/stkpushquery/v1/query`,
    {
      BusinessShortCode: shortcode,
      Password:          password,
      Timestamp:         timestamp,
      CheckoutRequestID: checkoutRequestId,
    },
    { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } }
  );

  return data;
};

module.exports = { getAccessToken, stkPush, stkQuery };
