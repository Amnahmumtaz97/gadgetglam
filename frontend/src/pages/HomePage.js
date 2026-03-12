import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import SEOHead from '../components/common/SEOHead';
import ProductCard from '../components/product/ProductCard';
import './HomePage.css';

const CATEGORIES = [
  { name: 'Cases',         icon: 'fi fi-rr-mobile',       slug: 'cases',         count: '120+' },
  { name: 'Chargers',      icon: 'fi fi-rr-bolt',         slug: 'chargers',      count: '80+'  },
  { name: 'Earphones',     icon: 'fi fi-rr-headphones',   slug: 'earphones',     count: '60+'  },
  { name: 'Cables',        icon: 'fi fi-rr-plug',         slug: 'cables',        count: '40+'  },
  { name: 'Screen Guards', icon: 'fi fi-rr-shield',       slug: 'screen-guards', count: '35+'  },
  { name: 'Bundles',       icon: 'fi fi-rr-gift',         slug: 'bundles',       count: '20+'  },
];

const TRUST_ITEMS = [
  { icon: 'fi fi-rr-truck-side',      text: 'Fast Delivery across Pakistan' },
  { icon: 'fi fi-rr-lock',            text: 'Secure Checkout' },
  { icon: 'fi fi-rr-undo',            text: 'Easy 7-Day Returns' },
  { icon: 'fi fi-rr-face-smile-beam', text: '10,000+ Happy Customers' },
  { icon: 'fi fi-rr-diamond',         text: 'Premium Quality Guaranteed' },
  { icon: 'fi fi-rr-box',             text: 'Safe Packaging Every Order' },
];

function ProductSlider({ products }) {
  const viewRef = useRef(null);
  const [idx, setIdx] = useState(0);
  const [paused, setPaused] = useState(false);
  const perPage = 4;
  const max = Math.max(0, products.length - perPage);

  const scrollTo = (i) => {
    const el = viewRef.current;
    if (!el) return;
    el.scrollTo({ left: i * (el.clientWidth / perPage), behavior: 'smooth' });
    setIdx(i);
  };
  const prev = () => scrollTo(Math.max(0, idx - 1));
  const next = () => scrollTo(idx >= max ? 0 : idx + 1);

  useEffect(() => {
    if (paused || products.length <= perPage) return;
    const t = setInterval(next, 4500);
    return () => clearInterval(t);
  }, [idx, paused]); // eslint-disable-line

  return (
    <div
      className="slider-wrap"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="slider-viewport" ref={viewRef}>
        {products.map(p => <ProductCard key={p._id} product={p} />)}
      </div>
      <div className="slider-controls">
        <button className="slider-btn" onClick={prev} disabled={idx === 0}>&#8249;</button>
        {Array.from({ length: max + 1 }).map((_, i) => (
          <button key={i} className={`dot${i === idx ? ' dot--active' : ''}`} onClick={() => scrollTo(i)} aria-label={`Slide ${i + 1}`} />
        ))}
        <button className="slider-btn" onClick={next}>&#8250;</button>
      </div>
    </div>
  );
}

export default function HomePage() {
  const [featured, setFeatured] = useState([]);
  const [newest, setNewest]     = useState([]);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    Promise.all([
      axios.get('/api/products?featured=true&limit=8'),
      axios.get('/api/products?sort=newest&limit=8')
    ]).then(([f, n]) => {
      setFeatured(f.data.products || []);
      setNewest(n.data.products || []);
    }).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (loading) return;
    const observer = new IntersectionObserver(
      entries => entries.forEach(e => {
        if (e.isIntersecting) { e.target.classList.add('visible'); observer.unobserve(e.target); }
      }),
      { threshold: 0.12 }
    );
    document.querySelectorAll('.reveal,.reveal-left,.reveal-right,.stagger-children')
      .forEach(el => observer.observe(el));
    return () => observer.disconnect();
  }, [loading]);

  return (
    <>
      <SEOHead
        title="GadgetGlam — Premium Phone Accessories in Pakistan"
        description="Shop top-rated phone cases, fast chargers, earphones, cables & screen guards at GadgetGlam. Best accessories for iPhone, Samsung, Xiaomi & more. Free delivery above PKR 2,000."
        keywords="phone cases Pakistan, mobile charger, earphones Pakistan, phone accessories online, GadgetGlam, Samsung case, iPhone case"
        canonical="https://www.gadgetglam.pk"
      />

      {/* ── HERO ── */}
      <section className="hero" aria-label="Hero banner">
        <div className="hero-content container">
          <div className="hero-text">
            <div className="hero-badge"><i className="fi fi-rr-sparkles" style={{marginRight:6,verticalAlign:'middle'}}></i>New Arrivals Just Dropped</div>
            <h1>Glam Up Your<br /><em>Gadgets</em> Today</h1>
            <p>
              Pakistan's most curated phone accessories store. Premium cases, ultra-fast chargers,
              studio-quality earphones — all designed to match your vibe.
            </p>
            <div className="hero-cta">
              <Link to="/products" className="btn-primary">Shop Now →</Link>
              <Link to="/products?featured=true" className="btn-outline">View Hot Deals</Link>
            </div>
            <div className="hero-stats">
              <div className="stat"><strong>500+</strong><span>Products</span></div>
              <div className="stat"><strong>12K+</strong><span>Customers</span></div>
              <div className="stat"><strong>4.9★</strong><span>Avg Rating</span></div>
            </div>
          </div>
          <div className="hero-visual" aria-hidden="true">
            <div className="hero-phone">
              <div className="phone-item"><i className="fi fi-rr-mobile"></i> <span>Magsafe Case Pro · <b>PKR 5,999</b></span></div>
              <div className="phone-item"><i className="fi fi-rr-bolt"></i> <span>65W GaN Charger · <b>PKR 9,499</b></span></div>
              <div className="phone-item"><i className="fi fi-rr-headphones"></i> <span>ANC Earbuds X · <b>PKR 67,999</b></span></div>
            </div>
            <div className="hero-chip chip-top"><i className="fi fi-rr-check" style={{marginRight:4,verticalAlign:'middle'}}></i>In Stock</div>
            <div className="hero-chip chip-bot"><i className="fi fi-sr-heart" style={{marginRight:4,verticalAlign:'middle',color:'var(--purple)'}}></i>Top Rated</div>
          </div>
        </div>
      </section>

      {/* ── TRUST STRIP ── */}
      <section className="trust-strip" aria-label="Trust indicators">
        <div className="trust-marquee">
          {[...TRUST_ITEMS, ...TRUST_ITEMS].map((item, i) => (
            <div key={i} className="trust-item"><i className={item.icon}></i> <span>{item.text}</span></div>
          ))}
        </div>
      </section>

      {/* ── CATEGORIES ── */}
      <section className="section container" aria-labelledby="categories-heading">
        <div className="section-header">
          <h2 id="categories-heading">Shop by <span>Category</span></h2>
          <Link to="/products" className="see-all reveal">See All →</Link>
        </div>
        <div className="categories-grid stagger-children" role="list">
          {CATEGORIES.map(cat => (
            <Link
              key={cat.slug}
              to={`/category/${cat.slug}`}
              className="cat-card"
              role="listitem"
              aria-label={`Browse ${cat.name}`}
            >
              <div className="cat-icon" aria-hidden="true"><i className={cat.icon}></i></div>
              <div className="cat-name">{cat.name}</div>
              <div className="cat-count">{cat.count} items</div>
            </Link>
          ))}
        </div>
      </section>

      {/* ── FEATURED PRODUCTS ── */}
      <section className="section container" aria-labelledby="featured-heading">
        <div className="section-header">
          <h2 id="featured-heading"><i className="fi fi-sr-flame" style={{color:'var(--red)',marginRight:8,verticalAlign:'middle'}}></i>Featured <span>Products</span></h2>
          <Link to="/products?featured=true" className="see-all">View All →</Link>
        </div>
        {loading ? (
          <div className="spinner" role="status" aria-label="Loading products" />
        ) : featured.length > 0 ? (
          <ProductSlider products={featured} />
        ) : (
          <p className="empty-msg">No featured products yet. Check back soon!</p>
        )}
      </section>

      {/* ── PROMO BANNER ── */}
      <section className="promo-banner" aria-label="Promotional offer">
        <div className="container promo-inner">
          <div className="promo-text">
            <h2>Flash Sale — Up to 40% Off <i className="fi fi-sr-flame" style={{verticalAlign:'middle'}}></i></h2>
            <p>Limited time deals on premium cases and chargers. Don't miss out!</p>
            <Link to="/products?featured=true" className="btn-white">Shop the Sale →</Link>
          </div>
          <div className="promo-deco" aria-hidden="true">
            <div className="deco-num">40<span>%</span></div>
            <div className="deco-label">OFF</div>
          </div>
        </div>
      </section>

      {/* ── NEW ARRIVALS ── */}
      <section className="section container" aria-labelledby="new-heading">
        <div className="section-header">
          <h2 id="new-heading"><i className="fi fi-rr-sparkles" style={{color:'var(--purple)',marginRight:8,verticalAlign:'middle'}}></i>New <span>Arrivals</span></h2>
          <Link to="/products?sort=newest" className="see-all">View All →</Link>
        </div>
        {loading ? (
          <div className="spinner" />
        ) : newest.length > 0 ? (
          <ProductSlider products={newest} />
        ) : (
          <p className="empty-msg">New products coming soon!</p>
        )}
      </section>
    </>
  );
}
