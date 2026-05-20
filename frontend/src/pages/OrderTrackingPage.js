import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import SEOHead from '../components/common/SEOHead';
import toast from 'react-hot-toast';

export default function OrderTrackingPage({ embedded = false }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);
  const [payingOrderId, setPayingOrderId] = useState(null);

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
      Confirmed: 'var(--accent-yellow)',
      Dispatched: 'var(--accent-gold)',
      Delivered: '#38a169',
      Cancelled: '#e53e3e',
      Processing: 'var(--accent-yellow)',
      Shipped: 'var(--accent-gold)'
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

  const submitJazzCashForm = (jcUrl, params) => {
    const form = document.createElement('form');
    form.method = 'POST';
    form.action = jcUrl;

    Object.entries(params || {}).forEach(([key, value]) => {
      const input = document.createElement('input');
      input.type = 'hidden';
      input.name = key;
      input.value = value;
      form.appendChild(input);
    });

    document.body.appendChild(form);
    form.submit();
  };

  const handleCancelOrder = async (orderId) => {
    if (!window.confirm('Cancel this order?')) return;
    try {
      const { data } = await axios.patch(`/api/orders/${orderId}/cancel`);
      setOrders((prev) => prev.map((o) => (o._id === orderId ? data.order : o)));
      toast.success('Order cancelled');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not cancel order');
    }
  };

  const handlePayNow = async (orderId) => {
    try {
      setPayingOrderId(orderId);
      const { data } = await axios.post(`/api/orders/${orderId}/initiate-jazzcash`);
      if (data?.success && data?.redirectUrl) {
        window.location.href = data.redirectUrl;
        return;
      }
      if (!data?.success || !data?.jcUrl || !data?.params) {
        throw new Error(data?.message || 'Unable to start payment');
      }
      submitJazzCashForm(data.jcUrl, data.params);
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Could not start payment');
      setPayingOrderId(null);
    }
  };

  const ordersBody = (
        <>
        {loading ? (
          <div className="spinner" />
        ) : orders.length === 0 ? (
          <div className="market-empty">
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
                  background: 'var(--surface)',
                  borderRadius: '16px',
                  border: '1.5px solid var(--border)',
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
                    backgroundColor: expandedId === order._id ? 'var(--accent-yellow-faint)' : 'var(--surface)'
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
                    <div style={{ fontWeight: '700', fontSize: '16px', color: 'var(--accent-yellow)' }}>
                      PKR {order.total_price?.toLocaleString()}
                    </div>
                    {order.tracking_number && (
                      <div style={{ color: 'var(--gray-500)', fontSize: '12px', marginTop: '4px', fontFamily: 'monospace' }}>
                        {order.tracking_number}
                      </div>
                    )}
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
                  <div style={{ padding: '20px', borderTop: '1.5px solid var(--gray-200)', backgroundColor: 'var(--accent-yellow-faint)' }}>
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
                              background: 'var(--surface)',
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
                                background: 'var(--accent-yellow-faint)',
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
                            <div style={{ fontWeight: '700', color: 'var(--accent-yellow)' }}>
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
                          background: 'var(--surface)',
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
                            background: 'var(--surface)',
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

                    {['Pending', 'Confirmed'].includes(order.order_status) && (
                      <div style={{ marginBottom: '24px' }}>
                        <button
                          type="button"
                          className="rounded-xl border border-rose-400/40 bg-rose-500/10 px-4 py-2.5 text-sm font-semibold text-rose-400 transition hover:bg-rose-500/20"
                          onClick={() => handleCancelOrder(order._id)}
                        >
                          Cancel order
                        </button>
                      </div>
                    )}

                    {/* Payment Action */}
                    {order.payment_status === 'Unpaid' && order.order_status !== 'Cancelled' && (
                      <div style={{ marginBottom: '24px' }}>
                        <div style={{ fontSize: '14px', fontWeight: '700', marginBottom: '12px', color: 'var(--gray-700)' }}>
                          💳 Complete Payment
                        </div>
                        <div
                          style={{
                            background: 'var(--surface)',
                            borderRadius: '12px',
                            padding: '12px',
                            border: '1px solid var(--gray-200)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: '12px',
                            flexWrap: 'wrap'
                          }}
                        >
                          <span style={{ fontSize: '13px', color: 'var(--gray-700)' }}>
                            This order is unpaid. You can pay now using JazzCash.
                          </span>
                          <button
                            type="button"
                            className="btn-primary"
                            disabled={payingOrderId === order._id}
                            onClick={() => handlePayNow(order._id)}
                            style={{ minWidth: '160px', opacity: payingOrderId === order._id ? 0.75 : 1 }}
                          >
                            {payingOrderId === order._id ? 'Redirecting...' : 'Pay Now'}
                          </button>
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
        </>
  );

  if (embedded) return <div>{ordersBody}</div>;

  return (
    <>
      <SEOHead title="My Orders | GadgetGlam" description="Track your GadgetGlam orders." />
      <div className="container market-page">
        <h1 className="market-heading" style={{ marginBottom: '8px' }}>My Orders</h1>
        <p className="market-subtitle" style={{ marginBottom: '32px' }}>Track status, pay, or cancel eligible orders.</p>
        {ordersBody}
      </div>
    </>
  );
}
