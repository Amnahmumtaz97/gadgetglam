import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Gift, Heart, ShoppingBag, Smartphone, Sparkles } from 'lucide-react';
import axios from 'axios';
import { useCart } from '../../context/CartContext';
import { getAssistantSessionId } from '../../utils/assistantSession';
import { useAuth } from '../../context/AuthContext';
import { getProductDisplayImage, getRealProductFallback } from '../../lib/mockups';
import { isInLocalWishlist, toggleWishlist } from '../../lib/wishlist';

export default function ProductCard({ product, compact = false }) {
  const { addToCart } = useCart();
  const { user } = useAuth();
  const [wishlisted, setWishlisted] = useState(() => isInLocalWishlist(product._id));

  const discount = product.compare_price
    ? Math.round((1 - product.price / product.compare_price) * 100)
    : null;
  const bundleItems = product.bundle_items || [];
  const isBundleDeal = bundleItems.length > 0 || product.category === 'Bundles';
  const rawImage = getProductDisplayImage(product);
  const displayImage = /\.svg(\?|$)/i.test(String(rawImage || ''))
    ? getRealProductFallback(product)
    : rawImage;

  const onToggleWishlist = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    const added = await toggleWishlist(product._id, axios, !!user);
    setWishlisted(added);
  };

  return (
    <motion.article
      whileHover={{ y: -6 }}
      transition={{ type: 'spring', stiffness: 260, damping: 24 }}
      className={`group relative flex h-full flex-col overflow-hidden rounded-2xl border border-theme bg-theme-panel shadow-[var(--shadow)] transition hover:-translate-y-1 hover:shadow-[0_14px_28px_rgba(37,99,235,0.1)] ${compact ? 'p-2.5' : 'p-3 shadow-[0_12px_30px_rgba(17,17,17,0.07)] hover:shadow-[0_18px_36px_rgba(37,99,235,0.12)]'}`}
      itemScope
      itemType="https://schema.org/Product"
    >
      <Link
        to={`/products/${product.slug}`}
        className="relative block overflow-hidden rounded-xl border border-theme"
        onClick={() => {
          axios.post('/api/assistant/event', {
            sessionId: getAssistantSessionId(),
            type: 'product_click',
            productId: product._id,
          }).catch(() => {});
        }}
      >
        <div className={`relative overflow-hidden bg-[var(--gray-200)] ${compact ? 'aspect-square max-h-[160px]' : 'aspect-square'}`}>
          {displayImage ? (
            <img
              src={displayImage}
              alt={product.name}
              itemProp="image"
              loading="lazy"
              className="absolute inset-0 h-full w-full object-cover object-center transition duration-500 group-hover:scale-105"
              onError={(event) => {
                const fallback = getRealProductFallback(product);
                if (event.currentTarget.src !== fallback) event.currentTarget.src = fallback;
              }}
            />
          ) : (
            <div className="grid h-full w-full place-items-center text-theme-muted"><Smartphone size={compact ? 36 : 54} strokeWidth={1.2} /></div>
          )}
          <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[1] h-1/4 bg-gradient-to-t from-black/25 to-transparent" />
          <div className="absolute left-3 top-3 z-[2] flex gap-2">
            {discount ? <span className="rounded-full border border-[#E11D2E] bg-[#E11D2E] px-3 py-1 text-xs font-bold text-white shadow-[0_8px_18px_rgba(225,29,46,0.22)]">-{discount}%</span> : null}
            {isBundleDeal && !discount ? <span className="rounded-full border border-accent bg-accent px-3 py-1 text-xs font-bold text-on-accent">Bundle deal</span> : null}
            {product.is_featured && !discount && !isBundleDeal ? <span className="rounded-full badge-accent px-3 py-1 text-xs font-bold text-on-accent">Top Pick</span> : null}
          </div>
          {product.stock_status === 'Out of Stock' && (
            <div className="absolute inset-0 grid place-items-center bg-black/65 text-sm font-bold uppercase tracking-[0.22em] text-white">Out of Stock</div>
          )}
          <button
            className={`absolute right-3 top-3 z-[2] grid place-items-center rounded-xl border border-theme bg-theme-panel/95 text-theme shadow-sm backdrop-blur-xl transition hover:border-[#E11D2E] hover:bg-[#E11D2E] hover:text-white ${compact ? 'h-8 w-8' : 'h-10 w-10'} ${wishlisted ? 'text-[#E11D2E]' : ''}`}
            onClick={onToggleWishlist}
            aria-label={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
          >
            <Heart size={18} fill={wishlisted ? 'currentColor' : 'none'} />
          </button>
        </div>
      </Link>

      <div className={`flex flex-1 flex-col ${compact ? 'pt-2.5' : 'pt-4'}`}>
        <p className={`mb-1.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 ${compact ? 'text-[10px]' : 'text-xs'}`}>
          <span className="inline-flex items-center gap-1 font-semibold text-accent">
            <Sparkles size={12} className="shrink-0" />
            {product.brand || 'Premium Gear'}
          </span>
          <span className="text-theme-muted" aria-hidden>·</span>
          <span className="text-theme-secondary">{product.category}</span>
        </p>
        <Link to={`/products/${product.slug}`} className="block min-h-[2.5rem]">
          <h2 className={`line-clamp-2 font-extrabold tracking-tight text-theme ${compact ? 'text-xs leading-snug' : 'text-sm md:text-[15px]'}`} itemProp="name">{product.name}</h2>
        </Link>

        {bundleItems.length > 0 && (
          <ul className={`mt-2 space-y-0.5 text-theme-muted ${compact ? 'text-[10px]' : 'text-xs'}`} aria-label="Bundle includes">
            {bundleItems.slice(0, compact ? 2 : 3).map((item, idx) => (
              <li key={idx} className="flex items-start gap-1.5 line-clamp-1">
                <Gift size={compact ? 10 : 12} className="mt-0.5 shrink-0 text-accent" aria-hidden />
                <span>
                  {item.quantity > 1 ? `${item.quantity}× ` : ''}{item.name}
                  {item.detail ? ` (${item.detail})` : ''}
                </span>
              </li>
            ))}
            {bundleItems.length > (compact ? 2 : 3) && (
              <li className="pl-[18px] font-semibold text-accent">+{bundleItems.length - (compact ? 2 : 3)} more included</li>
            )}
          </ul>
        )}

        <div className={`mt-auto flex flex-col ${compact ? 'gap-2 pt-2' : 'gap-3 pt-3'}`}>
          <div className="flex items-end justify-between gap-2">
            <div className="min-w-0">
              <div className={`font-extrabold text-[#E11D2E] ${compact ? 'text-sm' : 'text-base'}`} itemProp="price" content={product.price}>PKR {Number(product.price || 0).toLocaleString()}</div>
              {product.compare_price ? <div className={`text-theme-muted line-through ${compact ? 'text-[11px]' : 'text-sm'}`}>PKR {Number(product.compare_price || 0).toLocaleString()}</div> : null}
            </div>
            {!compact && (
              <span className="shrink-0 rounded-full border border-accent bg-accent-light px-3 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-theme">{product.stock_status}</span>
            )}
          </div>

          <div className={`flex items-stretch gap-2 ${compact ? '' : ''}`}>
            <Link
              to={`/products/${product.slug}`}
              className={`flex flex-1 items-center justify-center rounded-xl border border-theme bg-theme-panel text-center font-bold text-theme transition hover:border-accent hover:bg-accent-light ${compact ? 'px-2 py-2 text-[10px]' : 'px-3 py-2.5 text-xs'}`}
            >
              View details
            </Link>
            {product.stock_status !== 'Out of Stock' ? (
              <button
                type="button"
                className={`inline-flex shrink-0 items-center justify-center gap-1.5 rounded-xl btn-primary font-extrabold text-on-accent transition hover:scale-[1.01] ${compact ? 'px-2.5 py-2 text-[10px]' : 'px-3 py-2.5 text-xs'}`}
                onClick={() => addToCart(product)}
                aria-label={`Add ${product.name} to cart`}
              >
                <ShoppingBag size={compact ? 14 : 16} /> Add
              </button>
            ) : (
              <div className={`inline-flex shrink-0 items-center rounded-xl border border-theme bg-[var(--surface-2)] text-theme-muted ${compact ? 'px-2 py-2 text-[10px]' : 'px-3 py-2.5 text-xs'}`}>Unavailable</div>
            )}
          </div>
        </div>
      </div>
    </motion.article>
  );
}
