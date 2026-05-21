const express = require('express');
const router = express.Router();
const Blog = require('../models/Blog');
const SAMPLE_BLOGS = require('../config/sampleBlogs');

const publicBlogQuery = () => ({ status: 'published' });

function getSort(sort = '') {
  const map = {
    oldest: 'publishedAt',
    trending: '-views -publishedAt',
    featured: '-featured -publishedAt',
    latest: '-publishedAt',
  };
  return map[sort] || '-publishedAt';
}

function withSampleMeta(blog, index) {
  const createdAt = blog.publishedAt || new Date();
  return {
    ...blog,
    _id: `sample-blog-${index + 1}`,
    createdAt,
    updatedAt: createdAt,
    views: blog.views || (SAMPLE_BLOGS.length - index) * 18,
  };
}

function sampleBlogs() {
  return SAMPLE_BLOGS.map(withSampleMeta);
}

function filterSamples({ search, category, tag, featured, sort }) {
  let blogs = sampleBlogs();
  if (category) blogs = blogs.filter((blog) => blog.category.toLowerCase() === String(category).toLowerCase());
  if (tag) blogs = blogs.filter((blog) => (blog.tags || []).some((item) => item.toLowerCase() === String(tag).toLowerCase()));
  if (featured === 'true') blogs = blogs.filter((blog) => blog.featured);
  if (search) {
    const needle = String(search).toLowerCase();
    blogs = blogs.filter((blog) => [blog.title, blog.excerpt, blog.content, blog.category, ...(blog.tags || [])].join(' ').toLowerCase().includes(needle));
  }
  if (sort === 'oldest') blogs = blogs.sort((a, b) => new Date(a.publishedAt) - new Date(b.publishedAt));
  else if (sort === 'trending') blogs = blogs.sort((a, b) => Number(b.views || 0) - Number(a.views || 0));
  else if (sort === 'featured') blogs = blogs.sort((a, b) => Number(b.featured) - Number(a.featured) || new Date(b.publishedAt) - new Date(a.publishedAt));
  else blogs = blogs.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));
  return blogs;
}

function sampleFacets(blogs = sampleBlogs()) {
  const categoryMap = new Map();
  const tagMap = new Map();
  blogs.forEach((blog) => {
    if (blog.category) categoryMap.set(blog.category, (categoryMap.get(blog.category) || 0) + 1);
    (blog.tags || []).forEach((tag) => tagMap.set(tag, (tagMap.get(tag) || 0) + 1));
  });
  return {
    categories: [...categoryMap.entries()].map(([name, count]) => ({ name, count })),
    tags: [...tagMap.entries()].map(([name, count]) => ({ name, count })),
  };
}

router.get('/', async (req, res) => {
  try {
    const { search, category, tag, featured, sort = 'latest', page = 1, limit = 9 } = req.query;
    const query = publicBlogQuery();

    if (category) query.category = new RegExp(`^${String(category).trim()}$`, 'i');
    if (tag) query.tags = new RegExp(`^${String(tag).trim()}$`, 'i');
    if (featured === 'true') query.featured = true;
    if (search) query.$text = { $search: search };

    const numericLimit = Math.min(Number(limit) || 9, 30);
    const skip = (Number(page) - 1) * numericLimit;

    const [blogs, total, latestBlogs, trendingBlogs, categoryAgg, tagAgg, publishedTotal] = await Promise.all([
      Blog.find(query)
        .sort(search ? { score: { $meta: 'textScore' } } : getSort(sort))
        .skip(skip)
        .limit(numericLimit)
        .lean(),
      Blog.countDocuments(query),
      Blog.find(publicBlogQuery()).sort('-publishedAt').limit(5).lean(),
      Blog.find(publicBlogQuery()).sort('-views -publishedAt').limit(5).lean(),
      Blog.aggregate([
        { $match: publicBlogQuery() },
        { $group: { _id: '$category', count: { $sum: 1 } } },
        { $sort: { count: -1, _id: 1 } },
      ]),
      Blog.aggregate([
        { $match: publicBlogQuery() },
        { $unwind: '$tags' },
        { $group: { _id: '$tags', count: { $sum: 1 } } },
        { $sort: { count: -1, _id: 1 } },
        { $limit: 24 },
      ]),
      Blog.countDocuments(publicBlogQuery()),
    ]);

    if (publishedTotal === 0) {
      const allSamples = sampleBlogs();
      const filtered = filterSamples({ search, category, tag, featured, sort });
      const pageItems = filtered.slice(skip, skip + numericLimit);
      const facets = sampleFacets(allSamples);

      return res.json({
        success: true,
        blogs: pageItems,
        latestBlogs: [...allSamples].sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt)).slice(0, 5),
        trendingBlogs: [...allSamples].sort((a, b) => Number(b.views || 0) - Number(a.views || 0)).slice(0, 5),
        categories: facets.categories,
        tags: facets.tags,
        sample: true,
        pagination: { page: Number(page), limit: numericLimit, total: filtered.length, pages: Math.ceil(filtered.length / numericLimit) || 1 },
      });
    }

    res.json({
      success: true,
      blogs,
      latestBlogs,
      trendingBlogs,
      categories: categoryAgg.filter((item) => item._id).map((item) => ({ name: item._id, count: item.count })),
      tags: tagAgg.filter((item) => item._id).map((item) => ({ name: item._id, count: item.count })),
      pagination: { page: Number(page), limit: numericLimit, total, pages: Math.ceil(total / numericLimit) },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/:slug', async (req, res) => {
  try {
    const blog = await Blog.findOneAndUpdate(
      { slug: req.params.slug, ...publicBlogQuery() },
      { $inc: { views: 1 } },
      { new: true }
    ).lean();

    if (!blog) {
      const foundSample = sampleBlogs().find((item) => item.slug === req.params.slug);
      if (!foundSample) return res.status(404).json({ success: false, message: 'Blog not found' });
      const relatedSamples = sampleBlogs().filter((item) => item.slug !== foundSample.slug);
      return res.json({
        success: true,
        blog: foundSample,
        relatedBlogs: relatedSamples.filter((item) => item.category === foundSample.category || (item.tags || []).some((tag) => (foundSample.tags || []).includes(tag))).slice(0, 4),
        latestBlogs: [...relatedSamples].sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt)).slice(0, 4),
        sample: true,
      });
    }

    const [relatedBlogs, latestBlogs] = await Promise.all([
      Blog.find({
        ...publicBlogQuery(),
        _id: { $ne: blog._id },
        $or: [{ category: blog.category }, { tags: { $in: blog.tags || [] } }],
      }).sort('-featured -publishedAt').limit(4).lean(),
      Blog.find({ ...publicBlogQuery(), _id: { $ne: blog._id } }).sort('-publishedAt').limit(4).lean(),
    ]);

    res.json({ success: true, blog, relatedBlogs, latestBlogs });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
