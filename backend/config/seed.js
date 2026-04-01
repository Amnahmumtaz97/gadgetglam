require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const Product  = require('../models/Product');
const User     = require('../models/User');
const { Order, Review } = require('../models/OrderReview');

// ── PRODUCTS ──────────────────────────────────────────────────────────────────
const products = [

  // ── Cases (10) ─────────────────────────────────────────
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
  {
    name: '25W Super Fast Charger for Samsung',
    description: 'Official-grade 25W super fast charger for Samsung Galaxy devices. USB-C with AFC (Adaptive Fast Charging). Works with S24, S23, A54, and more.',
    short_description: '25W Samsung-compatible USB-C super fast charger.',
    price: 1799, compare_price: 2400, brand: 'SuperCharge',
    category: 'Chargers', device_compatibility: ['Samsung Galaxy S24', 'Samsung Galaxy S23', 'Samsung Galaxy A54'],
    tags: ['25w', 'samsung', 'super fast', 'usb-c'],
    thumbnail: 'https://images.unsplash.com/photo-1609592806596-b452e069e3bc?w=400&q=80',
    images: ['https://images.unsplash.com/photo-1609592806596-b452e069e3bc?w=800&q=80'],
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
    thumbnail: 'https://images.unsplash.com/photo-1609592806596-b452e069e3bc?w=400&q=80',
    images: ['https://images.unsplash.com/photo-1609592806596-b452e069e3bc?w=800&q=80'],
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
    thumbnail: 'https://images.unsplash.com/photo-1614438945823-f78d7af1dd82?w=400&q=80',
    images: ['https://images.unsplash.com/photo-1614438945823-f78d7af1dd82?w=800&q=80'],
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
    thumbnail: 'https://images.unsplash.com/photo-1609592806596-b452e069e3bc?w=400&q=80',
    images: ['https://images.unsplash.com/photo-1609592806596-b452e069e3bc?w=800&q=80'],
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
    thumbnail: 'https://images.unsplash.com/photo-1601504658430-97b3d76d5a48?w=400&q=80',
    images: ['https://images.unsplash.com/photo-1601504658430-97b3d76d5a48?w=800&q=80'],
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
    thumbnail: 'https://images.unsplash.com/photo-1601504658430-97b3d76d5a48?w=400&q=80',
    images: ['https://images.unsplash.com/photo-1601504658430-97b3d76d5a48?w=800&q=80'],
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

  // ── Bundles (4) ────────────────────────────────────────
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
  {
    name: 'GadgetGlam Travel Kit',
    description: 'The perfect travel kit: 65W GaN charger + 3-in-1 cable + 10000mAh power bank + carry pouch. Covers all your charging needs on the road. Save 25%.',
    short_description: 'Travel charging kit: GaN charger + cable + power bank.',
    price: 6999, compare_price: 9500, brand: 'GadgetGlam',
    category: 'Bundles', device_compatibility: ['Universal'],
    tags: ['travel', 'bundle', 'power bank', 'gan', 'charger', 'cable'],
    thumbnail: 'https://images.unsplash.com/photo-1609592806596-b452e069e3bc?w=400&q=80',
    images: ['https://images.unsplash.com/photo-1609592806596-b452e069e3bc?w=800&q=80'],
    affiliate_link: 'https://www.daraz.pk', affiliate_platform: 'Daraz',
    ratings_avg: 4.8, reviews_count: 29, is_featured: true, stock_status: 'In Stock',
  },
  {
    name: 'Audio Lover Bundle — Earbuds + Wireless Pad',
    description: 'Perfect combo for music lovers: Pro Wireless ANC Earbuds + 3-in-1 Wireless Charging Pad. Enjoy cable-free audio and cable-free charging. Save 20%.',
    short_description: 'ANC earbuds + 3-in-1 wireless charging pad bundle.',
    price: 8999, compare_price: 11500, brand: 'GadgetGlam',
    category: 'Bundles', device_compatibility: ['Universal'],
    tags: ['audio', 'bundle', 'earbuds', 'wireless charging', 'combo'],
    thumbnail: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=400&q=80',
    images: ['https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=800&q=80'],
    affiliate_link: 'https://www.daraz.pk', affiliate_platform: 'Daraz',
    ratings_avg: 4.9, reviews_count: 18, is_featured: true, stock_status: 'In Stock',
  },
];

// ── USERS ──────────────────────────────────────────────────────────────────
const users = [
  { first_name: 'Admin',   last_name: 'GadgetGlam', email: 'admin@gadgetglam.pk', password: 'admin123',  role: 'admin' },
  { first_name: 'Amnah',   last_name: 'Khan',        email: 'amnah@example.com',   password: 'user1234',  role: 'user' },
  { first_name: 'Bilal',   last_name: 'Ahmed',       email: 'bilal@example.com',   password: 'user1234',  role: 'user' },
  { first_name: 'Sana',    last_name: 'Malik',       email: 'sana@example.com',    password: 'user1234',  role: 'user' },
  { first_name: 'Usman',   last_name: 'Raza',        email: 'usman@example.com',   password: 'user1234',  role: 'user' },
  { first_name: 'Hira',    last_name: 'Baig',        email: 'hira@example.com',    password: 'user1234',  role: 'user' },
  { first_name: 'Kamran',  last_name: 'Sheikh',      email: 'kamran@example.com',  password: 'user1234',  role: 'user' },
  { first_name: 'Zara',    last_name: 'Hussain',     email: 'zara@example.com',    password: 'user1234',  role: 'user' },
  { first_name: 'Faisal',  last_name: 'Qureshi',     email: 'faisal@example.com',  password: 'user1234',  role: 'user' },
  { first_name: 'Nadia',   last_name: 'Iqbal',       email: 'nadia@example.com',   password: 'user1234',  role: 'user' },
];

// ── SEED FUNCTION ──────────────────────────────────────────────────────────
async function seed() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    await Product.deleteMany({});
    await User.deleteMany({});
    await Order.deleteMany({});
    await Review.deleteMany({});
    console.log('🗑️  Cleared existing data');

    // Insert products (pre-save slug hook runs per save)
    const savedProducts = [];
    for (const p of products) {
      const saved = await new Product(p).save();
      savedProducts.push(saved);
    }
    console.log(`📦 Inserted ${savedProducts.length} products`);

    // Insert users (pre-save password hash hook runs)
    const savedUsers = [];
    for (const u of users) {
      const saved = await new User(u).save();
      savedUsers.push(saved);
    }
    console.log(`👤 Inserted ${savedUsers.length} users`);

    const normalUsers = savedUsers.slice(1); // exclude admin

    // ── ORDERS ────────────────────────────────────────────────────────────
    const orderTemplates = [
      { ui: 0, pi: [0, 10],     qty: [1,1], method:'COD',       pstat:'Unpaid',  ostat:'Pending',    addr:{ street:'12 Gulshan Block 4',       city:'Karachi',   zip:'75300' } },
      { ui: 1, pi: [4, 18],     qty: [1,2], method:'JazzCash',  pstat:'Paid',    ostat:'Delivered',  addr:{ street:'5 DHA Phase 2',             city:'Lahore',    zip:'54000' }, track:'TCS-2024-00112' },
      { ui: 2, pi: [14],        qty: [1],   method:'COD',       pstat:'Unpaid',  ostat:'Processing', addr:{ street:'G-9/2 Street 45',           city:'Islamabad', zip:'44000' } },
      { ui: 3, pi: [6, 22],     qty: [1,1], method:'EasyPaisa', pstat:'Paid',    ostat:'Shipped',    addr:{ street:'Clifton Block 8',           city:'Karachi',   zip:'75600' }, track:'MNP-2024-00887' },
      { ui: 4, pi: [36],        qty: [1],   method:'COD',       pstat:'Unpaid',  ostat:'Pending',    addr:{ street:'Model Town Link Road',      city:'Lahore',    zip:'54700' } },
      { ui: 5, pi: [10,16,20],  qty: [1,1,1],method:'JazzCash', pstat:'Paid',    ostat:'Delivered',  addr:{ street:'F-7 Markaz',               city:'Islamabad', zip:'44000' }, track:'TCS-2024-00456' },
      { ui: 6, pi: [2, 8],      qty: [1,1], method:'COD',       pstat:'Unpaid',  ostat:'Processing', addr:{ street:'Johar Town Phase 2',        city:'Lahore',    zip:'54782' } },
      { ui: 7, pi: [37],        qty: [1],   method:'EasyPaisa', pstat:'Paid',    ostat:'Delivered',  addr:{ street:'Cantt Area Road 3',         city:'Rawalpindi',zip:'46000' }, track:'LCS-2024-00234' },
      { ui: 0, pi: [12, 26],    qty: [2,1], method:'COD',       pstat:'Unpaid',  ostat:'Cancelled',  addr:{ street:'PECHS Block 2',             city:'Karachi',   zip:'75400' } },
      { ui: 1, pi: [33, 29],    qty: [1,1], method:'JazzCash',  pstat:'Paid',    ostat:'Shipped',    addr:{ street:'Bahria Town Phase 4',       city:'Rawalpindi',zip:'46220' }, track:'TCS-2024-00981' },
      { ui: 2, pi: [23, 6],     qty: [1,1], method:'COD',       pstat:'Unpaid',  ostat:'Delivered',  addr:{ street:'Blue Area Plot 12',         city:'Islamabad', zip:'44000' } },
      { ui: 3, pi: [0,19,31],   qty: [1,1,1],method:'EasyPaisa',pstat:'Paid',    ostat:'Delivered',  addr:{ street:'North Nazimabad Block H',   city:'Karachi',   zip:'74700' }, track:'MNP-2024-01234' },
      { ui: 4, pi: [17],        qty: [3],   method:'COD',       pstat:'Unpaid',  ostat:'Pending',    addr:{ street:'Shadman Colony',            city:'Lahore',    zip:'54000' } },
      { ui: 5, pi: [36, 38],    qty: [1,1], method:'JazzCash',  pstat:'Paid',    ostat:'Processing', addr:{ street:'E-11 Sector 3',             city:'Islamabad', zip:'44000' } },
      { ui: 6, pi: [38],        qty: [1],   method:'COD',       pstat:'Unpaid',  ostat:'Delivered',  addr:{ street:'Gulberg III',               city:'Lahore',    zip:'54660' } },
    ];

    const savedOrders = [];
    for (const t of orderTemplates) {
      const orderProducts = t.pi.map((pidx, i) => {
        const p = savedProducts[Math.min(pidx, savedProducts.length - 1)];
        return { product_id: p._id, name: p.name, thumbnail: p.thumbnail, quantity: t.qty[i] || 1, price: p.price, affiliate_link: p.affiliate_link };
      });
      const total = orderProducts.reduce((s, p) => s + p.price * p.quantity, 0);
      const order = await new Order({
        user_id:          normalUsers[t.ui % normalUsers.length]._id,
        products:         orderProducts,
        total_price:      total,
        payment_method:   t.method,
        payment_status:   t.pstat,
        order_status:     t.ostat,
        tracking_number:  t.track,
        shipping_address: { ...t.addr, country: 'Pakistan' },
      }).save();
      savedOrders.push(order);
    }
    console.log(`🛒 Inserted ${savedOrders.length} orders`);

    // ── REVIEWS ───────────────────────────────────────────────────────────
    const reviewTemplates = [
      { pi:0,  ui:0, r:5, title:'Absolutely love it!',           text:'This leather case feels premium and my iPhone 15 Pro looks stunning in it. The card slots are super handy. Worth every rupee!' },
      { pi:0,  ui:1, r:4, title:'Great quality',                 text:'Very nice leather feel and the magnetic closure is satisfying. Slight discoloration on the edges after a month but still looks good.' },
      { pi:1,  ui:2, r:5, title:'Crystal clear!',                text:'You can barely notice it is even on the phone. Fits perfectly and the corners are solid. No yellowing after 2 months.' },
      { pi:1,  ui:3, r:4, title:'Good value',                    text:'Solid protection and very clear. It did slip off once but the case did its job. Would recommend for the price.' },
      { pi:2,  ui:4, r:5, title:'Beast protection',              text:'Dropped my phone three times and not a single scratch. The dual-layer design is bulkier but worth it. MagSafe works perfectly too.' },
      { pi:3,  ui:5, r:4, title:'So cute!',                      text:'Bought this for my daughter and she absolutely loves the glitter. The liquid moves when you tilt it. Looks adorable!' },
      { pi:4,  ui:6, r:5, title:'Sleek matte finish',            text:'Love the matte texture — no fingerprints at all! Very slim and does not add bulk. Exactly what I was looking for.' },
      { pi:5,  ui:7, r:3, title:'Decent but leather peeling',    text:'After 3 months the outer leather started to peel at the corners. Card slots work fine though. Expected better quality.' },
      { pi:6,  ui:8, r:5, title:'Ring stand is a game changer',  text:'I use the ring stand to watch Netflix at night and it is perfect. Works with my car mount too. Very sturdy.' },
      { pi:7,  ui:0, r:5, title:'Perfect MagSafe case',          text:'Snaps onto my MagSafe charger instantly every time. Crystal clear and tough. Best case I have bought for my 15 Pro Max.' },
      { pi:8,  ui:1, r:4, title:'Heavy duty and reliable',       text:'This case is thick but gives incredible peace of mind. Dropped it from a table and the phone was fine. Built like a tank.' },
      { pi:9,  ui:2, r:4, title:'Nice and thin',                 text:'Very slim and the card slot fits two cards easily. Polycarbonate feels premium. A bit slippery without a grip though.' },
      { pi:10, ui:3, r:5, title:'GaN charger is magic',          text:'Charges my laptop, phone, and earbuds all at once! Such a small brick for so much power. Travelling with just this now.' },
      { pi:10, ui:4, r:5, title:'Best charger ever',             text:'Replaced three separate chargers with this one GaN charger. Charges everything fast and stays cool. 100% recommend.' },
      { pi:11, ui:5, r:4, title:'iPhone charges super fast',     text:'My iPhone 15 goes from 20% to 100% in about 45 minutes. Very compact adapter. Happy with the purchase.' },
      { pi:12, ui:6, r:5, title:'MagSafe heaven',                text:'Aligns perfectly with my iPhone every time. No more misalignment issues like with generic chargers. Love the braided cable included.' },
      { pi:13, ui:7, r:5, title:'Samsung charges blazing fast',  text:'My S24 Ultra charges noticeably faster with this than the stock charger. Well worth the upgrade.' },
      { pi:14, ui:8, r:4, title:'Solid power bank',              text:'The LED display is very accurate. Charges my phone twice easily. Fits in my jeans pocket which is a bonus.' },
      { pi:15, ui:0, r:5, title:'Best bedside station',          text:'Charges my iPhone, Apple Watch, and AirPods every night. The night light mode is a nice touch. No cable mess anymore!' },
      { pi:16, ui:1, r:4, title:'Perfect travel companion',      text:'Small and light enough to keep in the car. Both ports actually deliver full speed. Great for long drives.' },
      { pi:17, ui:2, r:4, title:'Very fast 120W',                text:'My phone went from 10% to 100% in 14 minutes. Absolutely insane speed. A bit warm but totally safe.' },
      { pi:18, ui:3, r:5, title:'Super reliable cable',          text:'The nylon braiding feels incredibly durable. Used it every day for 4 months and it still looks new. 100W actually works.' },
      { pi:19, ui:4, r:4, title:'Very handy 3-in-1',             text:'So convenient to carry one cable for all devices. Quality is decent for the price. The micro-USB end is a bit stiff.' },
      { pi:20, ui:5, r:5, title:'MFi certified and fast',        text:'Finally a proper fast-charging Lightning cable. My iPad charges noticeably faster. Braiding feels premium.' },
      { pi:22, ui:6, r:5, title:'Thunderbolt 4 is incredible',   text:'Transfer speed is mind-blowing for my external SSD. Charges my MacBook at full 240W. Premium feel all around.' },
      { pi:23, ui:7, r:3, title:'Fun but LEDs dim over time',    text:'Loved the glow effect when I first got it but after a month the LEDs are noticeably dimmer. Charging still works fine.' },
      { pi:24, ui:8, r:5, title:'ANC is incredible',             text:'These earbuds cancel noise so well that I cannot hear anything around me. Sound quality is rich and detailed. Best purchase this year.' },
      { pi:24, ui:0, r:5, title:'Worth every rupee',             text:'The bass is deep without being muddy. ANC works great in the office. Battery easily lasts all day. 10/10.' },
      { pi:25, ui:1, r:4, title:'Good wired earphones',          text:'Clear audio and the microphone picks up my voice well on calls. USB-C fits perfectly. A bit uncomfortable after 2 hours.' },
      { pi:26, ui:2, r:4, title:'Nice bass boost',               text:'Bass hits hard and clear. Good battery life. Not as good as the ANC earbuds but at half the price it is great value.' },
      { pi:27, ui:3, r:5, title:'Life-changing for running',     text:'I can hear traffic while running and still enjoy my music. Bone conduction is a weird sensation at first but you get used to it.' },
      { pi:28, ui:4, r:5, title:'Gaming earbuds are legit',      text:'The low latency mode makes a huge difference in PUBG. No more hearing footsteps a second after they happen. RGB case is cool too.' },
      { pi:29, ui:5, r:4, title:'No bubbles at all!',            text:'Used the alignment frame and it went on perfectly first try. Crystal clear and harder than other screen protectors I have used.' },
      { pi:30, ui:6, r:4, title:'Privacy works great',           text:'People next to me on the bus cannot see my screen at all. Glass quality is good but installation was slightly tricky.' },
      { pi:31, ui:7, r:4, title:'Great for outdoor use',         text:'No glare at all in sunlight. The matte finish feels different from glass but you get used to it. Touch response is still excellent.' },
      { pi:34, ui:8, r:5, title:'Camera lenses look gorgeous',   text:'The titanium frame looks so premium on my iPhone 15 Pro. Lenses are perfectly clear and scratch-proof. Easy to install.' },
      { pi:35, ui:0, r:5, title:'Perfect bundle deal',           text:'Got everything I needed for my new iPhone in one package. Quality of all items is top-notch and the savings are real. Highly recommend!' },
      { pi:36, ui:1, r:5, title:'Samsung bundle is great value', text:'The clear case, fast charger, and cable all feel premium. Privacy guard was easy to install. Saved a lot versus buying separately.' },
      { pi:37, ui:2, r:5, title:'Travel kit is perfect',         text:'Took this on my Dubai trip and it covered everything — laptop, phone, tablet, all charged. The carry pouch is a nice bonus.' },
      { pi:38, ui:3, r:5, title:'Audio lover bundle is fire',    text:'The earbuds and charging pad together are an amazing combo. Dropped both devices on the pad at night, wake up fully charged. 5 stars!' },
    ];

    let reviewCount = 0;
    for (const t of reviewTemplates) {
      const pidx = Math.min(t.pi, savedProducts.length - 1);
      const uidx = Math.min(t.ui, normalUsers.length - 1);
      await new Review({
        product_id:    savedProducts[pidx]._id,
        user_id:       normalUsers[uidx]._id,
        rating:        t.r,
        title:         t.title,
        review_text:   t.text,
        is_verified:   t.r >= 4,
        helpful_votes: Math.floor(Math.random() * 30),
      }).save();
      reviewCount++;
    }
    console.log(`⭐ Inserted ${reviewCount} reviews`);

    console.log('\n✅ Seed complete!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`📦 Products : ${savedProducts.length}`);
    console.log(`👤 Users    : ${savedUsers.length}  (1 admin + ${savedUsers.length - 1} customers)`);
    console.log(`🛒 Orders   : ${savedOrders.length}`);
    console.log(`⭐ Reviews  : ${reviewCount}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🔐 Admin → admin@gadgetglam.pk / admin123');
    console.log('🔐 User  → amnah@example.com   / user1234');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    process.exit(0);
  } catch (err) {
    console.error('❌ Seed error:', err.message);
    console.error(err);
    process.exit(1);
  }
}

seed();

