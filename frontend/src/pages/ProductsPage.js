// ── ProductsPage.js ───────────────────────────────────────
import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import axios from 'axios';
import SEOHead from '../components/common/SEOHead';
import ProductCard from '../components/product/ProductCard';

const CATEGORIES = ['Cases', 'Chargers', 'Cables', 'Earphones', 'Screen Guards', 'Bundles'];
const PRICE_PRESETS = [
  { label: 'Under PKR 1,000',    min: '',     max: '999'  },
  { label: 'PKR 1,000 – 3,000', min: '1000', max: '3000' },
  { label: 'PKR 3,000 – 7,000', min: '3000', max: '7000' },
  { label: 'Above PKR 7,000',   min: '7000', max: ''     },
];

export default function ProductsPage() {
  const [params, setParams] = useSearchParams();
  const [products, setProducts]     = useState([]);
  const [pagination, setPagination] = useState({});
  const [loading, setLoading]       = useState(true);
  const [filtersOpen, setFiltersOpen] = useState(true);

  const search    = params.get('search')    || '';
  const category  = params.get('category')  || '';
  const sort      = params.get('sort')      || 'newest';
  const page      = Number(params.get('page') || 1);
  const featured  = params.get('featured')  || '';
  const minPrice  = params.get('minPrice')  || '';
  const maxPrice  = params.get('maxPrice')  || '';
  const minRating = params.get('minRating') || '';
  const inStock   = params.get('inStock')   || '';

  // local price range (committed on Apply or Enter)
  const [priceMin, setPriceMin] = useState(minPrice);
  const [priceMax, setPriceMax] = useState(maxPrice);
  useEffect(() => {
    setPriceMin(params.get('minPrice') || '');
    setPriceMax(params.get('maxPrice') || '');
  }, [params]);

  useEffect(() => {
    setLoading(true);
    const q = new URLSearchParams({
      ...(search   && { search }),
      ...(category && { category }),
      ...(featured && { featured }),
      ...(minPrice && { minPrice }),
      ...(maxPrice && { maxPrice }),
      sort, page, limit: 12,
    });
    axios.get(`/api/products?${q}`)
      .then(res => {
        let prods = res.data.products || [];
        if (minRating) prods = prods.filter(p => p.ratings_avg >= Number(minRating));
        if (inStock)   prods = prods.filter(p => p.stock_status === 'In Stock');
        setProducts(prods);
        setPagination(res.data.pagination || {});
      })
      .finally(() => setLoading(false));
  }, [search, category, sort, page, featured, minPrice, maxPrice, minRating, inStock]);

  const setParam = (key, val) => setParams(p => {
    const n = new URLSearchParams(p);
    if (val) n.set(key, val); else n.delete(key);
    n.set('page', '1');
    return n;
  });

  const applyPrice = () => setParams(p => {
    const n = new URLSearchParams(p);
    if (priceMin) n.set('minPrice', priceMin); else n.delete('minPrice');
    if (priceMax) n.set('maxPrice', priceMax); else n.delete('maxPrice');
    n.set('page', '1');
    return n;
  });

  const applyPreset = (preset) => {
    setPriceMin(preset.min);
    setPriceMax(preset.max);
    setParams(p => {
      const n = new URLSearchParams(p);
      if (preset.min) n.set('minPrice', preset.min); else n.delete('minPrice');
      if (preset.max) n.set('maxPrice', preset.max); else n.delete('maxPrice');
      n.set('page', '1');
      return n;
    });
  };

  const clearAll = () => setParams({});

  const activeFilters = [
    ...(category  ? [{ label: category,                                   key: 'category'  }] : []),
    ...(featured  ? [{ label: '🔥 Hot Deals',                            key: 'featured'  }] : []),
    ...(minPrice  ? [{ label: `Min PKR ${(+minPrice).toLocaleString()}`, key: 'minPrice'  }] : []),
    ...(maxPrice  ? [{ label: `Max PKR ${(+maxPrice).toLocaleString()}`, key: 'maxPrice'  }] : []),
    ...(minRating ? [{ label: `${minRating}★ & above`,                   key: 'minRating' }] : []),
    ...(inStock   ? [{ label: 'In Stock Only',                           key: 'inStock'   }] : []),
  ];

  const title = search ? `"${search}"` : featured ? 'Hot Deals' : 'All Products';

  return (
    <>
      <SEOHead
        title={`${title} | GadgetGlam`}
        description={`Shop ${title.toLowerCase()} at GadgetGlam. Premium phone accessories delivered across Pakistan.`}
        keywords={`${search || 'phone accessories'}, buy online Pakistan, GadgetGlam`}
      />
      <div className="container" style={{ padding: '40px 0 80px' }}>

        {/* ── Page header ── */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom: activeFilters.length ? '12px' : '24px', flexWrap:'wrap', gap:'12px' }}>
          <h1 style={{ fontFamily:'var(--font-display)', fontSize:'28px' }}>
            {title}
            <span style={{ fontSize:'14px', color:'var(--gray-500)', fontFamily:'var(--font-body)', fontWeight:'400', marginLeft:'10px' }}>
              {pagination.total || products.length} results
            </span>
          </h1>
          <div style={{ display:'flex', gap:'10px', alignItems:'center' }}>
            <button
              onClick={() => setFiltersOpen(o => !o)}
              style={{ display:'flex', alignItems:'center', gap:'7px', background: filtersOpen ? 'var(--purple)' : '#fff', color: filtersOpen ? '#fff' : 'var(--gray-700)', border:'1.5px solid var(--gray-200)', borderRadius:'10px', padding:'8px 16px', fontWeight:'600', fontSize:'13px', transition:'all .2s', cursor:'pointer' }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="4" y1="6" x2="20" y2="6"/><line x1="8" y1="12" x2="16" y2="12"/><line x1="11" y1="18" x2="13" y2="18"/>
              </svg>
              Filters
              {activeFilters.length > 0 && (
                <span style={{ background: filtersOpen ? 'rgba(255,255,255,.3)' : 'var(--purple)', color:'#fff', borderRadius:'20px', padding:'1px 7px', fontSize:'11px' }}>
                  {activeFilters.length}
                </span>
              )}
            </button>
            <select
              value={sort}
              onChange={e => setParams(p => { const n = new URLSearchParams(p); n.set('sort', e.target.value); n.set('page','1'); return n; })}
              style={{ border:'1.5px solid var(--gray-200)', borderRadius:'10px', padding:'8px 14px', fontFamily:'var(--font-body)', fontSize:'13px', background:'#fff', cursor:'pointer' }}
            >
              <option value="newest">Newest First</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
              <option value="rating">Top Rated</option>
              <option value="popular">Most Popular</option>
            </select>
          </div>
        </div>

        {/* ── Active filter chips ── */}
        {activeFilters.length > 0 && (
          <div style={{ display:'flex', gap:'8px', flexWrap:'wrap', marginBottom:'24px', alignItems:'center' }}>
            {activeFilters.map(f => (
              <button
                key={f.key}
                onClick={() => setParam(f.key, '')}
                style={{ display:'inline-flex', alignItems:'center', gap:'5px', background:'var(--purple-faint)', color:'var(--purple)', border:'none', borderRadius:'20px', padding:'5px 14px', fontSize:'12px', fontWeight:'600', cursor:'pointer' }}
              >
                {f.label} <span style={{ fontSize:'15px', lineHeight:'1' }}>×</span>
              </button>
            ))}
            <button
              onClick={clearAll}
              style={{ background:'none', border:'none', color:'var(--gray-500)', fontSize:'12px', fontWeight:'600', cursor:'pointer', textDecoration:'underline' }}
            >
              Clear all
            </button>
          </div>
        )}

        <div style={{ display:'flex', gap:'28px', alignItems:'flex-start', flexWrap:'wrap' }}>

          {/* ── Filter Sidebar ── */}
          {filtersOpen && (
            <aside style={{ width:'230px', flexShrink:0, background:'#fff', borderRadius:'16px', border:'1.5px solid var(--gray-200)', padding:'20px', position:'sticky', top:'100px' }}>

              {/* Category */}
              <div style={{ marginBottom:'22px' }}>
                <div style={sectionLabel}>Category</div>
                <div style={{ display:'flex', flexDirection:'column', gap:'4px' }}>
                  <FilterBtn active={!category} onClick={() => setParam('category', '')}>All Categories</FilterBtn>
                  {CATEGORIES.map(c => (
                    <FilterBtn key={c} active={category === c} onClick={() => setParam('category', c)}>{c}</FilterBtn>
                  ))}
                </div>
              </div>

              <Divider />

              {/* Price */}
              <div style={{ marginBottom:'22px' }}>
                <div style={sectionLabel}>Price (PKR)</div>
                <div style={{ display:'flex', gap:'8px', marginBottom:'10px' }}>
                  <input
                    type="number" min="0" placeholder="Min"
                    value={priceMin} onChange={e => setPriceMin(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && applyPrice()}
                    style={numInput}
                  />
                  <input
                    type="number" min="0" placeholder="Max"
                    value={priceMax} onChange={e => setPriceMax(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && applyPrice()}
                    style={numInput}
                  />
                </div>
                <div style={{ display:'flex', flexDirection:'column', gap:'4px', marginBottom:'10px' }}>
                  {PRICE_PRESETS.map(preset => {
                    const active = minPrice === preset.min && maxPrice === preset.max;
                    return (
                      <button
                        key={preset.label}
                        onClick={() => applyPreset(preset)}
                        style={{ textAlign:'left', background: active ? 'var(--purple-faint)' : 'none', color: active ? 'var(--purple)' : 'var(--gray-600)', border:'none', borderRadius:'8px', padding:'5px 8px', fontSize:'12px', fontWeight: active ? '700' : '400', cursor:'pointer' }}
                      >
                        {preset.label}
                      </button>
                    );
                  })}
                </div>
                <button
                  onClick={applyPrice}
                  style={{ width:'100%', background:'var(--purple)', color:'#fff', border:'none', borderRadius:'8px', padding:'7px', fontSize:'12px', fontWeight:'700', cursor:'pointer' }}
                >
                  Apply Price
                </button>
              </div>

              <Divider />

              {/* Rating */}
              <div style={{ marginBottom:'22px' }}>
                <div style={sectionLabel}>Min Rating</div>
                <div style={{ display:'flex', flexDirection:'column', gap:'4px' }}>
                  {[['', 'Any rating'], ['4', '4★ & above'], ['3', '3★ & above'], ['2', '2★ & above']].map(([val, label]) => (
                    <FilterBtn key={label} active={minRating === val} onClick={() => setParam('minRating', val)}>
                      {val ? <span style={{ color:'var(--gold)', marginRight:'4px' }}>{'★'.repeat(Number(val))}</span> : null}{label}
                    </FilterBtn>
                  ))}
                </div>
              </div>

              <Divider />

              {/* Availability */}
              <div>
                <div style={sectionLabel}>Availability</div>
                <label style={{ display:'flex', alignItems:'center', gap:'10px', cursor:'pointer', fontSize:'13px', color:'var(--gray-700)', padding:'4px 0' }}>
                  <input
                    type="checkbox"
                    checked={!!inStock}
                    onChange={e => setParam('inStock', e.target.checked ? '1' : '')}
                    style={{ width:'16px', height:'16px', accentColor:'var(--purple)', cursor:'pointer' }}
                  />
                  In Stock Only
                </label>
              </div>

            </aside>
          )}

          {/* ── Products Grid ── */}
          <div style={{ flex:1, minWidth:0 }}>
            {loading ? <div className="spinner" /> : products.length > 0 ? (
              <>
                <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(220px,1fr))', gap:'24px' }}>
                  {products.map(p => <ProductCard key={p._id} product={p} />)}
                </div>
                {pagination.pages > 1 && (
                  <div style={{ display:'flex', justifyContent:'center', gap:'8px', marginTop:'40px', flexWrap:'wrap', alignItems:'center' }}>
                    {page > 1 && (
                      <button
                        onClick={() => setParam('page', String(page - 1))}
                        style={pageBtn(false)}
                      >← Prev</button>
                    )}
                    {Array.from({ length: pagination.pages }, (_, i) => i + 1).map(n => (
                      <button key={n}
                        onClick={() => setParams(p => { const np = new URLSearchParams(p); np.set('page', String(n)); return np; })}
                        style={pageBtn(n === page)}
                      >{n}</button>
                    ))}
                    {page < pagination.pages && (
                      <button
                        onClick={() => setParam('page', String(page + 1))}
                        style={pageBtn(false)}
                      >Next →</button>
                    )}
                  </div>
                )}
              </>
            ) : (
              <div style={{ textAlign:'center', padding:'80px 0', color:'var(--gray-500)' }}>
                <div style={{ fontSize:'48px', marginBottom:'16px' }}>🔍</div>
                <h2 style={{ marginBottom:'8px' }}>No products found</h2>
                <p style={{ marginBottom:'20px' }}>Try adjusting your filters or search term</p>
                {activeFilters.length > 0 && (
                  <button onClick={clearAll} style={{ background:'var(--purple)', color:'#fff', border:'none', borderRadius:'10px', padding:'10px 24px', fontWeight:'600', cursor:'pointer' }}>
                    Clear Filters
                  </button>
                )}
              </div>
            )}
          </div>

        </div>
      </div>
    </>
  );
}

function FilterBtn({ active, onClick, children }) {
  return (
    <button onClick={onClick} style={{ textAlign:'left', display:'flex', alignItems:'center', background: active ? 'var(--purple-faint)' : 'none', color: active ? 'var(--purple)' : 'var(--gray-700)', border:'none', borderRadius:'8px', padding:'6px 10px', fontSize:'13px', fontWeight: active ? '700' : '400', cursor:'pointer', width:'100%' }}>
      {children}
    </button>
  );
}

function Divider() {
  return <div style={{ height:'1px', background:'var(--gray-200)', margin:'0 0 22px' }} />;
}

const sectionLabel = { fontSize:'11px', fontWeight:'800', color:'var(--gray-600)', textTransform:'uppercase', letterSpacing:'.6px', marginBottom:'10px' };
const numInput     = { width:'100%', border:'1.5px solid var(--gray-200)', borderRadius:'8px', padding:'6px 10px', fontSize:'13px', outline:'none', fontFamily:'inherit' };
const pageBtn = (active) => ({ padding:'8px 16px', borderRadius:'10px', border:'1.5px solid var(--gray-200)', background: active ? 'var(--purple)' : '#fff', color: active ? '#fff' : 'var(--gray-700)', fontWeight:'600', cursor:'pointer' });
