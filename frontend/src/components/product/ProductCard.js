import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useCart } from '../../context/CartContext';
import { getAssistantSessionId } from '../../utils/assistantSession';
import './ProductCard.css';

function getWishlist() {
  try { return JSON.parse(localStorage.getItem('gg_wishlist')) || []; }
  catch { return []; }
}

export default function ProductCard({ product }) {
  const { addToCart } = useCart();
  const [wishlisted, setWishlisted] = useState(() => getWishlist().includes(product._id));

  const discount = product.compare_price
    ? Math.round((1 - product.price / product.compare_price) * 100)
    : null;

  const toggleWishlist = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const list = getWishlist();
    if (list.includes(product._id)) {
      localStorage.setItem('gg_wishlist', JSON.stringify(list.filter(id => id !== product._id)));
      setWishlisted(false);
    } else {
      localStorage.setItem('gg_wishlist', JSON.stringify([...list, product._id]));
      setWishlisted(true);
    }
  };

  return (
    <article className="product-card fade-up" itemScope itemType="https://schema.org/Product">
      <Link
        to={`/products/${product.slug}`}
        className="product-card__image-wrap"
        onClick={() => {
          axios.post('/api/assistant/event', {
            sessionId: getAssistantSessionId(),
            type: 'product_click',
            productId: product._id
          }).catch(() => {});
        }}
      >
        {product.thumbnail
          ? <img src={product.thumbnail} alt={product.name} itemProp="image" loading="lazy" />
          : <div className="product-card__placeholder">📱</div>
        }
        {discount && <span className="badge badge--sale">-{discount}%</span>}
        {product.is_featured && !discount && <span className="badge badge--hot">🔥 Hot</span>}
        {product.stock_status === 'Out of Stock' && <div className="out-of-stock-overlay">Out of Stock</div>}
        <button
          className={`wishlist-btn${wishlisted ? ' wishlisted' : ''}`}
          onClick={toggleWishlist}
          aria-label={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
        >
          {wishlisted ? '♥' : '♡'}
        </button>
      </Link>

      <div className="product-card__body">
        <span className="product-card__brand" itemProp="brand">{product.brand}</span>
        <Link to={`/products/${product.slug}`}>
          <h2 className="product-card__name" itemProp="name">{product.name}</h2>
        </Link>

        {product.reviews_count > 0 && (
          <div className="product-card__rating" itemProp="aggregateRating" itemScope itemType="https://schema.org/AggregateRating">
            <span className="stars">{'★'.repeat(Math.round(product.ratings_avg))}{'☆'.repeat(5 - Math.round(product.ratings_avg))}</span>
            <span className="rating-count" itemProp="reviewCount">({product.reviews_count})</span>
            <meta itemProp="ratingValue" content={product.ratings_avg} />
          </div>
        )}

        <div className="product-card__footer" itemProp="offers" itemScope itemType="https://schema.org/Offer">
          <div className="product-card__price">
            <span className="price-current" itemProp="price" content={product.price}>
              PKR {product.price.toLocaleString()}
            </span>
            {product.compare_price && (
              <span className="price-original">PKR {product.compare_price.toLocaleString()}</span>
            )}
            <meta itemProp="priceCurrency" content="PKR" />
          </div>

          {product.stock_status !== 'Out of Stock' ? (
            <button
              className="add-cart-btn"
              onClick={() => addToCart(product)}
              aria-label={`Add ${product.name} to cart`}
            >
              + Cart
            </button>
          ) : (
            <span className="oos-label">Unavailable</span>
          )}
        </div>
      </div>
    </article>
  );
}
