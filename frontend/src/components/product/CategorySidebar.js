import React from 'react';
import { Link, useParams } from 'react-router-dom';
import { Menu } from 'lucide-react';
import {
  REGULAR_SHOP_CATEGORIES,
  BUNDLES_SHOP_CATEGORY,
  isCategorySlugActive,
} from '../../lib/categories';

function CategoryLink({ cat, active, compact, highlight }) {
  const Icon = cat.icon;
  const base = compact
    ? 'flex shrink-0 items-center gap-2 rounded-full px-4 py-2.5 text-sm font-bold transition'
    : 'flex items-center gap-3 rounded-xl px-3 py-3 text-sm transition';

  const stateClass = active
    ? compact
      ? 'bg-accent text-on-accent shadow-[0_8px_20px_rgba(37,99,235,0.25)]'
      : 'bg-[var(--promo-card-bg)] font-bold text-[var(--promo-card-text)]'
    : highlight && !compact
      ? 'border border-accent/30 bg-accent-light font-bold text-accent hover:bg-accent hover:text-on-accent'
      : highlight && compact
        ? 'border border-accent bg-accent-light text-accent hover:bg-accent hover:text-on-accent'
        : compact
          ? 'border border-theme bg-theme-panel text-theme-secondary hover:border-accent hover:text-accent'
          : 'text-theme-secondary hover:bg-accent-light hover:text-theme';

  return (
    <Link to={`/category/${cat.slug}`} className={`${base} ${stateClass}`}>
      <Icon size={compact ? 15 : 16} />
      <span>{cat.name}</span>
      {!compact && active ? <span className="ml-auto text-xs opacity-80">→</span> : null}
    </Link>
  );
}

export default function CategorySidebar() {
  const { category: currentSlug } = useParams();
  const bundlesActive = BUNDLES_SHOP_CATEGORY
    && isCategorySlugActive(currentSlug, BUNDLES_SHOP_CATEGORY.slug);

  return (
    <>
      <div className="mb-4 flex gap-2 overflow-x-auto pb-1 scrollbar-thin md:hidden">
        {REGULAR_SHOP_CATEGORIES.map((cat) => (
          <CategoryLink
            key={cat.slug}
            cat={cat}
            active={isCategorySlugActive(currentSlug, cat.slug)}
            compact
          />
        ))}
        {BUNDLES_SHOP_CATEGORY ? (
          <CategoryLink
            cat={BUNDLES_SHOP_CATEGORY}
            active={bundlesActive}
            compact
            highlight
          />
        ) : null}
        <Link
          to="/products?featured=true"
          className="flex shrink-0 items-center gap-2 rounded-full border border-theme bg-theme-panel px-4 py-2.5 text-sm font-bold text-theme-secondary transition hover:border-accent hover:text-accent"
        >
          Hot Deals
        </Link>
      </div>

      <aside className="hidden h-fit overflow-hidden rounded-2xl border border-theme bg-theme-panel shadow-[var(--shadow)] md:block lg:sticky lg:top-28">
        <div className="flex items-center gap-3 bg-accent px-5 py-4 text-sm font-black text-on-accent">
          <Menu size={18} />
          Shop By Category
        </div>
        <nav className="divide-y divide-theme p-3" aria-label="Product categories">
          {REGULAR_SHOP_CATEGORIES.map((cat) => (
            <CategoryLink
              key={cat.slug}
              cat={cat}
              active={isCategorySlugActive(currentSlug, cat.slug)}
            />
          ))}
          {BUNDLES_SHOP_CATEGORY ? (
            <div className="border-t border-theme pt-2">
              <CategoryLink
                cat={BUNDLES_SHOP_CATEGORY}
                active={bundlesActive}
                highlight
              />
            </div>
          ) : null}
        </nav>
        <div className="border-t border-theme p-3">
          <Link
            to="/products"
            className="flex items-center justify-center rounded-xl px-3 py-2.5 text-sm font-bold text-theme-secondary transition hover:bg-accent-light hover:text-accent"
          >
            All Products
          </Link>
          <Link
            to="/products?featured=true"
            className="mt-2 flex items-center justify-center rounded-xl bg-accent px-3 py-2.5 text-sm font-bold text-on-accent transition hover:brightness-105"
          >
            Hot Deals
          </Link>
        </div>
      </aside>
    </>
  );
}
