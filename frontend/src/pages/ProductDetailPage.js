import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import SEOHead from '../components/common/SEOHead';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import ProductCard from '../components/product/ProductCard';
import './ProductDetailPage.css';

export default function ProductDetailPage() {
  const { slug } = useParams();
  const { addToCart } = useCart();
  const { user } = useAuth();
  const [product, setProduct]   = useState(null);
  const [reviews, setReviews]   = useState([]);
  const [related, setRelated]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [activeImg, setActiveImg] = useState(0);
  const [qty, setQty]           = useState(1);
  const [reviewForm, setReviewForm] = useState({ rating: 5, title: '', review_text: '' });

  useEffect(() => {
    setLoading(true);
    let loaded;
    axios.get(`/api/products/${slug}`)
      .then(res => {
        loaded = res.data.product;
        setProduct(loaded);
        return Promise.all([
          axios.get(`/api/reviews/${loaded._id}`),
          axios.get(`/api/products?category=${encodeURIComponent(loaded.category)}&limit=8`),
        ]);
      })
      .then(([revRes, relRes]) => {
        setReviews(revRes.data.reviews || []);
        setRelated((relRes.data.products || []).filter(p => p._id !== loaded._id).slice(0, 4));
      })
      .catch(() => toast.error('Product not found'))
      .finally(() => setLoading(false));
  }, [slug]);

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!user) return toast.error('Please login to review');
    try {
      await axios.post(`/api/reviews/${product._id}`, reviewForm);
      toast.success('Review submitted!');
      const res = await axios.get(`/api/reviews/${product._id}`);
      setReviews(res.data.reviews);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error submitting review');
    }
  };

  if (loading) return <div className="spinner" role="status" aria-label="Loading product" />;
  if (!product) return <div className="container" style={{padding:'80px 0',textAlign:'center'}}><h2>Product not found</h2><Link to="/products">← Back to products</Link></div>;

  const discount = product.compare_price
    ? Math.round((1 - product.price / product.compare_price) * 100)
    : null;

  return (
    <>
      <SEOHead
        title={product.seo?.meta_title || `${product.name} | GadgetGlam`}
        description={product.seo?.meta_description || product.short_description || product.description?.substring(0, 155)}
        keywords={product.seo?.meta_keywords?.join(', ') || `${product.name}, ${product.brand}, phone accessories`}
        canonical={`https://www.gadgetglam.pk/products/${product.slug}`}
        ogImage={product.images?.[0] || ''}
        ogType="product"
        product={product}
      />

      <div className="container">
        {/* Breadcrumb - SEO important */}
        <nav className="breadcrumb" aria-label="Breadcrumb">
          <ol itemScope itemType="https://schema.org/BreadcrumbList">
            <li itemProp="itemListElement" itemScope itemType="https://schema.org/ListItem">
              <Link to="/" itemProp="item"><span itemProp="name">Home</span></Link>
              <meta itemProp="position" content="1" />
            </li>
            <span aria-hidden="true">›</span>
            <li itemProp="itemListElement" itemScope itemType="https://schema.org/ListItem">
              <Link to={`/category/${product.category.toLowerCase()}`} itemProp="item">
                <span itemProp="name">{product.category}</span>
              </Link>
              <meta itemProp="position" content="2" />
            </li>
            <span aria-hidden="true">›</span>
            <li itemProp="itemListElement" itemScope itemType="https://schema.org/ListItem">
              <span itemProp="name">{product.name}</span>
              <meta itemProp="position" content="3" />
            </li>
          </ol>
        </nav>

        {/* Product Detail */}
        <div className="product-detail" itemScope itemType="https://schema.org/Product">
          {/* Images */}
          <div className="pd-images">
            <div className="pd-main-img">
              {product.images?.length > 0
                ? <img src={product.images[activeImg]} alt={product.name} itemProp="image" />
                : <div className="pd-placeholder">📱</div>
              }
              {discount && <span className="pd-badge">-{discount}%</span>}
            </div>
            {product.images?.length > 1 && (
              <div className="pd-thumbs">
                {product.images.map((img, i) => (
                  <button key={i} className={`pd-thumb ${i === activeImg ? 'active' : ''}`} onClick={() => setActiveImg(i)}>
                    <img src={img} alt={`${product.name} view ${i + 1}`} />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Info */}
          <div className="pd-info">
            <span className="pd-brand" itemProp="brand">{product.brand}</span>
            <h1 className="pd-name" itemProp="name">{product.name}</h1>

            {product.reviews_count > 0 && (
              <div className="pd-rating" itemProp="aggregateRating" itemScope itemType="https://schema.org/AggregateRating">
                <span className="stars">{'★'.repeat(Math.round(product.ratings_avg))}{'☆'.repeat(5 - Math.round(product.ratings_avg))}</span>
                <span>{product.ratings_avg} ({product.reviews_count} reviews)</span>
                <meta itemProp="ratingValue" content={product.ratings_avg} />
                <meta itemProp="reviewCount" content={product.reviews_count} />
              </div>
            )}

            <div className="pd-price" itemProp="offers" itemScope itemType="https://schema.org/Offer">
              <span className="pd-price-current" itemProp="price" content={product.price}>
                PKR {product.price.toLocaleString()}
              </span>
              {product.compare_price && (
                <span className="pd-price-orig">PKR {product.compare_price.toLocaleString()}</span>
              )}
              {discount && <span className="pd-discount">{discount}% OFF</span>}
              <meta itemProp="priceCurrency" content="PKR" />
              <link itemProp="availability" href={product.stock_status === 'In Stock' ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock'} />
            </div>

            <div className="pd-stock">
              <span className={`stock-chip ${product.stock_status === 'In Stock' ? 'in' : 'out'}`}>
                {product.stock_status === 'In Stock' ? '✅' : '❌'} {product.stock_status}
              </span>
            </div>

            <p className="pd-desc" itemProp="description">{product.description}</p>

            {product.device_compatibility?.length > 0 && (
              <div className="pd-compat">
                <strong>Compatible with:</strong>
                <div className="compat-tags">
                  {product.device_compatibility.map(d => <span key={d} className="compat-tag">{d}</span>)}
                </div>
              </div>
            )}

            <div className="pd-actions">
              <div className="qty-control">
                <button onClick={() => setQty(q => Math.max(1, q - 1))}>−</button>
                <span>{qty}</span>
                <button onClick={() => setQty(q => q + 1)}>+</button>
              </div>
              <button
                className="btn-primary pd-cart-btn"
                onClick={() => addToCart(product, qty)}
                disabled={product.stock_status === 'Out of Stock'}
              >
                🛒 Add to Cart
              </button>
              <a
                href={product.affiliate_link}
                target="_blank"
                rel="noopener noreferrer sponsored"
                className="btn-buy-now"
                aria-label={`Buy ${product.name} on ${product.affiliate_platform}`}
              >
                Buy on {product.affiliate_platform} →
              </a>
            </div>
          </div>
        </div>

        {/* RELATED PRODUCTS */}
        {related.length > 0 && (
          <section style={{ padding:'40px 0', borderTop:'1px solid var(--gray-200)' }}>
            <h2 style={{ fontFamily:'var(--font-display)', fontSize:'24px', marginBottom:'24px' }}>You May Also Like</h2>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(220px,1fr))', gap:'20px' }}>
              {related.map(p => <ProductCard key={p._id} product={p} />)}
            </div>
          </section>
        )}

        {/* REVIEWS */}
        <section className="reviews-section" aria-labelledby="reviews-heading">
          <h2 id="reviews-heading">Customer Reviews ({product.reviews_count})</h2>

          {reviews.map(r => (
            <div key={r._id} className="review-card" itemScope itemType="https://schema.org/Review">
              <div className="review-header">
                <strong itemProp="author">{r.user_id?.first_name} {r.user_id?.last_name?.[0]}.</strong>
                <span className="stars" itemProp="reviewRating" itemScope itemType="https://schema.org/Rating">
                  {'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}
                  <meta itemProp="ratingValue" content={r.rating} />
                </span>
                {r.is_verified && <span className="verified-badge">✅ Verified Purchase</span>}
              </div>
              {r.title && <div className="review-title" itemProp="name">{r.title}</div>}
              <p className="review-text" itemProp="reviewBody">{r.review_text}</p>
            </div>
          ))}

          {/* Review Form */}
          {user && (
            <div className="review-form-wrap">
              <h3>Write a Review</h3>
              <form onSubmit={handleReviewSubmit} className="review-form">
                <label>Rating
                  <select value={reviewForm.rating} onChange={e => setReviewForm(f => ({ ...f, rating: Number(e.target.value) }))}>
                    {[5,4,3,2,1].map(n => <option key={n} value={n}>{n} ★</option>)}
                  </select>
                </label>
                <label>Title
                  <input type="text" placeholder="Summarize your review" value={reviewForm.title}
                    onChange={e => setReviewForm(f => ({ ...f, title: e.target.value }))} />
                </label>
                <label>Review
                  <textarea placeholder="What did you like or dislike?" required rows={4} value={reviewForm.review_text}
                    onChange={e => setReviewForm(f => ({ ...f, review_text: e.target.value }))} />
                </label>
                <button type="submit" className="btn-primary">Submit Review</button>
              </form>
            </div>
          )}
        </section>
      </div>
    </>
  );
}
