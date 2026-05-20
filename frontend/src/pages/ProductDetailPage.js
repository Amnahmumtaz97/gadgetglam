import React, { useEffect, useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import SEOHead from '../components/common/SEOHead';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { Gift, Heart, Smartphone } from 'lucide-react';
import toast from 'react-hot-toast';
import ProductCard from '../components/product/ProductCard';
import { getAssistantSessionId } from '../utils/assistantSession';
import { getProductGallery, getRealProductFallback } from '../lib/mockups';
import SelectMenu from '../components/ui/SelectMenu';

const RATING_OPTIONS = [
  { value: '5', label: '5 ★ — Excellent' },
  { value: '4', label: '4 ★ — Good' },
  { value: '3', label: '3 ★ — Average' },
  { value: '2', label: '2 ★ — Fair' },
  { value: '1', label: '1 ★ — Poor' },
];

export default function ProductDetailPage() {
  const { slug } = useParams();
  const { addToCart } = useCart();
  const { user } = useAuth();
  const [product, setProduct] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [related, setRelated] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeImg, setActiveImg] = useState(0);
  const [qty, setQty] = useState(1);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [savingWishlist, setSavingWishlist] = useState(false);
  const [reviewForm, setReviewForm] = useState({ rating: 5, title: '', review_text: '' });

  useEffect(() => {
    setLoading(true);
    let loaded;
    axios.get(`/api/products/${slug}`)
      .then((res) => {
        loaded = res.data.product;
        setProduct(loaded);
        axios.post('/api/assistant/event', { sessionId: getAssistantSessionId(), type: 'product_view', productId: loaded._id }).catch(() => {});
        if (user) {
          axios.get('/api/users/profile')
            .then((profileRes) => setIsWishlisted(profileRes.data.user?.wishlist?.includes(loaded._id) || false))
            .catch(() => {});
        }
        return Promise.all([
          axios.get(`/api/reviews/${loaded._id}`),
          axios.get(`/api/products?category=${encodeURIComponent(loaded.category)}&limit=8`),
        ]);
      })
      .then(([revRes, relRes]) => {
        setReviews(revRes.data.reviews || []);
        setRelated((relRes.data.products || []).filter((p) => p._id !== loaded._id).slice(0, 4));
      })
      .catch(() => toast.error('Product not found'))
      .finally(() => setLoading(false));
  }, [slug, user]);

  const handleWishlist = async () => {
    if (!user) return toast.error('Please login to add to wishlist');
    setSavingWishlist(true);
    try {
      await axios.post(`/api/users/wishlist/${product._id}`);
      setIsWishlisted((prev) => !prev);
      toast.success(isWishlisted ? 'Removed from wishlist' : 'Added to wishlist');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error updating wishlist');
    } finally {
      setSavingWishlist(false);
    }
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!user) return toast.error('Please login to review');
    try {
      await axios.post(`/api/reviews/${product._id}`, reviewForm);
      toast.success('Review submitted!');
      const res = await axios.get(`/api/reviews/${product._id}`);
      setReviews(res.data.reviews);
      setReviewForm({ rating: 5, title: '', review_text: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error submitting review');
    }
  };

  const discount = product?.compare_price ? Math.round((1 - product.price / product.compare_price) * 100) : null;
  const relatedList = useMemo(() => related.slice(0, 4), [related]);
  const gallery = useMemo(() => getProductGallery(product), [product]);

  if (loading) return <div className="container py-24"><div className="mx-auto h-12 w-12 animate-spin rounded-full border-2 border-[var(--accent-yellow)]/20 border-t-[var(--accent-yellow)]" /></div>;
  if (!product) return <div className="container py-24 text-center"><h2 className="text-3xl font-black text-theme">Product not found</h2><Link to="/products" className="mt-4 inline-flex rounded-2xl bg-gradient-to-r from-[var(--accent-yellow)] to-[var(--accent-gold)] px-4 py-3 text-black">Back to products</Link></div>;

  return (
    <>
      <SEOHead title={product.seo?.meta_title || `${product.name} | GadgetGlam`} description={product.seo?.meta_description || product.short_description || product.description?.substring(0, 155)} keywords={product.seo?.meta_keywords?.join(', ') || `${product.name}, ${product.brand}, phone accessories`} canonical={`https://www.gadgetglam.pk/products/${product.slug}`} ogImage={product.images?.[0] || ''} ogType="product" product={product} />

      <div className="container page-shell">
        <nav aria-label="Breadcrumb" className="mb-6 text-sm text-theme-muted">
          <ol className="flex flex-wrap items-center gap-2">
            <li><Link to="/" className="hover:text-theme">Home</Link></li><span aria-hidden="true">/</span>
            <li><Link to={`/category/${product.category.toLowerCase()}`} className="hover:text-theme">{product.category}</Link></li><span aria-hidden="true">/</span>
            <li className="text-theme">{product.name}</li>
          </ol>
        </nav>

        <div className="grid gap-8 xl:grid-cols-[1.05fr_0.95fr]">
          <div className="space-y-4">
            <div className="relative overflow-hidden rounded-4xl border border-theme bg-theme-panel p-3">
              {gallery?.length > 0 ? (
                <img
                  src={gallery[Math.min(activeImg, gallery.length - 1)]}
                  alt={product.name}
                  className="h-[540px] w-full rounded-3xl object-cover"
                  onError={(e) => {
                    const fallback = getRealProductFallback(product);
                    if (e.currentTarget.src !== fallback) e.currentTarget.src = fallback;
                  }}
                />
              ) : (
                <div className="grid h-[540px] place-items-center rounded-3xl text-[var(--accent-gold)]"><Smartphone size={96} strokeWidth={1.2} /></div>
              )}
              {discount && <span className="absolute left-6 top-6 rounded-full bg-emerald-500/15 px-4 py-2 text-sm font-bold text-emerald-300">-{discount}%</span>}
            </div>
            {gallery?.length > 1 && (
              <div className="flex gap-3 overflow-x-auto pb-2">
                {gallery.map((img, i) => (
                  <button key={i} type="button" className={`h-24 w-24 shrink-0 overflow-hidden rounded-2xl border ${i === activeImg ? 'border-[var(--accent-yellow)]' : 'border-theme'}`} onClick={() => setActiveImg(i)}>
                    <img
                      src={img}
                      alt={`${product.name} view ${i + 1}`}
                      className="h-full w-full object-cover"
                      onError={(e) => {
                        const fallback = getRealProductFallback(product);
                        if (e.currentTarget.src !== fallback) e.currentTarget.src = fallback;
                      }}
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-4xl border border-theme bg-theme-panel p-5 md:p-8">
            <span className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--accent-yellow)]/80">{product.brand}</span>
            <h1 className="mt-3 text-3xl font-black tracking-tight text-theme md:text-5xl">{product.name}</h1>

            {product.reviews_count > 0 && <div className="mt-4 inline-flex items-center gap-3 rounded-full border border-theme bg-theme-panel px-4 py-2 text-sm text-theme-muted"><span className="text-accent">{'★'.repeat(Math.round(product.ratings_avg))}{'☆'.repeat(5 - Math.round(product.ratings_avg))}</span><span>{product.ratings_avg} ({product.reviews_count} reviews)</span></div>}

            <div className="mt-6 flex items-end gap-3">
              <span className="text-4xl font-black text-theme">PKR {product.price.toLocaleString()}</span>
              {product.compare_price && <span className="text-lg text-theme-muted line-through">PKR {product.compare_price.toLocaleString()}</span>}
              {discount && <span className="rounded-full border border-emerald-400/20 bg-emerald-500/15 px-3 py-1 text-sm font-semibold text-emerald-300">{discount}% OFF</span>}
            </div>

            <div className="mt-4">
              <span className={`inline-flex rounded-full border px-4 py-2 text-sm font-semibold ${product.stock_status === 'In Stock' ? 'border-[var(--accent-yellow)]/20 bg-accent/15 text-[var(--accent-yellow)]' : 'border-rose-400/20 bg-rose-500/15 text-rose-300'}`}>{product.stock_status}</span>
            </div>

            <p className="mt-6 max-w-2xl text-base leading-8 text-theme-muted">{product.description}</p>

            {product.bundle_items?.length > 0 && (
              <div className="mt-8 rounded-2xl border border-accent/25 bg-accent-light p-5 md:p-6">
                <h2 className="flex items-center gap-2 text-lg font-black text-theme">
                  <Gift size={20} className="text-accent" />
                  What&apos;s included in this bundle
                </h2>
                <p className="mt-1 text-sm text-theme-muted">
                  {product.bundle_items.length} item{product.bundle_items.length === 1 ? '' : 's'} — buy together and save versus purchasing separately.
                </p>
                <ul className="mt-4 space-y-3">
                  {product.bundle_items.map((item, idx) => (
                    <li
                      key={idx}
                      className="flex items-start gap-3 rounded-xl border border-theme bg-theme-panel px-4 py-3"
                    >
                      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-accent text-sm font-black text-on-accent">
                        {item.quantity > 1 ? item.quantity : '✓'}
                      </span>
                      <div>
                        <p className="font-bold text-theme">{item.name}</p>
                        {item.detail ? <p className="text-sm text-theme-muted">{item.detail}</p> : null}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {product.device_compatibility?.length > 0 && <div className="mt-6"><div className="mb-3 text-sm font-semibold text-theme-muted">Compatible with:</div><div className="flex flex-wrap gap-2">{product.device_compatibility.map((d) => <span key={d} className="rounded-full border border-theme bg-theme-panel px-3 py-2 text-sm text-theme-muted">{d}</span>)}</div></div>}

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <div className="inline-flex items-center rounded-2xl border border-theme bg-theme-panel p-1"><button className="h-12 w-12 rounded-xl text-theme" onClick={() => setQty((q) => Math.max(1, q - 1))}>-</button><span className="min-w-10 text-center font-semibold text-theme">{qty}</span><button className="h-12 w-12 rounded-xl text-theme" onClick={() => setQty((q) => q + 1)}>+</button></div>
              <button className="rounded-2xl bg-gradient-to-r from-[var(--accent-yellow)] via-[var(--accent-gold)] to-[var(--accent-gold)] px-5 py-3 font-semibold text-on-accent shadow-[0_18px_40px_rgba(37,99,235,0.22)]" onClick={() => addToCart(product, qty)} disabled={product.stock_status === 'Out of Stock'}>Add to Cart</button>
              <button onClick={handleWishlist} disabled={savingWishlist} className="inline-flex items-center gap-2 rounded-2xl border border-theme bg-theme-panel px-5 py-3 font-semibold text-theme-muted"><Heart size={17} fill={isWishlisted ? 'currentColor' : 'none'} />{isWishlisted ? 'Saved' : 'Save'}</button>
              <a href={product.affiliate_link} target="_blank" rel="noopener noreferrer sponsored" className="rounded-2xl border border-[var(--accent-yellow)]/20 bg-accent/15 px-5 py-3 font-semibold text-[var(--accent-yellow)]">Buy on {product.affiliate_platform}</a>
            </div>
          </div>
        </div>

        {relatedList.length > 0 && <section className="mt-14 border-t border-theme pt-10"><h2 className="mb-6 text-2xl font-black text-theme">You May Also Like</h2><div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">{relatedList.map((p) => <ProductCard key={p._id} product={p} />)}</div></section>}

        <section className="mt-14 rounded-4xl border border-theme bg-theme-panel p-5 md:p-8" aria-labelledby="reviews-heading">
          <h2 id="reviews-heading" className="text-2xl font-black text-theme">Customer Reviews ({product.reviews_count})</h2>
          {reviews.map((r) => <div key={r._id} className="mt-5 rounded-3xl border border-theme bg-theme-panel p-4"><div className="flex flex-wrap items-center gap-3"><strong className="text-theme">{r.user_id?.first_name} {r.user_id?.last_name?.[0]}.</strong><span className="text-accent">{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</span>{r.is_verified && <span className="rounded-full border border-[var(--accent-yellow)]/20 bg-accent/10 px-3 py-1 text-xs font-semibold text-[var(--accent-yellow)]">Verified Purchase</span>}</div>{r.title && <div className="mt-2 font-semibold text-theme">{r.title}</div>}<p className="mt-2 text-sm leading-7 text-theme-muted">{r.review_text}</p></div>)}
          {user && <div className="mt-8 rounded-4xl border border-theme bg-theme-panel p-5 md:p-8"><h3 className="text-xl font-bold text-theme">Write a Review</h3><form onSubmit={handleReviewSubmit} className="mt-5 grid gap-4 md:grid-cols-2"><label className="block text-sm text-theme-muted">Rating<div className="mt-2"><SelectMenu fullWidth value={String(reviewForm.rating)} onChange={(val) => setReviewForm((f) => ({ ...f, rating: Number(val) }))} options={RATING_OPTIONS} aria-label="Review rating" /></div></label><label className="text-sm text-theme-muted">Title<input type="text" placeholder="Summarize your review" value={reviewForm.title} onChange={(e) => setReviewForm((f) => ({ ...f, title: e.target.value }))} className="mt-2 w-full rounded-2xl input-theme w-full rounded-2xl px-4 py-3 placeholder:text-theme-muted" /></label><label className="md:col-span-2 text-sm text-theme-muted">Review<textarea placeholder="What did you like or dislike?" required rows={4} value={reviewForm.review_text} onChange={(e) => setReviewForm((f) => ({ ...f, review_text: e.target.value }))} className="mt-2 w-full rounded-2xl input-theme w-full rounded-2xl px-4 py-3 placeholder:text-theme-muted" /></label><button type="submit" className="inline-flex w-fit rounded-2xl bg-gradient-to-r from-[var(--accent-yellow)] via-[var(--accent-gold)] to-[var(--accent-gold)] px-5 py-3 font-semibold text-on-accent">Submit Review</button></form></div>}
        </section>
      </div>
    </>
  );
}
