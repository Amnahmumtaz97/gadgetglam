require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const dns = require('dns');
const mongoose = require('mongoose');

if (typeof process.env.MONGODB_URI === 'string' && process.env.MONGODB_URI.startsWith('mongodb+srv://')) {
  try { dns.setServers(['1.1.1.1', '1.0.0.1', '8.8.8.8', '8.8.4.4']); } catch {}
}
const Product  = require('../models/Product');
const { SHOP_CATEGORIES } = require('../constants/categories');
const CURATED_CATALOG_EXTRA = require('./curatedCatalogExtra');
const BUNDLE_CATALOG = require('./bundleCatalog');
const User     = require('../models/User');
const { Order, Review } = require('../models/OrderReview');
const UserBehavior = require('../models/UserBehavior');

// ── PRODUCT GENERATION FUNCTION ────────────────────────────────────────────────
function generateProducts(count = 100) {
  const categories = SHOP_CATEGORIES.filter((c) => c !== 'Bundles');
  const brands = ['LuxeCase', 'PowerPro', 'TechLink', 'SoundPro', 'GlassGuard', 'GadgetGlam', 'ClearShield', 'ArmorMax', 'MatteMax', 'RingCase'];
  const devices = ['iPhone 15', 'iPhone 14', 'Samsung Galaxy S24', 'Samsung Galaxy A54', 'Universal'];

  const categoryImageBank = {
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

  const getCategoryImageSet = (category, index) => {
    const bank = categoryImageBank[category] || categoryImageBank.Other;
    const len = bank.length;
    return {
      thumbnail: bank[index % len],
      images: [
        bank[(index + 1) % len],
        bank[(index + 2) % len],
        bank[(index + 3) % len],
      ],
    };
  };
  
  const products = [];
  for (let i = 0; i < count; i++) {
    const category = categories[i % categories.length];
    const price = Math.floor(Math.random() * 7000) + 500;
    const compare_price = Math.floor(price * (1 + Math.random() * 0.5));
    const imageSet = getCategoryImageSet(category, i + 1);
    
    products.push({
      name: `${category} Item #${i + 1} - Premium ${brands[i % brands.length]} Product`,
      description: `Premium quality ${category.toLowerCase()} with excellent durability and performance. Perfect for your ${devices[i % devices.length]} device. Features advanced protection and sleek design. Highly recommended by customers.`,
      short_description: `Premium ${category.toLowerCase()} product #${i + 1}`,
      price,
      compare_price,
      brand: brands[i % brands.length],
      category,
      device_compatibility: [devices[i % devices.length]],
      tags: [category.toLowerCase(), 'premium', 'quality', `item-${i + 1}`],
      thumbnail: imageSet.thumbnail,
      images: imageSet.images,
      affiliate_link: 'https://www.daraz.pk',
      affiliate_platform: 'Daraz',
      ratings_avg: Math.min(5, Math.random() * 1.2 + 3.8),
      reviews_count: Math.floor(Math.random() * 300) + 20,
      is_featured: Math.random() > 0.7,
      stock_status: 'In Stock',
    });
  }
  return products;
}

// ── USER GENERATION FUNCTION ──────────────────────────────────────────────────
function generateUsers(count = 100) {
  const firstNames = ['Ahmed', 'Fatima', 'Muhammad', 'Aisha', 'Hassan', 'Zainab', 'Ibrahim', 'Noor', 'Bilal', 'Layla', 'Usman', 'Hana'];
  const lastNames = ['Khan', 'Ahmed', 'Ali', 'Malik', 'Shah', 'Raza', 'Hassan', 'Hussain', 'Baig', 'Iqbal', 'Sheikh', 'Qureshi'];
  
  const users = [
    { first_name: 'Admin', last_name: 'GadgetGlam', email: 'admin@gadgetglam.pk', password: 'admin123', role: 'admin' }
  ];
  
  for (let i = 0; i < count; i++) {
    users.push({
      first_name: firstNames[Math.floor(Math.random() * firstNames.length)],
      last_name: lastNames[Math.floor(Math.random() * lastNames.length)],
      email: `user${i + 1}@example.com`,
      password: 'user1234',
      role: 'user'
    });
  }
  return users;
}

// ── CURATED PRODUCTS (realistic catalog + analytics-friendly names) ───────────
const CURATED_PRODUCTS = [

  // ── Cases (10) ─────────────────────────────────────────
  {
    name: 'MagSafe Case Pro',
    description: 'Premium MagSafe-compatible case with reinforced corners and microfiber lining. Snaps on instantly and supports wireless charging.',
    short_description: 'MagSafe Case Pro with reinforced protection.',
    price: 5999, compare_price: 7999, brand: 'MagClear',
    category: 'Cases', device_compatibility: ['iPhone 15 Pro', 'iPhone 15 Pro Max'],
    tags: ['magsafe', 'case', 'iphone', 'pro'],
    thumbnail: 'https://images.unsplash.com/photo-1556656793-08538906a9f8?w=400&q=80',
    images: ['https://images.unsplash.com/photo-1556656793-08538906a9f8?w=800&q=80'],
    affiliate_link: 'https://www.daraz.pk', affiliate_platform: 'Daraz',
    ratings_avg: 4.8, reviews_count: 210, is_featured: true, stock_status: 'Limited',
  },
  {
    name: 'Premium Leather Wallet Case for iPhone 15 Pro',

    description: 'Luxury genuine leather wallet case with card slots and magnetic closure. Provides full 360° protection for your iPhone 15 Pro. Features a built-in stand for hands-free viewing.',
    short_description: 'Genuine leather wallet case with card slots for iPhone 15 Pro.',
    price: 2499, compare_price: 3500, brand: 'LuxeCase',
    category: 'Cases', device_compatibility: ['iPhone 15 Pro'],
    tags: ['leather', 'wallet', 'iphone', 'luxury'],
    thumbnail: 'https://images.unsplash.com/photo-1601784551446-20c9e07cdbdb?w=400&q=80',
    images: ['https://images.unsplash.com/photo-1601784551446-20c9e07cdbdb?w=800&q=80'],
    affiliate_link: 'https://www.daraz.pk', affiliate_platform: 'Daraz',
    ratings_avg: 4.7, reviews_count: 128, is_featured: true, stock_status: 'In Stock',
  },
  {
    name: 'Clear Shockproof Case for Samsung Galaxy S24',
    description: 'Ultra-clear TPU case with reinforced corners that absorb shocks and drops. Shows off the original beauty of your Samsung Galaxy S24 while keeping it protected.',
    short_description: 'Crystal-clear shockproof TPU case for Galaxy S24.',
    price: 899, compare_price: 1200, brand: 'ClearShield',
    category: 'Cases', device_compatibility: ['Samsung Galaxy S24'],
    tags: ['clear', 'transparent', 'samsung', 'shockproof'],
    thumbnail: 'https://images.unsplash.com/photo-1556656793-08538906a9f8?w=400&q=80',
    images: ['https://images.unsplash.com/photo-1556656793-08538906a9f8?w=800&q=80'],
    affiliate_link: 'https://www.daraz.pk', affiliate_platform: 'Daraz',
    ratings_avg: 4.4, reviews_count: 89, is_featured: false, stock_status: 'In Stock',
  },
  {
    name: 'Rugged Armor Case for iPhone 14',
    description: 'Military-grade drop protection with dual-layer design. Carbon fiber texture with precise cutouts for all ports and buttons. Compatible with MagSafe accessories.',
    short_description: 'Military-grade dual-layer armor case for iPhone 14.',
    price: 1799, compare_price: 2200, brand: 'ArmorMax',
    category: 'Cases', device_compatibility: ['iPhone 14'],
    tags: ['rugged', 'armor', 'military', 'iphone', 'magsafe'],
    thumbnail: 'https://images.unsplash.com/photo-1565849904461-04a58ad377e0?w=400&q=80',
    images: ['https://images.unsplash.com/photo-1565849904461-04a58ad377e0?w=800&q=80'],
    affiliate_link: 'https://www.daraz.pk', affiliate_platform: 'Daraz',
    ratings_avg: 4.8, reviews_count: 214, is_featured: true, stock_status: 'In Stock',
  },
  {
    name: 'Glitter Cute Case for Samsung Galaxy A54',
    description: 'Sparkling glitter liquid flowing case with cute heart design. Soft TPU material protects against scratches and minor drops. Available in multiple colors.',
    short_description: 'Cute glitter liquid flowing case for Galaxy A54.',
    price: 699, compare_price: 999, brand: 'GlitterGlam',
    category: 'Cases', device_compatibility: ['Samsung Galaxy A54'],
    tags: ['glitter', 'cute', 'girls', 'samsung'],
    thumbnail: 'https://images.unsplash.com/photo-1512054502232-10a0a035d672?w=400&q=80',
    images: ['https://images.unsplash.com/photo-1512054502232-10a0a035d672?w=800&q=80'],
    affiliate_link: 'https://www.daraz.pk', affiliate_platform: 'Daraz',
    ratings_avg: 4.3, reviews_count: 67, is_featured: false, stock_status: 'In Stock',
  },
  {
    name: 'Matte Frosted Case for iPhone 15',
    description: 'Ultra-slim matte frosted hard back cover with soft TPU bumper. Anti-fingerprint surface keeps your phone looking pristine. Available in 6 colors.',
    short_description: 'Ultra-slim matte frosted case for iPhone 15.',
    price: 749, compare_price: 1100, brand: 'MatteMax',
    category: 'Cases', device_compatibility: ['iPhone 15'],
    tags: ['matte', 'slim', 'frosted', 'iphone'],
    thumbnail: 'https://images.unsplash.com/photo-1609096458733-95b38583ac4e?w=400&q=80',
    images: ['https://images.unsplash.com/photo-1609096458733-95b38583ac4e?w=800&q=80'],
    affiliate_link: 'https://www.daraz.pk', affiliate_platform: 'Daraz',
    ratings_avg: 4.5, reviews_count: 102, is_featured: false, stock_status: 'In Stock',
  },
  {
    name: 'Flip Leather Case for Samsung Galaxy A34',
    description: 'Premium PU leather flip cover with card holder and magnetic closing. Full-body protection for your Samsung Galaxy A34. Precise cutouts for all buttons and ports.',
    short_description: 'PU leather flip cover with card holder for Galaxy A34.',
    price: 1199, compare_price: 1800, brand: 'FlipCraft',
    category: 'Cases', device_compatibility: ['Samsung Galaxy A34'],
    tags: ['flip', 'leather', 'samsung', 'card holder'],
    thumbnail: 'https://images.unsplash.com/photo-1574944985070-8f3ebc6b79d2?w=400&q=80',
    images: ['https://images.unsplash.com/photo-1574944985070-8f3ebc6b79d2?w=800&q=80'],
    affiliate_link: 'https://www.daraz.pk', affiliate_platform: 'Daraz',
    ratings_avg: 4.2, reviews_count: 55, is_featured: false, stock_status: 'In Stock',
  },
  {
    name: 'Ring Stand Case for iPhone 14 Pro Max',
    description: 'Hard PC back case with built-in 360-degree rotating ring stand. Perfect for watching videos hands-free. Compatible with magnetic car mounts.',
    short_description: 'Ring stand case for iPhone 14 Pro Max.',
    price: 1299, compare_price: 1800, brand: 'RingCase',
    category: 'Cases', device_compatibility: ['iPhone 14 Pro Max'],
    tags: ['ring', 'stand', 'iphone', 'kickstand'],
    thumbnail: 'https://images.unsplash.com/photo-1601784551446-20c9e07cdbdb?w=400&q=80',
    images: ['https://images.unsplash.com/photo-1601784551446-20c9e07cdbdb?w=800&q=80'],
    affiliate_link: 'https://www.daraz.pk', affiliate_platform: 'Daraz',
    ratings_avg: 4.6, reviews_count: 78, is_featured: false, stock_status: 'In Stock',
  },
  {
    name: 'Transparent MagSafe Case for iPhone 15 Pro Max',
    description: 'Crystal-clear MagSafe compatible case with reinforced corners. Built-in magnets align perfectly with MagSafe chargers. Military-grade protection.',
    short_description: 'Clear MagSafe case for iPhone 15 Pro Max.',
    price: 1899, compare_price: 2500, brand: 'MagClear',
    category: 'Cases', device_compatibility: ['iPhone 15 Pro Max'],
    tags: ['magsafe', 'clear', 'transparent', 'iphone'],
    thumbnail: 'https://images.unsplash.com/photo-1556656793-08538906a9f8?w=400&q=80',
    images: ['https://images.unsplash.com/photo-1556656793-08538906a9f8?w=800&q=80'],
    affiliate_link: 'https://www.daraz.pk', affiliate_platform: 'Daraz',
    ratings_avg: 4.7, reviews_count: 145, is_featured: true, stock_status: 'In Stock',
  },
  {
    name: 'Dual Layer Defender Case for Samsung S23 Ultra',
    description: 'Heavy-duty dual-layer protection case for Galaxy S23 Ultra. Outer silicone shell + inner hard PC frame. Built-in screen protector and port covers.',
    short_description: 'Heavy-duty defender case for Galaxy S23 Ultra.',
    price: 2199, compare_price: 3000, brand: 'DefendPro',
    category: 'Cases', device_compatibility: ['Samsung Galaxy S23 Ultra'],
    tags: ['rugged', 'defender', 'samsung', 'heavy duty'],
    thumbnail: 'https://images.unsplash.com/photo-1565849904461-04a58ad377e0?w=400&q=80',
    images: ['https://images.unsplash.com/photo-1565849904461-04a58ad377e0?w=800&q=80'],
    affiliate_link: 'https://www.daraz.pk', affiliate_platform: 'Daraz',
    ratings_avg: 4.8, reviews_count: 192, is_featured: false, stock_status: 'In Stock',
  },
  {
    name: 'Slim Card Holder Case for iPhone 13',
    description: 'Ultra-thin case with built-in card slot on the back. Holds up to 3 cards. Premium polycarbonate shell with soft inner lining.',
    short_description: 'Ultra-thin card-slot case for iPhone 13.',
    price: 999, compare_price: 1400, brand: 'SlimCard',
    category: 'Cases', device_compatibility: ['iPhone 13'],
    tags: ['slim', 'card slot', 'iphone', 'thin'],
    thumbnail: 'https://images.unsplash.com/photo-1512054502232-10a0a035d672?w=400&q=80',
    images: ['https://images.unsplash.com/photo-1512054502232-10a0a035d672?w=800&q=80'],
    affiliate_link: 'https://www.daraz.pk', affiliate_platform: 'Daraz',
    ratings_avg: 4.4, reviews_count: 61, is_featured: false, stock_status: 'In Stock',
  },

  // ── Chargers (8) ───────────────────────────────────────
  {
    name: '65W GaN Fast Charger USB-C 3-Port',
    description: 'Compact 65W GaN technology charger with 3 ports (2x USB-C, 1x USB-A). Simultaneously charge laptop, phone, and tablet. Foldable plug for easy travel.',
    short_description: '65W GaN fast charger with 3 ports for all devices.',
    price: 3299, compare_price: 4500, brand: 'PowerPro',
    category: 'Chargers', device_compatibility: ['Universal'],
    tags: ['gan', 'fast charger', '65w', 'usb-c', 'laptop'],
    thumbnail: 'https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=400&q=80',
    images: ['https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=800&q=80'],
    affiliate_link: 'https://www.daraz.pk', affiliate_platform: 'Daraz',
    ratings_avg: 4.9, reviews_count: 342, is_featured: true, stock_status: 'In Stock',
  },
  {
    name: '20W USB-C Fast Charger for iPhone',
    description: 'Apple-compatible 20W USB-C power adapter with Power Delivery. Charges iPhone to 50% in just 30 minutes. Compact design fits in any pocket.',
    short_description: 'Apple-compatible 20W USB-C PD fast charger.',
    price: 1499, compare_price: 2000, brand: 'ChargeFast',
    category: 'Chargers', device_compatibility: ['iPhone 12', 'iPhone 13', 'iPhone 14', 'iPhone 15'],
    tags: ['20w', 'iphone', 'usb-c', 'power delivery'],
    thumbnail: 'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=400&q=80',
    images: ['https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=800&q=80'],
    affiliate_link: 'https://www.daraz.pk', affiliate_platform: 'Daraz',
    ratings_avg: 4.6, reviews_count: 198, is_featured: false, stock_status: 'In Stock',
  },
  {
    name: 'Wireless MagSafe Charger 15W for iPhone',
    description: 'Magnetic wireless charger compatible with MagSafe iPhone models. 15W fast wireless charging with LED indicator. Premium braided cable included.',
    short_description: 'MagSafe-compatible 15W wireless charger for iPhone.',
    price: 2199, compare_price: 3000, brand: 'MagCharge',
    category: 'Chargers', device_compatibility: ['iPhone 12', 'iPhone 13', 'iPhone 14', 'iPhone 15'],
    tags: ['magsafe', 'wireless', '15w', 'iphone', 'magnetic'],
    thumbnail: 'https://images.unsplash.com/photo-1550009158-9ebf69173e03?w=400&q=80',
    images: ['https://images.unsplash.com/photo-1550009158-9ebf69173e03?w=800&q=80'],
    affiliate_link: 'https://www.daraz.pk', affiliate_platform: 'Daraz',
    ratings_avg: 4.5, reviews_count: 156, is_featured: true, stock_status: 'In Stock',
  },
  {
    name: '25W Super Fast Charger for Samsung',
    description: 'Official-grade 25W super fast charger for Samsung Galaxy devices. USB-C with AFC (Adaptive Fast Charging). Works with S24, S23, A54, and more.',
    short_description: '25W Samsung-compatible USB-C super fast charger.',
    price: 1799, compare_price: 2400, brand: 'SuperCharge',
    category: 'Chargers', device_compatibility: ['Samsung Galaxy S24', 'Samsung Galaxy S23', 'Samsung Galaxy A54'],
    tags: ['25w', 'samsung', 'super fast', 'usb-c'],
    thumbnail: 'https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=400&q=80',
    images: ['https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=800&q=80'],
    affiliate_link: 'https://www.daraz.pk', affiliate_platform: 'Daraz',
    ratings_avg: 4.7, reviews_count: 224, is_featured: false, stock_status: 'In Stock',
  },
  {
    name: '10000mAh Power Bank with LED Display',
    description: 'Slim 10000mAh power bank with dual USB-C output and LED battery display. Fast charge 22.5W PD. Ultra-compact design fits in your pocket. Charges phones 2-3 times.',
    short_description: '10000mAh slim power bank with 22.5W fast charge.',
    price: 3499, compare_price: 4800, brand: 'PowerBank Pro',
    category: 'Chargers', device_compatibility: ['Universal'],
    tags: ['power bank', '10000mah', 'portable', 'fast charge'],
    thumbnail: 'https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=400&q=80',
    images: ['https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=800&q=80'],
    affiliate_link: 'https://www.daraz.pk', affiliate_platform: 'Daraz',
    ratings_avg: 4.6, reviews_count: 311, is_featured: true, stock_status: 'In Stock',
  },
  {
    name: '3-in-1 Wireless Charging Pad',
    description: 'Wireless charging station for iPhone, AirPods, and Apple Watch simultaneously. 15W Qi fast charging. LED night light mode. Non-slip base.',
    short_description: '3-in-1 wireless charger for iPhone, Watch & AirPods.',
    price: 4299, compare_price: 6000, brand: 'TriCharge',
    category: 'Chargers', device_compatibility: ['iPhone', 'Apple Watch', 'AirPods'],
    tags: ['wireless', '3-in-1', 'qi', 'apple watch', 'airpods'],
    thumbnail: 'https://images.unsplash.com/photo-1550009158-9ebf69173e03?w=400&q=80',
    images: ['https://images.unsplash.com/photo-1550009158-9ebf69173e03?w=800&q=80'],
    affiliate_link: 'https://www.daraz.pk', affiliate_platform: 'Daraz',
    ratings_avg: 4.8, reviews_count: 98, is_featured: true, stock_status: 'In Stock',
  },
  {
    name: 'Car Charger 36W Dual USB-C',
    description: 'Compact 36W car charger with dual USB-C PD ports. Charges two devices simultaneously at full speed. Universal compatibility with all USB-C phones.',
    short_description: '36W dual-port USB-C car charger.',
    price: 1299, compare_price: 1800, brand: 'DriveCharge',
    category: 'Chargers', device_compatibility: ['Universal'],
    tags: ['car charger', '36w', 'usb-c', 'dual port', 'travel'],
    thumbnail: 'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=400&q=80',
    images: ['https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=800&q=80'],
    affiliate_link: 'https://www.daraz.pk', affiliate_platform: 'Daraz',
    ratings_avg: 4.4, reviews_count: 143, is_featured: false, stock_status: 'In Stock',
  },
  {
    name: '120W Hyper Charge Adapter',
    description: 'Blazing-fast 120W charger that charges most phones from 0 to 100% in under 15 minutes. Compatible with VOOC, SuperDash, and standard USB-C PD phones.',
    short_description: '120W ultra-fast charger, 0–100% in 15 minutes.',
    price: 3999, compare_price: 5500, brand: 'HyperCharge',
    category: 'Chargers', device_compatibility: ['Universal USB-C'],
    tags: ['120w', 'hyper charge', 'fast', 'usb-c', 'vooc'],
    thumbnail: 'https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=400&q=80',
    images: ['https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=800&q=80'],
    affiliate_link: 'https://www.daraz.pk', affiliate_platform: 'Daraz',
    ratings_avg: 4.7, reviews_count: 187, is_featured: false, stock_status: 'In Stock',
  },

  // ── Cables (6) ─────────────────────────────────────────
  {
    name: 'Braided USB-C to USB-C Cable 2m',
    description: 'Premium nylon braided USB-C to USB-C cable with 100W power delivery. Tangle-free design with durable aluminum connectors. Supports 10Gbps data transfer.',
    short_description: '100W braided USB-C cable with fast charging & data transfer.',
    price: 999, compare_price: 1500, brand: 'TechLink',
    category: 'Cables', device_compatibility: ['Universal'],
    tags: ['braided', 'usb-c', '100w', 'cable', 'fast charge'],
    thumbnail: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=80',
    images: ['https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80'],
    affiliate_link: 'https://www.daraz.pk', affiliate_platform: 'Daraz',
    ratings_avg: 4.6, reviews_count: 287, is_featured: false, stock_status: 'In Stock',
  },
  {
    name: '3-in-1 Charging Cable (USB-C / Lightning / Micro)',
    description: 'Universal 3-in-1 charging cable with USB-C, Lightning, and Micro-USB tips. Charge all your devices with a single cable. Durable reinforced connectors.',
    short_description: 'Universal 3-in-1 cable for all device types.',
    price: 799, compare_price: 1200, brand: 'UniCable',
    category: 'Cables', device_compatibility: ['Universal'],
    tags: ['3-in-1', 'universal', 'lightning', 'micro-usb', 'usb-c'],
    thumbnail: 'https://images.unsplash.com/photo-1583394838336-acd977736f90?auto=format&fit=crop&w=900&q=82',
    images: [
      'https://images.unsplash.com/photo-1583394838336-acd977736f90?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1517336714739-489689fd1ca8?auto=format&fit=crop&w=1200&q=80',
    ],
    affiliate_link: 'https://www.daraz.pk', affiliate_platform: 'Daraz',
    ratings_avg: 4.2, reviews_count: 93, is_featured: false, stock_status: 'In Stock',
  },
  {
    name: 'Lightning to USB-C Cable for iPhone (1m)',
    description: 'MFi certified Lightning to USB-C cable for iPhone and iPad. Supports 20W fast charging with USB-C power adapters. Tangle-resistant braided design.',
    short_description: 'MFi certified Lightning to USB-C cable, 1 meter.',
    price: 1199, compare_price: 1600, brand: 'TechLink',
    category: 'Cables', device_compatibility: ['iPhone', 'iPad'],
    tags: ['lightning', 'mfi', 'iphone', 'usb-c', 'certified'],
    thumbnail: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=80',
    images: ['https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80'],
    affiliate_link: 'https://www.daraz.pk', affiliate_platform: 'Daraz',
    ratings_avg: 4.5, reviews_count: 174, is_featured: false, stock_status: 'In Stock',
  },
  {
    name: 'Retractable 3-in-1 Cable Keychain',
    description: 'Compact retractable keychain cable with USB-C, Lightning, and Micro-USB connectors. 30cm extended length, perfect for travel. Attach to your keyring.',
    short_description: 'Retractable keychain cable with 3 connector types.',
    price: 899, compare_price: 1300, brand: 'KeyCable',
    category: 'Cables', device_compatibility: ['Universal'],
    tags: ['retractable', 'keychain', 'travel', '3-in-1', 'portable'],
    thumbnail: 'https://images.unsplash.com/photo-1517336714739-489689fd1ca8?auto=format&fit=crop&w=900&q=82',
    images: [
      'https://images.unsplash.com/photo-1517336714739-489689fd1ca8?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1583394838336-acd977736f90?auto=format&fit=crop&w=1200&q=80',
    ],
    affiliate_link: 'https://www.daraz.pk', affiliate_platform: 'Daraz',
    ratings_avg: 4.3, reviews_count: 112, is_featured: false, stock_status: 'In Stock',
  },
  {
    name: '240W USB-C Thunderbolt Cable',
    description: 'Thunderbolt 4 / USB4 cable supporting 240W charging, 40Gbps data, and 8K video output. Aluminium connectors with braided jacket. 1.8m length.',
    short_description: '240W Thunderbolt 4 USB-C cable for laptops & phones.',
    price: 2499, compare_price: 3500, brand: 'ThunderLink',
    category: 'Cables', device_compatibility: ['Universal USB-C'],
    tags: ['thunderbolt', '240w', 'usb4', '8k', 'laptop'],
    thumbnail: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=80',
    images: ['https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80'],
    affiliate_link: 'https://www.daraz.pk', affiliate_platform: 'Daraz',
    ratings_avg: 4.7, reviews_count: 63, is_featured: false, stock_status: 'In Stock',
  },
  {
    name: 'Glow-in-the-Dark USB-C Cable 1.5m',
    description: 'Fun LED glow-in-the-dark USB-C cable with 60W fast charging. RGB lighting flows along the cable while charging. Braided with durable aluminum tips.',
    short_description: 'LED glow USB-C cable with 60W charging.',
    price: 1099, compare_price: 1500, brand: 'GlowCable',
    category: 'Cables', device_compatibility: ['Universal USB-C'],
    tags: ['led', 'glow', 'rgb', 'usb-c', 'cool'],
    thumbnail: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=80',
    images: ['https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80'],
    affiliate_link: 'https://www.daraz.pk', affiliate_platform: 'Daraz',
    ratings_avg: 4.4, reviews_count: 88, is_featured: true, stock_status: 'In Stock',
  },

  // ── Earphones (6) ──────────────────────────────────────
  {
    name: 'Pro Wireless Earbuds with ANC',
    description: 'Premium true wireless earbuds with Active Noise Cancellation and 30-hour total battery life. IPX5 water resistant with crystal-clear call quality. Touch controls.',
    short_description: 'ANC true wireless earbuds with 30hr battery & IPX5.',
    price: 5999, compare_price: 8000, brand: 'SoundPro',
    category: 'Earphones', device_compatibility: ['Universal'],
    tags: ['anc', 'wireless', 'earbuds', 'noise cancelling', 'bluetooth'],
    thumbnail: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=400&q=80',
    images: ['https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=800&q=80'],
    affiliate_link: 'https://www.daraz.pk', affiliate_platform: 'Daraz',
    ratings_avg: 4.8, reviews_count: 412, is_featured: true, stock_status: 'In Stock',
  },
  {
    name: 'Type-C Wired Earphones with Mic',
    description: 'Hi-Fi stereo sound wired earphones with USB-C connector. Built-in microphone for crisp calls. Ergonomic in-ear design with extra silicone tips included.',
    short_description: 'Hi-Fi USB-C wired earphones with built-in mic.',
    price: 899, compare_price: 1200, brand: 'ClearSound',
    category: 'Earphones', device_compatibility: ['Universal USB-C'],
    tags: ['wired', 'usb-c', 'earphones', 'mic', 'hifi'],
    thumbnail: 'https://images.unsplash.com/photo-1484704849700-f032a568e944?w=400&q=80',
    images: ['https://images.unsplash.com/photo-1484704849700-f032a568e944?w=800&q=80'],
    affiliate_link: 'https://www.daraz.pk', affiliate_platform: 'Daraz',
    ratings_avg: 4.3, reviews_count: 176, is_featured: false, stock_status: 'In Stock',
  },
  {
    name: 'Bass Boost Wireless Earbuds',
    description: 'Powerful bass-enhanced wireless earbuds with 8mm dynamic drivers. 24-hour battery with charging case. IPX4 water resistance. Bluetooth 5.3 for stable connection.',
    short_description: 'Bass-boosted wireless earbuds with 24hr battery.',
    price: 2999, compare_price: 4000, brand: 'BassKing',
    category: 'Earphones', device_compatibility: ['Universal'],
    tags: ['bass', 'wireless', 'earbuds', 'bluetooth', 'ipx4'],
    thumbnail: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=400&q=80',
    images: ['https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=800&q=80'],
    affiliate_link: 'https://www.daraz.pk', affiliate_platform: 'Daraz',
    ratings_avg: 4.5, reviews_count: 233, is_featured: false, stock_status: 'In Stock',
  },
  {
    name: 'Open-Ear Bone Conduction Headphones',
    description: 'Bone conduction technology lets you hear your surroundings while listening to music. Perfect for running, cycling, and outdoor activities. IP67 waterproof.',
    short_description: 'Open-ear bone conduction sports headphones, IP67.',
    price: 6499, compare_price: 9000, brand: 'BoneFit',
    category: 'Earphones', device_compatibility: ['Universal'],
    tags: ['bone conduction', 'open ear', 'sports', 'running', 'ip67'],
    thumbnail: 'https://images.unsplash.com/photo-1484704849700-f032a568e944?w=400&q=80',
    images: ['https://images.unsplash.com/photo-1484704849700-f032a568e944?w=800&q=80'],
    affiliate_link: 'https://www.daraz.pk', affiliate_platform: 'Daraz',
    ratings_avg: 4.6, reviews_count: 87, is_featured: true, stock_status: 'In Stock',
  },
  {
    name: 'Gaming Earbuds with Low Latency Mode',
    description: 'True wireless gaming earbuds with 40ms ultra-low latency game mode. 7.1 surround sound simulation and RGB charging case. 30-hour total battery life.',
    short_description: 'Gaming TWS earbuds with 40ms latency & RGB case.',
    price: 3799, compare_price: 5200, brand: 'GameSound',
    category: 'Earphones', device_compatibility: ['Universal'],
    tags: ['gaming', 'low latency', 'rgb', 'wireless', 'earbuds'],
    thumbnail: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=400&q=80',
    images: ['https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=800&q=80'],
    affiliate_link: 'https://www.daraz.pk', affiliate_platform: 'Daraz',
    ratings_avg: 4.7, reviews_count: 154, is_featured: false, stock_status: 'In Stock',
  },
  {
    name: 'Lightning Wired Earphones for iPhone',
    description: 'MFi certified Lightning earphones for iPhone with inline microphone and volume controls. High-fidelity sound with deep bass. Compatible with all Lightning iPhones.',
    short_description: 'MFi Lightning earphones for iPhone.',
    price: 1299, compare_price: 1800, brand: 'iSound',
    category: 'Earphones', device_compatibility: ['iPhone'],
    tags: ['lightning', 'iphone', 'wired', 'mfi', 'earphones'],
    thumbnail: 'https://images.unsplash.com/photo-1484704849700-f032a568e944?w=400&q=80',
    images: ['https://images.unsplash.com/photo-1484704849700-f032a568e944?w=800&q=80'],
    affiliate_link: 'https://www.daraz.pk', affiliate_platform: 'Daraz',
    ratings_avg: 4.2, reviews_count: 119, is_featured: false, stock_status: 'In Stock',
  },

  // ── Screen Guards (6) ──────────────────────────────────
  {
    name: 'Tempered Glass Screen Protector for iPhone 15',
    description: '9H hardness tempered glass screen protector for iPhone 15. Ultra-clear with oleophobic coating to resist fingerprints. Easy bubble-free installation with alignment frame.',
    short_description: '9H tempered glass with alignment frame for iPhone 15.',
    price: 599, compare_price: 900, brand: 'GlassGuard',
    category: 'Screen Guards', device_compatibility: ['iPhone 15'],
    tags: ['tempered glass', '9h', 'iphone', 'screen protector'],
    thumbnail: '/assets/gg-screen-guard.svg',
    images: [
      '/assets/gg-screen-guard.svg',
      'https://images.unsplash.com/photo-1598327105666-5b89351aff97?auto=format&fit=crop&w=1200&q=80',
    ],
    affiliate_link: 'https://www.daraz.pk', affiliate_platform: 'Daraz',
    ratings_avg: 4.5, reviews_count: 234, is_featured: false, stock_status: 'In Stock',
  },
  {
    name: 'Privacy Anti-Spy Screen Protector for Samsung S24',
    description: 'Privacy filter tempered glass that blocks side views. 9H hardness with anti-fingerprint coating. Prevents others from seeing your screen at angles.',
    short_description: 'Privacy anti-spy tempered glass for Samsung Galaxy S24.',
    price: 899, compare_price: 1300, brand: 'PrivacyPro',
    category: 'Screen Guards', device_compatibility: ['Samsung Galaxy S24'],
    tags: ['privacy', 'anti-spy', 'samsung', 'tempered glass'],
    thumbnail: 'https://images.unsplash.com/photo-1601784551446-20c9e07cdbdb?w=400&q=80',
    images: ['https://images.unsplash.com/photo-1601784551446-20c9e07cdbdb?w=800&q=80'],
    affiliate_link: 'https://www.daraz.pk', affiliate_platform: 'Daraz',
    ratings_avg: 4.4, reviews_count: 88, is_featured: false, stock_status: 'In Stock',
  },
  {
    name: 'Matte Anti-Glare Screen Protector for iPhone 14',
    description: 'Matte finish tempered glass that eliminates glare and reflections. Perfect for outdoor use. 9H hardness with anti-fingerprint and anti-glare coating.',
    short_description: 'Matte anti-glare screen protector for iPhone 14.',
    price: 699, compare_price: 1000, brand: 'MatteGuard',
    category: 'Screen Guards', device_compatibility: ['iPhone 14'],
    tags: ['matte', 'anti-glare', 'iphone', 'tempered glass'],
    thumbnail: 'https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=400&q=80',
    images: ['https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=800&q=80'],
    affiliate_link: 'https://www.daraz.pk', affiliate_platform: 'Daraz',
    ratings_avg: 4.3, reviews_count: 97, is_featured: false, stock_status: 'In Stock',
  },
  {
    name: 'Full Glue Edge-to-Edge Glass for Samsung A54',
    description: 'Full coverage tempered glass for Samsung Galaxy A54 with full glue adhesive. No black borders. Curved edge compatibility. Auto-aligns during installation.',
    short_description: 'Full-coverage edge-to-edge glass for Galaxy A54.',
    price: 799, compare_price: 1100, brand: 'FullGuard',
    category: 'Screen Guards', device_compatibility: ['Samsung Galaxy A54'],
    tags: ['full glue', 'edge to edge', 'samsung', 'tempered glass'],
    thumbnail: 'https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=400&q=80',
    images: ['https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=800&q=80'],
    affiliate_link: 'https://www.daraz.pk', affiliate_platform: 'Daraz',
    ratings_avg: 4.4, reviews_count: 72, is_featured: false, stock_status: 'In Stock',
  },
  {
    name: 'Ceramic Film Screen Protector (Flexible)',
    description: 'Ultra-flexible ceramic film screen protector that covers curved edges. Unbreakable yet scratch-resistant. Thinner than glass with same 9H hardness rating.',
    short_description: 'Flexible ceramic film screen protector, unbreakable.',
    price: 999, compare_price: 1400, brand: 'CeraGuard',
    category: 'Screen Guards', device_compatibility: ['Universal'],
    tags: ['ceramic', 'flexible', 'unbreakable', 'curved', 'screen guard'],
    thumbnail: 'https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=400&q=80',
    images: ['https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=800&q=80'],
    affiliate_link: 'https://www.daraz.pk', affiliate_platform: 'Daraz',
    ratings_avg: 4.2, reviews_count: 53, is_featured: false, stock_status: 'In Stock',
  },
  {
    name: 'Camera Lens Protector Set for iPhone 15 Pro',
    description: 'Titanium alloy frame camera lens protector set for iPhone 15 Pro. Scratch-resistant optical glass lens covers. Set of 3 lenses.',
    short_description: 'Titanium camera lens protector set for iPhone 15 Pro.',
    price: 1299, compare_price: 1800, brand: 'LensGuard',
    category: 'Screen Guards', device_compatibility: ['iPhone 15 Pro'],
    tags: ['camera', 'lens protector', 'iphone', 'titanium'],
    thumbnail: 'https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=400&q=80',
    images: ['https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=800&q=80'],
    affiliate_link: 'https://www.daraz.pk', affiliate_platform: 'Daraz',
    ratings_avg: 4.6, reviews_count: 131, is_featured: true, stock_status: 'In Stock',
  },

  ...BUNDLE_CATALOG.map((b) => ({
    ...b,
    affiliate_link: 'https://www.daraz.pk',
    affiliate_platform: 'Daraz',
  })),
  ...CURATED_CATALOG_EXTRA,
];

const CATALOG_TARGET = 180;

const {
  enrichProductsForAnalytics,
  seedHistoricalOrders,
  seedHistoricalReviews,
  seedUserBehaviors,
  seedFilterCoverageOrders,
} = require('./seedAnalyticsLib');

// ── SEED FUNCTION ──────────────────────────────────────────────────────────
async function seed() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    await Product.deleteMany({});
    await User.deleteMany({});
    await Order.deleteMany({});
    await Review.deleteMany({});
    await UserBehavior.deleteMany({});
    console.log('🗑️  Cleared existing data');

    const generatedCount = Math.max(0, CATALOG_TARGET - CURATED_PRODUCTS.length);
    console.log(`📦 Inserting ${CURATED_PRODUCTS.length} curated + ${generatedCount} generated products...`);
    const catalog = [
      ...CURATED_PRODUCTS.map(p => ({ ...p, is_active: true, is_draft: false })),
      ...generateProducts(generatedCount),
    ];
    const savedProducts = [];
    for (const p of catalog) {
      const saved = await new Product(p).save();
      savedProducts.push(saved);
    }
    console.log(`✅ Inserted ${savedProducts.length} products`);

    console.log('📊 Enriching products (views, stock signals)...');
    await enrichProductsForAnalytics(savedProducts);

    const dealConfigs = [
      { days: 7, stock: 39 },
      { days: 5, stock: 52 },
      { days: 10, stock: 18 },
      { days: 3, stock: 74 },
      { days: 14, stock: 25 },
    ];
    const dealCandidates = savedProducts.slice().sort((a, b) => (b.is_featured - a.is_featured));
    for (let i = 0; i < Math.min(dealCandidates.length, dealConfigs.length); i++) {
      const cfg = dealConfigs[i];
      const ends = new Date();
      ends.setDate(ends.getDate() + cfg.days);
      const total = cfg.stock + 25;
      dealCandidates[i].is_deal = true;
      dealCandidates[i].deal_ends_at = ends;
      dealCandidates[i].deal_stock_total = total;
      dealCandidates[i].deal_stock_remaining = cfg.stock;
      dealCandidates[i].deal_sort_order = i;
      if (!dealCandidates[i].compare_price) {
        dealCandidates[i].compare_price = Math.round(dealCandidates[i].price * 1.3);
      }
      await Product.findByIdAndUpdate(dealCandidates[i]._id, {
        is_deal: true,
        deal_ends_at: ends,
        deal_stock_total: total,
        deal_stock_remaining: cfg.stock,
        deal_sort_order: i,
        compare_price: dealCandidates[i].compare_price,
      });
    }
    console.log(`🏷️  Applied ${Math.min(dealCandidates.length, dealConfigs.length)} weekly deals`);

    // Generate and insert 100 users
    console.log('👤 Generating 100 users...');
    const generatedUsers = generateUsers(100);
    const savedUsers = [];
    for (const u of generatedUsers) {
      const saved = await new User(u).save();
      savedUsers.push(saved);
    }
    console.log(`✅ Inserted ${savedUsers.length} users (1 admin + ${savedUsers.length - 1} customers)`);

    const normalUsers = savedUsers.slice(1); // exclude admin

    console.log('🛒 Generating historical orders (365-day spread)...');
    const savedOrders = await seedHistoricalOrders({
      savedProducts,
      normalUsers,
      count: 480,
      daysBack: 365,
    });
    const coverageOrders = await seedFilterCoverageOrders({
      savedProducts,
      normalUsers,
      daysBack: 365,
    });
    console.log(`✅ Inserted ${savedOrders.length} orders (+${coverageOrders} filter-coverage orders)`);

    console.log('⭐ Generating historical reviews...');
    const reviewCount = await seedHistoricalReviews({
      savedProducts,
      normalUsers,
      count: 220,
      daysBack: 365,
    });
    console.log(`✅ Inserted ${reviewCount} reviews`);

    console.log('🧠 Generating user behavior for analytics...');
    const behaviorCount = await seedUserBehaviors({
      normalUsers,
      savedProducts,
      count: 130,
      daysBack: 90,
    });
    console.log(`✅ Inserted ${behaviorCount} behavior records`);

    console.log('\n✅ Seed complete!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`📦 Products  : ${savedProducts.length} (curated + generated)`);
    console.log(`👤 Users     : ${savedUsers.length}  (1 admin + ${savedUsers.length - 1} customers)`);
    console.log(`🛒 Orders    : ${savedOrders.length} (spread over 90 days)`);
    console.log(`⭐ Reviews   : ${reviewCount}`);
    console.log(`🧠 Behaviors : ${behaviorCount}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🔐 Admin → admin@gadgetglam.pk / admin123');
    console.log('🔐 User  → user1@example.com    / user1234');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    process.exit(0);
  } catch (err) {
    console.error('❌ Seed error:', err.message);
    console.error(err);
    process.exit(1);
  }
}

if (require.main === module) {
  seed();
}

