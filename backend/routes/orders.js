// ── orders.js ─────────────────────────────────────────────
const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const { Order } = require('../models/OrderReview');
const { protect, adminOnly } = require('../middleware/auth');

// ── JazzCash helpers ───────────────────────────────────────
const JC_URL = process.env.JAZZCASH_ENV === 'production'
  ? 'https://payments.jazzcash.com.pk/CustomerPortal/transactionmanagement/merchantform/'
  : 'https://sandbox.jazzcash.com.pk/CustomerPortal/transactionmanagement/merchantform/';

function pad2(n) { return String(n).padStart(2, '0'); }
function jcDateTime(d) {
  return `${d.getFullYear()}${pad2(d.getMonth()+1)}${pad2(d.getDate())}${pad2(d.getHours())}${pad2(d.getMinutes())}${pad2(d.getSeconds())}`;
}
function generateHash(params, salt) {
  const str = salt + '&' + Object.keys(params)
    .filter(k => params[k] !== '' && params[k] != null)
    .sort()
    .map(k => params[k])
    .join('&');
  return crypto.createHmac('sha256', salt).update(str).digest('hex');
}

// ── Initiate JazzCash Hosted Payment ──────────────────────
router.post('/initiate-jazzcash', protect, async (req, res) => {
  try {
    const { products, total_price, shipping_address, notes } = req.body;
    if (!total_price || total_price <= 0)
      return res.status(400).json({ success: false, message: 'Invalid amount' });

    const now    = new Date();
    const expiry = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const txnRef = 'T' + Date.now() + Math.floor(Math.random() * 1000);

    const order = await Order.create({
      user_id: req.user._id,
      products,
      total_price,
      shipping_address,
      notes,
      payment_method: 'JazzCash',
      payment_status: 'Unpaid',
      jazzcash_txn_ref: txnRef,
    });

    const merchantId = process.env.JAZZCASH_MERCHANT_ID;
    const password   = process.env.JAZZCASH_PASSWORD;
    const salt       = process.env.JAZZCASH_INTEGRITY_SALT;

    if (!merchantId || !password || !salt ||
        merchantId === 'your_jazzcash_merchant_id' ||
        password   === 'your_jazzcash_password'    ||
        salt       === 'your_jazzcash_integrity_salt') {
      await Order.findByIdAndDelete(order._id);
      return res.status(503).json({
        success: false,
        message: 'JazzCash credentials are not configured. Please add JAZZCASH_MERCHANT_ID, JAZZCASH_PASSWORD, and JAZZCASH_INTEGRITY_SALT to your .env file.',
      });
    }

    const returnURL = `${process.env.SERVER_URL || 'http://localhost:5000'}/api/orders/jazzcash-callback`;

    const params = {
      pp_Amount:            String(Math.round(total_price * 100)),
      pp_BillReference:     `ORD-${order._id}`,
      pp_Description:       'GadgetGlam Order',
      pp_Language:          'EN',
      pp_MerchantID:        merchantId,
      pp_Password:          password,
      pp_ReturnURL:         returnURL,
      pp_TxnCurrency:       'PKR',
      pp_TxnDateTime:       jcDateTime(now),
      pp_TxnExpiryDateTime: jcDateTime(expiry),
      pp_TxnRefNo:          txnRef,
      pp_Version:           '1.1',
    };
    params.pp_SecureHash = generateHash(params, salt);

    res.json({ success: true, jcUrl: JC_URL, params });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── JazzCash callback (POST from JazzCash after payment) ──
router.post('/jazzcash-callback', async (req, res) => {
  const clientUrl = process.env.CLIENT_URL || 'http://localhost:3000';
  try {
    const data = req.body;
    const salt = process.env.JAZZCASH_INTEGRITY_SALT;
    const receivedHash = data.pp_SecureHash;
    const { pp_SecureHash, ...rest } = data;
    const expectedHash = generateHash(rest, salt);

    if (receivedHash !== expectedHash)
      return res.redirect(`${clientUrl}/payment-result?status=failed&reason=invalid`);

    const txnRef = data.pp_TxnRefNo;
    if (data.pp_ResponseCode === '000') {
      await Order.findOneAndUpdate(
        { jazzcash_txn_ref: txnRef },
        { payment_status: 'Paid', order_status: 'Processing', jazzcash_response: JSON.stringify(data) }
      );
      return res.redirect(`${clientUrl}/payment-result?status=success&ref=${txnRef}`);
    } else {
      await Order.findOneAndUpdate(
        { jazzcash_txn_ref: txnRef },
        { payment_status: 'Unpaid', order_status: 'Cancelled' }
      );
      return res.redirect(`${clientUrl}/payment-result?status=failed&code=${data.pp_ResponseCode}`);
    }
  } catch (err) {
    return res.redirect(`${clientUrl}/payment-result?status=failed`);
  }
});

router.post('/', protect, async (req, res) => {
  try {
    const order = await Order.create({ ...req.body, user_id: req.user._id });
    res.status(201).json({ success: true, order });
  } catch (err) { res.status(400).json({ success: false, message: err.message }); }
});

router.get('/my', protect, async (req, res) => {
  try {
    const orders = await Order.find({ user_id: req.user._id }).sort('-createdAt').populate('products.product_id', 'name thumbnail');
    res.json({ success: true, orders });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.get('/', protect, adminOnly, async (req, res) => {
  try {
    const orders = await Order.find().sort('-createdAt').populate('user_id', 'first_name last_name email');
    res.json({ success: true, orders });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.put('/:id/status', protect, adminOnly, async (req, res) => {
  try {
    const order = await Order.findByIdAndUpdate(req.params.id, { order_status: req.body.order_status }, { new: true });
    res.json({ success: true, order });
  } catch (err) { res.status(400).json({ success: false, message: err.message }); }
});

module.exports = router;
