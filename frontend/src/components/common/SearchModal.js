import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Sparkles, X } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { getProductDisplayImage } from '../../lib/mockups';
import { SHOP_CATEGORIES } from '../../lib/categories';

const QUICK_CATEGORIES = SHOP_CATEGORIES.map((c) => ({ label: c.name, slug: c.slug }));

export default function SearchModal({ open, onClose }) {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const canSearch = query.trim().length >= 2;

  useEffect(() => {
    if (!open) {
      setQuery('');
      setResults([]);
    }
  }, [open]);

  useEffect(() => {
    if (!open || !canSearch) {
      setResults([]);
      return undefined;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const { data } = await axios.get(`/api/products?search=${encodeURIComponent(query.trim())}&limit=6`);
        setResults(data.products || []);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 220);

    return () => clearTimeout(timer);
  }, [open, query, canSearch]);

  const resultMeta = useMemo(() => (results.length ? `${results.length} matches` : 'No direct matches yet'), [results.length]);

  const submit = (e) => {
    e.preventDefault();
    if (!canSearch) return;
    navigate(`/products?search=${encodeURIComponent(query.trim())}`);
    onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-90 bg-black/25 backdrop-blur-xl"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 18, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 260, damping: 26 }}
              className="mx-auto mt-20 w-[min(920px,calc(100%-24px))] overflow-hidden rounded-4xl border border-theme bg-theme-panel shadow-[0_30px_90px_rgba(17,17,17,0.18)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-theme px-5 py-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--accent-yellow)]/80">Search the store</p>
                <h3 className="mt-1 text-xl font-bold text-theme">Find premium gadgets faster</h3>
              </div>
              <button onClick={onClose} className="grid h-11 w-11 place-items-center rounded-2xl border border-theme bg-theme-panel text-theme-muted transition hover:border-accent hover:bg-accent-light hover:text-theme">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={submit} className="border-b border-theme p-5">
              <div className="flex items-center gap-3 rounded-3xl border border-theme bg-[var(--input-bg)] px-4 py-4 shadow-[var(--shadow)] focus-within:border-accent">
                <Search className="text-theme-muted" size={18} />
                <input
                  autoFocus
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search phone cases, chargers, bundles..."
                  className="w-full bg-transparent text-base text-theme outline-none placeholder:text-theme-muted"
                />
                <button type="submit" className="btn-gradient rounded-2xl px-4 py-2 text-sm font-semibold transition hover:scale-[1.02]">
                  Search
                </button>
              </div>
            </form>

            <div className="grid gap-5 p-5 md:grid-cols-[1.1fr_0.9fr]">
              <div className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  {QUICK_CATEGORIES.map((cat) => (
                    <Link
                      key={cat.slug}
                      to={`/category/${cat.slug}`}
                      onClick={onClose}
                      className="rounded-full border border-theme bg-theme-panel px-4 py-2 text-sm text-theme-secondary transition hover:border-accent hover:bg-accent-light hover:text-theme"
                    >
                      {cat.label}
                    </Link>
                  ))}
                </div>

                <div className="rounded-3xl border border-theme bg-accent-light p-4">
                  <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-theme-muted">
                    <Sparkles size={16} className="text-[var(--accent-yellow)]" /> AI-powered discovery
                  </div>
                  <p className="text-sm leading-6 text-theme-muted">
                    Search, browse categories, or jump straight to best-sellers and bundle deals with the premium gadget-store layout.
                  </p>
                </div>
              </div>

              <div className="rounded-3xl border border-theme bg-accent-light p-4">
                <div className="mb-3 flex items-center justify-between text-sm text-theme-muted">
                  <span>Live results</span>
                  <span>{loading ? 'Searching…' : resultMeta}</span>
                </div>
                <div className="space-y-3">
                  {results.map((item) => (
                    <Link
                      key={item._id}
                      to={`/products/${item.slug}`}
                      onClick={onClose}
                      className="flex items-center gap-3 rounded-2xl border border-theme bg-theme-panel p-3 transition hover:-translate-y-0.5 hover:border-accent hover:bg-accent-light hover:text-theme"
                    >
                      <div className="h-14 w-14 overflow-hidden rounded-2xl bg-[var(--accent-yellow-light)]">
                        <img src={getProductDisplayImage(item)} alt={item.name} className="h-full w-full object-cover" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-semibold text-theme">{item.name}</div>
                        <div className="text-xs text-theme-muted">{item.category}</div>
                      </div>
                      <div className="text-sm font-bold text-[var(--accent-yellow)]">PKR {Number(item.price || 0).toLocaleString()}</div>
                    </Link>
                  ))}
                  {!loading && !results.length && canSearch && (
                    <div className="rounded-2xl border border-dashed border-theme px-4 py-8 text-center text-sm text-theme-muted">
                      No matches yet. Try a shorter or broader search.
                    </div>
                  )}
                  {!canSearch && (
                    <div className="rounded-2xl border border-dashed border-theme px-4 py-8 text-center text-sm text-theme-muted">
                      Start typing to reveal premium product matches.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
