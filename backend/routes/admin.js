const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const User = require('../models/User');
const { Order, Review } = require('../models/OrderReview');
const { protect, adminOnly } = require('../middleware/auth');

router.use(protect, adminOnly);

// ── STATS ──────────────────────────────────────────────────
// GET /api/admin/stats
router.get('/stats', async (req, res) => {
  try {
    const [totalProducts, totalUsers, totalOrders, totalReviews, revenueData] = await Promise.all([
      Product.countDocuments({ is_active: true }),
      User.countDocuments(),
      Order.countDocuments(),
      Review.countDocuments(),
      Order.aggregate([
        { $match: { payment_status: 'Paid' } },
        { $group: { _id: null, total: { $sum: '$total_price' } } }
      ])
    ]);
    res.json({
      success: true,
      stats: {
        totalProducts, totalUsers, totalOrders, totalReviews,
        totalRevenue: revenueData[0]?.total || 0
      }
    });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// ── PRODUCTS ───────────────────────────────────────────────
// GET /api/admin/products — all (including inactive), paginated
router.get('/products', async (req, res) => {
  try {
    const { page = 1, limit = 20, search, category } = req.query;
    const query = {};
    if (category) query.category = category;
    if (search) query.$or = [
      { name: new RegExp(search, 'i') },
      { brand: new RegExp(search, 'i') }
    ];
    const skip = (Number(page) - 1) * Number(limit);
    const [products, total] = await Promise.all([
      Product.find(query).sort('-createdAt').skip(skip).limit(Number(limit)),
      Product.countDocuments(query)
    ]);
    res.json({ success: true, products, pagination: { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / Number(limit)) } });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// GET /api/admin/products/:id
router.get('/products/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
    res.json({ success: true, product });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// POST /api/admin/products
router.post('/products', async (req, res) => {
  try {
    const product = await Product.create(req.body);
    res.status(201).json({ success: true, product });
  } catch (err) { res.status(400).json({ success: false, message: err.message }); }
});

// PUT /api/admin/products/:id
router.put('/products/:id', async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
    res.json({ success: true, product });
  } catch (err) { res.status(400).json({ success: false, message: err.message }); }
});

// DELETE /api/admin/products/:id — soft delete
router.delete('/products/:id', async (req, res) => {
  try {
    await Product.findByIdAndUpdate(req.params.id, { is_active: false });
    res.json({ success: true, message: 'Product deactivated' });
  } catch (err) { res.status(400).json({ success: false, message: err.message }); }
});

// ── ORDERS ─────────────────────────────────────────────────
// GET /api/admin/orders
router.get('/orders', async (req, res) => {
  try {
    const { page = 1, limit = 20, status, payment } = req.query;
    const query = {};
    if (status) query.order_status = status;
    if (payment) query.payment_status = payment;
    const skip = (Number(page) - 1) * Number(limit);
    const [orders, total] = await Promise.all([
      Order.find(query).sort('-createdAt').skip(skip).limit(Number(limit))
        .populate('user_id', 'first_name last_name email'),
      Order.countDocuments(query)
    ]);
    res.json({ success: true, orders, pagination: { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / Number(limit)) } });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// GET /api/admin/orders/:id
router.get('/orders/:id', async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('user_id', 'first_name last_name email')
      .populate('products.product_id', 'name thumbnail slug');
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    res.json({ success: true, order });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// PUT /api/admin/orders/:id
router.put('/orders/:id', async (req, res) => {
  try {
    const { order_status, payment_status, tracking_number } = req.body;
    const update = {};
    if (order_status) update.order_status = order_status;
    if (payment_status) update.payment_status = payment_status;
    if (tracking_number !== undefined) update.tracking_number = tracking_number;
    const order = await Order.findByIdAndUpdate(req.params.id, update, { new: true })
      .populate('user_id', 'first_name last_name email');
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    res.json({ success: true, order });
  } catch (err) { res.status(400).json({ success: false, message: err.message }); }
});

// DELETE /api/admin/orders/:id
router.delete('/orders/:id', async (req, res) => {
  try {
    await Order.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Order deleted' });
  } catch (err) { res.status(400).json({ success: false, message: err.message }); }
});

// ── USERS ──────────────────────────────────────────────────
// GET /api/admin/users
router.get('/users', async (req, res) => {
  try {
    const { page = 1, limit = 20, search } = req.query;
    const query = {};
    if (search) query.$or = [
      { email: new RegExp(search, 'i') },
      { first_name: new RegExp(search, 'i') },
      { last_name: new RegExp(search, 'i') }
    ];
    const skip = (Number(page) - 1) * Number(limit);
    const [users, total] = await Promise.all([
      User.find(query).sort('-createdAt').skip(skip).limit(Number(limit)),
      User.countDocuments(query)
    ]);
    res.json({ success: true, users, pagination: { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / Number(limit)) } });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// GET /api/admin/users/:id
router.get('/users/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, user });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// PUT /api/admin/users/:id
router.put('/users/:id', async (req, res) => {
  try {
    const { role, is_active, first_name, last_name } = req.body;
    const update = {};
    if (role !== undefined) update.role = role;
    if (is_active !== undefined) update.is_active = is_active;
    if (first_name) update.first_name = first_name;
    if (last_name) update.last_name = last_name;
    const user = await User.findByIdAndUpdate(req.params.id, update, { new: true });
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, user });
  } catch (err) { res.status(400).json({ success: false, message: err.message }); }
});

// DELETE /api/admin/users/:id
router.delete('/users/:id', async (req, res) => {
  try {
    if (req.params.id === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: 'Cannot delete your own account' });
    }
    await User.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'User deleted' });
  } catch (err) { res.status(400).json({ success: false, message: err.message }); }
});

// ── REVIEWS ────────────────────────────────────────────────
// GET /api/admin/reviews
router.get('/reviews', async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);
    const [reviews, total] = await Promise.all([
      Review.find().sort('-createdAt').skip(skip).limit(Number(limit))
        .populate('user_id', 'first_name last_name email')
        .populate('product_id', 'name thumbnail slug'),
      Review.countDocuments()
    ]);
    res.json({ success: true, reviews, pagination: { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / Number(limit)) } });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// DELETE /api/admin/reviews/:id
router.delete('/reviews/:id', async (req, res) => {
  try {
    await Review.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Review deleted' });
  } catch (err) { res.status(400).json({ success: false, message: err.message }); }
});

module.exports = router;
