const express = require('express');
const router = express.Router();
const { Review } = require('../models/OrderReview');
const { protect } = require('../middleware/auth');

router.get('/:productId', async (req, res) => {
  try {
    const reviews = await Review.find({ product_id: req.params.productId })
      .sort('-createdAt')
      .populate('user_id', 'first_name last_name avatar');
    res.json({ success: true, reviews });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.post('/:productId', protect, async (req, res) => {
  try {
    const existing = await Review.findOne({ product_id: req.params.productId, user_id: req.user._id });
    if (existing) return res.status(400).json({ success: false, message: 'You already reviewed this product' });
    const review = await Review.create({ ...req.body, product_id: req.params.productId, user_id: req.user._id });
    res.status(201).json({ success: true, review });
  } catch (err) { res.status(400).json({ success: false, message: err.message }); }
});

module.exports = router;
