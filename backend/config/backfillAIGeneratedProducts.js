/**
 * Backfills existing AI-generated products so they match the full product shape.
 * Run: node config/backfillAIGeneratedProducts.js
 */
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const dns = require('dns');
const mongoose = require('mongoose');
const Product = require('../models/Product');

if (typeof process.env.MONGODB_URI === 'string' && process.env.MONGODB_URI.startsWith('mongodb+srv://')) {
  try { dns.setServers(['1.1.1.1', '1.0.0.1', '8.8.8.8', '8.8.4.4']); } catch {}
}

const CATEGORY_IMAGE_BANK = {
  Cases: [
    'https://images.unsplash.com/photo-1601784551446-20c9e07cdbdb?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1556656793-08538906a9f8?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1565849904461-04a58ad377e0?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1512054502232-10a0a035d672?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1574944985070-8f3ebc6b79d2?auto=format&fit=crop&w=1200&q=80',
  ],
  Chargers: [
    'https://images.unsplash.com/photo-1546868871-7041f2a55e12?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1550009158-9ebf69173e03?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1593642632559-0c6d3fc62b89?auto=format&fit=crop&w=1200&q=80',
  ],
  Cables: [
    'https://images.unsplash.com/photo-1583394838336-acd977736f90?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1546868871-7041f2a55e12?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1517336714739-489689fd1ca8?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=1200&q=80',
  ],
  Earphones: [
    'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1484704849700-f032a568e944?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1572569511254-d8f925fe2cbb?auto=format&fit=crop&w=1200&q=80',
  ],
  'Screen Guards': [
    'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1598327105666-5b89351aff97?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1556656793-08538906a9f8?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1565849904461-04a58ad377e0?auto=format&fit=crop&w=1200&q=80',
  ],
  Bundles: [
    'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1546868871-7041f2a55e12?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=1200&q=80',
  ],
  'Smart Watches': [
    'https://images.unsplash.com/photo-1523275335684-378980b3693b?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1579586337278-3befd40fd17a?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1544112474-2cdc81a5c677?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1522312340185-e585b57a0bb6?auto=format&fit=crop&w=1200&q=80',
  ],
  Speakers: [
    'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1545454679-3531b543cbeb?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=1200&q=80',
  ],
  Headphones: [
    'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1484704849700-f032a568e944?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1572569511254-d8f925fe2cbb?auto=format&fit=crop&w=1200&q=80',
  ],
  'Power Banks': [
    'https://images.unsplash.com/photo-1609096458733-95b38583ac4e?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1546868871-7041f2a55e12?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1593642632559-0c6d3fc62b89?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?auto=format&fit=crop&w=1200&q=80',
  ],
  Other: [
    'https://images.unsplash.com/photo-1601784551446-20c9e07cdbdb?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1556656793-08538906a9f8?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1546868871-7041f2a55e12?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=1200&q=80',
  ],
};

function slugify(value = '') {
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

function buildImages(title = '', category = 'Other') {
  const query = [title, category, 'mobile accessory', 'product photography']
    .map((part) => String(part || '').trim())
    .filter(Boolean)
    .join(',');
  const bank = CATEGORY_IMAGE_BANK[category] || CATEGORY_IMAGE_BANK.Other;
  if (!query) {
    return { thumbnail: bank[0], images: bank.slice(1, 4) };
  }
  const base = `https://source.unsplash.com/1200x900/?${encodeURIComponent(query)}`;
  return {
    thumbnail: `${base}&sig=1`,
    images: [`${base}&sig=2`, `${base}&sig=3`, `${base}&sig=4`],
  };
}

function normalizeProduct(product) {
  const category = product.category || 'Other';
  const title = product.name || 'Product Draft';
  const images = Array.isArray(product.images) && product.images.length ? product.images : buildImages(title, category).images;
  const thumbnail = product.thumbnail || images[0] || buildImages(title, category).thumbnail;
  const slug = product.slug || slugify(title);

  return {
    name: title,
    slug,
    description: String(product.description || product.short_description || '').trim() || `${title} with dependable build quality and everyday value.`,
    short_description: String(product.short_description || '').trim() || `${title} built for reliable daily use.`,
    price: estimatePrice({ title, description: product.description, category, price: product.price, compare_price: product.compare_price }),
    compare_price: Number(product.compare_price) > 0 ? Number(product.compare_price) : Math.max(1200, Math.round(estimatePrice({ title, description: product.description, category, price: product.price, compare_price: product.compare_price }) * 1.3)),
    brand: String(product.brand || inferBrand(`${title} ${product.description}`, category)).trim(),
    category,
    device_compatibility: splitList(product.device_compatibility).length ? splitList(product.device_compatibility) : inferCompatibility(`${title} ${product.description}`),
    tags: splitList(product.tags).length ? splitList(product.tags) : [category.toLowerCase(), 'premium', 'gadgetglam'],
    thumbnail,
    images,
    affiliate_link: 'https://www.daraz.pk',
    affiliate_platform: 'Daraz',
    stock_status: ['In Stock', 'Limited', 'Out of Stock'].includes(product.stock_status) ? product.stock_status : 'In Stock',
    is_featured: Boolean(product.is_featured),
    seo: {
      meta_title: String(product?.seo?.meta_title || `${title} | GadgetGlam`).trim().slice(0, 70),
      meta_description: String(product?.seo?.meta_description || product.short_description || product.description || '').trim().slice(0, 160),
      meta_keywords: splitList(product?.seo?.meta_keywords).length ? splitList(product?.seo?.meta_keywords) : splitList(product.tags),
      canonical_url: String(product?.seo?.canonical_url || `https://gadgetglam.pk/products/${slug}`).trim(),
      og_image: String(product?.seo?.og_image || thumbnail).trim(),
      schema_type: 'Product',
    },
  };
}

async function main() {
  if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI missing in backend/.env');
  await mongoose.connect(process.env.MONGODB_URI);

  const products = await Product.find({ $or: [{ isAIGenerated: true }, { slug: /draft|ai/i }] });
  let updated = 0;

  for (const product of products) {
    const normalized = normalizeProduct(product.toObject());
    const needsUpdate =
      !product.price ||
      !product.thumbnail ||
      !Array.isArray(product.images) ||
      product.images.length === 0 ||
      !String(product.affiliate_link || '').trim() ||
      String(product.affiliate_link || '').trim() !== 'https://www.daraz.pk' ||
      !String(product.brand || '').trim() ||
      !String(product.short_description || '').trim() ||
      !String(product?.seo?.canonical_url || '').trim() ||
      !String(product?.seo?.og_image || '').trim() ||
      !Array.isArray(product.device_compatibility) ||
      product.device_compatibility.length === 0 ||
      !Array.isArray(product.tags) ||
      product.tags.length === 0;

    if (!needsUpdate) continue;

    await Product.findByIdAndUpdate(product._id, {
      $set: {
        name: normalized.name,
        slug: normalized.slug,
        description: normalized.description,
        short_description: normalized.short_description,
        price: normalized.price,
        compare_price: normalized.compare_price,
        brand: normalized.brand,
        category: normalized.category,
        device_compatibility: normalized.device_compatibility,
        tags: normalized.tags,
        thumbnail: normalized.thumbnail,
        images: normalized.images,
        affiliate_link: normalized.affiliate_link,
        affiliate_platform: normalized.affiliate_platform,
        stock_status: normalized.stock_status,
        is_featured: normalized.is_featured,
        is_draft: true,
        isAIGenerated: true,
        seo: normalized.seo,
        aiGeneratedAt: product.aiGeneratedAt || new Date(),
      },
      $setOnInsert: { status: 'draft' },
      $push: {
        ai_history: {
          versionAt: new Date(),
          note: 'backfill missing AI product fields',
          data: normalized,
        },
      },
    }, { runValidators: true });

    updated += 1;
    console.log(`Backfilled: ${product.name}`);
  }

  console.log(`Done. Updated ${updated} AI-generated product(s).`);
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});