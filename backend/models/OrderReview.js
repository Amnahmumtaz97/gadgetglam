const mongoose = require('mongoose');

function randomTrackingIntervalMs() {
  const minMs = 2 * 60 * 60 * 1000;
  const maxMs = 3 * 60 * 60 * 1000;
  return Math.floor(Math.random() * (maxMs - minMs + 1)) + minMs;
}

// ── ORDER ──────────────────────────────────────────────────
const OrderSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

  products: [{
    product_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    name:       String,
    thumbnail:  String,
    quantity:   { type: Number, default: 1 },
    price:      Number,
    affiliate_link: String
  }],

  total_price:    { type: Number, required: true },
  payment_method: { type: String, enum: ['JazzCash', 'EasyPaisa', 'PayPal', 'COD'], default: 'COD' },
  payment_status: { type: String, enum: ['Unpaid', 'Paid', 'Refunded'], default: 'Unpaid' },
  jazzcash_txn_ref:  { type: String },
  jazzcash_response: { type: String },
  order_status: {
    type: String,
    enum: ['Pending', 'Confirmed', 'Dispatched', 'Delivered', 'Cancelled', 'Processing', 'Shipped'],
    default: 'Pending'
  },
  auto_tracking_enabled: { type: Boolean, default: true },
  status_updated_at: {
    type: Date,
    default: Date.now
  },
  next_auto_status_at: {
    type: Date,
    default: () => new Date(Date.now() + randomTrackingIntervalMs())
  },
  shipping_address: { street: String, city: String, country: String, zip: String },
  tracking_number: String,
  notes: String

}, { timestamps: true });

// ── REVIEW ─────────────────────────────────────────────────
const ReviewSchema = new mongoose.Schema({
  product_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true, index: true },
  user_id:    { type: mongoose.Schema.Types.ObjectId, ref: 'User',    required: true },

  rating:      { type: Number, min: 1, max: 5, required: true },
  title:       { type: String, maxlength: 100 },
  review_text: { type: String, required: true, maxlength: 1000 },
  is_verified: { type: Boolean, default: false },
  helpful_votes: { type: Number, default: 0 }

}, { timestamps: true });

// After saving a review, update product avg rating
ReviewSchema.post('save', async function () {
  const Product = require('./Product');
  const stats = await mongoose.model('Review').aggregate([
    { $match: { product_id: this.product_id } },
    { $group: { _id: '$product_id', avg: { $avg: '$rating' }, count: { $sum: 1 } } }
  ]);
  if (stats.length > 0) {
    await Product.findByIdAndUpdate(this.product_id, {
      ratings_avg:   Math.round(stats[0].avg * 10) / 10,
      reviews_count: stats[0].count
    });
  }
});

module.exports = {
  Order:  mongoose.model('Order',  OrderSchema),
  Review: mongoose.model('Review', ReviewSchema)
};
