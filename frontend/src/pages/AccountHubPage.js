import React from 'react';
import { Link, NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import SEOHead from '../components/common/SEOHead';
import { Heart, Package, Star, UserRound } from 'lucide-react';

const NAV = [
  { to: '/account', end: true, label: 'Profile', icon: UserRound },
  { to: '/account/orders', label: 'Orders', icon: Package },
  { to: '/account/wishlist', label: 'Wishlist', icon: Heart },
  { to: '/account/reviews', label: 'My Reviews', icon: Star },
];

export default function AccountHubPage() {
  const { user } = useAuth();
  if (!user) return null;

  return (
    <>
      <SEOHead title="My Account | GadgetGlam" description="Manage your GadgetGlam profile, orders, and wishlist." />
      <div className="container market-page">
        <h1 className="market-heading">My Account</h1>
        <p className="market-subtitle">Manage your profile, orders, wishlist, and reviews.</p>

        <div className="mt-8 grid gap-6 lg:grid-cols-[240px_1fr]">
          <aside className="market-card h-fit p-3">
            <div className="mb-4 border-b border-theme px-3 pb-4">
              <p className="text-xs font-bold uppercase tracking-wide text-theme-muted">Signed in as</p>
              <p className="mt-1 font-bold text-theme">{user.first_name} {user.last_name}</p>
              <p className="text-sm text-theme-muted">{user.email}</p>
            </div>
            <nav className="space-y-1">
              {NAV.map(({ to, end, label, icon: Icon }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={end}
                  className={({ isActive }) =>
                    `flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition ${
                      isActive ? 'bg-accent text-on-accent' : 'text-theme-secondary hover:bg-accent-light hover:text-theme'
                    }`
                  }
                >
                  <Icon size={17} />
                  {label}
                </NavLink>
              ))}
            </nav>
            {user.role === 'admin' && (
              <Link to="/admin" className="btn-gradient mt-4 block rounded-xl px-4 py-3 text-center text-sm font-semibold">
                Admin dashboard
              </Link>
            )}
          </aside>
          <div className="min-w-0">
            <Outlet />
          </div>
        </div>
      </div>
    </>
  );
}
