import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import SEOHead from '../components/common/SEOHead';
import { Star } from 'lucide-react';

export default function MyReviewsPage({ embedded = false }) {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get('/api/users/reviews')
      .then((res) => setReviews(res.data.reviews || []))
      .catch(() => toast.error('Failed to load your reviews'))
      .finally(() => setLoading(false));
  }, []);

  const list = (
        <>
        {loading ? (
          <div className="spinner" />
        ) : reviews.length === 0 ? (
          <div className="market-empty market-card">
            <Star size={40} className="mx-auto mb-4 text-accent" />
            <h2 className="text-xl font-black text-theme">No reviews yet</h2>
            <p className="mt-2 text-theme-muted">Purchase a product and share your experience on its detail page.</p>
            <Link to="/products" className="btn-primary mt-6 inline-flex rounded-xl px-5 py-3 text-sm">Shop now</Link>
          </div>
        ) : (
          <div className="grid gap-4">
            {reviews.map((review) => (
              <article key={review._id} className="market-card">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    {review.product_id?.slug ? (
                      <Link to={`/products/${review.product_id.slug}`} className="text-lg font-bold text-accent hover:underline">
                        {review.product_id.name}
                      </Link>
                    ) : (
                      <span className="text-lg font-bold text-theme">Product</span>
                    )}
                    <p className="mt-1 text-xs text-theme-muted">{new Date(review.createdAt).toLocaleDateString()}</p>
                  </div>
                  <span className="text-accent" aria-label={`${review.rating} stars`}>
                    {'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}
                  </span>
                </div>
                {review.title && <h3 className="mt-3 font-semibold text-theme">{review.title}</h3>}
                <p className="mt-2 text-sm leading-relaxed text-theme-secondary">{review.review_text}</p>
                {review.is_verified && (
                  <span className="mt-3 inline-flex rounded-full border border-accent/30 bg-accent/10 px-3 py-1 text-xs font-semibold text-accent">
                    Verified purchase
                  </span>
                )}
              </article>
            ))}
          </div>
        )}
        </>
  );

  if (embedded) return <div>{list}</div>;

  return (
    <>
      <SEOHead title="My Reviews | GadgetGlam" description="Reviews you have submitted on GadgetGlam." />
      <div className="container market-page">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="market-heading">My Reviews</h1>
            <p className="market-subtitle mb-0">Reviews you have submitted on products.</p>
          </div>
          <Link to="/products" className="btn-primary rounded-xl px-5 py-3 text-sm">Browse products</Link>
        </div>
        {list}
      </div>
    </>
  );
}
