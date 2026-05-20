/**
 * Add analytics-friendly data to an existing database (no wipe).
 * Run from backend/: npm run seed:analytics
 */
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const dns = require('dns');
const mongoose = require('mongoose');

if (typeof process.env.MONGODB_URI === 'string' && process.env.MONGODB_URI.startsWith('mongodb+srv://')) {
  try { dns.setServers(['1.1.1.1', '1.0.0.1', '8.8.8.8', '8.8.4.4']); } catch {}
}
const Product = require('../models/Product');
const User = require('../models/User');
const { Order } = require('../models/OrderReview');
const UserBehavior = require('../models/UserBehavior');

const {
  enrichProductsForAnalytics,
  seedHistoricalOrders,
  seedHistoricalReviews,
  seedUserBehaviors,
  seedFilterCoverageOrders,
  seedRichAnalyticsData,
} = require('./seedAnalyticsLib');

async function main() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('✅ Connected');

  const products = await Product.find({ is_active: true, is_draft: { $ne: true } }).lean();
  const users = await User.find({ role: 'user' }).lean();

  if (!products.length) {
    console.log('No products found. Run: npm run seed');
    process.exit(1);
  }
  if (!users.length) {
    console.log('No users found. Run: npm run seed');
    process.exit(1);
  }

  const orderCount = await Order.countDocuments();
  const behaviorCount = await UserBehavior.countDocuments();

  if (orderCount < 350) {
    console.log('📊 Seeding rich analytics dataset...');
    const result = await seedRichAnalyticsData({ savedProducts: products, normalUsers: users });
    console.log(`   Orders (total new): ~${result.orders}`);
    console.log(`   Reviews: +${result.reviews}`);
    console.log(`   Behaviors: +${result.behaviors}`);
  } else {
    console.log('📊 Enriching products & topping up analytics...');
    await enrichProductsForAnalytics(products);

    if (orderCount < 500) {
      const added = await seedHistoricalOrders({
        savedProducts: products,
        normalUsers: users,
        count: 120,
        daysBack: 365,
      });
      const coverage = await seedFilterCoverageOrders({
        savedProducts: products,
        normalUsers: users,
        daysBack: 365,
      });
      console.log(`   +${added.length} orders, +${coverage} coverage orders`);
    }

    if (behaviorCount < 80) {
      const added = await seedUserBehaviors({
        normalUsers: users,
        savedProducts: products,
        count: 80 - behaviorCount,
        daysBack: 90,
      });
      console.log(`   +${added} behaviors`);
    }

    await seedHistoricalReviews({
      savedProducts: products,
      normalUsers: users,
      count: 40,
      daysBack: 365,
    });
  }

  const activeDeals = await Product.countDocuments({
    is_deal: true,
    deal_ends_at: { $gt: new Date() },
    deal_stock_remaining: { $gt: 0 },
  });
  if (!activeDeals) {
    const dealConfigs = [
      { days: 7, stock: 39 },
      { days: 5, stock: 52 },
      { days: 10, stock: 18 },
      { days: 3, stock: 74 },
      { days: 14, stock: 25 },
    ];
    const candidates = await Product.find({ is_active: true, is_draft: { $ne: true } })
      .sort('-is_featured -ratings_avg')
      .limit(dealConfigs.length);
    for (let i = 0; i < candidates.length; i++) {
      const cfg = dealConfigs[i];
      const ends = new Date();
      ends.setDate(ends.getDate() + cfg.days);
      const total = cfg.stock + 25;
      await Product.findByIdAndUpdate(candidates[i]._id, {
        is_deal: true,
        deal_ends_at: ends,
        deal_stock_total: total,
        deal_stock_remaining: cfg.stock,
        deal_sort_order: i,
        compare_price: candidates[i].compare_price || Math.round(candidates[i].price * 1.25),
      });
    }
    console.log(`🏷️  Applied ${candidates.length} weekly deals`);
  }

  const finalOrders = await Order.countDocuments();
  console.log(`\n✅ Analytics seed complete (${finalOrders} orders in DB)`);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
