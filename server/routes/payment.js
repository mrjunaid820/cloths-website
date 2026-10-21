const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const db = require('../db');
const mailer = require('../mailer');

// Load environment credentials or defaults
const JAZZCASH_MERCHANT_ID = process.env.JAZZCASH_MERCHANT_ID || '';
const JAZZCASH_PASSWORD = process.env.JAZZCASH_PASSWORD || '';
const JAZZCASH_INTEGERITY_SALT = process.env.JAZZCASH_INTEGERITY_SALT || '';
const JAZZCASH_SANDBOX = process.env.JAZZCASH_SANDBOX !== 'false';

const EASYPAISA_STORE_ID = process.env.EASYPAISA_STORE_ID || '';
const EASYPAISA_HASH_KEY = process.env.EASYPAISA_HASH_KEY || '';
const EASYPAISA_SANDBOX = process.env.EASYPAISA_SANDBOX !== 'false';

// Helper: Calculate JazzCash HMAC-SHA256 signature
function calculateJazzCashHash(postData, salt) {
  const sortedKeys = Object.keys(postData)
    .filter(k => k !== 'pp_SecureHash' && postData[k] !== undefined && postData[k] !== '')
    .sort();

  let stringToHash = salt ? `${salt}&` : '';
  for (let i = 0; i < sortedKeys.length; i++) {
    const key = sortedKeys[i];
    stringToHash += `${postData[key]}`;
    if (i < sortedKeys.length - 1) stringToHash += '&';
  }

  return crypto.createHmac('sha256', salt || 'default_salt').update(stringToHash).digest('hex').toUpperCase();
}

// GET /api/payment/methods - Retrieve active payment methods and public credentials
router.get('/methods', (req, res) => {
  try {
    // Bank transfer details from settings or defaults
    const bankName = db.prepare("SELECT value FROM settings WHERE key = 'bank_name'").get()?.value || 'Meezan Bank Limited';
    const bankAccount = db.prepare("SELECT value FROM settings WHERE key = 'bank_account_title'").get()?.value || 'Aura Atelier Fashion Pvt Ltd';
    const bankIban = db.prepare("SELECT value FROM settings WHERE key = 'bank_iban'").get()?.value || 'PK52MEZN0001000102030405';
    const bankRaastId = db.prepare("SELECT value FROM settings WHERE key = 'bank_raast_id'").get()?.value || '03004562872';

    res.json({
      currency: 'PKR',
      methods: [
        {
          id: 'cod',
          name: 'Cash on Delivery (COD)',
          badge: 'Default & Most Popular',
          description: 'Pay cash to the courier representative when your parcel arrives at your doorstep anywhere in Pakistan.',
          enabled: true,
          fee: 0,
          instructions: 'Please keep exact cash ready upon parcel delivery.'
        },
        {
          id: 'bank_transfer',
          name: 'Raast / Direct Bank Transfer (IBFT)',
          badge: '0% Fees • Instant',
          description: 'Transfer directly to our official Pakistani corporate bank account using Raast ID or IBAN.',
          enabled: true,
          fee: 0,
          bankDetails: {
            bankName,
            accountTitle: bankAccount,
            iban: bankIban,
            raastId: bankRaastId
          },
          instructions: 'Transfer the exact order amount to our Meezan Bank account or via Raast ID. Enter your transaction/reference ID after placing your order.'
        },
        {
          id: 'jazzcash',
          name: 'JazzCash Mobile Account / Voucher',
          badge: 'JazzCash Wallet & Debit Cards',
          description: 'Pay securely using your JazzCash wallet, debit card, or cash voucher at any JazzCash shop.',
          enabled: Boolean(JAZZCASH_MERCHANT_ID),
          sandbox: JAZZCASH_SANDBOX,
          configured: Boolean(JAZZCASH_MERCHANT_ID && JAZZCASH_INTEGERITY_SALT),
          instructions: 'You will be redirected to the secure JazzCash payment gateway.'
        },
        {
          id: 'easypaisa',
          name: 'Easypaisa Mobile Account / OTC',
          badge: 'Easypaisa Wallet & Cards',
          description: 'Fast, secure checkout using your Easypaisa Mobile Account or debit card.',
          enabled: Boolean(EASYPAISA_STORE_ID),
          sandbox: EASYPAISA_SANDBOX,
          configured: Boolean(EASYPAISA_STORE_ID && EASYPAISA_HASH_KEY),
          instructions: 'You will be redirected to the secure Easypaisa payment gateway.'
        }
      ]
    });
  } catch (err) {
    console.error('Error fetching payment methods:', err);
    res.status(500).json({ error: 'Failed to retrieve payment options' });
  }
});

// POST /api/payment/initiate - Initiate an online payment request
router.post('/initiate', (req, res) => {
  try {
    const { orderId, paymentMethod } = req.body;

    if (!orderId || !paymentMethod) {
      return res.status(400).json({ error: 'Order ID and payment method are required' });
    }

    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const amountInPaisa = Math.round(order.total_amount * 100);
    const txnRefNo = `TXN-${Date.now()}-${order.id.replace(/[^A-Za-z0-9]/g, '')}`;

    if (paymentMethod === 'jazzcash') {
      if (!JAZZCASH_MERCHANT_ID || !JAZZCASH_INTEGERITY_SALT) {
        return res.status(400).json({
          error: 'JazzCash merchant credentials not configured. Please use Cash on Delivery or Bank Transfer.',
          requiresConfig: true
        });
      }

      const expiryDate = new Date(Date.now() + 2 * 60 * 60 * 1000); // 2 hours
      const formattedExpiry = expiryDate.toISOString().replace(/[-:T]/g, '').slice(0, 14);
      const formattedNow = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14);

      const postData = {
        pp_Version: '1.1',
        pp_TxnType: 'MWALLET',
        pp_Language: 'EN',
        pp_MerchantID: JAZZCASH_MERCHANT_ID,
        pp_Password: JAZZCASH_PASSWORD,
        pp_TxnRefNo: txnRefNo,
        pp_Amount: String(amountInPaisa),
        pp_TxnCurrency: 'PKR',
        pp_TxnDateTime: formattedNow,
        pp_BillReference: order.id,
        pp_Description: `Aura Atelier Order ${order.id}`,
        pp_TxnExpiryDateTime: formattedExpiry,
        pp_ReturnURL: `${req.protocol}://${req.get('host')}/api/payment/callback/jazzcash`
      };

      const secureHash = calculateJazzCashHash(postData, JAZZCASH_INTEGERITY_SALT);
      postData.pp_SecureHash = secureHash;

      const endpoint = JAZZCASH_SANDBOX
        ? 'https://sandbox.jazzcash.com.pk/CustomerPortal/transactionmanagement/merchantform'
        : 'https://payments.jazzcash.com.pk/CustomerPortal/transactionmanagement/merchantform';

      // Record transaction reference
      db.prepare('UPDATE orders SET payment_reference = ?, payment_status = ? WHERE id = ?')
        .run(txnRefNo, 'Payment Pending', order.id);

      return res.json({
        gateway: 'jazzcash',
        endpoint,
        postData,
        orderId: order.id
      });
    }

    if (paymentMethod === 'easypaisa') {
      if (!EASYPAISA_STORE_ID || !EASYPAISA_HASH_KEY) {
        return res.status(400).json({
          error: 'Easypaisa merchant credentials not configured. Please use Cash on Delivery or Bank Transfer.',
          requiresConfig: true
        });
      }

      const postData = {
        storeId: EASYPAISA_STORE_ID,
        orderId: order.id,
        transactionAmount: String(order.total_amount),
        mobileAccountNo: order.customer_phone || '',
        emailAddress: order.customer_email || ''
      };

      const endpoint = EASYPAISA_SANDBOX
        ? 'https://easypaystg.easypaisa.com.pk/easypay/Index.jsf'
        : 'https://easypay.easypaisa.com.pk/easypay/Index.jsf';

      db.prepare('UPDATE orders SET payment_reference = ?, payment_status = ? WHERE id = ?')
        .run(txnRefNo, 'Payment Pending', order.id);

      return res.json({
        gateway: 'easypaisa',
        endpoint,
        postData,
        orderId: order.id
      });
    }

    if (paymentMethod === 'bank_transfer') {
      return res.json({
        gateway: 'bank_transfer',
        orderId: order.id,
        message: 'Order recorded. Please submit bank transaction reference once transferred.'
      });
    }

    return res.status(400).json({ error: 'Unsupported online payment method' });
  } catch (err) {
    console.error('Error initiating payment:', err);
    res.status(500).json({ error: 'Failed to initiate payment gateway transaction' });
  }
});

// POST /api/payment/bank-transfer-proof - Submit reference ID for Bank Transfer / Raast
router.post('/bank-transfer-proof', (req, res) => {
  try {
    const { orderId, referenceNumber, senderName, senderBank } = req.body;

    if (!orderId || !referenceNumber) {
      return res.status(400).json({ error: 'Order ID and Transaction Reference are required' });
    }

    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const refNote = `[Raast/IBFT Verified Pending] Ref: ${referenceNumber.trim()} | Sender: ${senderName || 'N/A'} | Bank: ${senderBank || 'N/A'}`;

    const currentHistory = typeof order.tracking_history === 'string'
      ? JSON.parse(order.tracking_history)
      : (order.tracking_history || []);

    currentHistory.push({
      status: 'Verification Pending',
      time: new Date().toISOString().replace('T', ' ').substring(0, 19),
      note: refNote
    });

    db.prepare(`
      UPDATE orders SET
        payment_reference = ?,
        payment_status = 'Verification Pending',
        tracking_history = ?,
        updated_at = datetime('now', 'localtime')
      WHERE id = ?
    `).run(referenceNumber.trim(), JSON.stringify(currentHistory), orderId);

    // Send payment verification receipt email
    mailer.sendPaymentReceivedEmail(order, {
      referenceNumber: referenceNumber.trim(),
      senderName,
      senderBank
    }).catch(e => console.error('Email error:', e));

    res.json({
      success: true,
      message: 'Transaction reference submitted successfully. Our boutique accounts team will verify within 1-2 hours.',
      orderId
    });
  } catch (err) {
    console.error('Error recording bank proof:', err);
    res.status(500).json({ error: 'Failed to record payment verification' });
  }
});

// POST /api/payment/callback/jazzcash - Server-side webhook / return IPN
router.post('/callback/jazzcash', (req, res) => {
  try {
    const responseData = req.body;
    console.log('[JAZZCASH CALLBACK RECEIVED]:', responseData);

    const orderId = responseData.pp_BillReference;
    const responseCode = responseData.pp_ResponseCode;
    const receivedHash = responseData.pp_SecureHash;

    if (!orderId) {
      return res.status(400).send('Missing Order Reference');
    }

    // Verify hash
    const calculatedHash = calculateJazzCashHash(responseData, JAZZCASH_INTEGERITY_SALT);
    const isValid = JAZZCASH_SANDBOX || calculatedHash === receivedHash;

    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId);
    if (!order) {
      return res.status(404).send('Order not found');
    }

    if (isValid && responseCode === '000') {
      // Payment Successful
      db.prepare(`
        UPDATE orders SET
          payment_status = 'Paid',
          payment_reference = ?,
          status = 'Confirmed',
          updated_at = datetime('now', 'localtime')
        WHERE id = ?
      `).run(responseData.pp_TxnRefNo || 'JC-SUCCESS', orderId);

      mailer.sendStatusUpdateEmail(order, 'Confirmed', 'Payment verified successfully via JazzCash.')
        .catch(e => console.error(e));

      return res.redirect(`/order-success?order_id=${orderId}&payment=paid`);
    } else {
      // Payment Failed or Cancelled
      db.prepare(`
        UPDATE orders SET
          payment_status = 'Failed',
          updated_at = datetime('now', 'localtime')
        WHERE id = ?
      `).run(orderId);

      return res.redirect(`/checkout?order_id=${orderId}&payment_error=${encodeURIComponent(responseData.pp_ResponseMessage || 'Payment Failed')}`);
    }
  } catch (err) {
    console.error('JazzCash callback error:', err);
    res.status(500).send('Internal Error');
  }
});

// POST /api/payment/callback/easypaisa - Server-side webhook / return IPN
router.post('/callback/easypaisa', (req, res) => {
  try {
    const responseData = req.body;
    console.log('[EASYPAISA CALLBACK RECEIVED]:', responseData);

    const orderId = responseData.orderRefNumber || responseData.orderId;
    const status = responseData.status;

    if (!orderId) {
      return res.status(400).send('Missing Order Reference');
    }

    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId);
    if (!order) {
      return res.status(404).send('Order not found');
    }

    if (status === '0000' || status === 'PAID') {
      db.prepare(`
        UPDATE orders SET
          payment_status = 'Paid',
          status = 'Confirmed',
          updated_at = datetime('now', 'localtime')
        WHERE id = ?
      `).run(orderId);

      return res.redirect(`/order-success?order_id=${orderId}&payment=paid`);
    } else {
      db.prepare(`
        UPDATE orders SET
          payment_status = 'Failed',
          updated_at = datetime('now', 'localtime')
        WHERE id = ?
      `).run(orderId);

      return res.redirect(`/checkout?order_id=${orderId}&payment_error=Payment_Failed`);
    }
  } catch (err) {
    console.error('Easypaisa callback error:', err);
    res.status(500).send('Internal Error');
  }
});

module.exports = router;
