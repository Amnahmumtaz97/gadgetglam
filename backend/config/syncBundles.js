/**
 * Upsert curated bundle deals (with bundle_items) without full reseed.
 * Removes auto-generated "Bundles Item #" filler products.
 */
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const dns = require('dns');
const mongoose = require('mongoose');
const slugify = require('slugify');
const Product = require('../models/Product');
const BUNDLE_CATALOG = require('./bundleCatalog');

if (typeof process.env.MONGODB_URI === 'string' && process.env.MONGODB_URI.startsWith('mongodb+srv://')) {
  try { dns.setServers(['1.1.1.1', '1.0.0.1', '8.8.8.8', '8.8.4.4']); } catch {}
}

async function syncBundles() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('✅ Connected to MongoDB');

  const removed = await Product.deleteMany({
    category: 'Bundles',
    $or: [
      { name: /Bundles Item #/i },
      { bundle_items: { $exists: false } },
      { bundle_items: { $size: 0 } },
    ],
  });
  console.log(`🗑️  Removed ${removed.deletedCount} non-deal bundle listings`);

  let upserted = 0;
  for (const bundle of BUNDLE_CATALOG) {
    const slug = slugify(bundle.name, { lower: true, strict: true });
    const doc = {
      ...bundle,
      slug,
      is_active: true,
      is_draft: false,
      affiliate_link: bundle.affiliate_link || 'https://www.daraz.pk',
      affiliate_platform: bundle.affiliate_platform || 'Daraz',
    };
    await Product.findOneAndUpdate(
      { name: bundle.name, category: 'Bundles' },
      { $set: doc },
      { upsert: true, new: true, runValidators: true },
    );
    upserted += 1;
  }
  console.log(`✅ Upserted ${upserted} bundle deals`);
  await mongoose.disconnect();
}

syncBundles().catch((err) => {
  console.error(err);
  process.exit(1);
});
