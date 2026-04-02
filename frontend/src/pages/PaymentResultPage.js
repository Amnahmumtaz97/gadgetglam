import React, { useEffect, useState } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import SEOHead from '../components/common/SEOHead';
import { useCart } from '../context/CartContext';

export default function PaymentResultPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { clearCart } = useCart();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  const status = searchParams.get('status');
  const ref = searchParams.get('ref');
  const reason = searchParams.get('reason');
  const code = searchParams.get('code');

  useEffect(() => {
    if (ref) {
      // Fetch order details using the transaction reference
      axios
        .get(`/api/orders/by-ref/${ref}`)
        .then(res => {
          if (res.data.success) setOrder(res.data.order);
        })
        .catch(() => {})
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [ref]);

  const isSuccess = status === 'success';

  useEffect(() => {
    if (isSuccess) clearCart();
  }, [isSuccess, clearCart]);

  return (
    <>
      <SEOHead 
        title={isSuccess ? 'Order Placed | GadgetGlam' : 'Order Failed | GadgetGlam'} 
        description={isSuccess ? 'Your order has been placed successfully.' : 'Your order could not be processed.'} 
      />
      <div className="container" style={{ padding: '60px 0 80px', textAlign: 'center' }}>
        {loading ? (
          <div className="spinner" />
        ) : (
          <div style={{ maxWidth: '500px', margin: '0 auto' }}>
            {isSuccess ? (
              <>
                <div style={{ fontSize: '80px', marginBottom: '20px' }}>✅</div>
                <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '36px', marginBottom: '12px', color: '#38a169' }}>
                  Order Placed Successfully!
                </h1>
                <p style={{ color: 'var(--gray-500)', fontSize: '16px', marginBottom: '28px' }}>
                  Your order has been placed successfully. We'll send you a confirmation email shortly.
                </p>

                {order && (
                  <div style={{ background: '#fff', borderRadius: '16px', padding: '28px', border: '1.5px solid var(--gray-200)', marginBottom: '28px', textAlign: 'left' }}>
                    <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '18px', marginBottom: '16px', textAlign: 'center' }}>
                      Order Details
                    </h3>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid var(--gray-100)' }}>
                      <span style={{ color: 'var(--gray-500)' }}>Order ID</span>
                      <strong style={{ fontFamily: 'monospace', fontSize: '12px' }}>#{order._id?.slice(-8)}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid var(--gray-100)' }}>
                      <span style={{ color: 'var(--gray-500)' }}>Total Amount</span>
                      <strong style={{ color: 'var(--purple)', fontFamily: 'var(--font-display)', fontSize: '18px' }}>
                        PKR {order.total_price?.toLocaleString()}
                      </strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid var(--gray-100)' }}>
                      <span style={{ color: 'var(--gray-500)' }}>Status</span>
                      <span style={{ padding: '2px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '700', background: 'rgba(56,161,105,.1)', color: '#38a169' }}>
                        {order.order_status || 'Confirmed'}
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0' }}>
                      <span style={{ color: 'var(--gray-500)' }}>Items</span>
                      <strong>{order.products?.length || 0} item(s)</strong>
                    </div>
                  </div>
                )}

                <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
                  <Link to="/profile" className="btn-primary" style={{ padding: '12px 24px' }}>
                    View Order Status →
                  </Link>
                  <Link to="/products" style={{ 
                    padding: '12px 24px', 
                    border: '1.5px solid var(--gray-200)', 
                    borderRadius: '12px', 
                    textDecoration: 'none', 
                    color: 'var(--gray-700)', 
                    fontWeight: '600' 
                  }}>
                    Continue Shopping
                  </Link>
                </div>
              </>
            ) : (
              <>
                <div style={{ fontSize: '80px', marginBottom: '20px' }}>❌</div>
                <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '36px', marginBottom: '12px', color: '#e53e3e' }}>
                  Order Failed
                </h1>
                <p style={{ color: 'var(--gray-500)', fontSize: '16px', marginBottom: '8px' }}>
                  {reason === 'invalid' && 'Order verification failed. Please try again.'}
                  {code && !reason && `Error Code: ${code}`}
                  {!reason && !code && 'An error occurred while placing your order.'}
                </p>
                <p style={{ color: 'var(--gray-500)', fontSize: '14px', marginBottom: '28px' }}>
                  Your cart has been saved. You can try again anytime.
                </p>

                <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
                  <Link to="/checkout" className="btn-primary" style={{ padding: '12px 24px' }}>
                    Try Again →
                  </Link>
                  <Link to="/cart" style={{ 
                    padding: '12px 24px', 
                    border: '1.5px solid var(--gray-200)', 
                    borderRadius: '12px', 
                    textDecoration: 'none', 
                    color: 'var(--gray-700)', 
                    fontWeight: '600' 
                  }}>
                    Back to Cart
                  </Link>
                </div>
              </>
            )}

            <p style={{ color: 'var(--gray-400)', fontSize: '12px', marginTop: '40px' }}>
              Need help? <Link to="/" style={{ color: 'var(--purple)', textDecoration: 'none' }}>Contact Support</Link>
            </p>
          </div>
        )}
      </div>
    </>
  );
}
