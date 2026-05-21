require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const fs = require('fs');
const path = require('path');
const { SitemapStream, streamToPromise } = require('sitemap');
const { SHOP_CATEGORIES } = require('../constants/categories');
const SAMPLE_BLOGS = require('./sampleBlogs');

const OUTPUT_PATH = path.join(__dirname, '../../frontend/public/sitemap.xml');

function normalizeBaseUrl(value) {
  const fallback = 'https://www.gadgetglam.live';
  const raw = String(value || fallback).split(',')[0].trim() || fallback;
  return raw.replace(/\/+$/, '');
}

function slugifyCategory(value = '') {
  return String(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function dateOnly(value) {
  if (!value) return undefined;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return undefined;
  return date.toISOString();
}

function uniqueUrls(urls) {
  const seen = new Set();
  return urls.filter((item) => {
    if (!item.url || seen.has(item.url)) return false;
    seen.add(item.url);
    return true;
  });
}

async function generateSitemap() {
  const siteUrl = normalizeBaseUrl(process.env.SITE_URL || 'https://www.gadgetglam.live');
  const now = new Date().toISOString();
  const blogs = SAMPLE_BLOGS;

  const staticUrls = [
    { url: '/', changefreq: 'daily', priority: 1, lastmod: now },
    { url: '/products', changefreq: 'daily', priority: 0.9, lastmod: now },
    { url: '/blog', changefreq: 'weekly', priority: 0.8, lastmod: now },
    { url: '/about', changefreq: 'monthly', priority: 0.6, lastmod: now },
    { url: '/contact', changefreq: 'monthly', priority: 0.5, lastmod: now },
    { url: '/faq', changefreq: 'monthly', priority: 0.5, lastmod: now },
    { url: '/help', changefreq: 'monthly', priority: 0.5, lastmod: now },
    { url: '/returns', changefreq: 'monthly', priority: 0.4, lastmod: now },
    { url: '/privacy', changefreq: 'yearly', priority: 0.3, lastmod: now },
    { url: '/terms', changefreq: 'yearly', priority: 0.3, lastmod: now },
  ];

  const categoryUrls = SHOP_CATEGORIES.map((category) => ({
    url: `/category/${slugifyCategory(category)}`,
    changefreq: 'weekly',
    priority: 0.75,
    lastmod: now,
  }));

  const blogUrls = blogs
    .filter((blog) => blog.slug)
    .map((blog) => ({
      url: `/blog/${blog.slug}`,
      changefreq: 'monthly',
      priority: blog.featured ? 0.75 : 0.7,
      lastmod: dateOnly(blog.updatedAt || blog.publishedAt || blog.createdAt) || now,
    }));

  const stream = new SitemapStream({ hostname: siteUrl });
  const xmlPromise = streamToPromise(stream);
  const urls = uniqueUrls([...staticUrls, ...categoryUrls, ...blogUrls]);
  urls.forEach((item) => stream.write(item));
  stream.end();

  const xml = await xmlPromise;
  fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });
  fs.writeFileSync(OUTPUT_PATH, xml.toString());

  console.log(`Sitemap generated at ${OUTPUT_PATH}`);
  console.log(`Base URL: ${siteUrl}`);
  console.log(`URLs: ${urls.length}`);
  console.log('Generated static sitemap routes only. No database connection was used.');
}

generateSitemap().catch((err) => {
  console.error(err);
  process.exit(1);
});
