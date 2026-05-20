/**
 * Backfills review documents into the current database.
 * Run: node config/backfillSeededReviews.js
 */
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const dns = require('dns');
const mongoose = require('mongoose');
const Product = require('../models/Product');
const User = require('../models/User');
const { Review } = require('../models/OrderReview');
const { seedHistoricalReviews } = require('./seedAnalyticsLib');

if (typeof process.env.MONGODB_URI === 'string' && process.env.MONGODB_URI.startsWith('mongodb+srv://')) {
  try { dns.setServers(['1.1.1.1', '1.0.0.1', '8.8.8.8', '8.8.4.4']); } catch {}
}

async function main() {
  if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI missing in backend/.env');
  await mongoose.connect(process.env.MONGODB_URI);

  const [savedProducts, normalUsers, existingReviews] = await Promise.all([
    Product.find({ is_active: true }).sort({ createdAt: 1 }).lean(),
    User.find({ role: 'user' }).sort({ createdAt: 1 }).lean(),
    Review.countDocuments(),
  ]);

  if (!savedProducts.length) throw new Error('No products found. Seed products first.');
  if (!normalUsers.length) throw new Error('No customer users found. Seed users first.');

  const targetCount = existingReviews > 0 ? 0 : Math.min(220, savedProducts.length * normalUsers.length);
  if (targetCount === 0) {
    console.log(`Reviews already exist (${existingReviews}). No new review seed needed.`);
    await mongoose.disconnect();
    return;
  }

  const created = await seedHistoricalReviews({
    savedProducts,
    normalUsers,
    count: targetCount,
    daysBack: 365,
  });

  console.log(`Inserted ${created} seeded review(s).`);
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});