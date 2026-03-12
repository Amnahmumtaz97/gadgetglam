// ── CartPage.js ───────────────────────────────────────────
import React, { useState, useEffect } from 'react';
import { Link, useParams, Navigate } from 'react-router-dom';
import axios from 'axios';
import SEOHead from '../components/common/SEOHead';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import ProductCard from '../components/product/ProductCard';
import toast from 'react-hot-toast';

export function CartPage() {
  const { cart, removeFromCart, updateQty, totalPrice, clearCart } = useCart();
  const [coupon, setCoupon]           = useState('');
  const [couponApplied, setCouponApplied] = useState(false);
  const [couponDiscount, setCouponDiscount] = useState(0);

  const applyCoupon = () => {
    if (couponApplied) return;
    if (coupon.trim().toUpperCase() === 'GLAM10') {
      const disc = Math.round(totalPrice * 0.10);
      setCouponDiscount(disc);
      setCouponApplied(true);
      toast.success('Coupon applied! 10% off 🎉');
    } else {
      toast.error('Invalid coupon code');
    }
  };

  const finalTotal = couponApplied ? totalPrice - couponDiscount : totalPrice;

  return (
    <>
      <SEOHead title="Your Cart | GadgetGlam" description="Review your cart and checkout." />
      <div className="container" style={{padding:'40px 0 80px'}}>
        <h1 style={{fontFamily:'var(--font-display)',fontSize:'32px',marginBottom:'32px'}}>Your Cart 🛒</h1>
        {cart.length === 0 ? (
          <div style={{textAlign:'center',padding:'80px 0',color:'var(--gray-500)'}}>
            <div style={{fontSize:'64px',marginBottom:'16px'}}>🛒</div>
            <h2>Your cart is empty</h2>
            <Link to="/products" className="btn-primary" style={{display:'inline-block',marginTop:'20px'}}>Shop Now</Link>
          </div>
        ) : (
          <div style={{display:'grid',gridTemplateColumns:'2fr 1fr',gap:'32px',alignItems:'start'}}>
            <div>
              {cart.map(item => (
                <div key={item._id} style={{background:'#fff',borderRadius:'16px',padding:'20px',marginBottom:'16px',border:'1.5px solid var(--gray-200)',display:'flex',gap:'16px',alignItems:'center'}}>
                  <div style={{width:'80px',height:'80px',background:'var(--purple-faint)',borderRadius:'12px',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'36px',flexShrink:'0'}}>
                    {item.thumbnail ? <img src={item.thumbnail} alt={item.name} style={{width:'100%',height:'100%',objectFit:'cover',borderRadius:'12px'}} /> : '📱'}
                  </div>
                  <div style={{flex:'1'}}>
                    <div style={{fontWeight:'700',fontSize:'15px',marginBottom:'4px'}}>{item.name}</div>
                    <div style={{color:'var(--purple)',fontWeight:'700',fontFamily:'var(--font-display)',fontSize:'18px'}}>PKR {item.price.toLocaleString()}</div>
                  </div>
                  <div style={{display:'flex',alignItems:'center',gap:'10px'}}>
                    <div style={{display:'flex',alignItems:'center',border:'1.5px solid var(--gray-200)',borderRadius:'10px',overflow:'hidden'}}>
                      <button style={{background:'var(--gray-100)',border:'none',padding:'8px 12px',fontSize:'16px'}} onClick={() => updateQty(item._id, item.qty - 1)}>−</button>
                      <span style={{padding:'8px 14px',fontWeight:'700'}}>{item.qty}</span>
                      <button style={{background:'var(--gray-100)',border:'none',padding:'8px 12px',fontSize:'16px'}} onClick={() => updateQty(item._id, item.qty + 1)}>+</button>
                    </div>
                    <button style={{background:'var(--red)',color:'#fff',border:'none',borderRadius:'10px',padding:'8px 14px',fontWeight:'600'}} onClick={() => removeFromCart(item._id)}>Remove</button>
                  </div>
                </div>
              ))}
              <button style={{background:'none',border:'none',color:'var(--gray-500)',cursor:'pointer',fontSize:'13px'}} onClick={clearCart}>Clear all items</button>
            </div>

            <div style={{background:'#fff',borderRadius:'20px',padding:'28px',border:'1.5px solid var(--gray-200)',position:'sticky',top:'120px'}}>
              <h2 style={{fontFamily:'var(--font-display)',fontSize:'22px',marginBottom:'20px'}}>Order Summary</h2>
              <div style={{display:'flex',justifyContent:'space-between',fontSize:'15px',marginBottom:'10px'}}><span>Subtotal</span><strong>PKR {totalPrice.toLocaleString()}</strong></div>
              <div style={{display:'flex',justifyContent:'space-between',fontSize:'15px',marginBottom:'14px',color:'var(--green)'}}><span>Delivery</span><strong>FREE</strong></div>
              {/* Coupon code */}
              <div style={{marginBottom:'14px'}}>
                <div style={{display:'flex',gap:'8px',marginBottom: couponApplied ? '8px' : '0'}}>
                  <input
                    type="text" placeholder="Coupon code (try GLAM10)"
                    value={coupon} onChange={e => setCoupon(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && applyCoupon()}
                    disabled={couponApplied}
                    style={{flex:'1',border:'1.5px solid var(--gray-200)',borderRadius:'10px',padding:'9px 12px',fontSize:'13px',fontFamily:'inherit',outline:'none',opacity: couponApplied ? .6 : 1}}
                  />
                  <button
                    onClick={applyCoupon} disabled={couponApplied}
                    style={{background: couponApplied ? 'var(--gray-100)' : 'var(--purple)',color: couponApplied ? 'var(--gray-500)' : '#fff',border:'none',borderRadius:'10px',padding:'9px 14px',fontWeight:'600',fontSize:'13px',cursor: couponApplied ? 'default' : 'pointer',whiteSpace:'nowrap'}}
                  >{couponApplied ? 'Applied ✓' : 'Apply'}</button>
                </div>
                {couponApplied && (
                  <div style={{display:'flex',justifyContent:'space-between',color:'var(--green)',fontSize:'13px',fontWeight:'600'}}>
                    <span>✅ GLAM10 — 10% off</span><strong>−PKR {couponDiscount.toLocaleString()}</strong>
                  </div>
                )}
              </div>
              <div style={{borderTop:'1px solid var(--gray-200)',paddingTop:'14px',display:'flex',justifyContent:'space-between',fontSize:'18px',fontWeight:'700'}}>
                <span>Total</span><span style={{color:'var(--purple)',fontFamily:'var(--font-display)'}}>PKR {finalTotal.toLocaleString()}</span>
              </div>
              <button className="btn-primary" style={{width:'100%',padding:'14px',marginTop:'20px',fontSize:'15px'}} onClick={() => window.location.href='/checkout'}>Proceed to Checkout</button>
              <Link to="/products" style={{display:'block',textAlign:'center',marginTop:'14px',fontSize:'13px',color:'var(--gray-500)'}}>← Continue Shopping</Link>
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
  const catName = category.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

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
      <div className="container" style={{padding:'40px 0 80px'}}>
        <h1 style={{fontFamily:'var(--font-display)',fontSize:'32px',marginBottom:'8px'}}>{catName}</h1>
        <p style={{color:'var(--gray-500)',marginBottom:'24px',fontSize:'15px'}}>
          Discover our curated collection of {catName.toLowerCase()} for all devices.
        </p>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'24px',flexWrap:'wrap',gap:'12px'}}>
          <span style={{fontSize:'14px',color:'var(--gray-500)'}}>{products.length} products</span>
          <select
            value={sort} onChange={e => setSort(e.target.value)}
            style={{border:'1.5px solid var(--gray-200)',borderRadius:'10px',padding:'8px 14px',fontFamily:'var(--font-body)',fontSize:'13px',background:'#fff',cursor:'pointer'}}
          >
            <option value="newest">Newest First</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
            <option value="rating">Top Rated</option>
            <option value="popular">Most Popular</option>
          </select>
        </div>
        {loading ? <div className="spinner" /> : products.length > 0 ? (
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(240px,1fr))',gap:'24px'}}>
            {products.map(p => <ProductCard key={p._id} product={p} />)}
          </div>
        ) : (
          <div style={{textAlign:'center',padding:'80px',color:'var(--gray-500)'}}>
            <div style={{fontSize:'48px',marginBottom:'16px'}}>📦</div>
            <p>No {catName} available yet. Check back soon!</p>
          </div>
        )}
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
