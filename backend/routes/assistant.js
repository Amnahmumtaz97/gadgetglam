const express = require('express');
const jwt = require('jsonwebtoken');
const OpenAI = require('openai');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const Product = require('../models/Product');
const User = require('../models/User');
const UserBehavior = require('../models/UserBehavior');
const { Order } = require('../models/OrderReview');

const router = express.Router();
const { PRODUCT_CATEGORIES: CATEGORIES } = require('../constants/categories');
const VALID_COUPONS = { GLAM10: { discountPercent: 10 } };
const AI_PROVIDER = String(process.env.AI_PROVIDER || 'openai').toLowerCase();
const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini';
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-1.5-flash';

let openaiClient = null;
let geminiClient = null;

function getOpenAIClient() {
  if (!process.env.OPENAI_API_KEY) return null;
  if (!openaiClient) {
    openaiClient = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return openaiClient;
}

function getGeminiClient() {
  if (!process.env.GEMINI_API_KEY) return null;
  if (!geminiClient) {
    geminiClient = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  }
  return geminiClient;
}

function resolveAIProvider() {
  const hasOpenAI = Boolean(process.env.OPENAI_API_KEY);
  const hasGemini = Boolean(process.env.GEMINI_API_KEY);

  if (AI_PROVIDER === 'gemini') {
    if (hasGemini) return { provider: 'gemini', model: GEMINI_MODEL };
    if (hasOpenAI) return { provider: 'openai', model: OPENAI_MODEL };
    return null;
  }

  if (AI_PROVIDER === 'openai') {
    if (hasOpenAI) return { provider: 'openai', model: OPENAI_MODEL };
    if (hasGemini) return { provider: 'gemini', model: GEMINI_MODEL };
    return null;
  }

  if (hasOpenAI) return { provider: 'openai', model: OPENAI_MODEL };
  if (hasGemini) return { provider: 'gemini', model: GEMINI_MODEL };
  return null;
}

async function generateSmartReply({ message, user, cart = [], recentConversation = [], intentHint, fallbackReply }) {
  const ai = resolveAIProvider();
  if (!ai) return null;

  try {
    const userProfile = user
      ? {
          name: `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'customer',
          role: user.role || 'customer'
        }
      : { role: 'guest' };

    const cartSummary = (cart || []).slice(0, 6).map(item => ({
      name: item.name,
      qty: item.qty || 1,
      price: item.price
    }));

    const systemPrompt = [
      'You are GadgetGlam shopping assistant for Pakistan.',
      'Be concise, practical, and friendly.',
      'Do not invent unavailable features or data.',
      'If order/account access is required, ask user to sign in.',
      'Payment methods supported: JazzCash, EasyPaisa, PayPal, COD.',
      'When the customer writes Urdu or Roman Urdu, reply in the same language if you are confident.',
      'Keep responses to 2-4 short sentences.'
    ].join(' ');

    const payload = {
      intentHint: intentHint || 'general',
      userProfile,
      categories: CATEGORIES,
      cartSummary,
      recentConversation: (recentConversation || []).slice(-10),
      message,
      fallbackReply: fallbackReply || null
    };

    if (ai.provider === 'gemini') {
      const client = getGeminiClient();
      if (!client) return null;

      const model = client.getGenerativeModel({
        model: GEMINI_MODEL,
        systemInstruction: systemPrompt
      });

      const result = await model.generateContent({
        contents: [
          {
            role: 'user',
            parts: [{ text: JSON.stringify(payload) }]
          }
        ],
        generationConfig: {
          temperature: 0.35,
          maxOutputTokens: 220
        }
      });

      const content = result?.response?.text?.();
      if (!content) return null;
      return String(content).trim();
    }

    const client = getOpenAIClient();
    if (!client) return null;

    const completion = await client.chat.completions.create({
      model: OPENAI_MODEL,
      temperature: 0.35,
      max_tokens: 220,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: JSON.stringify(payload) }
      ]
    });

    const content = completion?.choices?.[0]?.message?.content;
    if (!content) return null;
    return String(content).trim();
  } catch {
    return null;
  }
}

function buildRecentConversation(history = [], latestUserMessage = '') {
  const normalized = (history || []).filter(Boolean).slice(-10);
  if (latestUserMessage) normalized.push(`user: ${latestUserMessage}`);
  return normalized;
}

function appendConversationTurn(behavior, role, text) {
  if (!behavior || !text) return;
  if (!Array.isArray(behavior.conversation_history)) {
    behavior.conversation_history = [];
  }
  behavior.conversation_history.push(`${role}: ${String(text).slice(0, 350)}`);
  if (behavior.conversation_history.length > 40) {
    behavior.conversation_history = behavior.conversation_history.slice(-40);
  }
}

function getQuickRepliesForUser(user) {
  if (user?.role === 'admin') {
    return [
      'Show low-value orders',
      'Open Help Center',
      'Delete order with lowest price',
      'Where is my order?',
      'Recommend accessories for me',
      'What are payment methods?',
      'Contact support'
    ];
  }

  return [
    'Show me products under PKR 3000',
    'Find cases for iPhone 15',
    'Recommend accessories for me',
    'Where is my order?',
    'Apply coupon GLAM10',
    'What are payment methods?',
    'Open Help Center',
    'Contact support'
  ];
}

function isSupportIntent(message) {
  return /(help center|help|contact support|contact us|about us|faq|returns|refund|privacy|terms)/i.test(message || '');
}

function getSupportNavigation(message) {
  const text = String(message || '').toLowerCase();
  if (/contact support|contact us/.test(text)) return { reply: 'Opening the Contact page.', path: '/contact' };
  if (/about us/.test(text)) return { reply: 'Opening the About page.', path: '/about' };
  if (/faq/.test(text)) return { reply: 'Opening FAQ.', path: '/faq' };
  if (/returns|refund/.test(text)) return { reply: 'Opening Returns & Refunds.', path: '/returns' };
  if (/privacy/.test(text)) return { reply: 'Opening Privacy Policy.', path: '/privacy' };
  if (/terms/.test(text)) return { reply: 'Opening Terms of Service.', path: '/terms' };
  return { reply: 'Opening the Help Center.', path: '/help' };
}

function isAdminOpsIntent(message) {
  return /(delete order|lowest price order|show low-value orders|low value orders|admin orders|remove order)/i.test(message || '');
}

function isChitChatIntent(message) {
  const text = String(message || '').trim().toLowerCase();
  if (!text) return false;
  if (text.length <= 3) return true;
  return /(how are you|who are you|what can you do|thank you|thanks|ok thanks|good morning|good evening|good night|joke|tell me something nice|motivate|help me decide)/i.test(text);
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
    discovery: 0,
    discount: 0,
    comparison: 0,
    compatibility: 0
  };

  if (/shipping|delivery|return|refund|exchange|payment|pay|jazzcash|paypal|cod|easypaisa/.test(text)) scores.faq += 0.9;
  if (/where is my order|track|tracking|order status|status of order|my order/.test(text)) scores.tracking += 0.95;
  if (/add to cart|add |remove|delete from cart|coupon|checkout|abandoned cart|top item/.test(text)) scores.cart += 0.9;
  if (/recommend|recommendation|also bought|similar|trending|best for me|suggest|show trending/.test(text)) scores.recommendation += 0.92;
  if (/(find|search|looking for|products?|cases|chargers|cables|earphones|bundles|screen guards|price|under|below|above)/.test(text)) scores.discovery += 0.9;
  if (/(discount|discounts|deals?|offers?|sale|price off|\d+\s*%\s*off|on discount)/.test(text)) scores.discount += 0.95;
  if (/(compare|comparison|versus|vs\.?|which one|which is better|better option)/.test(text)) scores.comparison += 0.95;
  if (/(compatible|compatibility|works with|fit|fits|support|for iphone|for samsung|for galaxy|for pixel|device)/.test(text)) scores.compatibility += 0.9;

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

  if (phraseSimilarity('show discounts on chargers') >= 0.6 || containsNearWord('discount') || containsNearWord('deal') || containsNearWord('sale')) {
    scores.discount = Math.max(scores.discount, 0.9);
  }

  if (phraseSimilarity('apply coupon glam10') >= 0.6 || containsNearWord('coupon')) {
    scores.cart = Math.max(scores.cart, 0.85);
  }

  if (phraseSimilarity('compare items for me') >= 0.62 || containsNearWord('compare')) {
    scores.comparison = Math.max(scores.comparison, 0.9);
  }

  if (containsNearWord('compatible') || containsNearWord('iphone') || containsNearWord('samsung') || containsNearWord('pixel')) {
    scores.compatibility = Math.max(scores.compatibility, 0.86);
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
    .replace(/show me|find|search|products|product|under|below|less than|above|over|more than|with|rated|stars?|brand|from|for|me|please|pkr|rs\.?|\$|under budget|cheap|best rated|top rated|most popular/gi, ' ')
    .replace(/\b\d+\b/g, ' ')
    .replace(new RegExp(`\\b(${CATEGORIES.map(c => c.toLowerCase().replace(' ', '\\s+')).join('|')})\\b`, 'gi'), ' ')
    .replace(/\s+/g, ' ')
    .trim();

  const wantsTrending = /trending|popular|best sellers|bestselling|hot deals/.test(q);

  return {
    maxPrice: maxPriceMatch ? Number(maxPriceMatch[1]) : undefined,
    minPrice: minPriceMatch ? Number(minPriceMatch[1]) : undefined,
    minRating: ratingMatch ? Number(ratingMatch[1]) : undefined,
    category,
    brand,
    wantsTrending,
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

function isDiscountIntent(message) {
  return /(discount|discounts|deals?|offers?|sale|price off|\d+\s*%\s*off|off on|on discount)/i.test(message || '');
}

function isComparisonIntent(message) {
  return /(compare|comparison|versus|vs\.?|which one|which is better|better option)/i.test(message || '');
}

function isCompatibilityIntent(message) {
  return /(compatible|compatibility|works with|fit|fits|support|for iphone|for samsung|for galaxy|for pixel|device)/i.test(message || '');
}

function extractDeviceQuery(message) {
  const text = String(message || '');
  const direct = text.match(/\b(iPhone\s?\d{1,2}(?:\s?(?:Pro Max|Pro|Plus|Mini))?|Samsung\s?(?:Galaxy\s?)?[a-z0-9\s]{2,24}|Galaxy\s?[a-z0-9\s]{2,24}|Pixel\s?\d[a-z\s]{0,18})\b/i);
  if (direct?.[1]) return direct[1].replace(/\s+/g, ' ').trim();

  const relation = text.match(/(?:compatible with|works with|fit(?:s)?|support(?:s)?|for)\s+([a-z0-9\s+\-]{3,40})/i);
  return relation?.[1]?.replace(/\s+/g, ' ').trim() || '';
}

function productCompatibilityScore(product, device) {
  const target = String(device || '').toLowerCase();
  if (!target) return 0;

  const compatibility = (product.device_compatibility || []).map(item => String(item || '').toLowerCase());
  if (compatibility.some(item => item.includes(target) || target.includes(item))) return 1;

  const hay = [
    product.name,
    product.description,
    product.short_description,
    product.brand,
    product.category,
    ...(product.tags || [])
  ].filter(Boolean).join(' ').toLowerCase();

  const tokens = tokenize(target).filter(tok => !['phone', 'case', 'cover', 'for', 'with', 'device'].includes(tok));
  if (!tokens.length) return 0;
  const matched = tokens.reduce((sum, tok) => sum + (hay.includes(tok) ? 1 : 0), 0);
  return matched / tokens.length;
}

function summarizeProduct(product) {
  return {
    _id: product._id,
    name: product.name,
    slug: product.slug,
    price: product.price,
    compare_price: product.compare_price,
    brand: product.brand,
    category: product.category,
    images: product.images,
    thumbnail: product.thumbnail,
    ratings_avg: product.ratings_avg,
    reviews_count: product.reviews_count,
    stock_status: product.stock_status,
    device_compatibility: product.device_compatibility
  };
}

function comparisonScore(product) {
  const rating = Math.min(1, Number(product.ratings_avg || 0) / 5);
  const reviewSignal = Math.min(1, Math.log10(Number(product.reviews_count || 0) + 1) / 3);
  const value = product.compare_price && product.compare_price > product.price
    ? Math.min(1, (product.compare_price - product.price) / product.compare_price)
    : 0.25;
  const stock = product.stock_status === 'In Stock' ? 1 : product.stock_status === 'Limited' ? 0.45 : 0;
  return rating * 0.38 + reviewSignal * 0.18 + value * 0.24 + stock * 0.2;
}

async function getProductsForComparison({ text, compareItems = [] }) {
  const ids = (compareItems || []).map(item => item?._id || item?.product_id).filter(Boolean).slice(0, 3);
  if (ids.length >= 2) {
    const products = await Product.find({ _id: { $in: ids }, is_active: true }).lean();
    const ordered = ids.map(id => products.find(p => String(p._id) === String(id))).filter(Boolean);
    if (ordered.length >= 2) return ordered;
  }

  const parsed = parseDiscoveryQuery(text);
  const products = await Product.find({ is_active: true }).sort('-views -ratings_avg').limit(120).lean();
  return rankProductsForDiscovery(products, parsed).slice(0, 3);
}

async function buildComparisonResponse({ text, compareItems = [] }) {
  const products = await getProductsForComparison({ text, compareItems });
  if (products.length < 2) {
    return {
      reply: 'Pick at least two products using the Compare button, or ask me to compare specific items by name.',
      products: products.map(summarizeProduct),
      quickReplies: ['Show trending products', 'Find cases for iPhone 15', 'Recommend accessories for me']
    };
  }

  const ranked = products
    .map(product => ({ product, score: comparisonScore(product) }))
    .sort((a, b) => b.score - a.score);
  const winner = ranked[0].product;
  const bestValue = products
    .slice()
    .sort((a, b) => Number(a.price || 0) - Number(b.price || 0))[0];
  const items = products.map(product => ({
    ...summarizeProduct(product),
    comparisonNotes: [
      `${Number(product.ratings_avg || 0).toFixed(1)} rating`,
      product.stock_status,
      product.compare_price && product.compare_price > product.price
        ? `${Math.round(((product.compare_price - product.price) / product.compare_price) * 100)}% off`
        : 'standard price'
    ]
  }));

  return {
    reply: `${winner.name} is the strongest pick overall. ${bestValue._id.equals?.(winner._id) || String(bestValue._id) === String(winner._id) ? 'It also gives the best value.' : `${bestValue.name} is the lowest-price option.`}`,
    products: items,
    comparison: {
      items,
      winner: `${winner.name} balances rating, stock, and value best.`
    },
    quickReplies: ['Add top item to cart', 'Recommend a bundle for my cart', 'Check compatibility']
  };
}

async function buildCompatibilityResponse(text) {
  const device = extractDeviceQuery(text);
  if (!device) {
    return {
      reply: 'Tell me the device model, for example: "Is this compatible with iPhone 15 Pro?"',
      compatibility: { isCompatible: false, reason: 'Device model was not clear.' },
      quickReplies: ['Check iPhone 15 compatibility', 'Find cases for iPhone 15', 'Show compatible accessories']
    };
  }

  const products = await Product.find({ is_active: true }).sort('-views -ratings_avg').limit(160).lean();
  const ranked = products
    .map(product => ({ product, score: productCompatibilityScore(product, device) }))
    .filter(item => item.score >= 0.45)
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return comparisonScore(b.product) - comparisonScore(a.product);
    })
    .slice(0, 8);

  if (!ranked.length) {
    return {
      reply: `I could not confirm compatible products for ${device}. Try searching by the exact model or browse universal chargers/cables.`,
      compatibility: { isCompatible: false, reason: `No strong match found for ${device}.` },
      quickReplies: ['Show universal chargers', 'Show cables', 'Contact support']
    };
  }

  const top = ranked[0].product;
  return {
    reply: `Yes, I found ${ranked.length} products that look compatible with ${device}. Top match: ${top.name}.`,
    products: ranked.map(item => summarizeProduct(item.product)),
    compatibility: {
      isCompatible: true,
      device,
      reason: `${top.name} has the strongest compatibility match for ${device}.`
    },
    quickReplies: ['Compare items for me', 'Add top item to cart', 'Recommend a bundle for my cart']
  };
}

async function buildAssistantAnalytics() {
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const [sessions, activeProducts, searchBehaviors, recentOrders] = await Promise.all([
    UserBehavior.countDocuments({ updatedAt: { $gte: since } }),
    Product.countDocuments({ is_active: true }),
    UserBehavior.find({ updatedAt: { $gte: since } }, 'search_queries viewed_products clicked_products recommended_products last_cart_activity checkout_started_at').lean(),
    Order.find({ createdAt: { $gte: since } }, 'products.product_id products.name total_price').lean()
  ]);

  const searchCounts = new Map();
  const productSignals = new Map();

  for (const behavior of searchBehaviors) {
    for (const q of behavior.search_queries || []) {
      const key = String(q || '').trim().toLowerCase();
      if (key) searchCounts.set(key, (searchCounts.get(key) || 0) + 1);
    }
    for (const id of [...(behavior.viewed_products || []), ...(behavior.clicked_products || []), ...(behavior.recommended_products || [])]) {
      const key = String(id);
      productSignals.set(key, (productSignals.get(key) || 0) + 1);
    }
  }

  for (const order of recentOrders) {
    for (const item of order.products || []) {
      const key = String(item.product_id || '');
      if (key) productSignals.set(key, (productSignals.get(key) || 0) + 2);
    }
  }

  const trendingIds = [...productSignals.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6).map(([id]) => id);
  const trendingProducts = trendingIds.length
    ? await Product.find({ _id: { $in: trendingIds }, is_active: true }).lean()
    : [];

  return {
    sessions,
    activeProducts,
    topSearches: [...searchCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8).map(([query, count]) => ({ query, count })),
    trendingProducts: trendingProducts.map(summarizeProduct),
    insightCards: [
      searchCounts.size ? 'Search intent is active this month. Use top searches for SEO product copy.' : 'No strong search trends captured yet.',
      trendingProducts[0] ? `${trendingProducts[0].name} is receiving the strongest chatbot demand signal.` : 'Promote best sellers to generate chatbot demand signals.',
      'Chatbot stores behavior signals for recommendations, search learning, and abandoned cart nudges.'
    ]
  };
}

function parseDiscountQuery(message) {
  const q = String(message || '').toLowerCase();
  const category = CATEGORIES.find(cat => q.includes(cat.toLowerCase()));
  const asksCategories = /(which|what).*(categories?|category).*(discount|deal|offer|sale)|categories?.*(have|with).*(discount|deal|offer|sale)/i.test(q);

  const keyword = q
    .replace(/show|find|what|which|any|for|me|please|products?|items?|discount|discounts|deals?|offers?|sale|price|off|on|under|above|below|best|top|categories?|have|with|that|currently|available/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  return {
    category,
    keyword,
    asksCategories
  };
}

function faqIntent(message) {
  const m = (message || '').toLowerCase();
  if (/shipping|delivery/.test(m)) return 'shipping';
  if (/return|refund|exchange/.test(m)) return 'returns';
  if (/payment|pay|jazzcash|paypal|cod|easypaisa/.test(m)) return 'payment';
  return null;
}

function buildOrderTimeline(order) {
  const legacyMap = { Processing: 'Confirmed', Shipped: 'Dispatched' };
  const sequence = ['Pending', 'Confirmed', 'Dispatched', 'Delivered'];
  if (order.order_status === 'Cancelled') {
    return [
      { label: 'Pending', completed: true, current: false },
      { label: 'Cancelled', completed: true, current: true }
    ];
  }

  const normalizedStatus = legacyMap[order.order_status] || order.order_status;
  const idx = sequence.indexOf(normalizedStatus);
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

router.get('/status', (req, res) => {
  const ai = resolveAIProvider();
  const aiEnabled = Boolean(ai);
  res.json({
    success: true,
    aiEnabled,
    provider: ai?.provider || null,
    model: ai?.model || null,
    mode: aiEnabled ? `${ai.provider}+rules` : 'rules-only'
  });
});

router.get('/analytics', async (req, res) => {
  try {
    const user = await getOptionalUser(req);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Admin access required' });
    }

    const analytics = await buildAssistantAnalytics();
    return res.json({ success: true, analytics });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/chat', async (req, res) => {
  try {
    const user = await getOptionalUser(req);
    const { message, cart = [], compareItems = [], sessionId, lastCartActivity } = req.body;
    const resolvedSessionId = getOrCreateSessionId(sessionId);
    const text = String(message || '').trim();

    if (!text) {
      return res.status(400).json({ success: false, message: 'Message is required' });
    }

    const behavior = await upsertBehavior({ userId: user?._id, sessionId: resolvedSessionId });
    appendConversationTurn(behavior, 'user', text);
    await behavior.save();
    const recentConversation = buildRecentConversation(behavior.conversation_history, '');

    if (/^(hi|hello|hey|salam|aoa|assalam o alaikum)\b/i.test(text)) {
      return res.json({
        success: true,
        sessionId: resolvedSessionId,
        reply: 'Hi! I can help with product search, recommendations, order tracking, cart/coupons, FAQ answers, and support pages.',
        quickReplies: getQuickRepliesForUser(user)
      });
    }

    if (isSupportIntent(text)) {
      const navigation = getSupportNavigation(text);
      return res.json({
        success: true,
        sessionId: resolvedSessionId,
        reply: navigation.reply,
        action: { type: 'navigate', path: navigation.path },
        quickReplies: ['FAQ', 'Returns & Refunds', 'Contact support']
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

    if (isChitChatIntent(text)) {
      const fallbackReply = 'I am here for you. I can help you discover products, compare prices, track orders, and make checkout easier whenever you are ready.';
      const smartReply = await generateSmartReply({
        message: text,
        user,
        cart,
        recentConversation,
        intentHint: 'chitchat',
        fallbackReply
      });

      return res.json({
        success: true,
        sessionId: resolvedSessionId,
        reply: smartReply || fallbackReply,
        quickReplies: ['Show trending products', 'Recommend accessories for me', 'Show discounts on chargers']
      });
    }

    const intentScores = detectIntentScores(text);
    const orderedIntents = Object.entries(intentScores).sort((a, b) => b[1] - a[1]);
    const best = orderedIntents[0];
    const second = orderedIntents[1];
    const isLowConfidence = best[1] < 0.65;
    const isAmbiguous = best[1] > 0 && second[1] > 0 && (best[1] - second[1]) < 0.12;
    const isRecommendationHighConfidence = best[0] === 'recommendation' && best[1] >= 0.85;
    const isDiscountHighConfidence = best[0] === 'discount' && best[1] >= 0.85;

    if (isLowConfidence || (isAmbiguous && !isRecommendationHighConfidence && !isDiscountHighConfidence)) {
      const defaultReply = 'I can do that. Do you want product search, recommendations, order tracking, cart help, or FAQs?';
      const smartReply = await generateSmartReply({
        message: text,
        user,
        cart,
        recentConversation,
        intentHint: 'clarification',
        fallbackReply: defaultReply
      });
      return res.json({
        success: true,
        sessionId: resolvedSessionId,
        reply: smartReply || defaultReply,
        confidence: { topIntent: best[0], topScore: Number(best[1].toFixed(2)) },
        quickReplies: getQuickRepliesForUser(user)
      });
    }

    const confidentIntent = best[1] >= 0.78 ? best[0] : null;

    if (isComparisonIntent(text) || confidentIntent === 'comparison') {
      const comparison = await buildComparisonResponse({ text, compareItems });
      return res.json({
        success: true,
        sessionId: resolvedSessionId,
        ...comparison,
        confidence: {
          topIntent: best[0],
          topScore: Number(best[1].toFixed(2))
        }
      });
    }

    if (isCompatibilityIntent(text) || confidentIntent === 'compatibility') {
      const compatibility = await buildCompatibilityResponse(text);
      return res.json({
        success: true,
        sessionId: resolvedSessionId,
        ...compatibility,
        confidence: {
          topIntent: best[0],
          topScore: Number(best[1].toFixed(2))
        }
      });
    }

    const faq = faqIntent(text);
    if (faq) {
      const faqReplies = {
        shipping: 'Shipping is free above PKR 2,000 and usually takes 2-5 business days across Pakistan.',
        returns: 'You can request returns within 7 days for unused items in original packaging. Refunds are processed after quality check.',
        payment: 'We support JazzCash, EasyPaisa, PayPal, and Cash on Delivery (COD).'
      };
      const smartReply = await generateSmartReply({
        message: text,
        user,
        cart,
        recentConversation,
        intentHint: `faq_${faq}`,
        fallbackReply: faqReplies[faq]
      });
      return res.json({
        success: true,
        sessionId: resolvedSessionId,
        reply: smartReply || faqReplies[faq],
        quickReplies: ['Track my latest order', 'Show trending products', 'Open Help Center']
      });
    }

    if (isDiscountIntent(text) || confidentIntent === 'discount') {
      const parsed = parseDiscountQuery(text);
      const query = {
        is_active: true,
        is_draft: { $ne: true },
        compare_price: { $gt: 0 },
        $expr: { $gt: ['$compare_price', '$price'] }
      };

      if (parsed.category) {
        query.category = parsed.category;
      }

      if (parsed.keyword) {
        query.$or = [
          { name: new RegExp(parsed.keyword, 'i') },
          { description: new RegExp(parsed.keyword, 'i') },
          { brand: new RegExp(parsed.keyword, 'i') },
          { category: new RegExp(parsed.keyword, 'i') }
        ];
      }

      let products = await Product.find(query).limit(80).lean();
      if (!products.length && query.$or) {
        delete query.$or;
        products = await Product.find(query).limit(80).lean();
      }

      products = products
        .map(p => {
          const compare = Number(p.compare_price || 0);
          const current = Number(p.price || 0);
          const discountPercent = compare > current ? Math.round(((compare - current) / compare) * 100) : 0;
          return { ...p, discountPercent };
        })
        .filter(p => p.discountPercent > 0)
        .sort((a, b) => {
          if (b.discountPercent !== a.discountPercent) return b.discountPercent - a.discountPercent;
          if ((b.ratings_avg || 0) !== (a.ratings_avg || 0)) return (b.ratings_avg || 0) - (a.ratings_avg || 0);
          return (b.views || 0) - (a.views || 0);
        });

      if (!products.length) {
        return res.json({
          success: true,
          sessionId: resolvedSessionId,
          reply: 'I could not find active discounted items for that request right now. Try asking for discounts by category, like chargers or cases.',
          quickReplies: ['Show discounts on chargers', 'Show discounts on cases', 'Show trending products']
        });
      }

      if (parsed.asksCategories && !parsed.category) {
        const categoryMap = new Map();
        for (const p of products) {
          const cat = p.category || 'Other';
          const existing = categoryMap.get(cat) || { count: 0, maxDiscount: 0 };
          existing.count += 1;
          existing.maxDiscount = Math.max(existing.maxDiscount, p.discountPercent || 0);
          categoryMap.set(cat, existing);
        }

        const categories = [...categoryMap.entries()]
          .sort((a, b) => {
            if (b[1].maxDiscount !== a[1].maxDiscount) return b[1].maxDiscount - a[1].maxDiscount;
            return b[1].count - a[1].count;
          })
          .slice(0, 8)
          .map(([name, data]) => ({
            name,
            count: data.count,
            maxDiscount: data.maxDiscount
          }));

        const categoryText = categories
          .map(c => `${c.name} (${c.maxDiscount}% off, ${c.count} items)`)
          .join(', ');

        const previewProducts = products.slice(0, 8);

        return res.json({
          success: true,
          sessionId: resolvedSessionId,
          reply: `Categories with active discounts right now: ${categoryText}.`,
          categories,
          products: previewProducts,
          quickReplies: ['Show discounts on chargers', 'Show discounts on cases', 'Show top discounted items']
        });
      }

      products = products.slice(0, 10);

      const top = products[0];
      const scope = parsed.category ? ` in ${parsed.category}` : '';
      return res.json({
        success: true,
        sessionId: resolvedSessionId,
        reply: `Here are the best discounts${scope}. Top deal: ${top.name} at ${top.discountPercent}% off.`,
        products,
        quickReplies: ['Show more discounted items', 'Add top item to cart', 'Apply coupon GLAM10']
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
        quickReplies: ['Show order details page', 'Show recommended accessories', 'Open Help Center']
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
        quickReplies: ['Add top item to cart', 'Track my order', 'Show trending products']
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

      if (parsed.wantsTrending) {
        query.$or = query.$or || [];
      }

      if (parsed.freeText) {
        query.$or = [
          { name: new RegExp(parsed.freeText, 'i') },
          { description: new RegExp(parsed.freeText, 'i') },
          { brand: new RegExp(parsed.freeText, 'i') }
        ];
      }

      let products = await Product.find(query).limit(80).lean();
      if (parsed.wantsTrending) {
        products = await Product.find({ is_active: true }).sort('-views -ratings_avg').limit(80).lean();
      }
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
          ? ['Show trending products', 'Recommend accessories for me', 'Open Help Center']
          : ['Show trending products', 'Show me cases under PKR 5000', 'Contact support']
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

    const fallbackReply = 'I can help with product search, recommendations, order tracking, cart updates, coupons, and FAQs. Try: “show me chargers under 3000”.';
    const smartFallback = await generateSmartReply({
      message: text,
      user,
      cart,
      recentConversation,
      intentHint: 'general',
      fallbackReply
    });

    return res.json({
      success: true,
      sessionId: resolvedSessionId,
      reply: smartFallback || fallbackReply,
      quickReplies: getQuickRepliesForUser(user)
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
