const express = require('express');
const jwt = require('jsonwebtoken');
const Product = require('../models/Product');
const User = require('../models/User');
const UserBehavior = require('../models/UserBehavior');
const { Order } = require('../models/OrderReview');

const router = express.Router();
const CATEGORIES = ['Cases', 'Chargers', 'Cables', 'Earphones', 'Screen Guards', 'Bundles', 'Other'];
const VALID_COUPONS = { GLAM10: { discountPercent: 10 } };

function getQuickRepliesForUser(user) {
  if (user?.role === 'admin') {
    return [
      'Show low-value orders',
      'Delete order with lowest price',
      'Where is my order?',
      'Recommend accessories for me',
      'What are payment methods?'
    ];
  }

  return [
    'Show me products under PKR 3000',
    'Recommend accessories for me',
    'Where is my order?',
    'Apply coupon GLAM10',
    'What are payment methods?'
  ];
}

function isAdminOpsIntent(message) {
  return /(delete order|lowest price order|show low-value orders|low value orders|admin orders|remove order)/i.test(message || '');
}

function levenshtein(a, b) {
  const s = String(a || '').toLowerCase();
  const t = String(b || '').toLowerCase();
  if (!s.length) return t.length;
  if (!t.length) return s.length;

  const matrix = Array.from({ length: s.length + 1 }, () => new Array(t.length + 1).fill(0));
  for (let i = 0; i <= s.length; i += 1) matrix[i][0] = i;
  for (let j = 0; j <= t.length; j += 1) matrix[0][j] = j;

  for (let i = 1; i <= s.length; i += 1) {
    for (let j = 1; j <= t.length; j += 1) {
      const cost = s[i - 1] === t[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      );
    }
  }

  return matrix[s.length][t.length];
}

function similarity(a, b) {
  const left = String(a || '').trim().toLowerCase();
  const right = String(b || '').trim().toLowerCase();
  if (!left || !right) return 0;
  if (left.includes(right) || right.includes(left)) return 0.95;
  const dist = levenshtein(left, right);
  const maxLen = Math.max(left.length, right.length) || 1;
  return Math.max(0, 1 - dist / maxLen);
}

function tokenize(text) {
  return String(text || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean)
    .filter(tok => tok.length > 1);
}

function rankProductsForDiscovery(products, parsed) {
  const qTokens = tokenize(parsed.freeText);

  return (products || [])
    .map(product => {
      const hay = [product.name, product.brand, product.category, product.description].filter(Boolean).join(' ').toLowerCase();
      const nameBrand = [product.name, product.brand].filter(Boolean).join(' ');

      let textScore = 0;
      if (!qTokens.length) {
        textScore = 0.6;
      } else {
        const tokenScore = qTokens.reduce((sum, tok) => {
          const direct = hay.includes(tok) ? 1 : 0;
          const fuzzy = Math.max(
            similarity(tok, product.name),
            similarity(tok, product.brand),
            similarity(tok, nameBrand)
          );
          return sum + Math.max(direct, fuzzy);
        }, 0) / qTokens.length;
        textScore = tokenScore;
      }

      const stockBoost = product.stock_status === 'In Stock' ? 1 : product.stock_status === 'Limited' ? 0.5 : 0;
      const ratingNorm = Math.min(1, Number(product.ratings_avg || 0) / 5);
      const viewsNorm = Math.min(1, Math.log10((Number(product.views || 0) + 1)) / 3);

      const score = textScore * 0.62 + stockBoost * 0.15 + ratingNorm * 0.16 + viewsNorm * 0.07;
      return { product, score };
    })
    .sort((a, b) => b.score - a.score)
    .map(x => x.product);
}

function detectIntentScores(message) {
  const text = String(message || '').toLowerCase();
  const normalized = text.replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
  const words = normalized.split(' ').filter(Boolean);
  const scores = {
    faq: 0,
    tracking: 0,
    cart: 0,
    recommendation: 0,
    discovery: 0
  };

  if (/shipping|delivery|return|refund|exchange|payment|pay|jazzcash|paypal|cod|easypaisa/.test(text)) scores.faq += 0.9;
  if (/where is my order|track|tracking|order status|status of order|my order/.test(text)) scores.tracking += 0.95;
  if (/add to cart|add |remove|delete from cart|coupon|checkout|abandoned cart|top item/.test(text)) scores.cart += 0.9;
  if (/recommend|recommendation|also bought|similar|trending|best for me|suggest|show trending/.test(text)) scores.recommendation += 0.92;
  if (/show me|find|search|looking for|under|below|above|products?|cases|chargers|cables|earphones|bundles/.test(text)) scores.discovery += 0.9;

  // Fuzzy rescue for typo-heavy phrases (e.g., "whre is my ordeer").
  const phraseSimilarity = (phrase) => similarity(normalized, phrase.toLowerCase());
  const containsNearWord = (target) => words.some(w => similarity(w, target) >= 0.72);

  if (phraseSimilarity('where is my order') >= 0.64 || (containsNearWord('order') && (containsNearWord('track') || containsNearWord('where') || containsNearWord('status')))) {
    scores.tracking = Math.max(scores.tracking, 0.93);
  }

  if (phraseSimilarity('show order details page') >= 0.62 || phraseSimilarity('open orders page') >= 0.62 || (containsNearWord('order') && containsNearWord('detail'))) {
    scores.tracking = Math.max(scores.tracking, 0.9);
  }

  if (phraseSimilarity('recommend accessories for me') >= 0.63 || containsNearWord('recommend') || containsNearWord('trending')) {
    scores.recommendation = Math.max(scores.recommendation, 0.88);
  }

  if (phraseSimilarity('show me products under 3000') >= 0.6 || (containsNearWord('show') && containsNearWord('product'))) {
    scores.discovery = Math.max(scores.discovery, 0.84);
  }

  if (phraseSimilarity('apply coupon glam10') >= 0.6 || containsNearWord('coupon')) {
    scores.cart = Math.max(scores.cart, 0.85);
  }

  return scores;
}

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
  return /(where is my order|track|tracking|order status|status of order|order details page|show order details|open orders page)/i.test(message || '');
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

    if (/^(hi|hello|hey|salam|aoa|assalam o alaikum)\b/i.test(text)) {
      return res.json({
        success: true,
        sessionId: resolvedSessionId,
        reply: 'Hi! I can help with product search, recommendations, order tracking, cart/coupons, and FAQs.',
        quickReplies: getQuickRepliesForUser(user)
      });
    }

    if (isAdminOpsIntent(text)) {
      if (!user || user.role !== 'admin') {
        return res.json({
          success: true,
          sessionId: resolvedSessionId,
          reply: 'That is an admin operation. Please sign in as admin to manage orders from chat.',
          quickReplies: ['Where is my order?', 'Show me products under PKR 3000', 'Recommend accessories for me']
        });
      }

      if (/delete order with lowest price|delete order lowest price|lowest price order/i.test(text)) {
        const target = await Order.findOne().sort('total_price createdAt');
        if (!target) {
          return res.json({ success: true, sessionId: resolvedSessionId, reply: 'No orders available to delete.' });
        }

        await Order.findByIdAndDelete(target._id);
        return res.json({
          success: true,
          sessionId: resolvedSessionId,
          reply: `Deleted order #${String(target._id).slice(-8)} with total PKR ${Number(target.total_price || 0).toLocaleString()}.`,
          quickReplies: ['Show low-value orders', 'Open orders page', 'Recommend accessories for me']
        });
      }

      if (/show low-value orders|low value orders/i.test(text)) {
        const lowOrders = await Order.find().sort('total_price createdAt').limit(5).lean();
        if (!lowOrders.length) {
          return res.json({ success: true, sessionId: resolvedSessionId, reply: 'No orders found.' });
        }

        const summary = lowOrders
          .map(o => `#${String(o._id).slice(-8)} - PKR ${Number(o.total_price || 0).toLocaleString()} (${o.order_status})`)
          .join('; ');

        return res.json({
          success: true,
          sessionId: resolvedSessionId,
          reply: `Lowest-value orders: ${summary}`,
          quickReplies: ['Delete order with lowest price', 'Open orders page']
        });
      }
    }

    const intentScores = detectIntentScores(text);
    const orderedIntents = Object.entries(intentScores).sort((a, b) => b[1] - a[1]);
    const best = orderedIntents[0];
    const second = orderedIntents[1];
    const isLowConfidence = best[1] < 0.65;
    const isAmbiguous = best[1] > 0 && second[1] > 0 && (best[1] - second[1]) < 0.12;

    if (isLowConfidence || isAmbiguous) {
      return res.json({
        success: true,
        sessionId: resolvedSessionId,
        reply: 'I can do that. Do you want product search, recommendations, order tracking, cart help, or FAQs?',
        confidence: { topIntent: best[0], topScore: Number(best[1].toFixed(2)) },
        quickReplies: getQuickRepliesForUser(user)
      });
    }

    const confidentIntent = best[1] >= 0.78 ? best[0] : null;

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

    if (isTrackingIntent(text) || confidentIntent === 'tracking') {
      if (/order details page|show order details|open orders page/i.test(text)) {
        return res.json({
          success: true,
          sessionId: resolvedSessionId,
          reply: 'Opening your order details page.',
          action: { type: 'navigate', path: '/orders' }
        });
      }

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

    if (isCartIntent(text) || confidentIntent === 'cart') {
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

        const candidates = await Product.find({ is_active: true }).limit(120).lean();
        const ranked = candidates
          .map(p => {
            const score = Math.max(
              similarity(productQuery, p.name),
              similarity(productQuery, p.brand),
              similarity(productQuery, `${p.brand || ''} ${p.name}`)
            );
            const stockBoost = p.stock_status === 'In Stock' ? 0.08 : 0;
            return { p, score: score + stockBoost };
          })
          .sort((a, b) => b.score - a.score);

        const product = ranked[0]?.score >= 0.45 ? ranked[0].p : null;

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

    if (isRecommendationIntent(text) || confidentIntent === 'recommendation') {
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

    if (isDiscoveryIntent(text) || confidentIntent === 'discovery') {
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

      let products = await Product.find(query).limit(80).lean();
      products = rankProductsForDiscovery(products, parsed).slice(0, 10);
      if (!products.length && query.$or) {
        delete query.$or;
        products = await Product.find(query).limit(80).lean();
        products = rankProductsForDiscovery(products, parsed).slice(0, 10);
      }
      if (parsed.minRating) {
        products = products.filter(p => (p.ratings_avg || 0) >= parsed.minRating);
      }

      const reply = products.length
        ? `I found ${products.length} products${parsed.maxPrice ? ` under ${parsed.maxPrice}` : ''}.`
        : 'No matching products found. Do you want me to broaden by category, brand, or price?';

      return res.json({
        success: true,
        sessionId: resolvedSessionId,
        reply,
        products,
        confidence: {
          topIntent: best[0],
          topScore: Number(best[1].toFixed(2))
        },
        searchFilters: parsed,
        quickReplies: products.length
          ? ['Show trending products', 'Recommend accessories for me', 'Apply coupon GLAM10']
          : ['Show trending products', 'Show me cases under PKR 5000', 'Recommend accessories for me']
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
      quickReplies: getQuickRepliesForUser(user)
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
