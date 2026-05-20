// ── orders.js ─────────────────────────────────────────────
const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const { Order } = require('../models/OrderReview');
const { protect, adminOnly } = require('../middleware/auth');
const { randomTrackingIntervalMs } = require('../utils/orderAutoTracker');

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

function normalizeCallbackParams(payload = {}) {
  return Object.keys(payload)
    .filter(k => k !== 'pp_SecureHash' && k.startsWith('pp_'))
    .reduce((acc, key) => {
      const value = payload[key];
      acc[key] = typeof value === 'string' ? value.trim() : value;
      return acc;
    }, {});
}

function isLocalSandboxMode() {
  const isSandbox = process.env.JAZZCASH_ENV !== 'production';
  const localSandboxEnabled = process.env.JAZZCASH_SANDBOX_LOCAL !== 'false';
  return isSandbox && localSandboxEnabled;
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
    const clientUrl = process.env.CLIENT_URL || 'http://localhost:3000';

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

    if (isLocalSandboxMode()) {
      const now = new Date();
      await Order.findByIdAndUpdate(order._id, {
        payment_status: 'Paid',
        order_status: 'Confirmed',
        jazzcash_response: JSON.stringify({ mode: 'local-sandbox', responseCode: '000', txnRef }),
        auto_tracking_enabled: true,
        status_updated_at: now,
        next_auto_status_at: new Date(now.getTime() + randomTrackingIntervalMs())
      });
      return res.json({
        success: true,
        sandbox: true,
        redirectUrl: `${clientUrl}/payment-result?status=success&ref=${txnRef}&sandbox=1`
      });
    }

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

// ── Initiate payment for an existing unpaid order ─────────
router.patch('/:id/cancel', protect, async (req, res) => {
  try {
    const order = await Order.findOne({ _id: req.params.id, user_id: req.user._id });
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    if (!['Pending', 'Confirmed'].includes(order.order_status)) {
      return res.status(400).json({ success: false, message: 'This order can no longer be cancelled' });
    }
    order.order_status = 'Cancelled';
    order.auto_tracking_enabled = false;
    order.next_auto_status_at = null;
    order.status_updated_at = new Date();
    await order.save();
    res.json({ success: true, order });
  } catch (err) { res.status(400).json({ success: false, message: err.message }); }
});

router.post('/:id/initiate-jazzcash', protect, async (req, res) => {
  try {
    const order = await Order.findOne({ _id: req.params.id, user_id: req.user._id });
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }
    if (order.payment_status === 'Paid') {
      return res.status(400).json({ success: false, message: 'Order is already paid' });
    }
    if (order.order_status === 'Cancelled') {
      return res.status(400).json({ success: false, message: 'Cancelled orders cannot be paid' });
    }
    if (!order.total_price || order.total_price <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid order amount' });
    }

    const merchantId = process.env.JAZZCASH_MERCHANT_ID;
    const password = process.env.JAZZCASH_PASSWORD;
    const salt = process.env.JAZZCASH_INTEGRITY_SALT;
    if (!merchantId || !password || !salt ||
        merchantId === 'your_jazzcash_merchant_id' ||
        password === 'your_jazzcash_password' ||
        salt === 'your_jazzcash_integrity_salt') {
      return res.status(503).json({
        success: false,
        message: 'JazzCash credentials are not configured. Please add JAZZCASH_MERCHANT_ID, JAZZCASH_PASSWORD, and JAZZCASH_INTEGRITY_SALT to your .env file.',
      });
    }

    const now = new Date();
    const expiry = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const txnRef = 'T' + Date.now() + Math.floor(Math.random() * 1000);
    const returnURL = `${process.env.SERVER_URL || 'http://localhost:5000'}/api/orders/jazzcash-callback`;
    const clientUrl = process.env.CLIENT_URL || 'http://localhost:3000';

    order.jazzcash_txn_ref = txnRef;
    order.payment_method = 'JazzCash';
    await order.save();

    if (isLocalSandboxMode()) {
      const now = new Date();
      await Order.findByIdAndUpdate(order._id, {
        payment_status: 'Paid',
        order_status: 'Confirmed',
        jazzcash_response: JSON.stringify({ mode: 'local-sandbox', responseCode: '000', txnRef }),
        auto_tracking_enabled: true,
        status_updated_at: now,
        next_auto_status_at: new Date(now.getTime() + randomTrackingIntervalMs())
      });
      return res.json({
        success: true,
        sandbox: true,
        redirectUrl: `${clientUrl}/payment-result?status=success&ref=${txnRef}&sandbox=1`
      });
    }

    const params = {
      pp_Amount: String(Math.round(order.total_price * 100)),
      pp_BillReference: `ORD-${order._id}`,
      pp_Description: 'GadgetGlam Order Payment',
      pp_Language: 'EN',
      pp_MerchantID: merchantId,
      pp_Password: password,
      pp_ReturnURL: returnURL,
      pp_TxnCurrency: 'PKR',
      pp_TxnDateTime: jcDateTime(now),
      pp_TxnExpiryDateTime: jcDateTime(expiry),
      pp_TxnRefNo: txnRef,
      pp_Version: '1.1',
    };
    params.pp_SecureHash = generateHash(params, salt);

    return res.json({ success: true, jcUrl: JC_URL, params });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// ── JazzCash callback (POST from JazzCash after payment) ──
router.post('/jazzcash-callback', async (req, res) => {
  const clientUrl = process.env.CLIENT_URL || 'http://localhost:3000';
  try {
    const data = req.body;
    const salt = process.env.JAZZCASH_INTEGRITY_SALT;
    const isSandbox = process.env.JAZZCASH_ENV !== 'production';
    const txnRef = String(data.pp_TxnRefNo || '').trim();
    const responseCode = String(data.pp_ResponseCode || '').trim();

    if (!txnRef) {
      return res.redirect(`${clientUrl}/payment-result?status=failed&reason=invalid`);
    }

    const order = await Order.findOne({ jazzcash_txn_ref: txnRef });
    if (!order) {
      return res.redirect(`${clientUrl}/payment-result?status=failed&reason=notfound`);
    }

    const receivedHash = String(data.pp_SecureHash || '').toLowerCase();
    const normalizedForHash = normalizeCallbackParams(data);
    const canVerifyHash = Boolean(salt && receivedHash);
    const expectedHash = canVerifyHash ? String(generateHash(normalizedForHash, salt)).toLowerCase() : '';
    const isHashValid = canVerifyHash ? receivedHash === expectedHash : false;

    if (!isHashValid && !isSandbox) {
      return res.redirect(`${clientUrl}/payment-result?status=failed&reason=invalid`);
    }

    if (responseCode === '000') {
      const now = new Date();
      await Order.findOneAndUpdate(
        { jazzcash_txn_ref: txnRef },
        {
          payment_status: 'Paid',
          order_status: 'Confirmed',
          jazzcash_response: JSON.stringify(data),
          auto_tracking_enabled: true,
          status_updated_at: now,
          next_auto_status_at: new Date(now.getTime() + randomTrackingIntervalMs())
        }
      );
      return res.redirect(`${clientUrl}/payment-result?status=success&ref=${txnRef}`);
    } else {
      await Order.findOneAndUpdate(
        { jazzcash_txn_ref: txnRef },
        {
          payment_status: 'Unpaid',
          jazzcash_response: JSON.stringify(data)
        }
      );
      return res.redirect(`${clientUrl}/payment-result?status=failed&ref=${txnRef}&code=${responseCode || 'UNKNOWN'}`);
    }
  } catch (err) {
    return res.redirect(`${clientUrl}/payment-result?status=failed`);
  }
});

router.post('/', protect, async (req, res) => {
  try {
    const orderPayload = {
      ...req.body,
      user_id: req.user._id,
      tracking_number: req.body.tracking_number || undefined,
      order_status: req.body.order_status || 'Pending',
      payment_status: req.body.payment_status || 'Unpaid',
      auto_tracking_enabled: req.body.auto_tracking_enabled !== undefined ? req.body.auto_tracking_enabled : true,
    };
    const order = await Order.create(orderPayload);
    res.status(201).json({ success: true, order });
  } catch (err) { res.status(400).json({ success: false, message: err.message }); }
});

router.get('/my', protect, async (req, res) => {
  try {
    const orders = await Order.find({ user_id: req.user._id }).sort('-createdAt').populate('products.product_id', 'name thumbnail');
    res.json({ success: true, orders });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.get('/by-ref/:ref', async (req, res) => {
  try {
    const order = await Order.findOne({ jazzcash_txn_ref: req.params.ref })
      .populate('products.product_id', 'name thumbnail')
      .populate('user_id', 'first_name last_name email');
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    res.json({ success: true, order });
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
    const now = new Date();
    const nextStatus = req.body.order_status;
    const orderUpdate = { order_status: nextStatus, status_updated_at: now };

    if (['Pending', 'Confirmed', 'Dispatched', 'Processing', 'Shipped'].includes(nextStatus)) {
      orderUpdate.auto_tracking_enabled = true;
      orderUpdate.next_auto_status_at = new Date(now.getTime() + randomTrackingIntervalMs());
    } else {
      orderUpdate.auto_tracking_enabled = false;
      orderUpdate.next_auto_status_at = null;
    }

    if (nextStatus === 'Delivered') {
      orderUpdate.payment_status = 'Paid';
    }

    const order = await Order.findByIdAndUpdate(req.params.id, orderUpdate, { new: true });
    res.json({ success: true, order });
  } catch (err) { res.status(400).json({ success: false, message: err.message }); }
});

module.exports = router;
