import React from 'react';
import { Link } from 'react-router-dom';
import CountdownTimer from './CountdownTimer';
import { getProductDisplayImage } from '../../lib/mockups';

export default function DealWeekCard({ product, onExpire, compact }) {
  const total = Math.max(product.deal_stock_total || 1, 1);
  const remaining = Math.max(0, product.deal_stock_remaining ?? 0);
  const pct = Math.min(100, Math.round((remaining / total) * 100));
  const image = getProductDisplayImage(product);

  return (
    <article className={`text-center ${compact ? 'border-t border-theme px-5 py-6 first:border-t-0' : 'p-6'}`}>
      <Link to={`/products/${product.slug}`} className="block">
        <div className="mx-auto flex h-36 w-full max-w-[200px] items-center justify-center overflow-hidden rounded-2xl bg-accent-light">
          {image ? (
            <img src={image} alt={product.name} className="max-h-full max-w-full object-contain p-2" />
          ) : (
            <span className="text-4xl">📱</span>
          )}
        </div>
        <h3 className="mt-3 text-base font-black leading-snug text-theme">{product.name}</h3>
        <div className="mt-2 flex flex-wrap items-center justify-center gap-2">
          {product.compare_price > product.price && (
            <span className="text-sm text-theme-muted line-through">PKR {Number(product.compare_price).toLocaleString()}</span>
          )}
          <span className="text-lg font-black text-[#E11D2E]">PKR {Number(product.price).toLocaleString()}</span>
        </div>
      </Link>

      <div className="mx-auto mt-5 h-2 max-w-xs overflow-hidden rounded-full bg-[var(--surface-3)]">
        <div className="h-full bg-accent transition-all duration-500" style={{ width: `${pct}%` }} />
      </div>
      <p className="mt-3 text-sm text-theme-muted">Available : {remaining}</p>

      {product.deal_ends_at && <CountdownTimer endsAt={product.deal_ends_at} onExpire={onExpire} />}
    </article>
  );
}
