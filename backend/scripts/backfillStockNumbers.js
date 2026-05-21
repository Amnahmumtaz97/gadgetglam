require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('../models/Product');

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function run() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('MONGODB_URI not set. Set it in .env and retry.');
    process.exit(1);
  }
  await mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });
  console.log('Connected to MongoDB');

  const products = await Product.find({}).lean();
  console.log(`Found ${products.length} products`);

  let updated = 0;
  for (const p of products) {
    let newStock = Number(p.stock || 0);
    // If product already has a positive stock, skip unless 0
    if (!p.stock || p.stock === 0) {
      if (p.stock_status === 'Out of Stock') {
        newStock = 0;
      } else if (p.stock_status === 'Limited') {
        newStock = randInt(1, 12);
      } else {
        // In Stock or default
        newStock = randInt(8, 120);
      }
    }

    let newStatus = p.stock_status || 'In Stock';
    if (newStock <= 0) newStatus = 'Out of Stock';
    else if (newStock <= 6) newStatus = 'Limited';
    else newStatus = 'In Stock';

    await Product.findByIdAndUpdate(p._id, { $set: { stock: newStock, stock_status: newStatus } });
    updated++;
  }

  console.log(`Updated ${updated} products.`);
  await mongoose.disconnect();
  console.log('Disconnected.');
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
