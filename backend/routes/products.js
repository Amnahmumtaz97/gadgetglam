const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const { protect, adminOnly } = require('../middleware/auth');

// GET /api/products — list with filter, search, pagination
router.get('/', async (req, res) => {
  try {
    const { category, brand, minPrice, maxPrice, search, sort, page = 1, limit = 12, featured } = req.query;

    const query = { is_active: true };
    if (category) query.category = category;
    if (brand)    query.brand = new RegExp(brand, 'i');
    if (featured) query.is_featured = true;
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }
    if (search) {
      query.$text = { $search: search };
    }

    const sortMap = {
      newest:      '-createdAt',
      oldest:      'createdAt',
      price_asc:   'price',
      price_desc:  '-price',
      rating:      '-ratings_avg',
      popular:     '-views'
    };
    const sortStr = sortMap[sort] || '-createdAt';

    const skip = (Number(page) - 1) * Number(limit);
    const [products, total] = await Promise.all([
      Product.find(query).sort(sortStr).skip(skip).limit(Number(limit)),
      Product.countDocuments(query)
    ]);

    res.json({
      success: true, products,
      pagination: { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / Number(limit)) }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/products/:slug — single product (increments view count)
router.get('/:slug', async (req, res) => {
  try {
    const product = await Product.findOneAndUpdate(
      { slug: req.params.slug, is_active: true },
      { $inc: { views: 1 } },
      { new: true }
    );
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
    res.json({ success: true, product });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/products/category/:cat — SEO-friendly category page
router.get('/category/:cat', async (req, res) => {
  try {
    const products = await Product.find({ category: req.params.cat, is_active: true }).sort('-createdAt').limit(24);
    res.json({ success: true, category: req.params.cat, products });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/products/sitemap/all — for XML sitemap generation
router.get('/sitemap/all', async (req, res) => {
  try {
    const products = await Product.find({ is_active: true }, 'slug updatedAt').lean();
    res.json({ success: true, products });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/products — create (admin)
router.post('/', protect, adminOnly, async (req, res) => {
  try {
    const product = await Product.create(req.body);
    res.status(201).json({ success: true, product });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// PUT /api/products/:id — update (admin)
router.put('/:id', protect, adminOnly, async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    res.json({ success: true, product });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// DELETE /api/products/:id — soft delete (admin)
router.delete('/:id', protect, adminOnly, async (req, res) => {
  try {
    await Product.findByIdAndUpdate(req.params.id, { is_active: false });
    res.json({ success: true, message: 'Product deactivated' });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

module.exports = router;
