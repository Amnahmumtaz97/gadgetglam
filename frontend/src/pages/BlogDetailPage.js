import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Briefcase, CalendarDays, MessageCircle, Send, Share2 } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import SEOHead from '../components/common/SEOHead';

const fallbackCover = 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=80';

function formatDate(date) {
  if (!date) return '';
  return new Date(date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

function renderContent(content = '') {
  return String(content)
    .split(/\n{2,}/)
    .map((block, index) => {
      const text = block.trim();
      if (!text) return null;
      if (text.startsWith('## ')) return <h2 key={index} className="mt-8 text-2xl font-black text-theme">{text.replace(/^##\s+/, '')}</h2>;
      if (text.startsWith('# ')) return <h2 key={index} className="mt-8 text-3xl font-black text-theme">{text.replace(/^#\s+/, '')}</h2>;
      if (/^[-*]\s+/m.test(text)) {
        return (
          <ul key={index} className="mt-4 list-disc space-y-2 pl-6 text-theme-muted">
            {text.split('\n').map((item) => item.replace(/^[-*]\s+/, '').trim()).filter(Boolean).map((item) => <li key={item}>{item}</li>)}
          </ul>
        );
      }
      return <p key={index} className="mt-4 text-base leading-8 text-theme-muted">{text}</p>;
    });
}

export default function BlogDetailPage() {
  const { slug } = useParams();
  const [blog, setBlog] = useState(null);
  const [relatedBlogs, setRelatedBlogs] = useState([]);
  const [latestBlogs, setLatestBlogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    axios.get(`/api/blogs/${slug}`)
      .then(({ data }) => {
        setBlog(data.blog);
        setRelatedBlogs(data.relatedBlogs || []);
        setLatestBlogs(data.latestBlogs || []);
      })
      .catch(() => setBlog(null))
      .finally(() => setLoading(false));
  }, [slug]);

  const shareUrl = typeof window !== 'undefined' ? window.location.href : `https://www.gadgetglam.pk/blog/${slug}`;
  const shareTitle = encodeURIComponent(blog?.title || 'GadgetGlam Blog');

  const copyShare = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast.success('Blog link copied');
    } catch {
      toast.error('Could not copy link');
    }
  };

  if (loading) return <div className="container page-shell"><div className="spinner" /></div>;
  if (!blog) {
    return (
      <div className="container page-shell text-center">
        <SEOHead title="Blog not found | GadgetGlam" description="This blog post could not be found." />
        <h1 className="text-3xl font-black text-theme">Blog not found</h1>
        <Link to="/blog" className="btn-primary mt-5 rounded-xl px-5 py-3 text-sm">Back to blog</Link>
      </div>
    );
  }

  return (
    <>
      <SEOHead
        title={blog.metaTitle || blog.title}
        description={blog.metaDescription || blog.excerpt}
        keywords={(blog.tags || []).join(', ')}
        canonical={`https://www.gadgetglam.pk/blog/${blog.slug}`}
        ogImage={blog.coverImage || fallbackCover}
        ogType="article"
      />

      <article className="container page-shell">
        <div className="mx-auto max-w-4xl">
          <Link to="/blog" className="text-sm font-bold text-accent">Back to blog</Link>
          <div className="mt-5 flex flex-wrap items-center gap-3 text-xs font-bold uppercase tracking-[0.14em] text-theme-muted">
            <span className="rounded-full bg-accent-light px-3 py-1 text-accent">{blog.category}</span>
            <span className="inline-flex items-center gap-1 normal-case tracking-normal"><CalendarDays size={13} /> {formatDate(blog.publishedAt || blog.createdAt)}</span>
            <span>{blog.author || 'GadgetGlam Team'}</span>
          </div>
          <h1 className="mt-5 text-3xl font-black leading-tight tracking-tight text-theme md:text-5xl">{blog.title}</h1>
          <p className="mt-5 max-w-3xl text-lg leading-8 text-theme-muted">{blog.excerpt}</p>
        </div>

        <div className="mx-auto mt-8 max-w-5xl overflow-hidden rounded-2xl border border-theme bg-theme-panel shadow-[var(--shadow)]">
          <img src={blog.coverImage || fallbackCover} alt={blog.title} className="aspect-[16/8] w-full object-cover" />
        </div>

        <div className="mx-auto mt-8 grid max-w-5xl gap-8 lg:grid-cols-[1fr_260px]">
          <div className="min-w-0 rounded-2xl border border-theme bg-theme-panel p-6 shadow-[var(--shadow)] md:p-8">
            <div className="prose max-w-none">{renderContent(blog.content)}</div>
            <div className="mt-8 flex flex-wrap gap-2 border-t border-theme pt-5">
              {(blog.tags || []).map((tag) => (
                <Link key={tag} to={`/blog?tag=${encodeURIComponent(tag)}`} className="rounded-full border border-theme px-3 py-1.5 text-xs font-semibold text-theme-muted hover:border-accent hover:text-accent">#{tag}</Link>
              ))}
            </div>
          </div>

          <aside className="space-y-5">
            <div className="rounded-2xl border border-theme bg-theme-panel p-5 shadow-[var(--shadow)]">
              <h2 className="font-black text-theme">Share</h2>
              <div className="mt-4 grid grid-cols-4 gap-2">
                <button type="button" onClick={copyShare} className="grid h-11 place-items-center rounded-xl border border-theme text-theme-muted hover:border-accent hover:text-accent" aria-label="Copy link"><Share2 size={17} /></button>
                <a href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${shareTitle}`} target="_blank" rel="noreferrer" className="grid h-11 place-items-center rounded-xl border border-theme text-theme-muted hover:border-accent hover:text-accent" aria-label="Share on X"><Send size={17} /></a>
                <a href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`} target="_blank" rel="noreferrer" className="grid h-11 place-items-center rounded-xl border border-theme text-theme-muted hover:border-accent hover:text-accent" aria-label="Share on Facebook"><MessageCircle size={17} /></a>
                <a href={`https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(shareUrl)}&title=${shareTitle}`} target="_blank" rel="noreferrer" className="grid h-11 place-items-center rounded-xl border border-theme text-theme-muted hover:border-accent hover:text-accent" aria-label="Share on LinkedIn"><Briefcase size={17} /></a>
              </div>
            </div>
            <MiniBlogList title="Latest" blogs={latestBlogs} />
          </aside>
        </div>

        {relatedBlogs.length > 0 && (
          <section className="mx-auto mt-10 max-w-5xl">
            <h2 className="text-2xl font-black text-theme">Related Blogs</h2>
            <div className="mt-5 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
              {relatedBlogs.map((item) => <RelatedCard key={item._id} blog={item} />)}
            </div>
          </section>
        )}
      </article>
    </>
  );
}

function RelatedCard({ blog }) {
  return (
    <Link to={`/blog/${blog.slug}`} className="overflow-hidden rounded-2xl border border-theme bg-theme-panel shadow-[var(--shadow)] transition hover:-translate-y-1 hover:border-accent">
      <img src={blog.coverImage || fallbackCover} alt="" className="aspect-[16/10] w-full object-cover" loading="lazy" />
      <div className="p-4">
        <p className="text-xs font-bold uppercase tracking-[0.12em] text-accent">{blog.category}</p>
        <h3 className="mt-2 line-clamp-2 text-sm font-black leading-snug text-theme">{blog.title}</h3>
      </div>
    </Link>
  );
}

function MiniBlogList({ title, blogs }) {
  return (
    <div className="rounded-2xl border border-theme bg-theme-panel p-5 shadow-[var(--shadow)]">
      <h2 className="font-black text-theme">{title}</h2>
      <div className="mt-4 space-y-4">
        {(blogs || []).map((item) => (
          <Link key={item._id} to={`/blog/${item.slug}`} className="block text-sm font-bold leading-snug text-theme hover:text-accent">
            {item.title}
          </Link>
        ))}
      </div>
    </div>
  );
}
