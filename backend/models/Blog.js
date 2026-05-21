const mongoose = require('mongoose');
const slugify = require('slugify');

const BlogSchema = new mongoose.Schema({
  title: { type: String, required: [true, 'Blog title is required'], trim: true, maxlength: 180 },
  slug: { type: String, unique: true, index: true, trim: true },
  content: { type: String, required: [true, 'Blog content is required'] },
  excerpt: { type: String, trim: true, maxlength: 320 },
  coverImage: { type: String, trim: true },
  category: { type: String, trim: true, default: 'Guides', index: true },
  tags: [{ type: String, trim: true }],
  author: { type: String, trim: true, default: 'GadgetGlam Team' },
  status: { type: String, enum: ['draft', 'published'], default: 'draft', index: true },
  featured: { type: Boolean, default: false, index: true },
  views: { type: Number, default: 0 },
  metaTitle: { type: String, trim: true, maxlength: 70 },
  metaDescription: { type: String, trim: true, maxlength: 160 },
  publishedAt: { type: Date },
}, { timestamps: true });

BlogSchema.pre('validate', function (next) {
  if (!this.slug && this.title) {
    this.slug = slugify(this.title, { lower: true, strict: true });
  } else if (this.slug) {
    this.slug = slugify(this.slug, { lower: true, strict: true });
  }

  if (!this.excerpt && this.content) {
    this.excerpt = String(this.content).replace(/\s+/g, ' ').slice(0, 220);
  }
  if (!this.metaTitle && this.title) {
    this.metaTitle = `${this.title} | GadgetGlam`.slice(0, 70);
  }
  if (!this.metaDescription) {
    this.metaDescription = (this.excerpt || String(this.content || '').replace(/\s+/g, ' ')).slice(0, 160);
  }
  if (this.status === 'published' && !this.publishedAt) {
    this.publishedAt = new Date();
  }

  next();
});

BlogSchema.index({ title: 'text', content: 'text', excerpt: 'text', tags: 'text', category: 'text' });

module.exports = mongoose.model('Blog', BlogSchema);
