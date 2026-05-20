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

if (typeof process.env.MONGODB_URI === 'string' && process.env.MONGODB_URI.startsWith('mongodb+srv://')) {
  try { dns.setServers(['1.1.1.1', '1.0.0.1', '8.8.8.8', '8.8.4.4']); } catch {}
}

function randomWeightedPastDate(daysBack = 365) {
  const end = Date.now();
  const start = end - daysBack * 86400000;
  const bias = Math.pow(Math.random(), 0.5);
  return new Date(start + bias * (end - start));
}

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function uniquePairKey(productId, userId) {
  return `${productId}:${userId}`;
}

function buildReviewTitle(product) {
  const name = String(product?.name || 'Product');
  const category = String(product?.category || 'Product');
  return `${category} review - ${name}`.slice(0, 100);
}

function buildReviewText(product) {
  const reviewTexts = [
    'Excellent quality and fast delivery!',
    'Very satisfied with this product.',
    'Value for money, highly recommend.',
    'Great product, exceeded expectations.',
    'Perfect fit for my phone.',
    'Good product at reasonable price.',
    'Case feels premium and durable.',
    'Charger works exactly as advertised.',
    'Not as expected but still acceptable.',
    'Average quality for the price.',
    'MagSafe alignment is perfect.',
    'Would buy again from GadgetGlam.',
  ];
  return `${pick(reviewTexts)} ${String(product?.name || '').split(' ').slice(0, 4).join(' ')}`.trim().slice(0, 1000);
}

async function refreshProductRatings(productIds) {
  for (const productId of productIds) {
    const stats = await Review.aggregate([
      { $match: { product_id: productId } },
      { $group: { _id: '$product_id', avg: { $avg: '$rating' }, count: { $sum: 1 } } }
    ]);
    if (stats.length) {
      await Product.findByIdAndUpdate(productId, {
        ratings_avg: Math.round(stats[0].avg * 10) / 10,
        reviews_count: stats[0].count,
      });
    }
  }
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

  const desiredTotal = 220;
  const reviewsToAdd = Math.max(0, desiredTotal - existingReviews);
  if (!reviewsToAdd) {
    console.log(`Reviews already exist (${existingReviews}). No new review seed needed.`);
    await mongoose.disconnect();
    return;
  }

  const usedPairs = new Set(
    (await Review.find({}, 'product_id user_id').lean())
      .map((review) => uniquePairKey(String(review.product_id), String(review.user_id)))
  );

  const docs = [];
  const touchedProductIds = new Set();
  let attempts = 0;
  const maxAttempts = reviewsToAdd * 20;

  while (docs.length < reviewsToAdd && attempts < maxAttempts) {
    attempts += 1;
    const product = pick(savedProducts);
    const user = pick(normalUsers);
    const key = uniquePairKey(String(product._id), String(user._id));
    if (usedPairs.has(key)) continue;

    usedPairs.add(key);
    touchedProductIds.add(String(product._id));

    const rating = Math.random() < 0.72
      ? Math.floor(Math.random() * 2) + 4
      : Math.floor(Math.random() * 3) + 1;

    docs.push({
      product_id: product._id,
      user_id: user._id,
      rating,
      title: buildReviewTitle(product),
      review_text: buildReviewText(product),
      is_verified: Math.random() > 0.25,
      helpful_votes: Math.floor(Math.random() * 80),
      createdAt: randomWeightedPastDate(365),
      updatedAt: randomWeightedPastDate(365),
    });
  }

  if (!docs.length) {
    console.log('No new review documents were needed.');
    await mongoose.disconnect();
    return;
  }

  await Review.insertMany(docs, { ordered: false });
  await refreshProductRatings(touchedProductIds);

  console.log(`Inserted ${docs.length} seeded review(s).`);
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});