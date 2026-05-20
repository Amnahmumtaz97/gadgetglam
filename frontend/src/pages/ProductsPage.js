import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Filter, Search, SlidersHorizontal, X } from 'lucide-react';
import axios from 'axios';
import SEOHead from '../components/common/SEOHead';
import ProductCard from '../components/product/ProductCard';
import { GradientButton, OutlineButton, SelectMenu, SkeletonCard } from '../components/ui/primitives';
import { PRODUCT_SORT_OPTIONS } from '../lib/sortOptions';
import { PRODUCT_CATEGORIES } from '../lib/categories';
const PRICE_PRESETS = [
  { label: 'Under PKR 1,000', min: '', max: '999' },
  { label: 'PKR 1,000 - 3,000', min: '1000', max: '3000' },
  { label: 'PKR 3,000 - 7,000', min: '3000', max: '7000' },
  { label: 'Above PKR 7,000', min: '7000', max: '' },
];

export default function ProductsPage() {
  const [params, setParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [pagination, setPagination] = useState({});
  const [loading, setLoading] = useState(true);
  const [filtersOpen, setFiltersOpen] = useState(true);

  const search = params.get('search') || '';
  const category = params.get('category') || '';
  const sort = params.get('sort') || 'newest';
  const page = Number(params.get('page') || 1);
  const featured = params.get('featured') || '';
  const minPrice = params.get('minPrice') || '';
  const maxPrice = params.get('maxPrice') || '';
  const minRating = params.get('minRating') || '';
  const inStock = params.get('inStock') || '';

  const [priceMin, setPriceMin] = useState(minPrice);
  const [priceMax, setPriceMax] = useState(maxPrice);

  useEffect(() => {
    setPriceMin(params.get('minPrice') || '');
    setPriceMax(params.get('maxPrice') || '');
  }, [params]);

  useEffect(() => {
    setLoading(true);
    const q = new URLSearchParams({
      ...(search && { search }),
      ...(category && { category }),
      ...(featured && { featured }),
      ...(minPrice && { minPrice }),
      ...(maxPrice && { maxPrice }),
      sort,
      page,
      limit: 12,
    });

    axios.get(`/api/products?${q}`)
      .then((res) => {
        let prods = res.data.products || [];
        if (minRating) prods = prods.filter((p) => p.ratings_avg >= Number(minRating));
        if (inStock) prods = prods.filter((p) => p.stock_status === 'In Stock');
        setProducts(prods);
        setPagination(res.data.pagination || {});
      })
      .finally(() => setLoading(false));
  }, [search, category, sort, page, featured, minPrice, maxPrice, minRating, inStock]);

  const setParam = (key, val) => setParams((p) => {
    const n = new URLSearchParams(p);
    if (val) n.set(key, val);
    else n.delete(key);
    n.set('page', '1');
    return n;
  });

  const applyPrice = () => setParams((p) => {
    const n = new URLSearchParams(p);
    if (priceMin) n.set('minPrice', priceMin);
    else n.delete('minPrice');
    if (priceMax) n.set('maxPrice', priceMax);
    else n.delete('maxPrice');
    n.set('page', '1');
    return n;
  });

  const applyPreset = (preset) => {
    setPriceMin(preset.min);
    setPriceMax(preset.max);
    setParams((p) => {
      const n = new URLSearchParams(p);
      if (preset.min) n.set('minPrice', preset.min);
      else n.delete('minPrice');
      if (preset.max) n.set('maxPrice', preset.max);
      else n.delete('maxPrice');
      n.set('page', '1');
      return n;
    });
  };

  const clearAll = () => setParams({});
  const activeFilters = [
    ...(category ? [{ label: category, key: 'category' }] : []),
    ...(featured ? [{ label: 'Hot Deals', key: 'featured' }] : []),
    ...(minPrice ? [{ label: `Min PKR ${(+minPrice).toLocaleString()}`, key: 'minPrice' }] : []),
    ...(maxPrice ? [{ label: `Max PKR ${(+maxPrice).toLocaleString()}`, key: 'maxPrice' }] : []),
    ...(minRating ? [{ label: `${minRating} stars and above`, key: 'minRating' }] : []),
    ...(inStock ? [{ label: 'In Stock Only', key: 'inStock' }] : []),
  ];

  const title = search ? `"${search}"` : featured ? 'Hot Deals' : 'All Products';

  return (
    <>
      <SEOHead
        title={`${title} | GadgetGlam`}
        description={`Shop ${title.toLowerCase()} at GadgetGlam. Premium phone accessories delivered across Pakistan.`}
        keywords={`${search || 'phone accessories'}, buy online Pakistan, GadgetGlam`}
      />

      <div className="container page-shell">
        <div className="mb-8 overflow-hidden rounded-4xl border border-theme bg-theme-panel p-6 shadow-card md:p-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="mb-3 inline-flex items-center gap-2 rounded-full badge-accent px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em]">
                <Search size={13} /> Store console
              </p>
              <h1 className="text-4xl font-black tracking-tight text-theme md:text-5xl">{title}</h1>
              <p className="mt-3 text-sm text-theme-muted">{pagination.total || products.length} premium products matched your current filters.</p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <OutlineButton type="button" onClick={() => setFiltersOpen((open) => !open)} className="px-4 py-3">
                <SlidersHorizontal size={16} /> Filters {activeFilters.length ? `(${activeFilters.length})` : ''}
              </OutlineButton>
              <SelectMenu
                value={sort}
                onChange={(next) => setParams((p) => {
                  const n = new URLSearchParams(p);
                  n.set('sort', next);
                  n.set('page', '1');
                  return n;
                })}
                options={PRODUCT_SORT_OPTIONS}
                aria-label="Sort products"
                className="min-w-[200px]"
              />
            </div>
          </div>

          {activeFilters.length > 0 && (
            <div className="mt-6 flex flex-wrap items-center gap-2">
              {activeFilters.map((f) => (
                <button
                  key={f.key}
                  onClick={() => setParam(f.key, '')}
                  className="inline-flex items-center gap-2 rounded-full border border-accent bg-accent px-4 py-2 text-xs font-semibold text-accent transition hover:border-accent hover:bg-accent"
                >
                  {f.label} <X size={13} />
                </button>
              ))}
              <button onClick={clearAll} className="text-xs font-semibold text-theme-muted underline-offset-4 hover:text-theme hover:underline">Clear all</button>
            </div>
          )}
        </div>

        <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
          {filtersOpen && (
            <aside className="h-fit rounded-4xl border border-theme bg-theme-panel p-5 shadow-card lg:sticky lg:top-32">
              <div className="mb-5 flex items-center gap-2 text-sm font-bold text-theme">
                <Filter size={17} className="text-accent" /> Filter matrix
              </div>

              <FilterGroup title="Category">
                <FilterBtn active={!category} onClick={() => setParam('category', '')}>All Categories</FilterBtn>
                {PRODUCT_CATEGORIES.map((c) => <FilterBtn key={c} active={category === c} onClick={() => setParam('category', c)}>{c}</FilterBtn>)}
              </FilterGroup>

              <FilterGroup title="Price (PKR)">
                <div className="mb-3 grid grid-cols-2 gap-2">
                  <NumberInput value={priceMin} onChange={setPriceMin} onEnter={applyPrice} placeholder="Min" />
                  <NumberInput value={priceMax} onChange={setPriceMax} onEnter={applyPrice} placeholder="Max" />
                </div>
                <div className="space-y-2">
                  {PRICE_PRESETS.map((preset) => (
                    <FilterBtn key={preset.label} active={minPrice === preset.min && maxPrice === preset.max} onClick={() => applyPreset(preset)}>
                      {preset.label}
                    </FilterBtn>
                  ))}
                </div>
                <GradientButton type="button" onClick={applyPrice} className="mt-3 w-full py-2.5">Apply Price</GradientButton>
              </FilterGroup>

              <FilterGroup title="Rating">
                {[['', 'Any rating'], ['4', '4 stars and above'], ['3', '3 stars and above'], ['2', '2 stars and above']].map(([val, label]) => (
                  <FilterBtn key={label} active={minRating === val} onClick={() => setParam('minRating', val)}>{label}</FilterBtn>
                ))}
              </FilterGroup>

              <label className="flex cursor-pointer items-center gap-3 rounded-2xl border border-theme bg-theme-panel px-4 py-3 text-sm font-semibold text-theme-muted">
                <input type="checkbox" checked={!!inStock} onChange={(e) => setParam('inStock', e.target.checked ? '1' : '')} className="h-4 w-4" style={{accentColor: 'var(--accent-yellow)'}} />
                In Stock Only
              </label>
            </aside>
          )}

          <div>
            {loading ? (
              <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
              </div>
            ) : products.length > 0 ? (
              <>
                <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                  {products.map((p) => <ProductCard key={p._id} product={p} />)}
                </div>
                {pagination.pages > 1 && (
                  <div className="mt-10 flex flex-wrap items-center justify-center gap-2">
                    {page > 1 && <PageBtn onClick={() => setParam('page', String(page - 1))}>Prev</PageBtn>}
                    {Array.from({ length: pagination.pages }, (_, i) => i + 1).map((n) => (
                      <PageBtn key={n} active={n === page} onClick={() => setParams((p) => { const np = new URLSearchParams(p); np.set('page', String(n)); return np; })}>{n}</PageBtn>
                    ))}
                    {page < pagination.pages && <PageBtn onClick={() => setParam('page', String(page + 1))}>Next</PageBtn>}
                  </div>
                )}
              </>
            ) : (
              <div className="rounded-4xl border border-dashed border-theme bg-theme-panel px-6 py-20 text-center backdrop-blur-xl">
                <Search className="mx-auto mb-4 text-accent" size={42} />
                <h2 className="text-2xl font-black text-theme">No products found</h2>
                <p className="mt-2 text-sm text-theme-muted">Try adjusting your filters or searching a broader gadget term.</p>
                {activeFilters.length > 0 && <GradientButton type="button" onClick={clearAll} className="mt-6">Clear Filters</GradientButton>}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}



function FilterGroup({ title, children }) {
  return (
    <div className="mb-6 border-b border-theme pb-6 last:border-b-0">
      <div className="mb-3 text-xs font-black uppercase tracking-[0.22em] text-theme-muted">{title}</div>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function FilterBtn({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={`w-full rounded-2xl px-4 py-2.5 text-left text-sm font-semibold transition ${active ? 'border border-accent bg-accent text-on-accent shadow-[0_0_24px_rgba(37,99,235,0.14)]' : 'border border-transparent text-theme-muted hover:border-theme hover:bg-theme-panel hover:text-theme'}`}
    >
      {children}
    </button>
  );
}

function NumberInput({ value, onChange, onEnter, placeholder }) {
  return (
    <input
      type="number"
      min="0"
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onKeyDown={(e) => e.key === 'Enter' && onEnter()}
      className="w-full rounded-2xl border border-theme bg-theme-panel px-3 py-2.5 text-sm text-theme outline-none placeholder:text-theme-muted focus:border-accent"
    />
  );
}

function PageBtn({ active = false, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-2xl border px-4 py-2 text-sm font-bold transition ${active ? 'border-accent bg-accent text-on-accent' : 'border-theme bg-theme-panel text-theme-muted hover:bg-accent-light'}`}
    >
      {children}
    </button>
  );
}
