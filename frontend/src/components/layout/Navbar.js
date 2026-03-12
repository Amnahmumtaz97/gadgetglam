import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import './Navbar.css';

const CATEGORIES = ['Cases', 'Chargers', 'Cables', 'Earphones', 'Screen Guards', 'Bundles'];

export default function Navbar() {
  const { user, logout } = useAuth();
  const { totalItems } = useCart();
  const [search, setSearch] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();

  const handleSearch = (e) => {
    e.preventDefault();
    if (search.trim()) {
      navigate(`/products?search=${encodeURIComponent(search.trim())}`);
      setSearch('');
    }
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
            <div className="user-menu">
              <span className="user-greeting">Hi, {user.first_name}</span>
              {user.role === 'admin' && <Link to="/admin" className="admin-link">Admin</Link>}
              <button className="btn-text" onClick={logout}>Logout</button>
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
