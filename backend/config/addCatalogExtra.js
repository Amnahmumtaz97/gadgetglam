/**
 * Adds new-category curated products without wiping the database.
 * Run: node config/addCatalogExtra.js
 */
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const dns = require('dns');
const mongoose = require('mongoose');
const Product = require('../models/Product');
const CURATED_CATALOG_EXTRA = require('./curatedCatalogExtra');

if (typeof process.env.MONGODB_URI === 'string' && process.env.MONGODB_URI.startsWith('mongodb+srv://')) {
  try { dns.setServers(['1.1.1.1', '1.0.0.1', '8.8.8.8', '8.8.4.4']); } catch {}
}

async function main() {
  await mongoose.connect(process.env.MONGODB_URI);
  let added = 0;
  let skipped = 0;

  for (const p of CURATED_CATALOG_EXTRA) {
    const exists = await Product.findOne({ name: p.name }).select('_id');
    if (exists) {
      skipped += 1;
      continue;
    }
    await new Product({ ...p, is_active: true, is_draft: false }).save();
    added += 1;
    console.log(`Added: ${p.name} (${p.category})`);
  }

  console.log(`Done. Added ${added}, skipped ${skipped} (already existed).`);
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
