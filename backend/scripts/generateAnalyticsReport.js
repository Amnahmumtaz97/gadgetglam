require('dotenv').config();
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');

const OrderModel = require('../models/OrderReview').Order;
const ProductModel = require('../models/Product');

async function ensureDir(dir) {
  try { await fs.promises.mkdir(dir, { recursive: true }); } catch {}
}

function csvEscape(val) {
  if (val == null) return '';
  return `"${String(val).replace(/"/g, '""')}"`;
}

async function run() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('MONGODB_URI not set in environment. Aborting.');
    process.exit(1);
  }

  await mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });
  console.log('Connected to MongoDB');

  const now = new Date();
  const days30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const days90 = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);

  // Sales last 30 days
  const salesAgg = await OrderModel.aggregate([
    { $match: { createdAt: { $gte: days30 } } },
    { $unwind: '$products' },
    { $group: { _id: '$products.product_id', qtySold: { $sum: '$products.quantity' }, revenue: { $sum: { $multiply: ['$products.quantity', '$products.price'] } } } },
    { $sort: { qtySold: -1 } }
  ]).allowDiskUse(true);

  // Returns last 90 days (based on refunded or cancelled orders)
  const returnsAgg = await OrderModel.aggregate([
    { $match: { createdAt: { $gte: days90 }, $or: [ { payment_status: 'Refunded' }, { order_status: 'Cancelled' } ] } },
    { $unwind: '$products' },
    { $group: { _id: '$products.product_id', returnedQty: { $sum: '$products.quantity' } } },
    { $sort: { returnedQty: -1 } }
  ]).allowDiskUse(true);

  // Category demand last 90 days
  const catAgg = await OrderModel.aggregate([
    { $match: { createdAt: { $gte: days90 } } },
    { $unwind: '$products' },
    { $lookup: { from: 'products', localField: 'products.product_id', foreignField: '_id', as: 'prod' } },
    { $unwind: { path: '$prod', preserveNullAndEmptyArrays: true } },
    { $group: { _id: '$prod.category', qty: { $sum: '$products.quantity' }, revenue: { $sum: { $multiply: ['$products.quantity', '$products.price'] } } } },
    { $sort: { revenue: -1 } }
  ]).allowDiskUse(true);

  const reportsDir = path.join(__dirname, '..', 'reports');
  await ensureDir(reportsDir);

  const dateKey = new Date().toISOString().slice(0,10);

  // Product sales CSV
  const prodCsvPath = path.join(reportsDir, `analytics-products-${dateKey}.csv`);
  const prodHeaders = ['productId','name','category','qtySold_30d','revenue_30d','returnedQty_90d'];
  const prodRows = [prodHeaders.join(',')];

  // build lookup of returns
  const returnsMap = new Map(returnsAgg.map(r => [String(r._id), r.returnedQty || 0]));

  for (const row of salesAgg) {
    const id = row._id ? String(row._id) : '';
    const product = id ? await ProductModel.findById(id).lean().select('name category').exec() : null;
    prodRows.push([
      csvEscape(id),
      csvEscape(product?.name || ''),
      csvEscape(product?.category || ''),
      csvEscape(row.qtySold || 0),
      csvEscape(row.revenue || 0),
      csvEscape(returnsMap.get(id) || 0)
    ].join(','));
  }

  await fs.promises.writeFile(prodCsvPath, prodRows.join('\n'), 'utf8');
  console.log('Wrote', prodCsvPath);

  // Category CSV
  const catCsvPath = path.join(reportsDir, `analytics-categories-${dateKey}.csv`);
  const catRows = [['category','qty_90d','revenue_90d'].join(',')];
  for (const c of catAgg) {
    catRows.push([csvEscape(c._id || 'Uncategorized'), csvEscape(c.qty || 0), csvEscape(c.revenue || 0)].join(','));
  }
  await fs.promises.writeFile(catCsvPath, catRows.join('\n'), 'utf8');
  console.log('Wrote', catCsvPath);

  await mongoose.disconnect();
  console.log('Disconnected. Done.');
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
