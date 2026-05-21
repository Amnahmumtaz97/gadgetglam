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
    enum: ['Cases', 'Chargers', 'Cables', 'Earphones', 'Screen Guards', 'Bundles', 'Smart Watches', 'Speakers', 'Headphones', 'Power Banks', 'Other'],
    required: true,
    index: true
  },
  device_compatibility: [{ type: String }],
  tags: [{ type: String }],

  /** Combo / bundle deals — items included in the pack */
  bundle_items: [{
    name: { type: String, required: true },
    detail: { type: String, default: '' },
    quantity: { type: Number, default: 1, min: 1 },
  }],

  // ── AI / Extended Fields ───────────────────
  focus_keywords: [{ type: String }],
  faqs: [{ question: String, answer: String }],
  variants: [{ name: String, color: String, material: String, price: Number, sku: String }],
  status: { type: String, enum: ['draft', 'published'], default: 'draft', index: true },
  isAIGenerated: { type: Boolean, default: false },
  aiGeneratedAt: { type: Date },
  ai_history: [{
    versionAt: { type: Date, default: Date.now },
    note: { type: String },
    data: { type: Object }
  }],

  // ── Affiliate ──────────────────────────────
  affiliate_link:     { type: String, required: true },
  affiliate_platform: { type: String, enum: ['AliExpress', 'Daraz', 'Amazon', 'Other'], default: 'AliExpress' },

  // ── Stats ─────────────────────────────────
  ratings_avg:   { type: Number, default: 0, min: 0, max: 5 },
  reviews_count: { type: Number, default: 0 },
  views:         { type: Number, default: 0 },

  stock: { type: Number, default: 0, min: 0 },
  stock_status: { type: String, enum: ['In Stock', 'Out of Stock', 'Limited'], default: 'In Stock' },
  is_featured:  { type: Boolean, default: false, index: true },
  is_active:    { type: Boolean, default: true, index: true },
  is_draft:     { type: Boolean, default: false, index: true },

  // ── Time-limited deals (Deals of the Week panel) ──
  is_deal: { type: Boolean, default: false, index: true },
  deal_ends_at: { type: Date, index: true },
  deal_stock_total: { type: Number, min: 0, default: 0 },
  deal_stock_remaining: { type: Number, min: 0, default: 0 },
  deal_sort_order: { type: Number, default: 0 },

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
