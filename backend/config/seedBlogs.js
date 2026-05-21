require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const dns = require('dns');
const mongoose = require('mongoose');
const Blog = require('../models/Blog');
const SAMPLE_BLOGS = require('./sampleBlogs');

if (typeof process.env.MONGODB_URI === 'string' && process.env.MONGODB_URI.startsWith('mongodb+srv://')) {
  try { dns.setServers(['1.1.1.1', '1.0.0.1', '8.8.8.8', '8.8.4.4']); } catch {}
}

async function seedBlogs() {
  if (!process.env.MONGODB_URI) {
    throw new Error('MONGODB_URI is required to seed blogs.');
  }

  await mongoose.connect(process.env.MONGODB_URI);

  for (const blog of SAMPLE_BLOGS) {
    await Blog.findOneAndUpdate(
      { slug: blog.slug },
      { $setOnInsert: blog },
      { upsert: true, new: true, runValidators: true }
    );
  }

  console.log(`Seeded ${SAMPLE_BLOGS.length} sample blog posts.`);
  await mongoose.disconnect();
}

seedBlogs().catch(async (err) => {
  console.error(err.message);
  try { await mongoose.disconnect(); } catch {}
  process.exit(1);
});
