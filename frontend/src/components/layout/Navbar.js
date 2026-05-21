import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Heart, MoonStar, Search, ShoppingCart, Sparkles, SunMedium, UserCircle2 } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { useTheme } from '../../context/ThemeContext';
import { getAssistantSessionId } from '../../utils/assistantSession';
import SearchModal from '../common/SearchModal';

function getWishlistCount() {
  try {
    return (JSON.parse(localStorage.getItem('gg_wishlist')) || []).length;
  } catch {
    return 0;
  }
}

export default function Navbar() {
  const { user, logout } = useAuth();
  const { totalItems, openCart } = useCart();
  const { isDark, toggleTheme } = useTheme();
  const [wishlistCount, setWishlistCount] = useState(() => getWishlistCount());
  const [profileOpen, setProfileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const refresh = () => setWishlistCount(getWishlistCount());
    window.addEventListener('storage', refresh);
    window.addEventListener('gg:wishlist-updated', refresh);
    refresh();
    return () => {
      window.removeEventListener('storage', refresh);
      window.removeEventListener('gg:wishlist-updated', refresh);
    };
  }, []);

  const handleLogout = () => {
    logout();
    setProfileOpen(false);
    navigate('/');
  };

  const searchAction = () => {
    axios.post('/api/assistant/event', { sessionId: getAssistantSessionId(), type: 'search_opened' }).catch(() => {});
    setSearchOpen(true);
  };

  return (
    <>
      <SearchModal open={searchOpen} onClose={() => setSearchOpen(false)} />
      <header className="sticky top-0 z-85">
        <div className="nav-promo text-[11px] font-semibold tracking-wide">
          <div className="container flex items-center justify-center gap-2 py-2 text-center">
            <Sparkles size={12} />
            <span>Free delivery above PKR 2,000 · Use code <span className="font-semibold opacity-90">GLAM10</span> for 10% off</span>
          </div>
        </div>

        <div className="nav-shell backdrop-blur-2xl">
          <div className="container grid items-center gap-3 py-3.5 md:grid-cols-[minmax(190px,1fr)_minmax(320px,520px)_minmax(190px,1fr)]">
            <div className="flex items-center gap-5">
              <Link to="/" className="flex items-center gap-2 text-2xl font-black tracking-tight text-theme">
                Gadget<span className="text-gradient">Glam</span>
              </Link>

              <Link to="/blog" className="hidden rounded-full px-4 py-2 text-sm font-bold text-theme-muted transition hover:bg-accent-light hover:text-theme lg:inline-flex">
                Blog
              </Link>
            </div>

            <button
              onClick={searchAction}
              className="nav-search mx-auto hidden w-full items-center gap-3 rounded-full px-4 py-3 text-left text-sm transition md:flex"
            >
              <Search size={16} />
              <span>Search smart watches, earbuds, chargers...</span>
              <span className="ml-auto rounded-full border border-theme bg-[var(--gray-900)] px-4 py-1.5 text-[11px] font-black uppercase tracking-[0.16em] text-white dark:bg-[var(--surface-3)]">All Categories</span>
            </button>

            <div className="ml-auto flex items-center gap-2 md:gap-3">
              <button onClick={toggleTheme} className="nav-icon-btn grid h-11 w-11 place-items-center rounded-full" aria-label="Toggle theme">
                {isDark ? <SunMedium size={18} /> : <MoonStar size={18} />}
              </button>
              <button onClick={searchAction} className="nav-icon-btn grid h-11 w-11 place-items-center rounded-full md:hidden" aria-label="Open search">
                <Search size={18} />
              </button>
              {user ? (
                <div className="relative hidden md:block">
                  <button onClick={() => setProfileOpen((prev) => !prev)} className="nav-icon-btn flex h-11 items-center gap-2 rounded-full px-3 text-sm font-bold">
                    <UserCircle2 size={18} />
                    {user.first_name || 'Account'}
                  </button>
                  {profileOpen && (
                    <div className="absolute right-0 mt-3 w-56 overflow-hidden rounded-3xl border border-theme bg-[var(--panel-strong)] shadow-[var(--shadow-lg)] backdrop-blur-2xl">
                      <Link to="/account" onClick={() => setProfileOpen(false)} className="block px-4 py-3 text-sm text-theme-muted hover:bg-accent/10 hover:text-accent">My Profile</Link>
                      <Link to="/account/orders" onClick={() => setProfileOpen(false)} className="block px-4 py-3 text-sm text-theme-muted hover:bg-accent/10 hover:text-accent">My Orders</Link>
                      {user.role === 'admin' && <Link to="/admin" onClick={() => setProfileOpen(false)} className="block px-4 py-3 text-sm text-accent hover:bg-accent/10">Admin Dashboard</Link>}
                      <button onClick={handleLogout} className="block w-full px-4 py-3 text-left text-sm text-theme-muted hover:bg-accent/10 hover:text-accent">Sign out</button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="hidden items-center gap-2 md:flex">
                  <Link to="/login" className="nav-icon-btn rounded-full px-4 py-3 text-sm font-bold">Sign in</Link>
                  <Link to="/register" className="btn-gradient rounded-2xl px-4 py-3 text-sm font-semibold transition hover:brightness-105">Register</Link>
                </div>
              )}

              <button onClick={() => navigate(user ? '/account/wishlist' : '/wishlist')} className="nav-icon-btn relative grid h-11 w-11 place-items-center rounded-full" aria-label="Wishlist">
                <Heart size={18} />
                {wishlistCount > 0 && <span className="badge-accent absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full px-1 text-[10px] font-black">{wishlistCount}</span>}
              </button>

                  <button onClick={openCart} className="nav-icon-btn relative grid h-11 w-11 place-items-center rounded-full" aria-label="Cart">
                <ShoppingCart size={18} />
                {totalItems > 0 && <span className="badge-accent absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full px-1 text-[10px] font-black">{totalItems}</span>}
              </button>
            </div>
          </div>
        </div>
      </header>
    </>
  );
}
