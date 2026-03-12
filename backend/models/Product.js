const mongoose = require('mongoose');
const slugify = require('slugify');

const ProductSchema = new mongoose.Schema({
  name: {
    type: String, required: [true, 'Product name is required'], trim: true, maxlength: [200, 'Name too long']
  },
  slug: { type: String, unique: true, index: true },

  description: { type: String, required: [true, 'Description required'] },
  short_description: { type: String, maxlength: 300 },

  price:         { type: Number, required: true, min: 0 },
  compare_price: { type: Number, min: 0 }, // crossed-out original price
  brand:         { type: String, trim: true },

  images: [{ type: String }],
  thumbnail: { type: String },

  category: {
    type: String,
    enum: ['Cases', 'Chargers', 'Cables', 'Earphones', 'Screen Guards', 'Bundles', 'Other'],
    required: true,
    index: true
  },
  device_compatibility: [{ type: String }],
  tags: [{ type: String }],

  // ── Affiliate ──────────────────────────────
  affiliate_link:     { type: String, required: true },
  affiliate_platform: { type: String, enum: ['AliExpress', 'Daraz', 'Amazon', 'Other'], default: 'AliExpress' },

  // ── Stats ─────────────────────────────────
  ratings_avg:   { type: Number, default: 0, min: 0, max: 5 },
  reviews_count: { type: Number, default: 0 },
  views:         { type: Number, default: 0 },

  stock_status: { type: String, enum: ['In Stock', 'Out of Stock', 'Limited'], default: 'In Stock' },
  is_featured:  { type: Boolean, default: false, index: true },
  is_active:    { type: Boolean, default: true, index: true },

  // ── SEO Fields ────────────────────────────
  seo: {
    meta_title:       { type: String, maxlength: 70 },
    meta_description: { type: String, maxlength: 160 },
    meta_keywords:    [{ type: String }],
    canonical_url:    { type: String },
    og_image:         { type: String },
    schema_type:      { type: String, default: 'Product' }
  }

}, { timestamps: true });

// ── Auto-generate slug from name ──────────────
ProductSchema.pre('save', function (next) {
  if (this.isModified('name')) {
    this.slug = slugify(this.name, { lower: true, strict: true });
  }
  // Auto-fill SEO if not set
  if (!this.seo.meta_title) {
    this.seo.meta_title = `${this.name} | GadgetGlam`;
  }
  if (!this.seo.meta_description) {
    this.seo.meta_description = this.short_description || this.description?.substring(0, 155);
  }
  next();
});

// ── Full-text search index ────────────────────
ProductSchema.index({ name: 'text', description: 'text', tags: 'text', brand: 'text' });

module.exports = mongoose.model('Product', ProductSchema);
