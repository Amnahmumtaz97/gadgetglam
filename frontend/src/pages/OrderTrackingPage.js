import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import SEOHead from '../components/common/SEOHead';
import toast from 'react-hot-toast';

export default function OrderTrackingPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      const { data } = await axios.get('/api/orders/my');
      setOrders(data.orders || []);
    } catch (err) {
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const statusColor = (status) => {
    const colors = {
      Pending: '#d69e2e',
      Processing: '#7c3aed',
      Shipped: '#3182ce',
      Delivered: '#38a169',
      Cancelled: '#e53e3e'
    };
    return colors[status] || '#888';
  };

  const paymentColor = (status) => {
    const colors = {
      Unpaid: '#e53e3e',
      Paid: '#38a169',
      Refunded: '#d69e2e'
    };
    return colors[status] || '#888';
  };

  return (
    <>
      <SEOHead title="My Orders | GadgetGlam" description="Track your GadgetGlam orders." />
      <div className="container" style={{ padding: '40px 0 80px' }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '32px', marginBottom: '8px' }}>
          My Orders 🧾
        </h1>
        <p style={{ color: 'var(--gray-500)', marginBottom: '32px', fontSize: '15px' }}>
          Track the status of your orders and view details.
        </p>

        {loading ? (
          <div className="spinner" />
        ) : orders.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 0', color: 'var(--gray-500)' }}>
            <div style={{ fontSize: '64px', marginBottom: '16px' }}>📦</div>
            <h2>No orders yet</h2>
            <p style={{ marginBottom: '24px' }}>You haven't placed any orders yet.</p>
            <Link to="/products" className="btn-primary" style={{ display: 'inline-block' }}>
              Start Shopping →
            </Link>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '16px' }}>
            {orders.map(order => (
              <div
                key={order._id}
                style={{
                  background: '#fff',
                  borderRadius: '16px',
                  border: '1.5px solid var(--gray-200)',
                  overflow: 'hidden',
                  transition: 'all 0.2s'
                }}
              >
                {/* Order Header */}
                <div
                  onClick={() => setExpandedId(expandedId === order._id ? null : order._id)}
                  style={{
                    padding: '20px',
                    cursor: 'pointer',
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr 1fr 1fr auto',
                    gap: '16px',
                    alignItems: 'center',
                    backgroundColor: expandedId === order._id ? 'var(--purple-faint)' : '#fff'
                  }}
                >
                  <div>
                    <div style={{ fontSize: '12px', color: 'var(--gray-500)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>
                      Order ID
                    </div>
                    <div style={{ fontWeight: '700', fontSize: '14px', fontFamily: 'monospace' }}>
                      #{order._id.slice(-8)}
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: '12px', color: 'var(--gray-500)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>
                      Total
                    </div>
                    <div style={{ fontWeight: '700', fontSize: '16px', color: 'var(--purple)' }}>
                      PKR {order.total_price?.toLocaleString()}
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: '12px', color: 'var(--gray-500)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>
                      Status
                    </div>
                    <span
                      style={{
                        padding: '3px 10px',
                        borderRadius: '20px',
                        fontSize: '11px',
                        fontWeight: '700',
                        background: `${statusColor(order.order_status)}22`,
                        color: statusColor(order.order_status),
                        display: 'inline-block'
                      }}
                    >
                      {order.order_status}
                    </span>
                  </div>

                  <div>
                    <div style={{ fontSize: '12px', color: 'var(--gray-500)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>
                      Payment
                    </div>
                    <span
                      style={{
                        padding: '3px 10px',
                        borderRadius: '20px',
                        fontSize: '11px',
                        fontWeight: '700',
                        background: `${paymentColor(order.payment_status)}22`,
                        color: paymentColor(order.payment_status),
                        display: 'inline-block'
                      }}
                    >
                      {order.payment_status}
                    </span>
                  </div>

                  <div style={{ fontSize: '20px' }}>
                    {expandedId === order._id ? '▼' : '▶'}
                  </div>
                </div>

                {/* Order Details - Expanded */}
                {expandedId === order._id && (
                  <div style={{ padding: '20px', borderTop: '1.5px solid var(--gray-200)', backgroundColor: 'var(--purple-faint)' }}>
                    {/* Items */}
                    <div style={{ marginBottom: '24px' }}>
                      <div style={{ fontSize: '14px', fontWeight: '700', marginBottom: '12px', color: 'var(--gray-700)' }}>
                        📦 Items ({order.products?.length || 0})
                      </div>
                      <div style={{ display: 'grid', gap: '10px' }}>
                        {order.products?.map((item, idx) => (
                          <div
                            key={idx}
                            style={{
                              background: '#fff',
                              borderRadius: '12px',
                              padding: '12px',
                              display: 'flex',
                              gap: '12px',
                              alignItems: 'center',
                              border: '1px solid var(--gray-200)'
                            }}
                          >
                            <div
                              style={{
                                width: '50px',
                                height: '50px',
                                borderRadius: '8px',
                                background: 'var(--purple-faint)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0,
                                fontSize: '24px'
                              }}
                            >
                              {item.product_id?.thumbnail ? (
                                <img
                                  src={item.product_id.thumbnail}
                                  alt={item.name}
                                  style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '8px' }}
                                />
                              ) : (
                                '📱'
                              )}
                            </div>
                            <div style={{ flex: 1 }}>
                              <div style={{ fontWeight: '600', fontSize: '13px' }}>{item.name}</div>
                              <div style={{ fontSize: '12px', color: 'var(--gray-500)' }}>
                                Qty: {item.quantity} × PKR {item.price?.toLocaleString()}
                              </div>
                            </div>
                            <div style={{ fontWeight: '700', color: 'var(--purple)' }}>
                              PKR {(item.price * item.quantity).toLocaleString()}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Shipping Address */}
                    <div style={{ marginBottom: '24px' }}>
                      <div style={{ fontSize: '14px', fontWeight: '700', marginBottom: '12px', color: 'var(--gray-700)' }}>
                        📍 Shipping Address
                      </div>
                      <div
                        style={{
                          background: '#fff',
                          borderRadius: '12px',
                          padding: '12px',
                          border: '1px solid var(--gray-200)',
                          fontSize: '13px',
                          color: 'var(--gray-700)',
                          lineHeight: '1.6'
                        }}
                      >
                        {order.shipping_address?.street && (
                          <div>{order.shipping_address.street}</div>
                        )}
                        <div>
                          {order.shipping_address?.city}, {order.shipping_address?.country}{' '}
                          {order.shipping_address?.zip && `(${order.shipping_address.zip})`}
                        </div>
                      </div>
                    </div>

                    {/* Tracking Number */}
                    {order.tracking_number && (
                      <div style={{ marginBottom: '24px' }}>
                        <div style={{ fontSize: '14px', fontWeight: '700', marginBottom: '12px', color: 'var(--gray-700)' }}>
                          🚚 Tracking Number
                        </div>
                        <div
                          style={{
                            background: '#fff',
                            borderRadius: '12px',
                            padding: '12px',
                            border: '1px solid var(--gray-200)',
                            fontSize: '13px',
                            fontFamily: 'monospace',
                            fontWeight: '600'
                          }}
                        >
                          {order.tracking_number}
                        </div>
                      </div>
                    )}

                    {/* Order Date */}
                    <div>
                      <div style={{ fontSize: '12px', color: 'var(--gray-500)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>
                        Order Date
                      </div>
                      <div style={{ fontSize: '13px', color: 'var(--gray-700)' }}>
                        {new Date(order.createdAt).toLocaleDateString('en-US', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
