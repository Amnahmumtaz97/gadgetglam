/**
 * Updates only products with known broken or mismatched image URLs.
 * Run: node config/fixBrokenProductImages.js
 */
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const dns = require('dns');
const mongoose = require('mongoose');
const Product = require('../models/Product');

if (typeof process.env.MONGODB_URI === 'string' && process.env.MONGODB_URI.startsWith('mongodb+srv://')) {
  try { dns.setServers(['1.1.1.1', '1.0.0.1', '8.8.8.8', '8.8.4.4']); } catch {}
}

/** Unsplash IDs that 404 or show wrong product type */
const BROKEN_PHOTO_IDS = [
  'photo-1601504658430-97b3d76d5a48',
];

const SLUG_IMAGE_FIXES = {
  '3-in-1-charging-cable-usb-c-lightning-micro': {
    thumbnail: 'https://images.unsplash.com/photo-1583394838336-acd977736f90?auto=format&fit=crop&w=900&q=82',
    images: [
      'https://images.unsplash.com/photo-1583394838336-acd977736f90?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1517336714739-489689fd1ca8?auto=format&fit=crop&w=1200&q=80',
    ],
  },
  'retractable-3-in-1-cable-keychain': {
    thumbnail: 'https://images.unsplash.com/photo-1517336714739-489689fd1ca8?auto=format&fit=crop&w=900&q=82',
    images: [
      'https://images.unsplash.com/photo-1517336714739-489689fd1ca8?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1583394838336-acd977736f90?auto=format&fit=crop&w=1200&q=80',
    ],
  },
  'tempered-glass-screen-protector-for-iphone-15': {
    thumbnail: '/assets/gg-screen-guard.svg',
    images: [
      '/assets/gg-screen-guard.svg',
      'https://images.unsplash.com/photo-1598327105666-5b89351aff97?auto=format&fit=crop&w=1200&q=80',
    ],
  },
};

function hasBrokenUrl(url = '') {
  const s = String(url);
  return BROKEN_PHOTO_IDS.some((id) => s.includes(id)) || s.includes('source.unsplash.com');
}

async function main() {
  if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI missing in backend/.env');
  await mongoose.connect(process.env.MONGODB_URI);

  const products = await Product.find({});
  let updated = 0;

  for (const product of products) {
    const slugFix = SLUG_IMAGE_FIXES[product.slug];
    const thumbBroken = hasBrokenUrl(product.thumbnail);
    const imagesBroken = (product.images || []).some(hasBrokenUrl);

    if (!slugFix && !thumbBroken && !imagesBroken) continue;

    const patch = slugFix || {
      thumbnail: 'https://images.unsplash.com/photo-1583394838336-acd977736f90?auto=format&fit=crop&w=900&q=82',
      images: [
        'https://images.unsplash.com/photo-1583394838336-acd977736f90?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1517336714739-489689fd1ca8?auto=format&fit=crop&w=1200&q=80',
      ],
    };

    if (product.category === 'Screen Guards' && !slugFix) {
      patch.thumbnail = '/assets/gg-screen-guard.svg';
      patch.images = ['/assets/gg-screen-guard.svg', 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?auto=format&fit=crop&w=1200&q=80'];
    }

    product.thumbnail = patch.thumbnail;
    product.images = patch.images;
    if (product.seo?.og_image && hasBrokenUrl(product.seo.og_image)) {
      product.seo.og_image = patch.thumbnail;
    }
    await product.save();
    updated += 1;
    console.log(`Fixed: ${product.name}`);
  }

  console.log(`Done. Updated ${updated} product(s).`);
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
