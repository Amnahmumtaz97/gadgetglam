import React from 'react';
import { Home, Search, ShoppingCart, UserRound, LayoutGrid } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';

const itemClass = 'flex flex-1 flex-col items-center justify-center gap-1 rounded-2xl py-2 text-[11px] font-semibold transition';

export default function MobileNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const { totalItems, openCart } = useCart();

  const active = (path) => location.pathname === path;

  return (
    <div className="fixed inset-x-0 bottom-3 z-80 px-3 md:hidden">
      <div className="mx-auto flex max-w-md items-stretch gap-2 rounded-3xl p-2 backdrop-blur-xl" style={{ border: '1px solid var(--border)', background: 'var(--panel)', boxShadow: 'var(--shadow)' }}>
        <Link to="/" className={`${itemClass} ${active('/') ? 'bg-accent text-on-accent' : 'text-theme-muted'}`}>
          <Home size={17} />
          Home
        </Link>
        <Link to="/products" className={`${itemClass} ${location.pathname.startsWith('/products') ? 'bg-accent text-on-accent' : 'text-theme-muted'}`}>
          <LayoutGrid size={17} />
          Shop
        </Link>
        <button onClick={() => navigate('/products?search=')} className={`${itemClass} text-theme-muted`}>
          <Search size={17} />
          Search
        </button>
        <button onClick={openCart} className={`${itemClass} relative text-theme-muted`}>
          <ShoppingCart size={17} />
          Cart
          {totalItems > 0 && <span className="absolute right-3 top-1 rounded-full badge-accent px-1.5 py-0.5 text-[10px]">{totalItems}</span>}
        </button>
        <Link to="/account" className={`${itemClass} ${location.pathname.startsWith('/account') ? 'bg-accent text-on-accent' : 'text-theme-muted'}`}>
          <UserRound size={17} />
          Profile
        </Link>
      </div>
    </div>
  );
}
