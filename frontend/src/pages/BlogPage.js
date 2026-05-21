import React, { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CalendarDays, Search, Tag } from 'lucide-react';
import axios from 'axios';
import SEOHead from '../components/common/SEOHead';

const fallbackCover = 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=80';

function formatDate(date) {
  if (!date) return 'Draft';
  return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function BlogCard({ blog, featured = false }) {
  return (
    <article className={`group overflow-hidden rounded-2xl border border-theme bg-theme-panel shadow-[var(--shadow)] transition hover:-translate-y-1 hover:border-accent ${featured ? 'lg:grid lg:grid-cols-[1.1fr_1fr]' : ''}`}>
      <Link to={`/blog/${blog.slug}`} className={`block overflow-hidden bg-[var(--surface-2)] ${featured ? 'aspect-[16/10] lg:aspect-auto' : 'aspect-[16/10]'}`}>
        <img src={blog.coverImage || fallbackCover} alt={blog.title} className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]" loading="lazy" />
      </Link>
      <div className={featured ? 'p-6 md:p-8' : 'p-5'}>
        <div className="flex flex-wrap items-center gap-3 text-xs font-semibold uppercase tracking-[0.14em] text-theme-muted">
          <span className="rounded-full bg-accent-light px-3 py-1 text-accent">{blog.category || 'Guides'}</span>
          <span className="inline-flex items-center gap-1 normal-case tracking-normal"><CalendarDays size={13} /> {formatDate(blog.publishedAt || blog.createdAt)}</span>
        </div>
        <Link to={`/blog/${blog.slug}`}>
          <h2 className={`${featured ? 'mt-4 text-2xl md:text-3xl' : 'mt-3 text-lg'} font-black leading-tight text-theme transition group-hover:text-accent`}>
            {blog.title}
          </h2>
        </Link>
        <p className="mt-3 line-clamp-3 text-sm leading-6 text-theme-muted">{blog.excerpt}</p>
        <div className="mt-5 flex flex-wrap gap-2">
          {(blog.tags || []).slice(0, 3).map((tag) => (
            <Link key={tag} to={`/blog?tag=${encodeURIComponent(tag)}`} className="rounded-full border border-theme px-3 py-1 text-xs font-semibold text-theme-muted transition hover:border-accent hover:text-accent">
              #{tag}
            </Link>
          ))}
        </div>
      </div>
    </article>
  );
}

export default function BlogPage() {
  const [params, setParams] = useSearchParams();
  const [blogs, setBlogs] = useState([]);
  const [latestBlogs, setLatestBlogs] = useState([]);
  const [trendingBlogs, setTrendingBlogs] = useState([]);
  const [categories, setCategories] = useState([]);
  const [tags, setTags] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState(params.get('search') || '');

  const queryString = useMemo(() => {
    const q = new URLSearchParams();
    ['search', 'category', 'tag', 'sort', 'page'].forEach((key) => {
      const value = params.get(key);
      if (value) q.set(key, value);
    });
    q.set('limit', '9');
    return q.toString();
  }, [params]);

  useEffect(() => {
    setLoading(true);
    axios.get(`/api/blogs?${queryString}`)
      .then(({ data }) => {
        setBlogs(data.blogs || []);
        setLatestBlogs(data.latestBlogs || []);
        setTrendingBlogs(data.trendingBlogs || []);
        setCategories(data.categories || []);
        setTags(data.tags || []);
        setPagination(data.pagination || { page: 1, pages: 1 });
      })
      .finally(() => setLoading(false));
  }, [queryString]);

  const setFilter = (key, value) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    next.delete('page');
    setParams(next);
  };

  const submitSearch = (e) => {
    e.preventDefault();
    setFilter('search', searchInput.trim());
  };

  const heroBlog = blogs[0];
  const remainingBlogs = heroBlog ? blogs.slice(1) : blogs;

  return (
    <>
      <SEOHead
        title="GadgetGlam Blog"
        description="Read phone case guides, mobile accessory tips, buying advice, and gadget trends from GadgetGlam."
        keywords="phone case blog, mobile accessories guide, gadget trends Pakistan"
        canonical="https://www.gadgetglam.pk/blog"
      />

      <div className="container page-shell">
        <section className="mb-8 rounded-2xl border border-theme bg-theme-panel p-6 shadow-[var(--shadow)] md:p-8">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-accent">GadgetGlam Journal</p>
          <div className="mt-3 grid gap-6 lg:grid-cols-[1fr_360px] lg:items-end">
            <div>
              <h1 className="text-3xl font-black tracking-tight text-theme md:text-5xl">Guides, trends, and accessory advice.</h1>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-theme-muted">
                SEO-friendly buying guides for phone cases, chargers, earbuds, screen guards, and everyday gadget care.
              </p>
            </div>
            <form onSubmit={submitSearch} className="flex rounded-2xl border border-theme bg-[var(--surface-2)] p-2">
              <input
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="min-w-0 flex-1 bg-transparent px-3 text-sm text-theme outline-none"
                placeholder="Search blog posts..."
              />
              <button type="submit" className="btn-primary rounded-xl px-4 py-2 text-sm"><Search size={16} /> Search</button>
            </form>
          </div>
        </section>

        <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
          <main className="min-w-0">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={() => setParams({})} className="rounded-full border border-theme px-4 py-2 text-xs font-bold text-theme-muted hover:border-accent hover:text-accent">All</button>
                {categories.slice(0, 5).map((cat) => (
                  <button key={cat.name} type="button" onClick={() => setFilter('category', cat.name)} className={`rounded-full border px-4 py-2 text-xs font-bold transition ${params.get('category') === cat.name ? 'border-accent bg-accent text-on-accent' : 'border-theme text-theme-muted hover:border-accent hover:text-accent'}`}>
                    {cat.name}
                  </button>
                ))}
              </div>
              <select value={params.get('sort') || 'latest'} onChange={(e) => setFilter('sort', e.target.value)} className="input-theme rounded-xl px-3 py-2 text-sm">
                <option value="latest">Latest</option>
                <option value="trending">Trending</option>
                <option value="featured">Featured</option>
                <option value="oldest">Oldest</option>
              </select>
            </div>

            {loading ? (
              <div className="spinner" />
            ) : blogs.length > 0 ? (
              <div className="space-y-5">
                {heroBlog && <BlogCard blog={heroBlog} featured />}
                <div className="grid gap-5 md:grid-cols-2">
                  {remainingBlogs.map((blog) => <BlogCard key={blog._id} blog={blog} />)}
                </div>
                {pagination.pages > 1 && (
                  <div className="flex justify-center gap-2 pt-4">
                    {Array.from({ length: pagination.pages }).slice(0, 6).map((_, i) => {
                      const page = i + 1;
                      return (
                        <button key={page} type="button" onClick={() => setFilter('page', String(page))} className={`h-10 w-10 rounded-xl border text-sm font-bold ${pagination.page === page ? 'border-accent bg-accent text-on-accent' : 'border-theme text-theme-muted'}`}>
                          {page}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            ) : (
              <div className="rounded-2xl border border-theme bg-theme-panel p-10 text-center text-theme-muted">No blog posts found.</div>
            )}
          </main>

          <aside className="space-y-5">
            <SidebarList title="Latest Blogs" blogs={latestBlogs} />
            <SidebarList title="Trending Blogs" blogs={trendingBlogs} />
            <div className="rounded-2xl border border-theme bg-theme-panel p-5 shadow-[var(--shadow)]">
              <h2 className="font-black text-theme">Tags</h2>
              <div className="mt-4 flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <button key={tag.name} type="button" onClick={() => setFilter('tag', tag.name)} className="inline-flex items-center gap-1 rounded-full border border-theme px-3 py-1.5 text-xs font-semibold text-theme-muted hover:border-accent hover:text-accent">
                    <Tag size={12} /> {tag.name}
                  </button>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </>
  );
}

function SidebarList({ title, blogs }) {
  return (
    <div className="rounded-2xl border border-theme bg-theme-panel p-5 shadow-[var(--shadow)]">
      <h2 className="font-black text-theme">{title}</h2>
      <div className="mt-4 space-y-4">
        {(blogs || []).map((blog) => (
          <Link key={blog._id} to={`/blog/${blog.slug}`} className="grid grid-cols-[72px_1fr] gap-3">
            <img src={blog.coverImage || fallbackCover} alt="" className="h-16 w-full rounded-xl object-cover" loading="lazy" />
            <span className="line-clamp-2 text-sm font-bold leading-snug text-theme hover:text-accent">{blog.title}</span>
          </Link>
        ))}
        {(!blogs || blogs.length === 0) && <p className="text-sm text-theme-muted">No posts yet.</p>}
      </div>
    </div>
  );
}
