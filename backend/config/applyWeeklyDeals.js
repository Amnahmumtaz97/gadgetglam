/**
 * Apply time-limited deals to existing products without full reseed.
 * Run: node config/applyWeeklyDeals.js  (from backend folder)
 */
require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('../models/Product');

async function applyWeeklyDeals() {
  await mongoose.connect(process.env.MONGODB_URI);
  const products = await Product.find({ is_active: true, is_draft: { $ne: true } })
    .sort('-is_featured -ratings_avg')
    .limit(8);

  if (!products.length) {
    console.log('No products found.');
    process.exit(0);
  }

  const configs = [
    { days: 7, stock: 39 },
    { days: 5, stock: 52 },
    { days: 10, stock: 18 },
    { days: 3, stock: 74 },
    { days: 14, stock: 25 },
  ];

  for (let i = 0; i < Math.min(products.length, configs.length); i++) {
    const cfg = configs[i];
    const ends = new Date();
    ends.setDate(ends.getDate() + cfg.days);
    const total = cfg.stock + Math.floor(Math.random() * 30) + 10;

    await Product.findByIdAndUpdate(products[i]._id, {
      is_deal: true,
      deal_ends_at: ends,
      deal_stock_total: total,
      deal_stock_remaining: cfg.stock,
      deal_sort_order: i,
      compare_price: products[i].compare_price || Math.round(products[i].price * 1.25),
    });
    console.log(`✓ Deal: ${products[i].name} → ends ${ends.toLocaleString()}, stock ${cfg.stock}/${total}`);
  }

  console.log(`\nApplied ${Math.min(products.length, configs.length)} weekly deals.`);
  process.exit(0);
}

applyWeeklyDeals().catch((err) => {
  console.error(err);
  process.exit(1);
});
