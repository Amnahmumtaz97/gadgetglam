import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Edit, Eye, Plus, Search, Trash2 } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

const BLOG_CATEGORIES = ['Guides', 'Phone Cases', 'Accessories', 'Buying Guides', 'Trends', 'How To', 'News'];
const BLANK_BLOG = {
  title: '',
  slug: '',
  excerpt: '',
  content: '',
  coverImage: '',
  category: 'Guides',
  tags: '',
  author: 'GadgetGlam Team',
  status: 'draft',
  featured: false,
  metaTitle: '',
  metaDescription: '',
};

const fieldClass = 'input-theme mt-2 w-full rounded-xl px-4 py-3 text-sm';
const fallbackCover = 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=80';

function slugify(value = '') {
  return String(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 120);
}

function splitTags(value = '') {
  if (Array.isArray(value)) return value;
  return String(value).split(',').map((tag) => tag.trim()).filter(Boolean);
}

function toForm(blog = {}) {
  return {
    title: blog.title || '',
    slug: blog.slug || '',
    excerpt: blog.excerpt || '',
    content: blog.content || '',
    coverImage: blog.coverImage || '',
    category: blog.category || 'Guides',
    tags: (blog.tags || []).join(', '),
    author: blog.author || 'GadgetGlam Team',
    status: blog.status || 'draft',
    featured: !!blog.featured,
    metaTitle: blog.metaTitle || '',
    metaDescription: blog.metaDescription || '',
  };
}

export default function AdminBlogsPanel() {
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editBlog, setEditBlog] = useState(null);
  const [form, setForm] = useState(BLANK_BLOG);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');

  const query = useMemo(() => {
    const params = new URLSearchParams({ limit: '100' });
    if (search.trim()) params.set('search', search.trim());
    if (status) params.set('status', status);
    return params.toString();
  }, [search, status]);

  const loadBlogs = () => {
    setLoading(true);
    axios.get(`/api/admin/blogs?${query}`)
      .then(({ data }) => setBlogs(data.blogs || []))
      .catch(() => toast.error('Could not load blogs'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadBlogs(); }, [query]);

  const openAdd = () => {
    setEditBlog(null);
    setForm(BLANK_BLOG);
    setShowForm(true);
  };

  const openEdit = (blog) => {
    setEditBlog(blog);
    setForm(toForm(blog));
    setShowForm(true);
  };

  const updateForm = (key) => (event) => {
    const value = event.target.type === 'checkbox' ? event.target.checked : event.target.value;
    setForm((prev) => ({
      ...prev,
      [key]: value,
      ...(key === 'title' && !editBlog && !prev.slug ? { slug: slugify(value) } : {}),
    }));
  };

  const payloadFromForm = () => ({
    ...form,
    slug: form.slug ? slugify(form.slug) : slugify(form.title),
    tags: splitTags(form.tags),
    publishedAt: form.status === 'published' ? (editBlog?.publishedAt || new Date()) : undefined,
  });

  const saveBlog = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      const payload = payloadFromForm();
      if (editBlog) {
        const { data } = await axios.put(`/api/admin/blogs/${editBlog._id}`, payload);
        setBlogs((items) => items.map((item) => item._id === editBlog._id ? data.blog : item));
        toast.success(payload.status === 'published' ? 'Blog updated and published' : 'Blog draft saved');
      } else {
        const { data } = await axios.post('/api/admin/blogs', payload);
        setBlogs((items) => [data.blog, ...items]);
        toast.success(payload.status === 'published' ? 'Blog published' : 'Blog draft created');
      }
      setShowForm(false);
      setEditBlog(null);
      setForm(BLANK_BLOG);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Blog save failed');
    } finally {
      setSaving(false);
    }
  };

  const quickStatus = async (blog, nextStatus) => {
    try {
      const { data } = await axios.put(`/api/admin/blogs/${blog._id}`, {
        status: nextStatus,
        publishedAt: nextStatus === 'published' ? (blog.publishedAt || new Date()) : undefined,
      });
      setBlogs((items) => items.map((item) => item._id === blog._id ? data.blog : item));
      toast.success(nextStatus === 'published' ? 'Blog published' : 'Blog moved to draft');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Status update failed');
    }
  };

  const deleteBlog = async (blog) => {
    if (!window.confirm(`Delete "${blog.title}"?`)) return;
    try {
      await axios.delete(`/api/admin/blogs/${blog._id}`);
      setBlogs((items) => items.filter((item) => item._id !== blog._id));
      toast.success('Blog deleted');
    } catch {
      toast.error('Delete failed');
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-4xl border border-theme bg-theme-panel p-5 shadow-card md:p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-xl font-black text-theme">Blog Management</h2>
            <p className="mt-1 text-sm text-theme-muted">Create SEO posts, buying guides, trends, and accessory advice.</p>
          </div>
          <button type="button" onClick={openAdd} className="btn-primary rounded-xl px-4 py-2.5 text-sm">
            <Plus size={16} /> Add Blog
          </button>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-[1fr_180px]">
          <label className="flex items-center gap-2 rounded-xl border border-theme bg-[var(--surface-2)] px-3">
            <Search size={16} className="text-theme-muted" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} className="min-w-0 flex-1 bg-transparent py-3 text-sm text-theme outline-none" placeholder="Search blogs..." />
          </label>
          <select value={status} onChange={(e) => setStatus(e.target.value)} className="input-theme rounded-xl px-3 py-3 text-sm">
            <option value="">All statuses</option>
            <option value="published">Published</option>
            <option value="draft">Draft</option>
          </select>
        </div>
      </div>

      {showForm && (
        <form onSubmit={saveBlog} className="rounded-4xl border border-theme bg-theme-panel p-5 shadow-card md:p-6">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <h3 className="text-lg font-black text-theme">{editBlog ? 'Edit Blog Post' : 'Add Blog Post'}</h3>
            <button type="button" onClick={() => setShowForm(false)} className="rounded-xl border border-theme px-4 py-2 text-sm font-semibold text-theme">Cancel</button>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Title"><input className={fieldClass} value={form.title} onChange={updateForm('title')} required /></Field>
            <Field label="Slug"><input className={fieldClass} value={form.slug} onChange={updateForm('slug')} placeholder="seo-friendly-slug" /></Field>
            <Field label="Category">
              <select className={fieldClass} value={form.category} onChange={updateForm('category')}>
                {BLOG_CATEGORIES.map((cat) => <option key={cat} value={cat}>{cat}</option>)}
              </select>
            </Field>
            <Field label="Author"><input className={fieldClass} value={form.author} onChange={updateForm('author')} /></Field>
            <Field label="Cover Image URL" colSpan={2}><input className={fieldClass} value={form.coverImage} onChange={updateForm('coverImage')} placeholder="https://..." /></Field>
            <Field label="Excerpt" colSpan={2}><textarea className={`${fieldClass} min-h-[92px]`} value={form.excerpt} onChange={updateForm('excerpt')} /></Field>
            <Field label="Content" colSpan={2}><textarea className={`${fieldClass} min-h-[260px] leading-7`} value={form.content} onChange={updateForm('content')} required placeholder={'Use paragraphs, ## headings, and - bullets for guides.'} /></Field>
            <Field label="Tags" colSpan={2}><input className={fieldClass} value={form.tags} onChange={updateForm('tags')} placeholder="phone cases, iphone, guide" /></Field>
            <Field label="Meta Title"><input className={fieldClass} value={form.metaTitle} onChange={updateForm('metaTitle')} maxLength={70} /></Field>
            <Field label="Meta Description"><input className={fieldClass} value={form.metaDescription} onChange={updateForm('metaDescription')} maxLength={160} /></Field>
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-4">
            <label className="inline-flex items-center gap-2 text-sm font-semibold text-theme-muted">
              <input type="checkbox" checked={form.featured} onChange={updateForm('featured')} /> Featured blog
            </label>
            <label className="inline-flex items-center gap-2 text-sm font-semibold text-theme-muted">
              Status
              <select value={form.status} onChange={updateForm('status')} className="input-theme rounded-xl px-3 py-2 text-sm">
                <option value="draft">Draft</option>
                <option value="published">Published</option>
              </select>
            </label>
            <button type="submit" disabled={saving} className="btn-primary ml-auto rounded-xl px-5 py-2.5 text-sm">
              {saving ? 'Saving...' : form.status === 'published' ? 'Publish Blog' : 'Save Draft'}
            </button>
          </div>
        </form>
      )}

      <div className="overflow-x-auto rounded-4xl border border-theme bg-theme-panel shadow-card">
        <table className="w-full min-w-[900px] border-collapse">
          <thead className="bg-theme-panel">
            <tr>
              <Th>Blog</Th>
              <Th>Category</Th>
              <Th>Status</Th>
              <Th>Featured</Th>
              <Th>Views</Th>
              <Th>Updated</Th>
              <Th>Actions</Th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className="p-8 text-center text-theme-muted">Loading blogs...</td></tr>
            ) : blogs.length > 0 ? blogs.map((blog) => (
              <tr key={blog._id} className="border-t border-theme">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <img src={blog.coverImage || fallbackCover} alt="" className="h-12 w-16 rounded-xl object-cover" />
                    <div className="min-w-0">
                      <div className="line-clamp-1 text-sm font-bold text-theme">{blog.title}</div>
                      <div className="line-clamp-1 text-xs text-theme-muted">/{blog.slug}</div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-sm text-theme-muted">{blog.category}</td>
                <td className="px-4 py-3"><StatusPill status={blog.status} /></td>
                <td className="px-4 py-3 text-sm text-theme-muted">{blog.featured ? 'Yes' : 'No'}</td>
                <td className="px-4 py-3 text-sm text-theme-muted">{Number(blog.views || 0).toLocaleString()}</td>
                <td className="px-4 py-3 text-sm text-theme-muted">{new Date(blog.updatedAt || blog.createdAt).toLocaleDateString()}</td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap items-center gap-3">
                    <button type="button" onClick={() => openEdit(blog)} className="text-xs font-bold text-accent"><Edit size={14} className="inline" /> Edit</button>
                    {blog.status === 'published' ? (
                      <button type="button" onClick={() => quickStatus(blog, 'draft')} className="text-xs font-bold text-amber-600">Unpublish</button>
                    ) : (
                      <button type="button" onClick={() => quickStatus(blog, 'published')} className="text-xs font-bold text-emerald-600">Publish</button>
                    )}
                    {blog.status === 'published' && <Link to={`/blog/${blog.slug}`} className="text-xs font-bold text-theme-muted"><Eye size={14} className="inline" /> View</Link>}
                    <button type="button" onClick={() => deleteBlog(blog)} className="text-xs font-bold text-red-600"><Trash2 size={14} className="inline" /> Delete</button>
                  </div>
                </td>
              </tr>
            )) : (
              <tr><td colSpan={7} className="p-8 text-center text-theme-muted">No blog posts yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Field({ label, children, colSpan = 1 }) {
  return (
    <label className={`block text-sm font-semibold text-theme-muted ${colSpan === 2 ? 'md:col-span-2' : ''}`}>
      {label}
      {children}
    </label>
  );
}

function Th({ children }) {
  return <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-theme-muted">{children}</th>;
}

function StatusPill({ status }) {
  const published = status === 'published';
  return (
    <span className={`rounded-full px-3 py-1 text-xs font-bold ${published ? 'bg-emerald-500/10 text-emerald-600' : 'bg-amber-500/10 text-amber-600'}`}>
      {published ? 'Published' : 'Draft'}
    </span>
  );
}
