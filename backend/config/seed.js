require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const Product  = require('../models/Product');
const User     = require('../models/User');
const { Order, Review } = require('../models/OrderReview');

const products = [
  // ── Cases ──────────────────────────────────────────────
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

  // ── Chargers ────────────────────────────────────────────
  {
    name: '65W GaN Fast Charger USB-C 3-Port',
    description: 'Compact 65W GaN technology charger with 3 ports (2x USB-C, 1x USB-A). Simultaneously charge laptop, phone, and tablet. Foldable plug for easy travel.',
    short_description: '65W GaN fast charger with 3 ports for all devices.',
    price: 3299, compare_price: 4500, brand: 'PowerPro',
    category: 'Chargers', device_compatibility: ['Universal'],
    tags: ['gan', 'fast charger', '65w', 'usb-c', 'laptop'],
    thumbnail: 'https://images.unsplash.com/photo-1609592806596-b452e069e3bc?w=400&q=80',
    images: ['https://images.unsplash.com/photo-1609592806596-b452e069e3bc?w=800&q=80'],
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
    thumbnail: 'https://images.unsplash.com/photo-1614438945823-f78d7af1dd82?w=400&q=80',
    images: ['https://images.unsplash.com/photo-1614438945823-f78d7af1dd82?w=800&q=80'],
    affiliate_link: 'https://www.daraz.pk', affiliate_platform: 'Daraz',
    ratings_avg: 4.5, reviews_count: 156, is_featured: true, stock_status: 'In Stock',
  },

  // ── Cables ──────────────────────────────────────────────
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
    thumbnail: 'https://images.unsplash.com/photo-1601504658430-97b3d76d5a48?w=400&q=80',
    images: ['https://images.unsplash.com/photo-1601504658430-97b3d76d5a48?w=800&q=80'],
    affiliate_link: 'https://www.daraz.pk', affiliate_platform: 'Daraz',
    ratings_avg: 4.2, reviews_count: 93, is_featured: false, stock_status: 'In Stock',
  },

  // ── Earphones ───────────────────────────────────────────
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

  // ── Screen Guards ────────────────────────────────────────
  {
    name: 'Tempered Glass Screen Protector for iPhone 15',
    description: '9H hardness tempered glass screen protector for iPhone 15. Ultra-clear with oleophobic coating to resist fingerprints. Easy bubble-free installation with alignment frame.',
    short_description: '9H tempered glass with alignment frame for iPhone 15.',
    price: 599, compare_price: 900, brand: 'GlassGuard',
    category: 'Screen Guards', device_compatibility: ['iPhone 15'],
    tags: ['tempered glass', '9h', 'iphone', 'screen protector'],
    thumbnail: 'https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=400&q=80',
    images: ['https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=800&q=80'],
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

  // ── Bundles ─────────────────────────────────────────────
  {
    name: 'Ultimate iPhone 15 Starter Pack',
    description: 'Everything you need for your new iPhone 15: Premium leather case + 20W charger + USB-C cable + tempered glass screen protector. Save 30% vs buying separately.',
    short_description: 'Complete 4-in-1 starter bundle for iPhone 15.',
    price: 4999, compare_price: 7200, brand: 'GadgetGlam',
    category: 'Bundles', device_compatibility: ['iPhone 15'],
    tags: ['bundle', 'iphone', 'starter pack', 'value', 'combo'],
    thumbnail: 'https://images.unsplash.com/photo-1512054502232-10a0a035d672?w=400&q=80',
    images: ['https://images.unsplash.com/photo-1512054502232-10a0a035d672?w=800&q=80'],
    affiliate_link: 'https://www.daraz.pk', affiliate_platform: 'Daraz',
    ratings_avg: 4.9, reviews_count: 54, is_featured: true, stock_status: 'In Stock',
  },
  {
    name: 'Samsung Galaxy Accessories Mega Bundle',
    description: 'Complete accessories bundle for Samsung Galaxy users. Includes clear case, 25W fast charger, braided USB-C cable, and privacy screen guard. Best value deal.',
    short_description: 'Complete 4-in-1 accessories bundle for Samsung Galaxy.',
    price: 3999, compare_price: 5800, brand: 'GadgetGlam',
    category: 'Bundles', device_compatibility: ['Samsung Galaxy S24', 'Samsung Galaxy A54'],
    tags: ['bundle', 'samsung', 'combo', 'value', 'charger'],
    thumbnail: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=80',
    images: ['https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80'],
    affiliate_link: 'https://www.daraz.pk', affiliate_platform: 'Daraz',
    ratings_avg: 4.7, reviews_count: 41, is_featured: true, stock_status: 'In Stock',
  },
];

const users = [
  {
    first_name: 'Admin',
    last_name: 'GadgetGlam',
    email: 'admin@gadgetglam.pk',
    password: 'admin123',
    role: 'admin',
  },
  {
    first_name: 'Amnah',
    last_name: 'Khan',
    email: 'amnah@example.com',
    password: 'user1234',
    role: 'user',
  },
];

async function seed() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Clear existing data
    await Product.deleteMany({});
    await User.deleteMany({});
    console.log('🗑️  Cleared existing data');

    // Insert products (save individually so pre-save slug hook runs)
    for (const p of products) {
      await new Product(p).save();
    }
    console.log(`📦 Inserted ${products.length} products`);

    // Insert users (passwords will be hashed by pre-save hook)
    for (const u of users) {
      await new User(u).save();
    }
    console.log(`👤 Inserted ${users.length} users`);

    console.log('\n✅ Seed complete!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('👤 Admin   → admin@gadgetglam.pk  / admin123');
    console.log('👤 User    → amnah@example.com    / user1234');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    process.exit(0);
  } catch (err) {
    console.error('❌ Seed error:', err.message);
    process.exit(1);
  }
}

seed();
