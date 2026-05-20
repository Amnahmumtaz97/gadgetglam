const Product = require('../models/Product');
const { Order, Review } = require('../models/OrderReview');
const UserBehavior = require('../models/UserBehavior');

const SEARCH_QUERIES = [
  'iphone 15 case', 'magsafe case', 'samsung s24 cover', '65w charger',
  'wireless earbuds', 'screen guard', 'usb c cable', 'power bank',
  'clear case', 'fast charger pakistan', 'airpods case', 'travel bundle',
  'galaxy a54 case', 'privacy screen guard', 'gan charger', 'cable pack',
  'bluetooth earbuds', 'phone bundle', 'tempered glass', 'car charger',
];

const { SHOP_CATEGORIES: SEED_CATEGORIES } = require('../constants/categories');
const SEED_ORDER_STATUSES = ['Pending', 'Confirmed', 'Dispatched', 'Delivered', 'Cancelled'];
const COVERAGE_RANGES = [7, 30, 90, 365];

function randomPastDate(daysBack = 90) {
  const end = Date.now();
  const start = end - daysBack * 86400000;
  return new Date(start + Math.floor(Math.random() * (end - start)));
}

/** More orders in recent weeks (better 7d / 30d charts). */
function randomWeightedPastDate(daysBack = 365) {
  const end = Date.now();
  const start = end - daysBack * 86400000;
  const bias = Math.pow(Math.random(), 0.5);
  return new Date(start + bias * (end - start));
}

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function pickUniqueProducts(products, count) {
  const pool = [...products];
  const chosen = [];
  for (let i = 0; i < count && pool.length; i++) {
    const idx = Math.floor(Math.random() * pool.length);
    chosen.push(pool.splice(idx, 1)[0]);
  }
  return chosen;
}

function orderStatusPair() {
  const roll = Math.random();
  if (roll < 0.48) return { payment_status: 'Paid', order_status: 'Delivered' };
  if (roll < 0.60) return { payment_status: 'Paid', order_status: 'Dispatched' };
  if (roll < 0.68) return { payment_status: 'Paid', order_status: 'Confirmed' };
  if (roll < 0.74) return { payment_status: 'Paid', order_status: 'Processing' };
  if (roll < 0.80) return { payment_status: 'Paid', order_status: 'Shipped' };
  if (roll < 0.88) return { payment_status: 'Unpaid', order_status: 'Pending' };
  if (roll < 0.94) return { payment_status: 'Refunded', order_status: 'Cancelled' };
  return { payment_status: 'Unpaid', order_status: 'Cancelled' };
}

function paymentForOrderStatus(orderStatus) {
  if (orderStatus === 'Delivered' || orderStatus === 'Dispatched' || orderStatus === 'Confirmed') {
    return 'Paid';
  }
  if (orderStatus === 'Cancelled') {
    return Math.random() < 0.7 ? 'Refunded' : 'Unpaid';
  }
  return Math.random() < 0.4 ? 'Paid' : 'Unpaid';
}

async function stampDocumentTimestamps(Model, id, when) {
  await Model.collection.updateOne(
    { _id: id },
    { $set: { createdAt: when, updatedAt: when } }
  );
}

async function createOrder({ normalUsers, products, when, order_status, payment_status }) {
  const paymentMethods = ['COD', 'JazzCash', 'EasyPaisa'];
  const cities = ['Karachi', 'Lahore', 'Islamabad', 'Rawalpindi', 'Faisalabad', 'Multan', 'Hyderabad', 'Peshawar'];
  const streets = ['Main Street', 'Market Road', 'DHA Phase', 'Gulshan Block', 'Model Town', 'Clifton', 'F-Block', 'Johar Town'];

  const lineItems = Array.isArray(products) ? products : [products];
  const orderProducts = [];
  let totalPrice = 0;

  for (const p of lineItems) {
    const qty = Math.floor(Math.random() * 3) + 1;
    orderProducts.push({
      product_id: p._id,
      name: p.name,
      thumbnail: p.thumbnail,
      quantity: qty,
      price: p.price,
      affiliate_link: p.affiliate_link,
    });
    totalPrice += p.price * qty;
  }

  const statuses = order_status
    ? { order_status, payment_status: payment_status || paymentForOrderStatus(order_status) }
    : orderStatusPair();

  const order = await Order.create({
    user_id: pick(normalUsers)._id,
    products: orderProducts,
    total_price: totalPrice,
    payment_method: pick(paymentMethods),
    payment_status: statuses.payment_status,
    order_status: statuses.order_status,
    tracking_number: `GG-${when.toISOString().slice(0, 10).replace(/-/g, '')}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
    shipping_address: {
      street: `${Math.floor(Math.random() * 200) + 1} ${pick(streets)}`,
      city: pick(cities),
      zip: String(Math.floor(Math.random() * 90000) + 10000),
      country: 'Pakistan',
    },
  });

  await stampDocumentTimestamps(Order, order._id, when);
  return order;
}

async function enrichProductsForAnalytics(savedProducts) {
  const stockPool = ['In Stock', 'In Stock', 'In Stock', 'Limited', 'Limited', 'Out of Stock'];
  const updates = savedProducts.map((p, index) => {
    let views = Math.floor(Math.random() * 120) + 10;
    let stock_status = stockPool[index % stockPool.length];

    if (index < 15) views = 800 + Math.floor(Math.random() * 2200);
    else if (index < 35) views = 250 + Math.floor(Math.random() * 650);

    if (/iphone|magsafe|case/i.test(`${p.name} ${p.category}`)) {
      if (stock_status === 'In Stock' && Math.random() < 0.4) stock_status = 'Limited';
      views += 180;
    }
    if (/transparent|clear/i.test(`${p.name}`)) views += 90;

    return Product.findByIdAndUpdate(p._id, { views, stock_status }, { new: true });
  });
  return Promise.all(updates);
}

async function seedHistoricalOrders({ savedProducts, normalUsers, count = 450, daysBack = 365 }) {
  const savedOrders = [];

  for (let i = 0; i < count; i++) {
    const lineItems = pickUniqueProducts(savedProducts, Math.floor(Math.random() * 3) + 1);
    const when = randomWeightedPastDate(daysBack);
    const order = await createOrder({ normalUsers, products: lineItems, when });
    savedOrders.push(order);
  }

  return savedOrders;
}

/** Extra orders so every filter dropdown returns meaningful charts. */
async function seedFilterCoverageOrders({ savedProducts, normalUsers, daysBack = 365 }) {
  let created = 0;

  // Ensure each category has sales across all dashboard ranges.
  for (const category of SEED_CATEGORIES) {
    const catProducts = savedProducts.filter((p) => p.category === category);
    if (!catProducts.length) continue;

    for (let i = 0; i < COVERAGE_RANGES.length; i++) {
      const when = randomWeightedPastDate(Math.min(daysBack, COVERAGE_RANGES[i]));
      const orderStatus = SEED_ORDER_STATUSES[(i + category.length) % SEED_ORDER_STATUSES.length];
      await createOrder({
        normalUsers,
        products: pick(catProducts),
        when,
        order_status: orderStatus,
        payment_status: paymentForOrderStatus(orderStatus),
      });
      created++;
    }
  }

  // Ensure every supported order status exists in the analytics time window.
  for (const orderStatus of SEED_ORDER_STATUSES) {
    for (const rangeDays of COVERAGE_RANGES) {
      const when = randomWeightedPastDate(Math.min(daysBack, rangeDays));
      await createOrder({
        normalUsers,
        products: pick(savedProducts),
        when,
        order_status: orderStatus,
        payment_status: paymentForOrderStatus(orderStatus),
      });
      created++;
    }
  }

  return created;
}

async function seedHistoricalReviews({ savedProducts, normalUsers, count = 200, daysBack = 365 }) {
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

  let reviewCount = 0;
  for (let i = 0; i < count; i++) {
    const product = pick(savedProducts);
    const user = pick(normalUsers);
    const rating = Math.random() < 0.72
      ? Math.floor(Math.random() * 2) + 4
      : Math.floor(Math.random() * 3) + 1;

    const review = await Review.create({
      product_id: product._id,
      user_id: user._id,
      rating,
      title: `${product.category} review`,
      review_text: pick(reviewTexts),
      is_verified: Math.random() > 0.25,
      helpful_votes: Math.floor(Math.random() * 80),
    });

    await stampDocumentTimestamps(Review, review._id, randomWeightedPastDate(daysBack));
    reviewCount++;
  }

  return reviewCount;
}

async function seedUserBehaviors({ normalUsers, savedProducts, count = 120, daysBack = 90 }) {
  let created = 0;

  // Guarantee that every search suggestion appears at least once.
  for (let i = 0; i < SEARCH_QUERIES.length; i++) {
    const user = normalUsers[i % normalUsers.length];
    const viewedProducts = pickUniqueProducts(savedProducts, 4);
    const viewed = viewedProducts.map((p) => p._id);
    const clicked = viewedProducts.slice(0, 2).map((p) => p._id);
    const recommended = pickUniqueProducts(savedProducts, 2).map((p) => p._id);
    const behavior = await UserBehavior.create({
      user_id: user._id,
      session_id: `seed-search-${i}-${user._id}`,
      viewed_products: viewed,
      clicked_products: clicked,
      recommended_products: recommended,
      search_queries: [SEARCH_QUERIES[i]],
      last_cart_activity: randomWeightedPastDate(21),
      checkout_started_at: i % 3 === 0 ? randomWeightedPastDate(14) : undefined,
    });

    await stampDocumentTimestamps(UserBehavior, behavior._id, randomWeightedPastDate(Math.min(daysBack, 30)));
    created++;
  }

  for (let i = 0; i < count; i++) {
    const user = pick(normalUsers);
    const viewedProducts = pickUniqueProducts(savedProducts, Math.floor(Math.random() * 6) + 2);
    const viewed = viewedProducts.map((p) => p._id);
    const clicked = pickUniqueProducts(
      viewedProducts,
      Math.min(3, viewedProducts.length)
    ).map((p) => p._id);
    const recommended = pickUniqueProducts(savedProducts, Math.floor(Math.random() * 4) + 1).map((p) => p._id);
    const when = randomWeightedPastDate(daysBack);

    const behavior = await UserBehavior.create({
      user_id: user._id,
      session_id: `seed-session-${i}-${user._id}`,
      viewed_products: viewed,
      clicked_products: clicked.length ? clicked : viewed.slice(0, 2),
      recommended_products: recommended,
      search_queries: Array.from(
        { length: Math.floor(Math.random() * 5) + 2 },
        () => pick(SEARCH_QUERIES)
      ),
      last_cart_activity: Math.random() > 0.35 ? randomWeightedPastDate(21) : undefined,
      checkout_started_at: Math.random() > 0.5 ? randomWeightedPastDate(14) : undefined,
    });

    await stampDocumentTimestamps(UserBehavior, behavior._id, when);
    created++;
  }

  return created;
}

async function seedRichAnalyticsData({ savedProducts, normalUsers }) {
  await enrichProductsForAnalytics(savedProducts);
  const orders = await seedHistoricalOrders({
    savedProducts,
    normalUsers,
    count: 480,
    daysBack: 365,
  });
  const coverage = await seedFilterCoverageOrders({
    savedProducts,
    normalUsers,
    daysBack: 365,
  });
  const reviews = await seedHistoricalReviews({
    savedProducts,
    normalUsers,
    count: 220,
    daysBack: 365,
  });
  const behaviors = await seedUserBehaviors({
    normalUsers,
    savedProducts,
    count: 130,
    daysBack: 90,
  });

  return {
    orders: orders.length + coverage,
    reviews,
    behaviors,
  };
}

module.exports = {
  enrichProductsForAnalytics,
  seedHistoricalOrders,
  seedHistoricalReviews,
  seedUserBehaviors,
  seedFilterCoverageOrders,
  seedRichAnalyticsData,
};
