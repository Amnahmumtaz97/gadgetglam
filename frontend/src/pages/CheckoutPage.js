import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import toast from 'react-hot-toast';
import SEOHead from '../components/common/SEOHead';
import { getAssistantSessionId } from '../utils/assistantSession';
import { getProductDisplayImage, getRealProductFallback } from '../lib/mockups';

export default function CheckoutPage() {
  const { cart, discountedTotal } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    full_name: user ? `${user.first_name || ''} ${user.last_name || ''}`.trim() : '',
    phone: user?.phone || '',
    street: '',
    city: '',
    zip: '',
  });

  if (cart.length === 0) {
    return (
      <div className="container page-shell text-center">
        <div className="rounded-4xl border border-theme bg-theme-panel py-24">
          <h2 className="text-3xl font-black text-theme">Your cart is empty</h2>
          <Link to="/products" className="mt-5 inline-flex rounded-2xl bg-gradient-to-r from-[var(--accent-yellow)] to-[var(--accent-gold)] px-5 py-3 font-semibold text-on-accent">Shop Now</Link>
        </div>
      </div>
    );
  }

  const handleChange = e => setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.phone || !form.street || !form.city) {
      toast.error('Please fill in all required fields');
      return;
    }
    setLoading(true);
    try {
      axios.post('/api/assistant/event', {
        sessionId: getAssistantSessionId(),
        type: 'checkout_started'
      }).catch(() => {});

      const sandboxRef = `SBX-${Date.now()}`;
      const { data } = await axios.post('/api/orders', {
        products: cart.map(i => ({
          product_id: i._id,
          name: i.name,
          thumbnail: i.thumbnail,
          quantity: i.qty,
          price: i.price,
        })),
        total_price: discountedTotal,
        payment_method: 'COD',
        payment_status: 'Unpaid',
        order_status: 'Pending',
        jazzcash_txn_ref: sandboxRef,
        notes: 'Sandbox checkout (no payment gateway)',
        shipping_address: { street: form.street, city: form.city, zip: form.zip, country: 'Pakistan' },
      });
      if (!data.success) throw new Error(data.message);
      const trackingId = data.order?.tracking_number || '';
      navigate(`/payment-result?status=success&ref=${sandboxRef}${trackingId ? `&tracking=${encodeURIComponent(trackingId)}` : ''}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not place order. Try again.');
      setLoading(false);
    }
  };

  const fields = [
    { name: 'full_name', label: 'Full Name',      placeholder: 'Ali Ahmed',                    required: true  },
    { name: 'phone',     label: 'Phone Number',   placeholder: '03001234567',                  required: true  },
    { name: 'street',    label: 'Street Address', placeholder: 'House #12, Street 4, Block A', required: true  },
    { name: 'city',      label: 'City',           placeholder: 'Karachi',                      required: true  },
    { name: 'zip',       label: 'Postal Code',    placeholder: '75300',                        required: false },
  ];

  return (
    <>
      <SEOHead title="Checkout | GadgetGlam" description="Complete your purchase securely." />
      <div className="container page-shell">
        <h1 className="mb-8 text-4xl font-black text-theme">Checkout</h1>
        <div className="grid gap-8 xl:grid-cols-[1.05fr_0.95fr]">
          <div className="rounded-4xl border border-theme bg-theme-panel p-6">
            <h2 className="mb-5 text-2xl font-black text-theme">Shipping Details</h2>
            <form onSubmit={handleSubmit} className="grid gap-4">
              {fields.map(f => (
                <div key={f.name}>
                  <label className="mb-2 block text-sm text-theme-muted">
                    {f.label}{f.required && ' *'}
                  </label>
                  <input
                    name={f.name}
                    value={form[f.name]}
                    onChange={handleChange}
                    placeholder={f.placeholder}
                    required={f.required}
                    className="input-theme w-full rounded-2xl px-4 py-3"
                  />
                </div>
              ))}

              <div className="flex items-center gap-4 rounded-3xl border border-[var(--accent-yellow)]/20 bg-accent/10 p-4 text-theme-muted">
                <span className="text-3xl">📱</span>
                <div>
                  <div className="font-semibold text-[var(--accent-yellow)]">Sandbox Checkout</div>
                  <div className="text-sm text-theme-muted">No external gateway. Orders are placed instantly for testing.</div>
                </div>
              </div>

              <button className="rounded-2xl bg-gradient-to-r from-[var(--accent-yellow)] via-[var(--accent-gold)] to-[var(--accent-gold)] px-4 py-4 font-semibold text-on-accent" type="submit" disabled={loading} style={{ opacity: loading ? 0.7 : 1 }}>
                {loading ? 'Placing sandbox order…' : `Place Sandbox Order (PKR ${discountedTotal.toLocaleString()})`}
              </button>
            </form>
          </div>

          <div className="sticky top-28 rounded-4xl border border-theme bg-theme-panel p-6">
            <h2 className="mb-5 text-2xl font-black text-theme">Order Summary</h2>
            <div className="max-h-[min(420px,50vh)] space-y-3 overflow-y-auto pr-1 scrollbar-thin">
              {cart.map((item) => (
                <div key={item._id} className="flex items-center gap-3 rounded-2xl border border-theme bg-[var(--surface-2)] p-3">
                  <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-theme bg-[var(--gray-200)]">
                    <img
                      src={getProductDisplayImage(item)}
                      alt={item.name}
                      className="h-full w-full object-cover"
                      loading="lazy"
                      onError={(e) => {
                        const fallback = getRealProductFallback(item);
                        if (e.currentTarget.src !== fallback) e.currentTarget.src = fallback;
                      }}
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="line-clamp-2 text-sm font-semibold leading-snug text-theme">{item.name}</div>
                    <div className="mt-0.5 text-xs text-theme-muted">Qty {item.qty}</div>
                  </div>
                  <strong className="shrink-0 text-sm text-theme">PKR {(item.price * item.qty).toLocaleString()}</strong>
                </div>
              ))}
            </div>
            <div className="mt-4 flex justify-between border-t border-theme pt-4 text-sm text-[var(--accent-yellow)]">
              <span>Delivery</span><strong>FREE</strong>
            </div>
            <div className="flex justify-between text-lg font-bold text-theme">
              <span>Total</span>
              <span className="text-[var(--accent-yellow)]">PKR {discountedTotal.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
