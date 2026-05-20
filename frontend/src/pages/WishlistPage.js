import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import SEOHead from '../components/common/SEOHead';
import toast from 'react-hot-toast';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import {
  getLocalWishlistIds,
  setLocalWishlistIds,
  syncWishlistFromServer,
  toggleWishlist,
} from '../lib/wishlist';

function WishlistItemCard({ product, onRemove, onAddToCart }) {
  return (
    <article className="market-card overflow-hidden p-0">
      <Link to={`/products/${product.slug}`} className="block">
        <div className="relative aspect-[4/3] bg-accent-light">
          {product.thumbnail ? (
            <img src={product.thumbnail} alt={product.name} className="h-full w-full object-cover" loading="lazy" />
          ) : (
            <div className="grid h-full place-items-center text-4xl">📱</div>
          )}
          <button
            type="button"
            onClick={(e) => { e.preventDefault(); onRemove(product._id); }}
            className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full bg-[var(--gray-900)] text-sm text-white"
            aria-label={`Remove ${product.name}`}
          >
            ×
          </button>
        </div>
      </Link>
      <div className="p-4">
        <span className="text-xs font-bold uppercase tracking-wide text-accent">{product.brand}</span>
        <Link to={`/products/${product.slug}`}>
          <h2 className="mt-1 text-base font-bold text-theme">{product.name}</h2>
        </Link>
        <div className="mt-3 flex items-center justify-between gap-2">
          <div className="font-display text-lg font-bold text-accent">PKR {product.price.toLocaleString()}</div>
          <span className="text-xs font-semibold text-theme-muted">{product.stock_status}</span>
        </div>
        <div className="mt-4 flex gap-2">
          <button type="button" className="btn-primary flex-1 rounded-xl py-2.5 text-sm" onClick={() => onAddToCart(product)} disabled={product.stock_status === 'Out of Stock'}>
            Add to cart
          </button>
          <button type="button" className="rounded-xl border border-theme px-4 py-2.5 text-sm font-semibold text-theme-muted hover:bg-accent-light hover:text-theme" onClick={() => onRemove(product._id)}>
            Remove
          </button>
        </div>
      </div>
    </article>
  );
}

export default function WishlistPage({ embedded = false }) {
  const { addToCart } = useCart();
  const { user } = useAuth();
  const [wishlistIds, setWishlistState] = useState(() => getLocalWishlistIds());
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const reloadIds = async () => {
    if (user) await syncWishlistFromServer(axios);
    const ids = getLocalWishlistIds();
    setWishlistState(ids);
    return ids;
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const ids = await reloadIds();
      if (cancelled) return;
      if (!ids.length) {
        setProducts([]);
        setLoading(false);
        return;
      }
      try {
        const res = await axios.get(`/api/products?ids=${encodeURIComponent(ids.join(','))}`);
        if (!cancelled) setProducts(res.data.products || []);
      } catch {
        if (!cancelled) toast.error('Failed to load wishlist');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [user]);

  const removeFromWishlist = async (productId) => {
    if (user) {
      await toggleWishlist(productId, axios, true);
    } else {
      setLocalWishlistIds(getLocalWishlistIds().filter((id) => id !== productId));
    }
    const next = getLocalWishlistIds();
    setWishlistState(next);
    setProducts((prev) => prev.filter((p) => p._id !== productId));
    toast.success('Removed from wishlist');
  };

  const clearAll = async () => {
    if (user) {
      const ids = [...getLocalWishlistIds()];
      await Promise.all(ids.map((id) => axios.post(`/api/users/wishlist/${id}`).catch(() => {})));
    }
    setLocalWishlistIds([]);
    setWishlistState([]);
    setProducts([]);
    toast.success('Wishlist cleared');
  };

  const heading = useMemo(() => (wishlistIds.length ? `Wishlist (${wishlistIds.length})` : 'Wishlist'), [wishlistIds.length]);

  const body = (
    <>
      {!embedded && (
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="market-heading">{heading}</h1>
            <p className="market-subtitle mb-0">Saved items sync with your account when signed in.</p>
          </div>
          <div className="flex gap-2">
            <Link to="/products" className="btn-primary rounded-xl px-5 py-3 text-sm">Continue shopping</Link>
            {wishlistIds.length > 0 && (
              <button type="button" onClick={clearAll} className="rounded-xl border border-theme px-5 py-3 text-sm font-semibold text-theme-muted hover:bg-accent-light hover:text-theme">
                Clear all
              </button>
            )}
          </div>
        </div>
      )}
      {embedded && wishlistIds.length > 0 && (
        <div className="mb-4 flex justify-end">
          <button type="button" onClick={clearAll} className="text-sm font-semibold text-theme-muted hover:text-theme">Clear wishlist</button>
        </div>
      )}

      {loading ? (
        <div className="spinner" />
      ) : wishlistIds.length === 0 ? (
        <div className="market-empty market-card text-center">
          <div className="text-5xl mb-4">🤍</div>
          <h2 className="text-xl font-black text-theme">Your wishlist is empty</h2>
          <p className="mt-2 text-theme-muted">Tap the heart on any product to save it here.</p>
          <Link to="/products" className="btn-primary mt-6 inline-flex rounded-xl px-5 py-3 text-sm">Browse products</Link>
        </div>
      ) : products.length === 0 ? (
        <div className="market-empty market-card text-center">
          <h2 className="text-xl font-black text-theme">Saved items unavailable</h2>
          <p className="mt-2 text-theme-muted">Some products may have been removed.</p>
          <button type="button" className="btn-primary mt-4 rounded-xl px-5 py-3 text-sm" onClick={reloadIds}>Refresh</button>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {products.map((product) => (
            <WishlistItemCard key={product._id} product={product} onRemove={removeFromWishlist} onAddToCart={addToCart} />
          ))}
        </div>
      )}
    </>
  );

  if (embedded) return <div>{body}</div>;

  return (
    <>
      <SEOHead title="Wishlist | GadgetGlam" description="Your saved GadgetGlam products." />
      <div className="container market-page">{body}</div>
    </>
  );
}
