import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { getAssistantSessionId } from '../../utils/assistantSession';
import './Navbar.css';

const CATEGORIES = ['Cases', 'Chargers', 'Cables', 'Earphones', 'Screen Guards', 'Bundles'];

export default function Navbar() {
  const { user, logout } = useAuth();
  const { totalItems } = useCart();
  const [search, setSearch] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const navigate = useNavigate();

  const handleSearch = (e) => {
    e.preventDefault();
    if (search.trim()) {
      axios.post('/api/assistant/event', {
        sessionId: getAssistantSessionId(),
        type: 'search',
        query: search.trim()
      }).catch(() => {});

      navigate(`/products?search=${encodeURIComponent(search.trim())}`);
      setSearch('');
      setMenuOpen(false);
    }
  };

  const handleLogout = () => {
    logout();
    setProfileMenuOpen(false);
    navigate('/');
  };

  return (
    <header className="navbar">
      {/* Top Strip */}
      <div className="navbar-strip">
        <span><i className="fi fi-rr-truck-side" style={{marginRight:6,verticalAlign:'middle'}}></i>Free delivery on orders above PKR 2,000 · Use code <strong>GLAM10</strong> for 10% off</span>
      </div>

      {/* Main Nav */}
      <nav className="navbar-main container">
        <Link to="/" className="navbar-logo">Gadget<span>Glam</span></Link>

        {/* Search */}
        <form className="navbar-search" onSubmit={handleSearch}>
          <span className="search-icon"><i className="fi fi-rr-search"></i></span>
          <input
            type="search"
            placeholder="Search phone cases, chargers..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            aria-label="Search products"
          />
          <button type="submit">Search</button>
        </form>

        {/* Actions */}
        <div className="navbar-actions">
          {user ? (
            <div style={{ position: 'relative' }}>
              <button 
                onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  color: 'inherit',
                  fontWeight: '600',
                  fontSize: '14px'
                }}
              >
                👤 {user.first_name}
              </button>
              {profileMenuOpen && (
                <div style={{
                  position: 'absolute',
                  top: '100%',
                  right: 0,
                  background: '#fff',
                  borderRadius: '12px',
                  border: '1.5px solid var(--gray-200)',
                  boxShadow: '0 4px 16px rgba(0,0,0,.1)',
                  minWidth: '180px',
                  zIndex: 100,
                  marginTop: '8px'
                }}>
                  <Link 
                    to="/profile"
                    onClick={() => setProfileMenuOpen(false)}
                    style={{
                      display: 'block',
                      padding: '12px 16px',
                      borderBottom: '1px solid var(--gray-100)',
                      textDecoration: 'none',
                      color: 'var(--gray-700)',
                      fontSize: '14px'
                    }}
                  >
                    👤 My Profile
                  </Link>
                  <Link 
                    to="/orders"
                    onClick={() => setProfileMenuOpen(false)}
                    style={{
                      display: 'block',
                      padding: '12px 16px',
                      borderBottom: '1px solid var(--gray-100)',
                      textDecoration: 'none',
                      color: 'var(--gray-700)',
                      fontSize: '14px'
                    }}
                  >
                    📦 My Orders
                  </Link>
                  {user.role === 'admin' && (
                    <Link 
                      to="/admin"
                      onClick={() => setProfileMenuOpen(false)}
                      style={{
                        display: 'block',
                        padding: '12px 16px',
                        borderBottom: '1px solid var(--gray-100)',
                        textDecoration: 'none',
                        color: 'var(--purple)',
                        fontSize: '14px',
                        fontWeight: '600'
                      }}
                    >
                      📊 Admin Dashboard
                    </Link>
                  )}
                  <button
                    onClick={handleLogout}
                    style={{
                      width: '100%',
                      textAlign: 'left',
                      padding: '12px 16px',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: 'var(--gray-700)',
                      fontSize: '14px',
                      borderRadius: '0 0 12px 12px'
                    }}
                  >
                    🚪 Sign Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="auth-links">
              <Link to="/login">Sign In</Link>
              <Link to="/register" className="btn-primary">Register</Link>
            </div>
          )}
          <Link to="/cart" className="cart-btn" aria-label={`Cart with ${totalItems} items`}>
            <i className="fi fi-rr-shopping-cart"></i>
            {totalItems > 0 && <span className="cart-count">{totalItems}</span>}
          </Link>
        </div>
      </nav>

      {/* Categories Bar */}
      <nav className="navbar-cats container" aria-label="Product categories">
        {CATEGORIES.map(cat => (
          <Link
            key={cat}
            to={`/category/${cat.toLowerCase().replace(' ', '-')}`}
            className="cat-link"
          >
            {cat}
          </Link>
        ))}
        <Link to="/products?featured=true" className="cat-link cat-link--hot"><i className="fi fi-sr-flame" style={{marginRight:4,verticalAlign:'middle'}}></i>Deals</Link>
      </nav>
    </header>
  );
}
