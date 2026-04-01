import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import toast from 'react-hot-toast';
import SEOHead from '../components/common/SEOHead';
import { getAssistantSessionId } from '../utils/assistantSession';

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
      <div className="container" style={{ padding: '80px 0', textAlign: 'center' }}>
        <h2>Your cart is empty</h2>
        <Link to="/products" className="btn-primary" style={{ display: 'inline-block', marginTop: 20 }}>Shop Now</Link>
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
      navigate(`/payment-result?status=success&ref=${sandboxRef}`);
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
      <div className="container" style={{ padding: '40px 0 80px' }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '32px', marginBottom: '32px' }}>Checkout 💳</h1>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '32px', alignItems: 'start' }}>

          {/* Shipping form */}
          <div style={{ background: '#fff', borderRadius: '20px', padding: '28px', border: '1.5px solid var(--gray-200)' }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '18px', marginBottom: '20px' }}>Shipping Details</h2>
            <form onSubmit={handleSubmit}>
              {fields.map(f => (
                <div key={f.name} style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px', color: 'var(--gray-600)' }}>
                    {f.label}{f.required && ' *'}
                  </label>
                  <input
                    name={f.name}
                    value={form[f.name]}
                    onChange={handleChange}
                    placeholder={f.placeholder}
                    required={f.required}
                    style={{ width: '100%', padding: '10px 14px', border: '1.5px solid var(--gray-200)', borderRadius: '10px', fontSize: '15px', outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>
              ))}

              <div style={{ background: 'var(--purple-faint)', borderRadius: '12px', padding: '16px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '28px' }}>📱</span>
                <div>
                  <div style={{ fontWeight: '700', fontSize: '14px', color: 'var(--purple)' }}>Sandbox Checkout</div>
                  <div style={{ fontSize: '12px', color: 'var(--gray-500)' }}>No external gateway. Orders are placed instantly for testing.</div>
                </div>
              </div>

              <button
                className="btn-primary"
                type="submit"
                disabled={loading}
                style={{ width: '100%', padding: '14px', fontSize: '15px', opacity: loading ? 0.7 : 1 }}
              >
                {loading ? 'Placing sandbox order…' : `Place Sandbox Order (PKR ${discountedTotal.toLocaleString()})`}
              </button>
            </form>
            <p style={{ fontSize: '12px', color: 'var(--gray-500)', marginTop: '12px', textAlign: 'center' }}>
              Sandbox mode: no real payment is processed.
            </p>
          </div>

          {/* Order summary */}
          <div style={{ background: '#fff', borderRadius: '20px', padding: '28px', border: '1.5px solid var(--gray-200)', position: 'sticky', top: '120px' }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '18px', marginBottom: '20px' }}>Order Summary</h2>
            {cart.map(item => (
              <div key={item._id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', marginBottom: '8px' }}>
                <span style={{ color: 'var(--gray-700)' }}>{item.name} <span style={{ color: 'var(--gray-400)' }}>×{item.qty}</span></span>
                <strong>PKR {(item.price * item.qty).toLocaleString()}</strong>
              </div>
            ))}
            <div style={{ borderTop: '1px solid var(--gray-200)', paddingTop: '14px', marginTop: '10px', display: 'flex', justifyContent: 'space-between', fontSize: '15px', color: 'var(--green)', marginBottom: '8px' }}>
              <span>Delivery</span><strong>FREE</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '18px', fontWeight: '700' }}>
              <span>Total</span>
              <span style={{ color: 'var(--purple)', fontFamily: 'var(--font-display)' }}>PKR {discountedTotal.toLocaleString()}</span>
            </div>
          </div>

        </div>
      </div>
    </>
  );
}
