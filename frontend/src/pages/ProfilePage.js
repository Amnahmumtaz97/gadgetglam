import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import SEOHead from '../components/common/SEOHead';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    shipping_address: { street: '', city: '', zip: '' }
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData({
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        shipping_address: user.shipping_address || { street: '', city: '', zip: '' }
      });
      loadOrders();
    }
  }, [user]);

  const loadOrders = async () => {
    try {
      const { data } = await axios.get('/api/orders/my');
      setOrders(data.orders || []);
    } catch (err) {
      console.error('Failed to load orders');
    } finally {
      setLoadingOrders(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await axios.put('/api/users/profile', formData);
      toast.success('Profile updated!');
      setEditing(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed');
    } finally {
      setSaving(false);
    }
  };

  if (!user) return null;

  return (
    <>
      <SEOHead title="My Profile | GadgetGlam" description="Manage your GadgetGlam account." />
      <div className="container" style={{ padding: '40px 0 80px' }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '32px', marginBottom: '32px' }}>
          My Profile 👤
        </h1>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '28px', alignItems: 'start' }}>
          {/* Left: Profile Card */}
          <div style={{ background: '#fff', borderRadius: '20px', padding: '28px', border: '1.5px solid var(--gray-200)', boxShadow: '0 4px 20px rgba(124,58,237,.08)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
              <div style={{ width: '72px', height: '72px', borderRadius: '50%', background: 'var(--purple)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px', color: '#fff', fontWeight: '700', flexShrink: 0 }}>
                {user.first_name?.[0]?.toUpperCase() || '👤'}
              </div>
              <div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: '22px', fontWeight: '800' }}>
                  {user.first_name} {user.last_name}
                </div>
                <div style={{ color: 'var(--gray-500)', fontSize: '14px' }}>{user.email}</div>
                {user.role === 'admin' && (
                  <span style={{ background: 'var(--purple)', color: '#fff', fontSize: '11px', fontWeight: '700', padding: '2px 10px', borderRadius: '20px', marginTop: '4px', display: 'inline-block' }}>
                    Admin
                  </span>
                )}
              </div>
            </div>

            <div style={{ borderTop: '1.5px solid var(--gray-200)', paddingTop: '16px' }}>
              {user.role === 'admin' && (
                <button
                  onClick={() => navigate('/admin')}
                  className="btn-primary"
                  style={{ width: '100%', padding: '11px', marginBottom: '10px', fontSize: '14px' }}
                >
                  📊 Admin Dashboard
                </button>
              )}
              <button
                onClick={() => navigate('/orders')}
                style={{
                  width: '100%',
                  padding: '11px',
                  marginBottom: '10px',
                  fontSize: '14px',
                  background: 'var(--purple-light)',
                  color: 'var(--purple)',
                  border: 'none',
                  borderRadius: '12px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                📦 View All Orders
              </button>
              <button
                onClick={handleLogout}
                style={{
                  width: '100%',
                  padding: '11px',
                  fontSize: '14px',
                  background: 'none',
                  border: '1.5px solid var(--gray-200)',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  color: 'var(--gray-700)',
                  fontWeight: '600'
                }}
              >
                Sign Out
              </button>
            </div>
          </div>

          {/* Right: Orders & Account Info */}
          <div>
            {/* Edit Profile Form */}
            {editing ? (
              <div style={{ background: '#fff', borderRadius: '20px', padding: '28px', border: '1.5px solid var(--gray-200)', marginBottom: '28px' }}>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '18px', marginBottom: '20px' }}>
                  Edit Profile
                </h3>
                <form onSubmit={handleSaveProfile}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px', color: 'var(--gray-600)' }}>
                        First Name
                      </label>
                      <input
                        type="text"
                        value={formData.first_name}
                        onChange={e => setFormData(p => ({ ...p, first_name: e.target.value }))}
                        style={{ width: '100%', padding: '10px 12px', border: '1.5px solid var(--gray-200)', borderRadius: '10px', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px', color: 'var(--gray-600)' }}>
                        Last Name
                      </label>
                      <input
                        type="text"
                        value={formData.last_name}
                        onChange={e => setFormData(p => ({ ...p, last_name: e.target.value }))}
                        style={{ width: '100%', padding: '10px 12px', border: '1.5px solid var(--gray-200)', borderRadius: '10px', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
                      />
                    </div>
                  </div>

                  <div style={{ marginBottom: '12px' }}>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px', color: 'var(--gray-600)' }}>
                      Street Address
                    </label>
                    <input
                      type="text"
                      value={formData.shipping_address?.street || ''}
                      onChange={e => setFormData(p => ({ ...p, shipping_address: { ...p.shipping_address, street: e.target.value } }))}
                      style={{ width: '100%', padding: '10px 12px', border: '1.5px solid var(--gray-200)', borderRadius: '10px', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '12px', marginBottom: '20px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px', color: 'var(--gray-600)' }}>
                        City
                      </label>
                      <input
                        type="text"
                        value={formData.shipping_address?.city || ''}
                        onChange={e => setFormData(p => ({ ...p, shipping_address: { ...p.shipping_address, city: e.target.value } }))}
                        style={{ width: '100%', padding: '10px 12px', border: '1.5px solid var(--gray-200)', borderRadius: '10px', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px', color: 'var(--gray-600)' }}>
                        Zip Code
                      </label>
                      <input
                        type="text"
                        value={formData.shipping_address?.zip || ''}
                        onChange={e => setFormData(p => ({ ...p, shipping_address: { ...p.shipping_address, zip: e.target.value } }))}
                        style={{ width: '100%', padding: '10px 12px', border: '1.5px solid var(--gray-200)', borderRadius: '10px', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '12px' }}>
                    <button
                      type="submit"
                      disabled={saving}
                      className="btn-primary"
                      style={{ flex: 1, padding: '11px', fontSize: '14px' }}
                    >
                      {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditing(false)}
                      style={{
                        flex: 1,
                        padding: '11px',
                        fontSize: '14px',
                        background: 'none',
                        border: '1.5px solid var(--gray-200)',
                        borderRadius: '12px',
                        cursor: 'pointer',
                        color: 'var(--gray-700)',
                        fontWeight: '600'
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            ) : (
              <div style={{ background: '#fff', borderRadius: '20px', padding: '28px', border: '1.5px solid var(--gray-200)', marginBottom: '28px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '18px' }}>Account Information</h3>
                  <button
                    onClick={() => setEditing(true)}
                    style={{ background: 'none', border: 'none', color: 'var(--purple)', fontWeight: '600', cursor: 'pointer', fontSize: '14px' }}
                  >
                    ✏️ Edit
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid var(--gray-100)', fontSize: '14px' }}>
                    <span style={{ color: 'var(--gray-500)' }}>First Name</span>
                    <strong>{formData.first_name}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid var(--gray-100)', fontSize: '14px' }}>
                    <span style={{ color: 'var(--gray-500)' }}>Last Name</span>
                    <strong>{formData.last_name}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid var(--gray-100)', fontSize: '14px' }}>
                    <span style={{ color: 'var(--gray-500)' }}>Email</span>
                    <strong>{user.email}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', fontSize: '14px' }}>
                    <span style={{ color: 'var(--gray-500)' }}>Role</span>
                    <strong style={{ textTransform: 'capitalize' }}>{user.role || 'customer'}</strong>
                  </div>
                </div>
              </div>
            )}

            {/* Recent Orders */}
            <div style={{ background: '#fff', borderRadius: '20px', padding: '28px', border: '1.5px solid var(--gray-200)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '18px' }}>Recent Orders</h3>
                <Link to="/orders" style={{ color: 'var(--purple)', fontSize: '13px', fontWeight: '600', textDecoration: 'none' }}>
                  View All →
                </Link>
              </div>

              {loadingOrders ? (
                <div className="spinner" />
              ) : orders.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--gray-500)' }}>
                  <div style={{ fontSize: '32px', marginBottom: '12px' }}>📦</div>
                  <p style={{ fontSize: '14px' }}>No orders yet. Start shopping!</p>
                </div>
              ) : (
                <div style={{ display: 'grid', gap: '12px' }}>
                  {orders.slice(0, 3).map(order => (
                    <div
                      key={order._id}
                      style={{
                        borderBottom: '1px solid var(--gray-100)',
                        paddingBottom: '12px',
                        paddingTop: '12px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        fontSize: '13px'
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: '600', marginBottom: '4px' }}>
                          Order #{order._id.slice(-8)}
                        </div>
                        <div style={{ color: 'var(--gray-500)', fontSize: '12px' }}>
                          {new Date(order.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontWeight: '700', color: 'var(--purple)' }}>
                          PKR {order.total_price?.toLocaleString()}
                        </div>
                        <span
                          style={{
                            padding: '2px 8px',
                            borderRadius: '20px',
                            fontSize: '11px',
                            fontWeight: '700',
                            background: 'rgba(124,58,237,.1)',
                            color: 'var(--purple)',
                            display: 'inline-block',
                            marginTop: '4px'
                          }}
                        >
                          {order.order_status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
