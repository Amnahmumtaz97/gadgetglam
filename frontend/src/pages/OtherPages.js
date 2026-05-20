// ── CartPage.js ───────────────────────────────────────────
import React, { useState, useEffect } from 'react';
import { Link, useParams, Navigate } from 'react-router-dom';
import axios from 'axios';
import SEOHead from '../components/common/SEOHead';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import ProductCard from '../components/product/ProductCard';
import CategorySidebar from '../components/product/CategorySidebar';
import SelectMenu from '../components/ui/SelectMenu';
import { slugToCategoryName } from '../lib/categories';
import { PRODUCT_SORT_OPTIONS } from '../lib/sortOptions';
import toast from 'react-hot-toast';

export function CartPage() {
  const {
    cart,
    removeFromCart,
    updateQty,
    subtotal,
    clearCart,
    couponCode,
    couponDiscount,
    discountedTotal,
    applyCoupon,
    clearCoupon
  } = useCart();
  const [couponInput, setCouponInput] = useState(couponCode || '');

  const couponApplied = !!couponCode;

  const handleApplyCoupon = () => {
    const ok = applyCoupon(couponInput);
    if (ok) setCouponInput((couponInput || '').trim().toUpperCase());
  };

  const finalTotal = discountedTotal;

  return (
    <>
      <SEOHead title="Your Cart | GadgetGlam" description="Review your cart and checkout." />
      <div className="container page-shell">
        <h1 className="mb-8 text-4xl font-black text-theme">Your Cart</h1>
        {cart.length === 0 ? (
          <div className="grid place-items-center rounded-4xl border border-theme bg-theme-panel py-24 text-center text-theme-muted">
            <div className="mb-4 text-6xl">🛒</div>
            <h2 className="text-2xl font-bold text-theme">Your cart is empty</h2>
            <Link to="/products" className="mt-5 inline-flex rounded-2xl bg-gradient-to-r from-[var(--accent-yellow)] to-[var(--accent-gold)] px-5 py-3 font-semibold text-on-accent">Shop Now</Link>
          </div>
        ) : (
          <div className="grid gap-8 xl:grid-cols-[1.2fr_0.8fr]">
            <div>
              {cart.map(item => (
                <div key={item._id} className="mb-4 flex items-center gap-4 rounded-4xl border border-theme bg-theme-panel p-4">
                  <div className="grid h-20 w-20 shrink-0 place-items-center overflow-hidden rounded-2xl bg-[var(--surface-2)]">
                    {item.thumbnail ? <img src={item.thumbnail} alt={item.name} className="h-full w-full object-cover" /> : '📱'}
                  </div>
                  <div className="flex-1">
                    <div className="text-base font-semibold text-theme">{item.name}</div>
                    <div className="text-sm font-bold text-[var(--accent-yellow)]">PKR {item.price.toLocaleString()}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="inline-flex items-center overflow-hidden rounded-2xl border border-theme bg-theme-panel">
                      <button className="px-4 py-3 text-theme" onClick={() => updateQty(item._id, item.qty - 1)}>−</button>
                      <span className="px-4 py-3 font-semibold text-theme">{item.qty}</span>
                      <button className="px-4 py-3 text-theme" onClick={() => updateQty(item._id, item.qty + 1)}>+</button>
                    </div>
                    <button className="rounded-2xl border border-theme bg-theme-panel px-4 py-3 text-sm font-semibold text-theme-muted" onClick={() => removeFromCart(item._id)}>Remove</button>
                  </div>
                </div>
              ))}
              <button className="text-sm text-theme-muted underline underline-offset-4" onClick={clearCart}>Clear all items</button>
            </div>

            <div className="sticky top-28 rounded-4xl border border-theme bg-theme-panel p-6">
              <h2 className="mb-5 text-2xl font-black text-theme">Order Summary</h2>
              <div className="mb-3 flex justify-between text-sm text-theme-muted"><span>Subtotal</span><strong>PKR {subtotal.toLocaleString()}</strong></div>
              <div className="mb-4 flex justify-between text-sm text-[var(--accent-yellow)]"><span>Delivery</span><strong>FREE</strong></div>
              <div className="mb-4">
                <div className="mb-2 flex gap-2">
                  <input
                    type="text" placeholder="Coupon code (try GLAM10)"
                    value={couponInput} onChange={e => setCouponInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleApplyCoupon()}
                    disabled={couponApplied}
                    className="flex-1 rounded-2xl border border-theme bg-theme-panel px-4 py-3 text-sm text-theme outline-none placeholder:text-theme-muted disabled:opacity-60"
                  />
                  <button
                    onClick={handleApplyCoupon} disabled={couponApplied}
                    className="rounded-2xl bg-gradient-to-r from-[var(--accent-yellow)] to-[var(--accent-gold)] px-4 py-3 text-sm font-semibold text-on-accent disabled:opacity-60"
                  >{couponApplied ? 'Applied ✓' : 'Apply'}</button>
                </div>
                {couponApplied && (
                  <>
                    <div className="flex justify-between text-sm font-semibold text-emerald-300">
                      <span>✅ {couponCode} — 10% off</span><strong>−PKR {couponDiscount.toLocaleString()}</strong>
                    </div>
                    <button onClick={clearCoupon} className="mt-2 text-xs text-theme-muted underline underline-offset-4">Remove coupon</button>
                  </>
                )}
              </div>
              <div className="flex justify-between border-t border-theme pt-4 text-lg font-bold text-theme">
                <span>Total</span><span className="text-[var(--accent-yellow)]">PKR {finalTotal.toLocaleString()}</span>
              </div>
              <button className="mt-5 w-full rounded-2xl bg-gradient-to-r from-[var(--accent-yellow)] via-[var(--accent-gold)] to-[var(--accent-gold)] px-4 py-3 font-semibold text-on-accent" onClick={() => window.location.href='/checkout'}>Proceed to Checkout</button>
              <Link to="/products" className="mt-4 block text-center text-sm text-theme-muted">Continue Shopping</Link>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

// ── CategoryPage.js ────────────────────────────────────────
export function CategoryPage() {
  const { category } = useParams();
  const [products, setProducts] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [sort, setSort]         = useState('newest');
  const catName = slugToCategoryName(category);
  const isBundles = catName === 'Bundles';

  useEffect(() => {
    setLoading(true);
    axios.get(`/api/products?category=${encodeURIComponent(catName)}&limit=24&sort=${sort}`)
      .then(res => setProducts(res.data.products || []))
      .finally(() => setLoading(false));
  }, [category, catName, sort]);

  return (
    <>
      <SEOHead
        title={`${catName} | GadgetGlam`}
        description={`Shop premium ${catName.toLowerCase()} for all phones at GadgetGlam Pakistan. Fast delivery, great prices.`}
        keywords={`${catName.toLowerCase()} Pakistan, buy ${catName.toLowerCase()} online, phone ${catName.toLowerCase()}`}
        canonical={`https://www.gadgetglam.pk/category/${category}`}
        category={catName}
      />
      <div className="container page-shell py-8 md:py-10">
        <nav className="mb-6 flex flex-wrap items-center gap-2 text-sm text-theme-muted" aria-label="Breadcrumb">
          <Link to="/" className="font-semibold hover:text-accent">Home</Link>
          <span aria-hidden="true">/</span>
          <Link to="/products" className="font-semibold hover:text-accent">Products</Link>
          <span aria-hidden="true">/</span>
          <span className="font-bold text-theme">{catName}</span>
        </nav>

        <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
          <CategorySidebar />

          <div className="min-w-0">
            <div className="mb-6 rounded-2xl border border-theme bg-theme-panel p-6 shadow-[var(--shadow)] md:p-8">
              <h1 className="text-3xl font-black tracking-tight text-theme md:text-4xl">
                {isBundles ? 'Bundles & combo deals' : catName}
              </h1>
              <p className="mt-2 text-sm text-theme-muted md:text-base">
                {isBundles
                  ? 'Save more with curated multi-item packs — each deal lists exactly what is included in the bundle.'
                  : `Discover our curated collection of ${catName.toLowerCase()} for all devices.`}
              </p>
              <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
                <span className="text-sm font-semibold text-theme-muted">
                  {loading ? 'Loading…' : `${products.length} product${products.length === 1 ? '' : 's'}`}
                </span>
                <SelectMenu
                  value={sort}
                  onChange={setSort}
                  options={PRODUCT_SORT_OPTIONS}
                  aria-label="Sort products"
                  className="min-w-[200px]"
                />
              </div>
            </div>

            {loading ? (
              <div className="grid place-items-center py-20">
                <div className="spinner" />
              </div>
            ) : products.length > 0 ? (
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {products.map((p) => <ProductCard key={p._id} product={p} />)}
              </div>
            ) : (
              <div className="rounded-2xl border border-theme bg-theme-panel py-20 text-center text-theme-muted">
                <div className="mb-4 text-5xl">📦</div>
                <p className="font-semibold text-theme">No {catName} available yet</p>
                <p className="mt-2 text-sm">Try another category from the sidebar, or check back soon.</p>
                <Link to="/products" className="btn-gradient mt-6 inline-flex rounded-xl px-6 py-2.5 text-sm font-bold">
                  Browse all products
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

// ── NotFoundPage.js ────────────────────────────────────────
export function NotFoundPage() {
  return (
    <>
      <SEOHead title="404 — Page Not Found | GadgetGlam" />
      <div style={{minHeight:'70vh',display:'flex',alignItems:'center',justifyContent:'center',flexDirection:'column',textAlign:'center',gap:'16px',padding:'40px'}}>
        <div style={{fontSize:'80px'}}>😵</div>
        <h1 style={{fontFamily:'var(--font-display)',fontSize:'36px',color:'var(--gray-900)'}}>Page Not Found</h1>
        <p style={{color:'var(--gray-500)',fontSize:'16px'}}>The page you're looking for doesn't exist.</p>
        <Link to="/" className="btn-primary">Go Home →</Link>
      </div>
    </>
  );
}

// ── PrivateRoute.js ────────────────────────────────────────
export function PrivateRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="spinner" />;
  return user ? children : <Navigate to="/login" replace />;
}

// ── AdminRoute.js ──────────────────────────────────────────
export function AdminRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="spinner" />;
  if (!user || user.role !== 'admin') return <Navigate to="/" replace />;
  return children;
}
