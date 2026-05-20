import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Cable, ChevronLeft, ChevronRight, Gift, Headphones, Headset, Menu, PackageCheck, ShieldCheck, ShoppingBag, Smartphone, Star, Truck, Watch, Zap } from 'lucide-react';
import { SHOP_CATEGORIES } from '../lib/categories';
import axios from 'axios';
import SEOHead from '../components/common/SEOHead';
import ProductCard from '../components/product/ProductCard';
import DealsOfWeekPanel from '../components/product/DealsOfWeekPanel';
import OptimizedPicture from '../components/common/OptimizedPicture';
import CountdownTimer from '../components/product/CountdownTimer';
import { GradientButton, SectionHeading, SkeletonCard } from '../components/ui/primitives';
import { realProductImages, referenceMockups } from '../lib/mockups';
import './HomePage.css';

const HERO_HEADPHONES = '/assets/still-life-wireless-cyberpunk-headphones.jpg';

const HOME_PERKS = [
  { title: 'Fast Delivery', text: 'Nationwide shipping with protected packaging.', icon: Truck, stat: '2–4 days' },
  { title: 'Premium Quality', text: 'Top-rated accessories and trusted picks.', icon: PackageCheck, stat: '4.8★ avg' },
  { title: 'Secure Checkout', text: 'Smooth payments and safe order handling.', icon: ShieldCheck, stat: 'SSL safe' },
];

const CATEGORY_ITEM_COUNTS = {
  Cases: '200+ items',
  Chargers: '150+ items',
  Cables: '120+ items',
  Earphones: '180+ items',
  'Screen Guards': '100+ items',
  Bundles: '80+ items',
  'Smart Watches': '90+ items',
  Speakers: '70+ items',
  Headphones: '110+ items',
  'Power Banks': '95+ items',
};

const BRANDS = ['RingCase', 'PowerVolt', 'SoundPod', 'ShieldPro', 'GlamKit', 'CableFlex', 'MagSafe', 'Anker', 'Samsung'];

const FALLBACK_PRODUCTS = [
  { _id: 'preview-case', slug: 'preview-case', name: 'MagSafe Case Pro', category: 'Cases', brand: 'GadgetGlam', price: 5999, compare_price: 7999, stock_status: 'In Stock', is_featured: true, thumbnail: realProductImages.cases[0], images: realProductImages.cases },
  { _id: 'preview-charger', slug: 'preview-charger', name: '65W GaN Charger', category: 'Chargers', brand: 'GadgetGlam', price: 9499, compare_price: 11999, stock_status: 'In Stock', is_featured: true, thumbnail: realProductImages.chargers[0], images: realProductImages.chargers },
  { _id: 'preview-earbuds', slug: 'preview-earbuds', name: 'ANC Earbuds X', category: 'Earphones', brand: 'GadgetGlam', price: 6799, compare_price: 8999, stock_status: 'In Stock', is_featured: true, thumbnail: realProductImages.earphones[0], images: realProductImages.earphones },
  { _id: 'preview-cable', slug: 'preview-cable', name: 'Braided USB-C Cable', category: 'Cables', brand: 'GadgetGlam', price: 1499, compare_price: 2299, stock_status: 'In Stock', is_featured: false, thumbnail: realProductImages.cables[0], images: realProductImages.cables },
  { _id: 'preview-guard', slug: 'preview-guard', name: 'Privacy Screen Guard', category: 'Screen Guards', brand: 'GadgetGlam', price: 1299, compare_price: 1999, stock_status: 'In Stock', is_featured: false, thumbnail: realProductImages['screen guards'][0], images: realProductImages['screen guards'] },
  { _id: 'preview-bundle', slug: 'preview-bundle', name: 'Power Bundle Kit', category: 'Bundles', brand: 'GadgetGlam', price: 12499, compare_price: 15999, stock_status: 'In Stock', is_featured: true, thumbnail: realProductImages.bundles[0], images: realProductImages.bundles },
  { _id: 'preview-clear-case', slug: 'preview-clear-case', name: 'Crystal Clear Case', category: 'Cases', brand: 'GadgetGlam', price: 2499, compare_price: 3499, stock_status: 'In Stock', is_featured: false, thumbnail: realProductImages.cases[1], images: realProductImages.cases },
  { _id: 'preview-slim-case', slug: 'preview-slim-case', name: 'Slim Matte Case', category: 'Cases', brand: 'GadgetGlam', price: 3199, compare_price: 4499, stock_status: 'In Stock', is_featured: true, thumbnail: realProductImages.cases[2], images: realProductImages.cases },
  { _id: 'preview-wireless-charger', slug: 'preview-wireless-charger', name: 'MagSafe Wireless Charger', category: 'Chargers', brand: 'PowerVolt', price: 5499, compare_price: 6999, stock_status: 'In Stock', is_featured: true, thumbnail: realProductImages.chargers[1], images: realProductImages.chargers },
  { _id: 'preview-car-charger', slug: 'preview-car-charger', name: 'Dual Port Car Charger', category: 'Chargers', brand: 'PowerVolt', price: 2799, compare_price: 3999, stock_status: 'In Stock', is_featured: false, thumbnail: realProductImages.chargers[2], images: realProductImages.chargers },
  { _id: 'preview-lightning-cable', slug: 'preview-lightning-cable', name: 'Fast Lightning Cable', category: 'Cables', brand: 'CableFlex', price: 1699, compare_price: 2499, stock_status: 'In Stock', is_featured: false, thumbnail: realProductImages.cables[1], images: realProductImages.cables },
  { _id: 'preview-earbuds-pro', slug: 'preview-earbuds-pro', name: 'Noise Canceling Earbuds Pro', category: 'Earphones', brand: 'SoundPod', price: 9999, compare_price: 12999, stock_status: 'In Stock', is_featured: true, thumbnail: realProductImages.earphones[1], images: realProductImages.earphones },
  { _id: 'preview-wired-earphones', slug: 'preview-wired-earphones', name: 'Type-C Wired Earphones', category: 'Earphones', brand: 'SoundPod', price: 2199, compare_price: 2999, stock_status: 'In Stock', is_featured: false, thumbnail: realProductImages.earphones[2], images: realProductImages.earphones },
  { _id: 'preview-tempered-glass', slug: 'preview-tempered-glass', name: 'Tempered Glass Protector', category: 'Screen Guards', brand: 'ShieldPro', price: 999, compare_price: 1499, stock_status: 'In Stock', is_featured: false, thumbnail: realProductImages['screen guards'][1], images: realProductImages['screen guards'] },
  { _id: 'preview-travel-bundle', slug: 'preview-travel-bundle', name: 'Travel Charging Bundle', category: 'Bundles', brand: 'GlamKit', price: 10499, compare_price: 13999, stock_status: 'In Stock', is_featured: true, thumbnail: realProductImages.bundles[1], images: realProductImages.bundles },
  { _id: 'preview-audio-bundle', slug: 'preview-audio-bundle', name: 'Audio Essentials Bundle', category: 'Bundles', brand: 'GlamKit', price: 8999, compare_price: 11999, stock_status: 'In Stock', is_featured: true, thumbnail: realProductImages.bundles[2], images: realProductImages.bundles },
];

function inStockOnly(list) {
  return (list || []).filter((p) => p.stock_status !== 'Out of Stock');
}

function pickInStockProducts(apiList, fallback, min = 8) {
  const stocked = inStockOnly(apiList);
  if (stocked.length >= min) return stocked;
  return inStockOnly(fallback);
}

function ProductGrid({ products, compact = false }) {
  const gridClass = compact
    ? 'grid gap-3 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4'
    : 'grid gap-4 sm:grid-cols-2 lg:grid-cols-3';
  return (
    <div className={gridClass}>
      {products.map((product) => (
        <ProductCard key={product._id} product={product} compact={compact} />
      ))}
    </div>
  );
}

function Rating() {
  return <div className="mt-2 flex items-center gap-0.5 text-accent">{Array.from({ length: 5 }).map((_, i) => <Star key={i} size={12} fill="currentColor" />)}<span className="ml-1 text-[11px] text-theme-muted">120k Reviews</span></div>;
}

export default function HomePage() {
  const [featured, setFeatured] = useState([]);
  const [newest, setNewest] = useState([]);
  const [flashDeal, setFlashDeal] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      axios.get('/api/products?featured=true&limit=12&inStock=true'),
      axios.get('/api/products?sort=newest&limit=12&inStock=true'),
      axios.get('/api/products/deals/week'),
    ])
      .then(([f, n, d]) => {
        setFeatured(pickInStockProducts(f.data.products, FALLBACK_PRODUCTS).slice(0, 8));
        setNewest(pickInStockProducts(n.data.products, FALLBACK_PRODUCTS.slice().reverse()).slice(0, 8));
        setFlashDeal((d.data.deals || [])[0] || null);
      })
      .catch(() => {
        setFeatured(inStockOnly(FALLBACK_PRODUCTS).slice(0, 8));
        setNewest(inStockOnly(FALLBACK_PRODUCTS.slice().reverse()).slice(0, 8));
        setFlashDeal(null);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <SEOHead title="GadgetGlam - Premium Gadget Store" description="Shop phone cases, smart watches, earbuds, chargers, speakers, and gadget accessories." keywords="gadget ecommerce, phone accessories, smart watches, earbuds, chargers" />

      <section className="container py-8">
        <div className="grid gap-5 lg:grid-cols-[260px_1fr]">
          <aside className="overflow-hidden rounded-2xl border border-theme bg-theme-panel shadow-[0_12px_28px_rgba(17,17,17,0.07)]">
            <div className="flex items-center gap-3 bg-accent px-5 py-4 text-sm font-black text-on-accent"><Menu size={18} /> Shop By Categories</div>
            <div className="divide-y divide-black/5 p-3">
              {SHOP_CATEGORIES.map((cat) => {
                const Icon = cat.icon;
                return (
                  <Link key={cat.name} to={`/category/${cat.slug}`} className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm text-theme-secondary transition hover:bg-accent-light hover:text-theme">
                    <Icon size={16} />
                    <span>{cat.name}</span>
                  </Link>
                );
              })}
            </div>
          </aside>

          <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} className="promo-hero relative min-h-[420px] overflow-hidden rounded-2xl p-7 md:p-10">
            <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:36px_36px] [mask-image:linear-gradient(to_bottom,rgba(0,0,0,0.5),transparent)]" aria-hidden />
            <OptimizedPicture
              src={HERO_HEADPHONES}
              alt="Wireless cyberpunk headphones still life"
              pictureClassName="absolute bottom-0 right-0 top-0 hidden h-full w-[52%] p-6 md:block"
              className="h-full w-full rounded-2xl object-cover object-center opacity-95"
              loading="eager"
              fetchPriority="high"
            />
            <div className="relative z-10 max-w-xl">
              <p className="mb-5 flex items-center gap-2 text-xs font-bold text-accent"><span className="h-6 w-1.5 rounded-full bg-accent" /> New Arrivals Just Dropped</p>
              <h1 className="promo-hero-title text-4xl font-black leading-[1.04] tracking-tight md:text-6xl">Upgrade Your Style. <br />Power Your Life.</h1>
              <p className="promo-hero-sub mt-5 max-w-md text-sm font-medium leading-7 md:text-base">Premium phone cases, fast chargers, and accessories designed for performance and style.</p>
              <div className="mt-7"><GradientButton as={Link} to="/products" className="rounded-md px-7">Shop Now</GradientButton></div>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="container pb-8" aria-label="Offers and store benefits">
        <div className="home-perks">
          <motion.article
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ duration: 0.35 }}
            className="home-perks__offer"
          >
            <div className="home-perks__offer-glow" aria-hidden />
            <div className="home-perks__offer-grid">
              <div className="home-perks__offer-copy">
                <span className="home-perks__badge">Special Offer</span>
                <h2 className="home-perks__offer-title">Bundle &amp; Save</h2>
                <p className="home-perks__offer-text">Curated accessory bundles — premium gear at prices that beat buying separately.</p>
                <div className="home-perks__offer-actions">
                  <Link to="/products?category=Bundles" className="home-perks__cta">Shop Bundles</Link>
                  <span className="home-perks__save-chip">Up to 30% off</span>
                </div>
              </div>
              <div className="home-perks__offer-visual">
                <OptimizedPicture src={HERO_HEADPHONES} alt="Premium wireless headphones" className="h-full w-full object-cover object-center" loading="lazy" />
              </div>
            </div>
          </motion.article>

          <div className="home-perks__features">
            {HOME_PERKS.map((item, index) => {
              const Icon = item.icon;
              return (
                <motion.article
                  key={item.title}
                  initial={{ opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-40px' }}
                  transition={{ duration: 0.35, delay: 0.06 * (index + 1) }}
                  className="home-perks__feature"
                >
                  <div className="home-perks__feature-icon" aria-hidden>
                    <Icon size={22} strokeWidth={2} />
                  </div>
                  <div className="home-perks__feature-body">
                    <div className="home-perks__feature-head">
                      <h3>{item.title}</h3>
                      <span className="home-perks__feature-stat">{item.stat}</span>
                    </div>
                    <p>{item.text}</p>
                  </div>
                </motion.article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="container grid gap-6 py-8 lg:grid-cols-[1fr_320px]">
        <div>
          <SectionHeading title="Featured" accent="Categories" action={<Link to="/products" className="rounded-xl border border-theme bg-[var(--surface-2)] px-4 py-2 text-xs font-bold text-theme transition hover:border-accent hover:text-accent">Shop Now</Link>} />
          <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
            {SHOP_CATEGORIES.map((cat) => {
              const Icon = cat.icon;
              return (
                <Link key={cat.slug} to={`/category/${cat.slug}`} className="rounded-xl border border-theme bg-theme-panel p-4 text-center shadow-[var(--shadow)] transition hover:border-accent hover:bg-accent-light">
                  <Icon className="mx-auto text-accent" size={24} />
                  <div className="mt-3 text-xs font-black text-theme">{cat.name}</div>
                  <div className="mt-1 text-[11px] text-theme-muted">{CATEGORY_ITEM_COUNTS[cat.name] || '50+ items'}</div>
                </Link>
              );
            })}
          </div>
        </div>
        <div>
          <SectionHeading title="Shop by" accent="Brands" />
          <div className="grid grid-cols-3 gap-3 rounded-2xl border border-theme bg-theme-panel p-4 shadow-[0_10px_26px_rgba(17,17,17,0.05)]">
            {BRANDS.map((brand) => <div key={brand} className="rounded-xl border border-theme bg-[var(--surface-2)] px-2 py-4 text-center text-xs font-bold text-theme">{brand}</div>)}
            <Link to="/products" className="col-span-3 rounded-md bg-accent py-3 text-center text-xs font-black text-on-accent">See All Brands</Link>
          </div>
        </div>
      </section>

      <section className="container grid gap-6 py-8 xl:grid-cols-[340px_1fr]">
        <DealsOfWeekPanel />
        <div>
          <SectionHeading title="Featured" accent="Products" action={<Link to="/products?featured=true" className="rounded-xl border border-theme bg-[var(--surface-2)] px-4 py-2 text-xs font-bold text-theme transition hover:border-accent hover:text-accent">View All</Link>} />
          {loading ? <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">{Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}</div> : <ProductGrid products={featured} compact />}
        </div>
      </section>

      <section className="container py-8">
        <div className="promo-spotlight relative overflow-hidden rounded-2xl p-7">
          <img src={referenceMockups['smart watches']} alt="" className="absolute bottom-0 right-0 h-full w-1/2 object-contain opacity-80" />
          <p className="promo-spotlight-accent text-xs font-bold">Weekly Best Selling</p>
          <h2 className="mt-2 text-3xl font-black text-theme">Flash Sale</h2>
          {flashDeal?.deal_ends_at ? (
            <div className="relative z-10 mt-3">
              <CountdownTimer endsAt={flashDeal.deal_ends_at} />
            </div>
          ) : null}
          <Link to={flashDeal?.slug ? `/products/${flashDeal.slug}` : '/products?featured=true'} className="relative z-10 mt-5 inline-flex rounded-xl btn-gradient px-5 py-2 text-xs font-bold">Shop Now</Link>
        </div>
      </section>


      <section className="container py-8">
        <SectionHeading title="Top Categories" accent="Products" action={<Link to="/products" className="rounded-xl border border-theme bg-[var(--surface-2)] px-4 py-2 text-xs font-bold text-theme transition hover:border-accent hover:text-accent">View all products</Link>} />
        {loading ? <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">{Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}</div> : (
          <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
            {[...featured, ...newest]
              .filter((p, i, arr) => arr.findIndex((x) => x._id === p._id) === i)
              .slice(0, 8)
              .map((product) => <ProductCard key={`${product._id}-top`} product={product} compact />)}
          </div>
        )}
      </section>

      <section className="container py-8">
        <div className="promo-banner-strip relative overflow-hidden rounded-2xl border border-theme p-8 md:p-10">
          <div className="absolute inset-y-0 left-0 w-1/3 bg-accent/25" />
          <img src={referenceMockups.headphones} alt="Headphones banner" className="absolute bottom-0 left-10 top-0 z-10 hidden h-full object-contain md:block" />
          <div className="relative z-20 ml-auto max-w-xl">
            <p className="text-xs font-bold text-accent">Quality Products</p>
            <h2 className="mt-2 text-4xl font-black text-theme">Get More. <br />Save More.</h2>
            <Link to="/products" className="btn-gradient mt-5 inline-flex rounded-xl px-5 py-2 text-xs font-bold">Shop Now</Link>
          </div>
        </div>
      </section>

      <section className="home-featured-section container py-8">
        <div className="home-featured-section__grid">
          <div className="home-featured-section__products min-w-0">
            <SectionHeading title="Featured" accent="Products" />
            {loading ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}</div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {newest.slice(0, 6).map((product) => <ProductCard key={`${product._id}-new`} product={product} compact />)}
              </div>
            )}
          </div>
          <aside className="home-featured-section__aside flex flex-col gap-4">
            <article className="home-promo-card promo-spotlight">
              <div className="home-promo-card__visual">
                <img src={referenceMockups.chargers} alt="65W GaN Charger" className="mx-auto h-full max-h-44 w-full object-contain p-2" />
              </div>
              <div className="home-promo-card__body text-center">
                <p className="home-promo-card__label">Special Offer</p>
                <h3 className="home-promo-card__title">65W GaN Charger</h3>
                <Rating />
              </div>
            </article>
            <article className="home-promo-card promo-sale-card">
              <div className="home-promo-card__visual home-promo-card__visual--sm">
                <img src={referenceMockups.earphones} alt="ANC Earbuds X" className="h-full max-h-28 w-full object-contain p-2" />
              </div>
              <div className="home-promo-card__body">
                <p className="home-promo-card__label">Special Sale</p>
                <h3 className="home-promo-card__title text-xl">ANC Earbuds X</h3>
                <Link to="/products" className="btn-gradient mt-4 inline-flex rounded-xl px-4 py-2.5 text-xs font-bold text-on-accent">Shop Now</Link>
              </div>
            </article>
          </aside>
        </div>
      </section>
    </>
  );
}
