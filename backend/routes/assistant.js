const express = require('express');
const jwt = require('jsonwebtoken');
const Product = require('../models/Product');
const User = require('../models/User');
const UserBehavior = require('../models/UserBehavior');
const { Order } = require('../models/OrderReview');

const router = express.Router();
const CATEGORIES = ['Cases', 'Chargers', 'Cables', 'Earphones', 'Screen Guards', 'Bundles', 'Other'];
const VALID_COUPONS = { GLAM10: { discountPercent: 10 } };

async function getOptionalUser(req) {
  const auth = req.headers.authorization || '';
  if (!auth.startsWith('Bearer ')) return null;

  try {
    const token = auth.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return await User.findById(decoded.id).select('-password');
  } catch {
    return null;
  }
}

function getOrCreateSessionId(sessionId) {
  if (sessionId && typeof sessionId === 'string') return sessionId.slice(0, 120);
  return `guest_${Date.now()}_${Math.floor(Math.random() * 100000)}`;
}

async function upsertBehavior({ userId, sessionId }) {
  const filter = userId ? { user_id: userId } : { session_id: sessionId };
  let behavior = await UserBehavior.findOne(filter);
  if (!behavior) {
    behavior = await UserBehavior.create({
      ...(userId ? { user_id: userId } : { session_id: sessionId }),
      viewed_products: [],
      clicked_products: [],
      search_queries: []
    });
  }
  return behavior;
}

function pushUniqueLimited(arr, value, limit = 50) {
  const existing = new Set((arr || []).map(v => String(v)));
  if (!existing.has(String(value))) {
    arr.push(value);
  }
  if (arr.length > limit) {
    arr.splice(0, arr.length - limit);
  }
  return arr;
}

function parseDiscoveryQuery(message) {
  const q = String(message || '').toLowerCase();

  const maxPriceMatch = q.match(/(?:under|below|less than)\s*(?:\$|pkr|rs\.?\s*)?(\d+)/i);
  const minPriceMatch = q.match(/(?:above|over|more than)\s*(?:\$|pkr|rs\.?\s*)?(\d+)/i);
  const ratingMatch = q.match(/(\d(?:\.\d)?)\s*\+?\s*star/i);

  const category = CATEGORIES.find(cat => q.includes(cat.toLowerCase()));

  let brand = null;
  const brandMatch = q.match(/(?:brand|from)\s+([a-z0-9\- ]{2,30})/i);
  if (brandMatch) brand = brandMatch[1].trim();

  const clean = q
    .replace(/show me|find|search|products|product|under|below|less than|above|over|more than|with|rated|stars?|brand|from|for|me|please|pkr|rs\.?|\$/gi, ' ')
    .replace(/\b\d+\b/g, ' ')
    .replace(new RegExp(`\\b(${CATEGORIES.map(c => c.toLowerCase().replace(' ', '\\s+')).join('|')})\\b`, 'gi'), ' ')
    .replace(/\s+/g, ' ')
    .trim();

  return {
    maxPrice: maxPriceMatch ? Number(maxPriceMatch[1]) : undefined,
    minPrice: minPriceMatch ? Number(minPriceMatch[1]) : undefined,
    minRating: ratingMatch ? Number(ratingMatch[1]) : undefined,
    category,
    brand,
    freeText: clean
  };
}

function isDiscoveryIntent(message) {
  return /(show me|find|search|looking for|under\s*\$|products?)/i.test(message || '');
}

function isRecommendationIntent(message) {
  return /(recommend|recommendation|also bought|similar|trending|best for me|suggest|show trending)/i.test(message || '');
}

function isTrackingIntent(message) {
  return /(where is my order|track|tracking|order status|status of order)/i.test(message || '');
}

function isCartIntent(message) {
  return /(add to cart|add |remove|delete from cart|apply coupon|coupon|checkout|abandoned cart)/i.test(message || '');
}

function faqIntent(message) {
  const m = (message || '').toLowerCase();
  if (/shipping|delivery/.test(m)) return 'shipping';
  if (/return|refund|exchange/.test(m)) return 'returns';
  if (/payment|pay|jazzcash|paypal|cod|easypaisa/.test(m)) return 'payment';
  return null;
}

function buildOrderTimeline(order) {
  const sequence = ['Pending', 'Processing', 'Shipped', 'Delivered'];
  if (order.order_status === 'Cancelled') {
    return [
      { label: 'Pending', completed: true, current: false },
      { label: 'Cancelled', completed: true, current: true }
    ];
  }

  const idx = sequence.indexOf(order.order_status);
  return sequence.map((step, i) => ({
    label: step,
    completed: i <= idx,
    current: i === idx
  }));
}

async function getRecommendations({ user, sessionId, cart = [] }) {
  const behavior = await UserBehavior.findOne(user ? { user_id: user._id } : { session_id: sessionId }).lean();

  const viewedOrClicked = [
    ...(behavior?.viewed_products || []),
    ...(behavior?.clicked_products || [])
  ].map(String);

  const orders = user
    ? await Order.find({ user_id: user._id }, 'products.product_id').lean()
    : [];

  const purchased = orders.flatMap(o => (o.products || []).map(p => String(p.product_id)));
  const personalIds = Array.from(new Set([...viewedOrClicked, ...purchased])).slice(-20);

  let personalized = [];
  if (personalIds.length) {
    const baseProducts = await Product.find({ _id: { $in: personalIds }, is_active: true }, 'category brand').lean();
    const categories = [...new Set(baseProducts.map(p => p.category).filter(Boolean))];
    const brands = [...new Set(baseProducts.map(p => p.brand).filter(Boolean))];

    personalized = await Product.find({
      is_active: true,
      ...(categories.length || brands.length
        ? { $or: [{ category: { $in: categories } }, { brand: { $in: brands } }] }
        : {})
    })
      .sort('-ratings_avg -views')
      .limit(6)
      .lean();
  }

  const trending = await Product.find({ is_active: true })
    .sort('-views -ratings_avg')
    .limit(6)
    .lean();

  let alsoBought = [];
  const cartIds = (cart || []).map(c => String(c._id || c.product_id)).filter(Boolean);
  if (cartIds.length) {
    const relatedOrders = await Order.find({ 'products.product_id': { $in: cartIds } }, 'products.product_id').lean();
    const counts = new Map();
    for (const o of relatedOrders) {
      for (const p of (o.products || [])) {
        const pid = String(p.product_id);
        if (!cartIds.includes(pid)) counts.set(pid, (counts.get(pid) || 0) + 1);
      }
    }
    const topAlsoBoughtIds = [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([id]) => id);

    if (topAlsoBoughtIds.length) {
      alsoBought = await Product.find({ _id: { $in: topAlsoBoughtIds }, is_active: true }).lean();
    }
  }

  return {
    personalized,
    trending,
    alsoBought
  };
}

async function saveLastRecommendedProducts({ user, sessionId, productIds = [] }) {
  const behavior = await upsertBehavior({ userId: user?._id, sessionId });
  behavior.recommended_products = productIds.slice(0, 12);
  await behavior.save();
}

async function getLastRecommendedProducts({ user, sessionId }) {
  const behavior = await UserBehavior.findOne(user ? { user_id: user._id } : { session_id: sessionId }).lean();
  return (behavior?.recommended_products || []).map(String);
}

router.post('/event', async (req, res) => {
  try {
    const user = await getOptionalUser(req);
    const { sessionId, type, productId, query } = req.body;
    const resolvedSessionId = getOrCreateSessionId(sessionId);

    const behavior = await upsertBehavior({ userId: user?._id, sessionId: resolvedSessionId });

    if (type === 'product_view' && productId) {
      pushUniqueLimited(behavior.viewed_products, productId);
    }

    if (type === 'product_click' && productId) {
      pushUniqueLimited(behavior.clicked_products, productId);
    }

    if (type === 'search' && query) {
      pushUniqueLimited(behavior.search_queries, String(query).slice(0, 120), 30);
    }

    if (type === 'cart_activity') {
      behavior.last_cart_activity = new Date();
    }

    if (type === 'checkout_started') {
      behavior.checkout_started_at = new Date();
    }

    await behavior.save();
    res.json({ success: true, sessionId: resolvedSessionId });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/suggestions', async (req, res) => {
  try {
    const q = String(req.query.q || '').trim();
    if (!q || q.length < 2) return res.json({ success: true, suggestions: [] });

    const products = await Product.find({
      is_active: true,
      $or: [
        { name: new RegExp(q, 'i') },
        { brand: new RegExp(q, 'i') },
        { category: new RegExp(q, 'i') }
      ]
    }, 'name brand category')
      .limit(8)
      .lean();

    const suggestions = products.map(p => `${p.name} ${p.brand ? `(${p.brand})` : ''}`.trim());
    res.json({ success: true, suggestions });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/product/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product || !product.is_active) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    res.json({ success: true, product });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/chat', async (req, res) => {
  try {
    const user = await getOptionalUser(req);
    const { message, cart = [], sessionId, lastCartActivity } = req.body;
    const resolvedSessionId = getOrCreateSessionId(sessionId);
    const text = String(message || '').trim();

    if (!text) {
      return res.status(400).json({ success: false, message: 'Message is required' });
    }

    const faq = faqIntent(text);
    if (faq) {
      const faqReplies = {
        shipping: 'Shipping is free above PKR 2,000 and usually takes 2-5 business days across Pakistan.',
        returns: 'You can request returns within 7 days for unused items in original packaging. Refunds are processed after quality check.',
        payment: 'We support JazzCash, EasyPaisa, PayPal, and Cash on Delivery (COD).'
      };
      return res.json({
        success: true,
        sessionId: resolvedSessionId,
        reply: faqReplies[faq],
        quickReplies: ['Track my latest order', 'Show trending products', 'Apply coupon GLAM10']
      });
    }

    if (isTrackingIntent(text)) {
      if (!user) {
        return res.json({
          success: true,
          sessionId: resolvedSessionId,
          reply: 'Please sign in to track your orders securely. Once logged in, ask “Where is my order?” again.',
          requiresAuth: true
        });
      }

      const orders = await Order.find({ user_id: user._id }).sort('-createdAt').limit(10).lean();
      if (!orders.length) {
        return res.json({ success: true, sessionId: resolvedSessionId, reply: 'No orders found on your account yet.' });
      }

      const idMatch = text.match(/(?:order|ref|#)\s*([a-z0-9\-]{4,})/i);
      let order = orders[0];
      if (idMatch) {
        const key = idMatch[1].toLowerCase();
        order = orders.find(o =>
          String(o._id).toLowerCase().includes(key) ||
          String(o.jazzcash_txn_ref || '').toLowerCase().includes(key)
        ) || order;
      }

      return res.json({
        success: true,
        sessionId: resolvedSessionId,
        reply: `Order #${String(order._id).slice(-8)} is currently ${order.order_status}.`,
        order: {
          id: order._id,
          status: order.order_status,
          paymentStatus: order.payment_status,
          total: order.total_price,
          trackingNumber: order.tracking_number || null,
          createdAt: order.createdAt,
          timeline: buildOrderTimeline(order)
        },
        quickReplies: ['Show order details page', 'Show recommended accessories']
      });
    }

    if (isCartIntent(text)) {
      const lower = text.toLowerCase();

      if (/apply coupon|coupon/.test(lower)) {
        const couponAfterKeyword = text.match(/coupon\s+([a-z0-9]{4,12})/i);
        const upperTokens = text.toUpperCase().split(/\s+/).filter(Boolean);
        const fallbackToken = upperTokens.reverse().find(t => /^[A-Z0-9]{4,12}$/.test(t) && t !== 'APPLY' && t !== 'COUPON');
        const code = (couponAfterKeyword?.[1] || fallbackToken || 'GLAM10').toUpperCase();
        const coupon = VALID_COUPONS[code];

        if (coupon) {
          return res.json({
            success: true,
            sessionId: resolvedSessionId,
            reply: `Coupon ${code} is valid. I can apply it to your cart now (${coupon.discountPercent}% off).`,
            action: { type: 'apply_coupon', code, discountPercent: coupon.discountPercent }
          });
        }

        return res.json({ success: true, sessionId: resolvedSessionId, reply: `Coupon ${code} is invalid. Try GLAM10 for 10% off.` });
      }

      if (/remove|delete/.test(lower)) {
        const requestedName = lower.replace(/remove|delete|from cart|item/g, '').trim();
        if (!requestedName) {
          return res.json({ success: true, sessionId: resolvedSessionId, reply: 'Tell me what to remove, for example: “remove charger from cart”.' });
        }

        const cartItem = (cart || []).find(item => String(item.name || '').toLowerCase().includes(requestedName));
        if (!cartItem) {
          return res.json({ success: true, sessionId: resolvedSessionId, reply: 'I could not find that item in your cart.' });
        }

        return res.json({
          success: true,
          sessionId: resolvedSessionId,
          reply: `Removed ${cartItem.name} from your cart.`,
          action: { type: 'remove_from_cart', productId: cartItem._id }
        });
      }

      if (/add/.test(lower)) {
        if (/add\s+top\s+item|add\s+top\s+product|add\s+first\s+item/i.test(lower)) {
          const lastRecommendedIds = await getLastRecommendedProducts({ user, sessionId: resolvedSessionId });
          if (lastRecommendedIds.length) {
            const topProduct = await Product.findOne({ _id: lastRecommendedIds[0], is_active: true });
            if (topProduct) {
              return res.json({
                success: true,
                sessionId: resolvedSessionId,
                reply: `Added 1 × ${topProduct.name} to your cart.`,
                action: { type: 'add_to_cart', productId: topProduct._id, quantity: 1 }
              });
            }
          }
          return res.json({
            success: true,
            sessionId: resolvedSessionId,
            reply: 'No recent recommendations found. Say “show trending products” first, then ask me to add top item.'
          });
        }

        const qtyMatch = lower.match(/add\s+(\d+)/i);
        const quantity = qtyMatch ? Number(qtyMatch[1]) : 1;
        const productQuery = lower
          .replace(/add\s+\d+/i, '')
          .replace(/add|to cart|please|item/gi, '')
          .trim();

        const product = await Product.findOne({
          is_active: true,
          $or: [
            { name: new RegExp(productQuery, 'i') },
            { brand: new RegExp(productQuery, 'i') }
          ]
        }).sort('-ratings_avg -views');

        if (!product) {
          return res.json({
            success: true,
            sessionId: resolvedSessionId,
            reply: 'I could not find that product. Try a more specific name like “add 1 Samsung fast charger”.'
          });
        }

        return res.json({
          success: true,
          sessionId: resolvedSessionId,
          reply: `Added ${quantity} × ${product.name} to your cart.`,
          action: { type: 'add_to_cart', productId: product._id, quantity }
        });
      }
    }

    if (isRecommendationIntent(text)) {
      const recs = await getRecommendations({ user, sessionId: resolvedSessionId, cart });
      const products = [
        ...recs.alsoBought,
        ...recs.personalized,
        ...recs.trending
      ]
        .filter((p, i, arr) => arr.findIndex(x => String(x._id) === String(p._id)) === i)
        .slice(0, 8);

      await saveLastRecommendedProducts({
        user,
        sessionId: resolvedSessionId,
        productIds: products.map(p => String(p._id))
      });

      return res.json({
        success: true,
        sessionId: resolvedSessionId,
        reply: 'Here are recommendations based on your behavior, purchases, and what is trending right now.',
        products,
        recommendationMeta: {
          basedOnBehavior: recs.personalized.length,
          trending: recs.trending.length,
          alsoBought: recs.alsoBought.length
        },
        quickReplies: ['Add top item to cart', 'Track my order', 'Show products under PKR 3000']
      });
    }

    if (isDiscoveryIntent(text)) {
      const parsed = parseDiscoveryQuery(text);
      const query = { is_active: true };

      if (parsed.category) query.category = parsed.category;
      if (parsed.brand) query.brand = new RegExp(parsed.brand, 'i');
      if (parsed.minPrice || parsed.maxPrice) {
        query.price = {};
        if (parsed.minPrice) query.price.$gte = parsed.minPrice;
        if (parsed.maxPrice) query.price.$lte = parsed.maxPrice;
      }

      if (parsed.freeText) {
        query.$or = [
          { name: new RegExp(parsed.freeText, 'i') },
          { description: new RegExp(parsed.freeText, 'i') },
          { brand: new RegExp(parsed.freeText, 'i') }
        ];
      }

      let products = await Product.find(query).sort('-ratings_avg -views').limit(10).lean();
      if (!products.length && query.$or) {
        delete query.$or;
        products = await Product.find(query).sort('-ratings_avg -views').limit(10).lean();
      }
      if (parsed.minRating) {
        products = products.filter(p => (p.ratings_avg || 0) >= parsed.minRating);
      }

      const reply = products.length
        ? `I found ${products.length} products${parsed.maxPrice ? ` under ${parsed.maxPrice}` : ''}.`
        : 'No matching products found. Try widening your filters or removing a brand/category constraint.';

      return res.json({
        success: true,
        sessionId: resolvedSessionId,
        reply,
        products,
        searchFilters: parsed,
        quickReplies: ['Show trending products', 'Recommend accessories for me', 'Apply coupon GLAM10']
      });
    }

    const now = Date.now();
    const lastActivity = lastCartActivity ? new Date(lastCartActivity).getTime() : null;
    if (Array.isArray(cart) && cart.length > 0 && lastActivity && now - lastActivity > 60 * 60 * 1000) {
      return res.json({
        success: true,
        sessionId: resolvedSessionId,
        reply: `You still have ${cart.length} item(s) in your cart. Complete checkout now before stock runs out.`,
        quickReplies: ['Take me to checkout', 'Apply coupon GLAM10']
      });
    }

    return res.json({
      success: true,
      sessionId: resolvedSessionId,
      reply: 'I can help with product search, recommendations, order tracking, cart updates, coupons, and FAQs. Try: “show me chargers under 3000”.',
      quickReplies: ['Show me products under PKR 3000', 'Where is my order?', 'What are payment methods?']
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
