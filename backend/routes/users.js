// ── users.js ──────────────────────────────────────────────
const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { protect } = require('../middleware/auth');

router.get('/profile', protect, (req, res) => res.json({ success: true, user: req.user }));

router.put('/profile', protect, async (req, res) => {
  try {
    const { first_name, last_name, shipping_address } = req.body;
    const user = await User.findByIdAndUpdate(req.user._id, { first_name, last_name, shipping_address }, { new: true });
    res.json({ success: true, user });
  } catch (err) { res.status(400).json({ success: false, message: err.message }); }
});

router.get('/wishlist', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('wishlist');
    res.json({ success: true, wishlist: user?.wishlist || [] });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.get('/reviews', protect, async (req, res) => {
  try {
    const { Review } = require('../models/OrderReview');
    const reviews = await Review.find({ user_id: req.user._id })
      .sort('-createdAt')
      .populate('product_id', 'name slug thumbnail');
    res.json({ success: true, reviews });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.post('/wishlist/:productId', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const idx = user.wishlist.indexOf(req.params.productId);
    if (idx > -1) user.wishlist.splice(idx, 1);
    else user.wishlist.push(req.params.productId);
    await user.save();
    res.json({ success: true, wishlist: user.wishlist });
  } catch (err) { res.status(400).json({ success: false, message: err.message }); }
});

module.exports = router;
