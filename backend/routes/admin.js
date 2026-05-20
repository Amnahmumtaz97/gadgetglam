const express = require('express');
const router = express.Router();
const OpenAI = require('openai');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const Product = require('../models/Product');
const User = require('../models/User');
const UserBehavior = require('../models/UserBehavior');
const { Order, Review } = require('../models/OrderReview');
const { protect, adminOnly } = require('../middleware/auth');

const { PRODUCT_CATEGORIES: CATEGORIES } = require('../constants/categories');
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

function safeJsonParse(raw) {
  try {
    return JSON.parse(raw);
  } catch {
    const start = String(raw || '').indexOf('{');
    const end = String(raw || '').lastIndexOf('}');
    if (start === -1 || end === -1 || end <= start) return null;
    try {
      return JSON.parse(String(raw).slice(start, end + 1));
    } catch {
      return null;
    }
  }
}

function buildDraftFromInput({ title, description }) {
  const cleanTitle = String(title || '').trim();
  const cleanDescription = String(description || '').trim();
  const combined = `${cleanTitle} ${cleanDescription}`.toLowerCase();
  const fallbackTitle = cleanTitle || cleanDescription.split(/[.!?\n]/)[0].trim().slice(0, 120) || 'Product Draft';
  const shortDescription = (cleanDescription || `${fallbackTitle} with dependable build quality and practical everyday value.`)
    .replace(/\s+/g, ' ')
    .slice(0, 220);
  const finalDescription = cleanDescription || [
    `${fallbackTitle} is designed for users who want reliable performance and clean aesthetics.`,
    `It balances durability, usability, and value for everyday use.`
  ].join('\n\n');

  const tokenized = `${cleanTitle} ${cleanDescription}`
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean)
    .filter(word => word.length > 2)
    .slice(0, 12);
  const tags = Array.from(new Set(tokenized)).slice(0, 8);

  let inferredCategory = 'Other';
  if (/case|cover|bumper|silicone/.test(combined)) inferredCategory = 'Cases';
  else if (/charger|charging|adapter|power brick|fast charge/.test(combined)) inferredCategory = 'Chargers';
  else if (/cable|usb c|lightning cable|type c/.test(combined)) inferredCategory = 'Cables';
  else if (/earphone|earbud|headphone|airpods|audio/.test(combined)) inferredCategory = 'Earphones';
  else if (/screen guard|tempered glass|protector/.test(combined)) inferredCategory = 'Screen Guards';
  else if (/bundle|combo|kit|pack/.test(combined)) inferredCategory = 'Bundles';

  return {
    name: fallbackTitle,
    category: inferredCategory,
    short_description: shortDescription,
    description: finalDescription,
    tags,
    seo: {
      meta_title: `${fallbackTitle} | GadgetGlam`.slice(0, 70),
      meta_description: shortDescription.slice(0, 160),
      meta_keywords: tags
    }
  };
}

function slugifyForUrl(value = '') {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 120);
}

function splitList(value) {
  if (Array.isArray(value)) return value.map((item) => String(item).trim()).filter(Boolean);
  return String(value || '')
    .split(',')
    .map((item) => String(item).trim())
    .filter(Boolean);
}

function inferBrand(text = '', category = '') {
  const combined = `${text} ${category}`.toLowerCase();
  if (/glassguard|screen guard|protector/.test(combined)) return 'GlassGuard';
  if (/armormax|armor|rugged/.test(combined)) return 'ArmorMax';
  if (/clearshield|clear/.test(combined)) return 'ClearShield';
  if (/magsafe|mag/.test(combined)) return 'MagClear';
  if (/leather|wallet/.test(combined)) return 'LuxeCase';
  if (/charger|power/.test(combined)) return 'PowerPro';
  if (/speaker|audio|headphone|earbud|earphone/.test(combined)) return 'SoundPro';
  return 'GadgetGlam';
}

function inferCompatibility(text = '') {
  const combined = String(text || '').toLowerCase();
  if (/iphone 15 pro max/.test(combined)) return ['iPhone 15 Pro Max'];
  if (/iphone 15 pro/.test(combined)) return ['iPhone 15 Pro'];
  if (/iphone 15/.test(combined)) return ['iPhone 15'];
  if (/iphone 14 pro max/.test(combined)) return ['iPhone 14 Pro Max'];
  if (/iphone 14/.test(combined)) return ['iPhone 14'];
  if (/samsung galaxy s24/.test(combined)) return ['Samsung Galaxy S24'];
  if (/samsung galaxy a54/.test(combined)) return ['Samsung Galaxy A54'];
  if (/samsung galaxy a34/.test(combined)) return ['Samsung Galaxy A34'];
  return ['Universal'];
}

function estimatePrice({ title = '', description = '', category = '', price, compare_price }) {
  const numericPrice = Number(price);
  if (Number.isFinite(numericPrice) && numericPrice > 0) return numericPrice;

  const combined = `${title} ${description}`.toLowerCase();
  if (/bundle|kit|combo/.test(combined)) return 2999;
  if (/watch|smart watch|smartwatch/.test(combined)) return 7499;
  if (/speaker|headphone|earbud|earphone/.test(combined)) return 3999;
  if (/charger|adapter|power bank/.test(combined)) return 1899;
  if (/case|cover|screen guard|protector/.test(combined)) return 999;
  if (/cable/.test(combined)) return 699;
  if (category === 'Bundles') return 2999;

  const numericCompare = Number(compare_price);
  if (Number.isFinite(numericCompare) && numericCompare > 0) return Math.max(499, Math.round(numericCompare / 1.25));
  return 1499;
}

function makeAiImageSet(title = '', category = 'Other') {
  const query = [title, category, 'mobile accessory', 'product photography']
    .map((part) => String(part || '').trim())
    .filter(Boolean)
    .join(',');
  const base = `https://source.unsplash.com/1200x900/?${encodeURIComponent(query)}`;
  return {
    thumbnail: `${base}&sig=1`,
    images: [`${base}&sig=2`, `${base}&sig=3`, `${base}&sig=4`],
  };
}

function normalizeAiProductDraft(input = {}, draft = {}) {
  const title = String(input.title || draft.name || '').trim();
  const description = String(input.description || draft.description || '').trim();
  const category = CATEGORIES.includes(String(input.category || draft.category || ''))
    ? String(input.category || draft.category)
    : draft.category || 'Other';
  const imageSet = makeAiImageSet(title || draft.name, category);
  const draftPrice = estimatePrice({
    title,
    description,
    category,
    price: input.price ?? draft.price,
    compare_price: input.compare_price ?? draft.compare_price,
  });
  const manualImages = splitList(input.images);
  const manualCompat = splitList(input.device_compatibility);
  const manualTags = splitList(input.tags);
  const manualSeoKeywords = splitList(input.seo_meta_keywords || input?.seo?.meta_keywords);
  const manualCanonicalUrl = String(input.seo_canonical_url || input?.seo?.canonical_url || '').trim();
  const manualOgImage = String(input.seo_og_image || input?.seo?.og_image || '').trim();
  const slug = slugifyForUrl(title || draft.name || 'product-draft');

  const tags = Array.from(new Set([
    ...manualTags,
    ...(draft.tags || []),
    category.toLowerCase(),
    inferBrand(`${title} ${description}`, category).toLowerCase(),
  ].filter(Boolean))).slice(0, 10);

  const comparePrice = Number(input.compare_price ?? draft.compare_price);

  return {
    name: title || draft.name || 'Product Draft',
    description: description || draft.description || '',
    short_description: String(input.short_description || draft.short_description || '').trim(),
    price: draftPrice,
    compare_price: Number.isFinite(comparePrice) && comparePrice > draftPrice ? comparePrice : Math.max(draftPrice + Math.round(draftPrice * 0.25), draftPrice + 200),
    brand: String(input.brand || draft.brand || inferBrand(`${title} ${description}`, category)).trim(),
    category,
    stock_status: ['In Stock', 'Limited', 'Out of Stock'].includes(String(input.stock_status || draft.stock_status || ''))
      ? String(input.stock_status || draft.stock_status)
      : 'In Stock',
    thumbnail: String(input.thumbnail || draft.thumbnail || imageSet.thumbnail).trim(),
    images: manualImages.length ? manualImages : (draft.images && draft.images.length ? draft.images : imageSet.images),
    affiliate_link: String(input.affiliate_link || draft.affiliate_link || 'https://www.daraz.pk').trim() || 'https://www.daraz.pk',
    affiliate_platform: String(input.affiliate_platform || draft.affiliate_platform || 'Daraz').trim() || 'Daraz',
    device_compatibility: manualCompat.length ? manualCompat : (draft.device_compatibility && draft.device_compatibility.length ? draft.device_compatibility : inferCompatibility(`${title} ${description}`)),
    tags,
    is_featured: Boolean(input.is_featured ?? draft.is_featured ?? false),
    is_draft: true,
    seo: {
      meta_title: String(input.seo_meta_title || draft?.seo?.meta_title || `${title || draft.name || 'Product'} | GadgetGlam`).trim().slice(0, 70),
      meta_description: String(input.seo_meta_description || draft?.seo?.meta_description || draft.short_description || description || '').trim().slice(0, 160),
      meta_keywords: manualSeoKeywords.length ? manualSeoKeywords : (draft?.seo?.meta_keywords || tags).slice(0, 12),
      canonical_url: manualCanonicalUrl || `https://gadgetglam.pk/products/${slug}`,
      og_image: manualOgImage || String(input.thumbnail || draft.thumbnail || imageSet.thumbnail).trim(),
      schema_type: 'Product',
    }
  };
}

function detectGenerationMode({ title, description }) {
  const hasTitle = Boolean(String(title || '').trim());
  const hasDescription = Boolean(String(description || '').trim());
  if (hasTitle && hasDescription) return 'both';
  if (hasTitle) return 'title-only';
  return 'description-only';
}

function getPublishMissingFields(product = {}) {
  const missing = [];

  if (!String(product.name || '').trim()) missing.push('name');
  if (!String(product.description || '').trim()) missing.push('description');
  if (!String(product.short_description || '').trim()) missing.push('short description');
  if (!Number(product.price) || Number(product.price) <= 0) missing.push('valid price');
  if (!CATEGORIES.includes(String(product.category || ''))) missing.push('category');
  if (!String(product.affiliate_link || '').trim()) missing.push('affiliate link');
  if (!String(product.thumbnail || '').trim()) missing.push('thumbnail image');
  if (!Array.isArray(product.images) || product.images.length === 0) missing.push('gallery images');
  if (!Array.isArray(product.tags) || product.tags.length === 0) missing.push('tags');
  if (!String(product?.seo?.meta_title || '').trim()) missing.push('SEO meta title');
  if (!String(product?.seo?.meta_description || '').trim()) missing.push('SEO meta description');

  return missing;
}

async function generateAdminProductDraft(input = {}) {
  const fallback = normalizeAiProductDraft(input, buildDraftFromInput(input));
  const ai = resolveAIProvider();
  if (!ai) return fallback;
  const mode = input.modeOverride || detectGenerationMode(input);

  const modeInstructions = {
    both: 'Both title and description were provided by admin. Refine both with minimal rewriting. Preserve core intent, product specifics, and key terms.',
    'title-only': 'Only title was provided by admin. Keep title close to original and generate high-quality description, tags, and SEO.',
    'description-only': 'Only description was provided by admin. Infer a strong product title from description and improve copy for ecommerce.',
    'seo-only': 'Focus on generating SEO fields: meta_title, meta_description, and meta_keywords based on the provided product title/description and site conventions. Return JSON with seo keys.'
  };

  const prompt = {
    task: 'Generate ecommerce product copy draft for admin use.',
    mode,
    modeInstruction: modeInstructions[mode],
    constraints: {
      language: 'English',
      tone: 'professional, concise, conversion-focused',
      shortDescriptionMax: 220,
      descriptionParagraphs: 2,
      maxTags: 10,
      mustReturnJsonOnly: true,
      requiredKeys: ['name', 'category', 'short_description', 'description', 'tags', 'seo', 'thumbnail', 'images', 'brand', 'affiliate_link', 'affiliate_platform', 'device_compatibility', 'price', 'compare_price', 'stock_status'],
      seoKeys: ['meta_title', 'meta_description', 'meta_keywords', 'canonical_url', 'og_image'],
      preserveInputMeaning: true,
      categoryEnum: CATEGORIES
    },
    productInput: {
      title: input.title || '',
      description: input.description || '',
      price: input.price ?? '',
      compare_price: input.compare_price ?? '',
      brand: input.brand || '',
      category: input.category || '',
      stock_status: input.stock_status || '',
      affiliate_link: input.affiliate_link || '',
      affiliate_platform: input.affiliate_platform || '',
      thumbnail: input.thumbnail || '',
      images: input.images || '',
      device_compatibility: input.device_compatibility || '',
      tags: input.tags || '',
      is_featured: input.is_featured || false,
    }
  };

  try {
    let raw = null;

    if (ai.provider === 'gemini') {
      const client = getGeminiClient();
      if (!client) return fallback;

      const model = client.getGenerativeModel({ model: GEMINI_MODEL });
      const result = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: JSON.stringify(prompt) }] }],
        generationConfig: { temperature: 0.4, maxOutputTokens: 700 }
      });
      raw = result?.response?.text?.();
    } else {
      const client = getOpenAIClient();
      if (!client) return fallback;

      const completion = await client.chat.completions.create({
        model: OPENAI_MODEL,
        temperature: mode === 'both' ? 0.25 : 0.4,
        max_tokens: 700,
        messages: [
          { role: 'system', content: 'Return only valid JSON. No markdown.' },
          { role: 'user', content: JSON.stringify(prompt) }
        ]
      });
      raw = completion?.choices?.[0]?.message?.content;
    }

    const parsed = safeJsonParse(raw);
    if (!parsed || typeof parsed !== 'object') return fallback;

    return {
      ...fallback,
      name: String(parsed.name || fallback.name).trim().slice(0, 200),
      category: CATEGORIES.includes(String(parsed.category || '').trim()) ? String(parsed.category).trim() : fallback.category,
      short_description: String(parsed.short_description || fallback.short_description).trim().slice(0, 300),
      description: String(parsed.description || fallback.description).trim(),
      price: Number.isFinite(Number(parsed.price)) && Number(parsed.price) > 0 ? Number(parsed.price) : fallback.price,
      compare_price: Number.isFinite(Number(parsed.compare_price)) && Number(parsed.compare_price) > fallback.price ? Number(parsed.compare_price) : fallback.compare_price,
      brand: String(parsed.brand || fallback.brand).trim(),
      thumbnail: String(parsed.thumbnail || fallback.thumbnail).trim(),
      images: Array.isArray(parsed.images) && parsed.images.length ? parsed.images.map((x) => String(x).trim()).filter(Boolean) : fallback.images,
      affiliate_link: String(parsed.affiliate_link || fallback.affiliate_link).trim() || fallback.affiliate_link,
      affiliate_platform: String(parsed.affiliate_platform || fallback.affiliate_platform).trim() || fallback.affiliate_platform,
      device_compatibility: Array.isArray(parsed.device_compatibility) && parsed.device_compatibility.length
        ? parsed.device_compatibility.map((x) => String(x).trim()).filter(Boolean)
        : fallback.device_compatibility,
      stock_status: ['In Stock', 'Limited', 'Out of Stock'].includes(String(parsed.stock_status || '').trim()) ? String(parsed.stock_status).trim() : fallback.stock_status,
      tags: Array.isArray(parsed.tags)
        ? parsed.tags.map(x => String(x).trim()).filter(Boolean).slice(0, 10)
        : fallback.tags,
      seo: {
        meta_title: String(parsed?.seo?.meta_title || fallback.seo.meta_title).trim().slice(0, 70),
        meta_description: String(parsed?.seo?.meta_description || fallback.seo.meta_description).trim().slice(0, 160),
        meta_keywords: Array.isArray(parsed?.seo?.meta_keywords)
          ? parsed.seo.meta_keywords.map(x => String(x).trim()).filter(Boolean).slice(0, 12)
          : fallback.seo.meta_keywords,
        canonical_url: String(parsed?.seo?.canonical_url || fallback.seo.canonical_url).trim(),
        og_image: String(parsed?.seo?.og_image || fallback.seo.og_image).trim(),
        schema_type: 'Product'
      }
    };
  } catch {
    return fallback;
  }
}

function startOfDay(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function parseAnalyticsFilters(query = {}) {
  const now = new Date();
  const range = String(query.range || '30d');
  const rangeDays = range === '7d' ? 7 : range === '90d' ? 90 : range === '365d' ? 365 : 30;
  const end = query.endDate ? new Date(query.endDate) : now;
  const start = query.startDate ? new Date(query.startDate) : addDays(end, -rangeDays + 1);
  start.setHours(0, 0, 0, 0);
  end.setHours(23, 59, 59, 999);

  return {
    start,
    end,
    range,
    category: String(query.category || '').trim(),
    productId: String(query.productId || '').trim(),
    orderStatus: String(query.orderStatus || '').trim(),
    stockStatus: String(query.stockStatus || '').trim()
  };
}

function formatDateKey(date) {
  return new Date(date).toISOString().slice(0, 10);
}

function getDayLabel(dateKey) {
  return new Date(`${dateKey}T00:00:00.000Z`).toLocaleDateString('en-US', { weekday: 'short' });
}

function money(value) {
  return Number(value || 0);
}

function percentChange(current, previous) {
  if (!previous && current) return 100;
  if (!previous) return 0;
  return Math.round(((current - previous) / previous) * 1000) / 10;
}

function normalizeProductId(value) {
  if (!value) return '';
  return String(value._id || value.product_id || value);
}

function categoryMatches(product, category) {
  return !category || product?.category === category;
}

function buildProductLookup(products) {
  const map = new Map();
  for (const product of products) {
    map.set(String(product._id), product);
  }
  return map;
}

function buildSeries(start, end, orders, productLookup, filters) {
  const byDay = new Map();
  for (let d = startOfDay(start); d <= end; d = addDays(d, 1)) {
    byDay.set(formatDateKey(d), { date: formatDateKey(d), sales: 0, orders: 0, units: 0, refunds: 0 });
  }

  for (const order of orders) {
    const key = formatDateKey(order.createdAt);
    if (!byDay.has(key)) continue;
    const lineItems = (order.products || []).filter(item => {
      const product = productLookup.get(normalizeProductId(item.product_id));
      return categoryMatches(product, filters.category) && (!filters.productId || normalizeProductId(item.product_id) === filters.productId);
    });
    if (!lineItems.length && (filters.category || filters.productId)) continue;

    const orderRevenue = lineItems.length
      ? lineItems.reduce((sum, item) => sum + money(item.price) * Number(item.quantity || 1), 0)
      : money(order.total_price);
    const row = byDay.get(key);
    row.orders += 1;
    row.units += lineItems.reduce((sum, item) => sum + Number(item.quantity || 1), 0);
    if (order.payment_status === 'Refunded' || order.order_status === 'Cancelled') {
      row.refunds += orderRevenue;
    } else if (order.payment_status === 'Paid' || order.order_status === 'Delivered') {
      row.sales += orderRevenue;
    }
  }

  return [...byDay.values()];
}

function rankMapEntries(map, limit = 8) {
  return [...map.values()].sort((a, b) => (b.revenue || b.count || b.score || 0) - (a.revenue || a.count || a.score || 0)).slice(0, limit);
}

function buildInsightCards({ sales, products, returns, trends, stock }) {
  const cards = [];
  const limitedCase = stock.lowStock.find(p => /iphone|magsafe|case/i.test(`${p.name} ${p.category}`)) || stock.lowStock[0];
  const trendingCase = trends.currentlyTrending.find(p => /transparent|clear|case/i.test(`${p.name} ${p.category}`)) || trends.currentlyTrending[0];

  if (limitedCase) cards.push(`${limitedCase.name} may go out of stock soon based on limited stock status and demand.`);
  if (trendingCase) cards.push(`${trendingCase.name} is trending this week.`);
  cards.push(`Returns/refunds are ${returns.refundPercentage}% of filtered order value.`);
  if (stock.lowStock[0]) cards.push(`Restock ${stock.lowStock[0].name} before the next sales push.`);
  if (products.lowPerforming[0]) cards.push(`Offer a discount or bundle placement for ${products.lowPerforming[0].name}.`);
  if (sales.revenueGrowth > 0) cards.push(`Revenue is up ${sales.revenueGrowth}% versus the previous period.`);
  if (cards.length < 5) cards.push('Promote high-view products with low conversion using homepage badges and chatbot recommendations.');

  return cards.slice(0, 6);
}

async function generateAnalyticsAISummary(snapshot) {
  const ai = resolveAIProvider();
  if (!ai) return null;

  const prompt = {
    task: 'Generate concise ecommerce admin analytics insights for a phone case/accessories store.',
    constraints: {
      returnJsonOnly: true,
      keys: ['summary', 'insights', 'stockSuggestions', 'returnSuggestions'],
      maxInsights: 5,
      tone: 'professional, direct, decision-focused'
    },
    analytics: snapshot
  };

  try {
    let raw = null;
    if (ai.provider === 'gemini') {
      const client = getGeminiClient();
      if (!client) return null;
      const model = client.getGenerativeModel({ model: GEMINI_MODEL });
      const result = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: JSON.stringify(prompt) }] }],
        generationConfig: { temperature: 0.25, maxOutputTokens: 700 }
      });
      raw = result?.response?.text?.();
    } else {
      const client = getOpenAIClient();
      if (!client) return null;
      const completion = await client.chat.completions.create({
        model: OPENAI_MODEL,
        temperature: 0.25,
        max_tokens: 700,
        messages: [
          { role: 'system', content: 'Return only valid JSON. No markdown.' },
          { role: 'user', content: JSON.stringify(prompt) }
        ]
      });
      raw = completion?.choices?.[0]?.message?.content;
    }

    const parsed = safeJsonParse(raw);
    if (!parsed) return null;
    return {
      summary: String(parsed.summary || '').slice(0, 700),
      insights: Array.isArray(parsed.insights) ? parsed.insights.map(String).slice(0, 5) : [],
      stockSuggestions: Array.isArray(parsed.stockSuggestions) ? parsed.stockSuggestions.map(String).slice(0, 5) : [],
      returnSuggestions: Array.isArray(parsed.returnSuggestions) ? parsed.returnSuggestions.map(String).slice(0, 5) : []
    };
  } catch {
    return null;
  }
}

async function buildAdminAnalytics(query = {}) {
  const filters = parseAnalyticsFilters(query);
  const previousStart = addDays(filters.start, -Math.ceil((filters.end - filters.start) / (24 * 60 * 60 * 1000)) - 1);
  const previousEnd = addDays(filters.start, -1);
  previousEnd.setHours(23, 59, 59, 999);

  const orderMatch = { createdAt: { $gte: filters.start, $lte: filters.end } };
  if (filters.orderStatus) orderMatch.order_status = filters.orderStatus;

  const previousOrderMatch = { createdAt: { $gte: previousStart, $lte: previousEnd } };
  if (filters.orderStatus) previousOrderMatch.order_status = filters.orderStatus;

  const productMatch = {};
  if (filters.category) productMatch.category = filters.category;
  if (filters.stockStatus) productMatch.stock_status = filters.stockStatus;
  if (filters.productId) productMatch._id = filters.productId;

  const [orders, previousOrders, products, users, reviews, behaviors] = await Promise.all([
    Order.find(orderMatch).populate('user_id', 'first_name last_name email createdAt').lean(),
    Order.find(previousOrderMatch).lean(),
    Product.find(productMatch).lean(),
    User.find({}, 'first_name last_name email createdAt').lean(),
    Review.find({ createdAt: { $gte: filters.start, $lte: filters.end } }).populate('product_id', 'name category').lean(),
    UserBehavior.find({ updatedAt: { $gte: filters.start, $lte: filters.end } }).lean()
  ]);

  const productLookup = buildProductLookup(await Product.find({}).lean());
  const filteredProductIds = new Set(products.map(p => String(p._id)));
  const series = buildSeries(filters.start, filters.end, orders, productLookup, filters);
  const previousSeries = buildSeries(previousStart, previousEnd, previousOrders, productLookup, filters);

  const totalSales = series.reduce((sum, row) => sum + row.sales, 0);
  const previousSales = previousSeries.reduce((sum, row) => sum + row.sales, 0);
  const todayKey = formatDateKey(new Date());
  const weeklySales = series.slice(-7).reduce((sum, row) => sum + row.sales, 0);
  const currentMonth = new Date().toISOString().slice(0, 7);
  const monthlyRevenue = series.filter(row => row.date.startsWith(currentMonth)).reduce((sum, row) => sum + row.sales, 0);
  const paidOrders = orders.filter(order => order.payment_status === 'Paid' || order.order_status === 'Delivered');
  const averageOrderValue = paidOrders.length ? totalSales / paidOrders.length : 0;
  const byWeekday = new Map();
  for (const row of series) {
    const label = getDayLabel(row.date);
    byWeekday.set(label, (byWeekday.get(label) || 0) + row.sales);
  }

  const productSales = new Map();
  const customerSpend = new Map();
  const categoryDemand = new Map();
  const convertedProductIds = new Set();

  for (const order of orders) {
    const uid = String(order.user_id?._id || order.user_id || '');
    if (uid) {
      const existing = customerSpend.get(uid) || {
        _id: uid,
        name: `${order.user_id?.first_name || ''} ${order.user_id?.last_name || ''}`.trim() || 'Customer',
        email: order.user_id?.email || '',
        orders: 0,
        spend: 0
      };
      existing.orders += 1;
      existing.spend += money(order.total_price);
      customerSpend.set(uid, existing);
    }

    for (const item of order.products || []) {
      const id = normalizeProductId(item.product_id);
      const product = productLookup.get(id);
      if (!product || (filteredProductIds.size && !filteredProductIds.has(id))) continue;
      convertedProductIds.add(id);
      const quantity = Number(item.quantity || 1);
      const revenue = money(item.price) * quantity;
      const existing = productSales.get(id) || {
        _id: id,
        name: item.name || product.name,
        category: product.category,
        quantity: 0,
        revenue: 0,
        views: Number(product.views || 0),
        stock_status: product.stock_status
      };
      existing.quantity += quantity;
      existing.revenue += revenue;
      productSales.set(id, existing);

      const cat = product.category || 'Other';
      const current = categoryDemand.get(cat) || { category: cat, revenue: 0, quantity: 0 };
      current.revenue += revenue;
      current.quantity += quantity;
      categoryDemand.set(cat, current);
    }
  }

  const searchCounts = new Map();
  const addToCartCounts = new Map();
  for (const behavior of behaviors) {
    for (const queryText of behavior.search_queries || []) {
      const key = String(queryText || '').trim().toLowerCase();
      if (!key) continue;
      searchCounts.set(key, (searchCounts.get(key) || 0) + 1);
    }
    for (const id of behavior.recommended_products || []) {
      const key = String(id);
      addToCartCounts.set(key, (addToCartCounts.get(key) || 0) + 1);
    }
  }

  const mostViewed = products.slice().sort((a, b) => Number(b.views || 0) - Number(a.views || 0)).slice(0, 8).map(p => ({
    _id: p._id,
    name: p.name,
    category: p.category,
    views: p.views || 0,
    conversionRate: p.views ? Math.round(((productSales.get(String(p._id))?.quantity || 0) / p.views) * 1000) / 10 : 0
  }));

  const lowPerforming = products
    .map(p => ({ _id: p._id, name: p.name, category: p.category, views: p.views || 0, revenue: productSales.get(String(p._id))?.revenue || 0 }))
    .filter(p => p.views > 0 && p.revenue === 0)
    .sort((a, b) => b.views - a.views)
    .slice(0, 8);

  const highestConversion = products
    .map(p => {
      const sold = productSales.get(String(p._id))?.quantity || 0;
      const views = Number(p.views || 0);
      return { _id: p._id, name: p.name, category: p.category, conversionRate: views ? Math.round((sold / views) * 1000) / 10 : 0, units: sold };
    })
    .filter(p => p.units > 0)
    .sort((a, b) => b.conversionRate - a.conversionRate)
    .slice(0, 8);

  const outOfStock = products.filter(p => p.stock_status === 'Out of Stock');
  const lowStock = products.filter(p => p.stock_status === 'Limited');
  const overstocked = products.filter(p => p.stock_status === 'In Stock' && !convertedProductIds.has(String(p._id)) && Number(p.views || 0) < 20).slice(0, 8);
  const deadInventory = products.filter(p => !convertedProductIds.has(String(p._id)) && Number(p.views || 0) === 0).slice(0, 8);

  const returnedOrders = orders.filter(order => order.payment_status === 'Refunded' || order.order_status === 'Cancelled');
  const refundedValue = returnedOrders.reduce((sum, order) => sum + money(order.total_price), 0);
  const returnProductMap = new Map();
  for (const order of returnedOrders) {
    for (const item of order.products || []) {
      const id = normalizeProductId(item.product_id);
      const existing = returnProductMap.get(id) || { _id: id, name: item.name || productLookup.get(id)?.name || 'Product', count: 0 };
      existing.count += Number(item.quantity || 1);
      returnProductMap.set(id, existing);
    }
  }
  const returnReasonMap = new Map([
    ['Refunded payment', orders.filter(o => o.payment_status === 'Refunded').length],
    ['Cancelled order', orders.filter(o => o.order_status === 'Cancelled').length],
    ['Low rating reviews', reviews.filter(r => Number(r.rating || 0) <= 2).length]
  ]);

  const currentTrending = rankMapEntries(productSales, 8).map(item => ({ ...item, score: Math.round((item.revenue / Math.max(totalSales, 1)) * 1000) / 10 }));
  const likelyTrending = mostViewed.filter(p => p.conversionRate < 20).slice(0, 6);
  const seasonalDemand = [...categoryDemand.values()].sort((a, b) => b.revenue - a.revenue).slice(0, 8);
  const categoriesGainingDemand = seasonalDemand.map(item => ({ ...item, demandScore: Math.round((item.revenue / Math.max(totalSales, 1)) * 1000) / 10 }));

  const stockSuggestions = [
    ...lowStock.slice(0, 5).map(p => ({
      product: p.name,
      action: 'Restock',
      suggestedUnits: Math.max(10, (productSales.get(String(p._id))?.quantity || 1) * 3),
      reason: 'Limited stock with recent demand or visibility.'
    })),
    ...outOfStock.slice(0, 5).map(p => ({
      product: p.name,
      action: 'Urgent restock',
      suggestedUnits: Math.max(15, (productSales.get(String(p._id))?.quantity || 2) * 4),
      reason: 'Out of stock products cannot convert while demand exists.'
    })),
    ...overstocked.slice(0, 3).map(p => ({
      product: p.name,
      action: 'Reduce stock / discount',
      suggestedUnits: 0,
      reason: 'In stock but low demand signals.'
    }))
  ].slice(0, 10);

  const returnSuggestions = [
    returnedOrders.length ? 'Audit product descriptions and compatibility labels for returned/cancelled products.' : 'Returns are low in this period. Keep current QA flow.',
    reviews.some(r => Number(r.rating || 0) <= 2) ? 'Use low-rating review text to update FAQs and set clearer expectations.' : 'No major low-rating review signal in this period.',
    'Show device compatibility chips prominently on product cards and checkout summary.'
  ];

  const sales = {
    totalSales,
    todaySales: series.find(row => row.date === todayKey)?.sales || 0,
    weeklySales,
    monthlyRevenue,
    revenueGrowth: percentChange(totalSales, previousSales),
    averageOrderValue,
    bestSalesDays: [...byWeekday.entries()].map(([day, revenue]) => ({ day, revenue })).sort((a, b) => b.revenue - a.revenue).slice(0, 3),
    totalOrders: orders.length,
    paidOrders: paidOrders.length
  };

  const productPerformance = {
    bestSelling: rankMapEntries(productSales, 8),
    mostViewed,
    mostSearched: [...searchCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8).map(([query, count]) => ({ query, count })),
    mostAddedToCart: [...addToCartCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8).map(([id, count]) => ({ _id: id, name: productLookup.get(id)?.name || 'Product', count })),
    lowPerforming,
    highestConversion
  };

  const stock = {
    outOfStock: outOfStock.map(p => ({ _id: p._id, name: p.name, category: p.category })),
    lowStock: lowStock.map(p => ({ _id: p._id, name: p.name, category: p.category })),
    aboutToRunOut: lowStock.slice(0, 6).map(p => ({ _id: p._id, name: p.name, category: p.category, etaDays: Math.max(2, 8 - (productSales.get(String(p._id))?.quantity || 1)) })),
    overstocked: overstocked.map(p => ({ _id: p._id, name: p.name, category: p.category })),
    deadInventory: deadInventory.map(p => ({ _id: p._id, name: p.name, category: p.category })),
    stockStatus: ['In Stock', 'Limited', 'Out of Stock'].map(status => ({ name: status, value: products.filter(p => p.stock_status === status).length }))
  };

  const returns = {
    totalReturns: returnedOrders.length,
    mostReturnedProducts: [...returnProductMap.values()].sort((a, b) => b.count - a.count).slice(0, 8),
    returnReasons: [...returnReasonMap.entries()].map(([reason, count]) => ({ reason, count })),
    refundPercentage: Math.round((refundedValue / Math.max(totalSales + refundedValue, 1)) * 1000) / 10,
    refundedValue,
    suggestions: returnSuggestions
  };

  const trends = {
    currentlyTrending: currentTrending,
    likelyTrendingSoon: likelyTrending,
    seasonalTrending: seasonalDemand,
    categoriesGainingDemand
  };

  const customers = {
    newCustomers: users.filter(u => new Date(u.createdAt) >= filters.start && new Date(u.createdAt) <= filters.end).length,
    returningCustomers: [...customerSpend.values()].filter(c => c.orders > 1).length,
    topCustomers: [...customerSpend.values()].sort((a, b) => b.spend - a.spend).slice(0, 8),
    purchaseBehavior: [
      { name: 'One-time', value: [...customerSpend.values()].filter(c => c.orders === 1).length },
      { name: 'Returning', value: [...customerSpend.values()].filter(c => c.orders > 1).length }
    ],
    mostPurchasedCategories: seasonalDemand
  };

  const analytics = {
    filters: {
      range: filters.range,
      startDate: filters.start,
      endDate: filters.end,
      category: filters.category,
      productId: filters.productId,
      orderStatus: filters.orderStatus,
      stockStatus: filters.stockStatus
    },
    sales,
    productPerformance,
    stock,
    returns,
    trends,
    aiStockSuggestions: stockSuggestions,
    customers,
    charts: {
      revenueLine: series,
      salesBar: series.slice(-14),
      productPerformance: rankMapEntries(productSales, 8).map(item => ({ name: item.name, revenue: item.revenue, quantity: item.quantity })),
      stockStatus: stock.stockStatus,
      returnAnalytics: returns.returnReasons,
      seasonalDemand
    }
  };

  analytics.aiInsightCards = buildInsightCards({ sales, products: productPerformance, returns, trends, stock });
  return analytics;
}

router.use(protect, adminOnly);

// ── STATS ──────────────────────────────────────────────────
// GET /api/admin/stats
router.get('/stats', async (req, res) => {
  try {
    const [totalProducts, totalUsers, totalOrders, totalReviews, revenueData] = await Promise.all([
      Product.countDocuments({ is_active: true }),
      User.countDocuments(),
      Order.countDocuments(),
      Review.countDocuments(),
      Order.aggregate([
        { $match: { payment_status: 'Paid' } },
        { $group: { _id: null, total: { $sum: '$total_price' } } }
      ])
    ]);
    res.json({
      success: true,
      stats: {
        totalProducts, totalUsers, totalOrders, totalReviews,
        totalRevenue: revenueData[0]?.total || 0
      }
    });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// ── PRODUCTS ───────────────────────────────────────────────
// GET /api/admin/products — all (including inactive), paginated
// GET /api/admin/analytics
router.get('/analytics', async (req, res) => {
  try {
    const analytics = await buildAdminAnalytics(req.query);
    res.json({ success: true, analytics });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// POST /api/admin/analytics/ai-summary
router.post('/analytics/ai-summary', async (req, res) => {
  try {
    const analytics = req.body?.analytics || await buildAdminAnalytics(req.query);
    const fallback = {
      summary: 'AI provider is not configured, so this summary is based on deterministic analytics. Review stock risk, low-performing products, return signals, and category demand before planning the next campaign.',
      insights: analytics.aiInsightCards || [],
      stockSuggestions: (analytics.aiStockSuggestions || []).map(item => `${item.action}: ${item.product} (${item.reason})`).slice(0, 5),
      returnSuggestions: analytics.returns?.suggestions || []
    };
    const aiSummary = await generateAnalyticsAISummary({
      sales: analytics.sales,
      stock: analytics.stock,
      trends: analytics.trends,
      returns: analytics.returns,
      customers: analytics.customers,
      productPerformance: analytics.productPerformance,
      aiStockSuggestions: analytics.aiStockSuggestions
    });
    res.json({ success: true, aiSummary: aiSummary || fallback, provider: resolveAIProvider()?.provider || 'rules' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// GET /api/admin/analytics/export.csv
router.get('/analytics/export.csv', async (req, res) => {
  try {
    const analytics = await buildAdminAnalytics(req.query);
    const rows = [
      ['Metric', 'Value'],
      ['Total sales', analytics.sales.totalSales],
      ['Today sales', analytics.sales.todaySales],
      ['Weekly sales', analytics.sales.weeklySales],
      ['Monthly revenue', analytics.sales.monthlyRevenue],
      ['Revenue growth %', analytics.sales.revenueGrowth],
      ['Average order value', analytics.sales.averageOrderValue],
      ['Total returns', analytics.returns.totalReturns],
      ['Refund percentage', analytics.returns.refundPercentage],
      [],
      ['Best-selling products', 'Revenue', 'Units'],
      ...analytics.productPerformance.bestSelling.map(p => [p.name, p.revenue, p.quantity]),
      [],
      ['AI stock suggestions', 'Action', 'Suggested units', 'Reason'],
      ...analytics.aiStockSuggestions.map(s => [s.product, s.action, s.suggestedUnits, s.reason])
    ];
    const csv = rows.map(row => row.map(cell => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="gadgetglam-admin-analytics-${Date.now()}.csv"`);
    res.send(csv);
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.get('/products', async (req, res) => {
  try {
    const { page = 1, limit = 20, search, category } = req.query;
    const query = {};
    if (category) query.category = category;
    if (search) query.$or = [
      { name: new RegExp(search, 'i') },
      { brand: new RegExp(search, 'i') }
    ];
    const skip = (Number(page) - 1) * Number(limit);
    const [products, total] = await Promise.all([
      Product.find(query).sort('-createdAt').skip(skip).limit(Number(limit)),
      Product.countDocuments(query)
    ]);
    res.json({ success: true, products, pagination: { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / Number(limit)) } });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// GET /api/admin/products/:id
router.get('/products/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
    res.json({ success: true, product });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// POST /api/admin/products
router.post('/products', async (req, res) => {
  try {
    const payload = {
      ...req.body,
      is_draft: req.body.is_draft !== undefined ? Boolean(req.body.is_draft) : true
    };

    if (!payload.is_draft) {
      const missing = getPublishMissingFields(payload);
      if (missing.length) {
        return res.status(400).json({ success: false, message: `Cannot publish. Missing: ${missing.join(', ')}` });
      }
    }

    const product = await Product.create(payload);
    res.status(201).json({ success: true, product });
  } catch (err) { res.status(400).json({ success: false, message: err.message }); }
});

// POST /api/admin/products/generate-content
router.post('/products/generate-content', async (req, res) => {
  try {
    const { title = '', description = '' } = req.body || {};
    if (!String(title).trim() && !String(description).trim()) {
      return res.status(400).json({ success: false, message: 'Provide title or description to generate AI content.' });
    }
    const source = String(req.body.source || '').trim();
    const modeOverride = source === 'title' ? 'title-only' : source === 'description' ? 'description-only' : undefined;
    const content = await generateAdminProductDraft({ title, description, modeOverride });
    res.json({ success: true, content, draftOnly: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || 'Failed to generate content' });
  }
});

// POST /api/admin/products/generate-and-save
router.post('/products/generate-and-save', async (req, res) => {
  try {
    const { title = '', description = '' } = req.body || {};
    const form = req.body?.form || {};
    if (!String(title).trim() && !String(description).trim()) {
      return res.status(400).json({ success: false, message: 'Provide title or description to generate AI content.' });
    }

    const source = String(req.body.source || '').trim();
    const modeOverride = source === 'title' ? 'title-only' : source === 'description' ? 'description-only' : undefined;
    const draft = await generateAdminProductDraft({
      title,
      description,
      modeOverride,
      ...form,
    });

    const payload = normalizeAiProductDraft({ ...form, title, description }, draft);
    payload.isAIGenerated = true;
    payload.aiGeneratedAt = new Date();
    payload.status = 'draft';
    payload.ai_history = [{ versionAt: new Date(), note: 'initial ai draft', data: draft }];

    const product = await Product.create(payload);
    res.status(201).json({ success: true, product });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || 'Failed to generate and save product' });
  }
});

// POST /api/admin/products/:id/regenerate
router.post('/products/:id/regenerate', async (req, res) => {
  try {
    const { fields = ['all'], mode } = req.body || {};
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });

    // If regenerating SEO only, request SEO generation and include product text for context
    const isSeoOnly = fields.includes('seo');
    const wantTitle = isSeoOnly || fields.includes('all') || fields.includes('title');
    const wantDescription = isSeoOnly || fields.includes('all') || fields.includes('description');

    const input = {
      title: wantTitle ? (product.name || '') : '',
      description: wantDescription ? (product.description || '') : '',
      modeOverride: isSeoOnly ? 'seo-only' : mode
    };

    const generated = await generateAdminProductDraft(input);

    const update = {
      ...(generated.name ? { name: generated.name } : {}),
      ...(generated.short_description ? { short_description: generated.short_description } : {}),
      ...(generated.description ? { description: generated.description } : {}),
      ...(generated.tags ? { tags: generated.tags } : {}),
      ...(generated.seo ? { seo: generated.seo } : {}),
      isAIGenerated: true,
      aiGeneratedAt: new Date(),
      is_draft: true
    };

    const updated = await Product.findByIdAndUpdate(req.params.id, {
      $set: update,
      $push: { ai_history: { versionAt: new Date(), note: `regenerated fields: ${fields.join(',')}`, data: generated } }
    }, { new: true, runValidators: true });

    res.json({ success: true, product: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || 'Regeneration failed' });
  }
});

// PUT /api/admin/products/:id
router.put('/products/:id', async (req, res) => {
  try {
    const existing = await Product.findById(req.params.id);
    if (!existing) return res.status(404).json({ success: false, message: 'Product not found' });

    const merged = {
      ...existing.toObject(),
      ...req.body,
      seo: {
        ...(existing.seo || {}),
        ...(req.body.seo || {})
      }
    };

    if (merged.is_draft === false) {
      const missing = getPublishMissingFields(merged);
      if (missing.length) {
        return res.status(400).json({ success: false, message: `Cannot publish. Missing: ${missing.join(', ')}` });
      }
    }

    const product = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
    res.json({ success: true, product });
  } catch (err) { res.status(400).json({ success: false, message: err.message }); }
});

// POST /api/admin/products/:id/restore-history
router.post('/products/:id/restore-history', async (req, res) => {
  try {
    const { index } = req.body || {};
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
    const hist = Array.isArray(product.ai_history) ? product.ai_history : [];
    const idx = Number.isInteger(Number(index)) ? Number(index) : hist.length - 1;
    if (!hist[idx]) return res.status(400).json({ success: false, message: 'History entry not found' });

    const data = hist[idx].data || {};
    const update = {
      ...(data.name ? { name: data.name } : {}),
      ...(data.short_description ? { short_description: data.short_description } : {}),
      ...(data.description ? { description: data.description } : {}),
      ...(data.tags ? { tags: data.tags } : {}),
      ...(data.seo ? { seo: data.seo } : {})
    };

    const updated = await Product.findByIdAndUpdate(req.params.id, {
      $set: { ...update, is_draft: true, isAIGenerated: true, aiGeneratedAt: new Date() },
      $push: { ai_history: { versionAt: new Date(), note: `restored history index ${idx}`, data } }
    }, { new: true, runValidators: true });

    res.json({ success: true, product: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || 'Restore failed' });
  }
});

// DELETE /api/admin/products/:id — soft delete
router.delete('/products/:id', async (req, res) => {
  try {
    await Product.findByIdAndUpdate(req.params.id, { is_active: false });
    res.json({ success: true, message: 'Product deactivated' });
  } catch (err) { res.status(400).json({ success: false, message: err.message }); }
});

// ── ORDERS ─────────────────────────────────────────────────
// GET /api/admin/orders
router.get('/orders', async (req, res) => {
  try {
    const { page = 1, limit = 20, status, payment } = req.query;
    const query = {};
    if (status) query.order_status = status;
    if (payment) query.payment_status = payment;
    const skip = (Number(page) - 1) * Number(limit);
    const [orders, total] = await Promise.all([
      Order.find(query).sort('-createdAt').skip(skip).limit(Number(limit))
        .populate('user_id', 'first_name last_name email'),
      Order.countDocuments(query)
    ]);
    res.json({ success: true, orders, pagination: { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / Number(limit)) } });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// GET /api/admin/orders/:id
router.get('/orders/:id', async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('user_id', 'first_name last_name email')
      .populate('products.product_id', 'name thumbnail slug');
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    res.json({ success: true, order });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// PUT /api/admin/orders/:id
router.put('/orders/:id', async (req, res) => {
  try {
    const { order_status, payment_status, tracking_number } = req.body;
    const update = {};
    if (order_status) update.order_status = order_status;
    if (payment_status) update.payment_status = payment_status;
    if (tracking_number !== undefined) update.tracking_number = tracking_number;
    if (order_status === 'Delivered') update.payment_status = 'Paid';
    const order = await Order.findByIdAndUpdate(req.params.id, update, { new: true })
      .populate('user_id', 'first_name last_name email');
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    res.json({ success: true, order });
  } catch (err) { res.status(400).json({ success: false, message: err.message }); }
});

// DELETE /api/admin/orders/:id
router.delete('/orders/:id', async (req, res) => {
  try {
    await Order.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Order deleted' });
  } catch (err) { res.status(400).json({ success: false, message: err.message }); }
});

// ── USERS ──────────────────────────────────────────────────
// GET /api/admin/users
router.get('/users', async (req, res) => {
  try {
    const { page = 1, limit = 20, search } = req.query;
    const query = {};
    if (search) query.$or = [
      { email: new RegExp(search, 'i') },
      { first_name: new RegExp(search, 'i') },
      { last_name: new RegExp(search, 'i') }
    ];
    const skip = (Number(page) - 1) * Number(limit);
    const [users, total] = await Promise.all([
      User.find(query).sort('-createdAt').skip(skip).limit(Number(limit)),
      User.countDocuments(query)
    ]);
    res.json({ success: true, users, pagination: { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / Number(limit)) } });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// GET /api/admin/users/:id
router.get('/users/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, user });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// PUT /api/admin/users/:id
router.put('/users/:id', async (req, res) => {
  try {
    const { role, is_active, first_name, last_name } = req.body;
    const update = {};
    if (role !== undefined) update.role = role;
    if (is_active !== undefined) update.is_active = is_active;
    if (first_name) update.first_name = first_name;
    if (last_name) update.last_name = last_name;
    const user = await User.findByIdAndUpdate(req.params.id, update, { new: true });
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, user });
  } catch (err) { res.status(400).json({ success: false, message: err.message }); }
});

// DELETE /api/admin/users/:id
router.delete('/users/:id', async (req, res) => {
  try {
    if (req.params.id === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: 'Cannot delete your own account' });
    }
    await User.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'User deleted' });
  } catch (err) { res.status(400).json({ success: false, message: err.message }); }
});

// ── REVIEWS ────────────────────────────────────────────────
// GET /api/admin/reviews
router.get('/reviews', async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);
    const [reviews, total] = await Promise.all([
      Review.find().sort('-createdAt').skip(skip).limit(Number(limit))
        .populate('user_id', 'first_name last_name email')
        .populate('product_id', 'name thumbnail slug'),
      Review.countDocuments()
    ]);
    res.json({ success: true, reviews, pagination: { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / Number(limit)) } });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// DELETE /api/admin/reviews/:id
router.delete('/reviews/:id', async (req, res) => {
  try {
    await Review.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Review deleted' });
  } catch (err) { res.status(400).json({ success: false, message: err.message }); }
});

module.exports = router;
