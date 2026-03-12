import React from 'react';
import { useAuth } from '../context/AuthContext';
import SEOHead from '../components/common/SEOHead';
import { useNavigate } from 'react-router-dom';

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  if (!user) return null;

  return (
    <>
      <SEOHead title="My Profile | GadgetGlam" description="Manage your GadgetGlam account." />
      <div className="container" style={{ padding: '60px 0 80px', maxWidth: '600px', margin: '0 auto' }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '32px', marginBottom: '32px' }}>
          My Profile
        </h1>
        <div style={{ background: '#fff', borderRadius: '20px', padding: '36px', border: '1.5px solid var(--gray-200)', boxShadow: '0 4px 20px rgba(124,58,237,.08)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '32px' }}>
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

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid var(--gray-100)', fontSize: '14px' }}>
              <span style={{ color: 'var(--gray-500)' }}>First Name</span>
              <strong>{user.first_name}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid var(--gray-100)', fontSize: '14px' }}>
              <span style={{ color: 'var(--gray-500)' }}>Last Name</span>
              <strong>{user.last_name}</strong>
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

          {user.role === 'admin' && (
            <button
              onClick={() => navigate('/admin')}
              className="btn-primary"
              style={{ width: '100%', padding: '13px', marginTop: '24px', fontSize: '14px' }}
            >
              Go to Admin Dashboard →
            </button>
          )}

          <button
            onClick={handleLogout}
            style={{ width: '100%', padding: '13px', marginTop: '12px', fontSize: '14px', background: 'none', border: '1.5px solid var(--gray-200)', borderRadius: '12px', cursor: 'pointer', color: 'var(--gray-700)', fontWeight: '600' }}
          >
            Sign Out
          </button>
        </div>
      </div>
    </>
  );
}
