import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, Minus, Plus, ShoppingBag, X } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { getProductDisplayImage } from '../../lib/mockups';

export default function CartDrawer() {
  const { cart, drawerOpen, closeCart, updateQty, removeFromCart, subtotal, discountedTotal } = useCart();
  const navigate = useNavigate();

  const goCheckout = () => {
    closeCart();
    navigate('/checkout');
  };

  return (
    <AnimatePresence>
      {drawerOpen && (
        <>
          <motion.button
            aria-label="Close cart drawer"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-92 cursor-default bg-black/35 backdrop-blur-sm"
            onClick={closeCart}
          />
          <motion.aside
            initial={{ x: 520 }}
            animate={{ x: 0 }}
            exit={{ x: 520 }}
            transition={{ type: 'spring', stiffness: 240, damping: 28 }}
            className="fixed right-0 top-0 z-93 flex h-full w-[min(420px,100%)] flex-col border-l border-theme bg-[var(--nav-bg)] shadow-[var(--shadow-lg)] backdrop-blur-2xl"
          >
            <div className="flex items-center justify-between border-b border-theme px-5 py-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-accent">Your cart</p>
                <h3 className="mt-1 text-xl font-bold text-theme">Cart</h3>
              </div>
              <button onClick={closeCart} className="grid h-11 w-11 place-items-center rounded-2xl border border-theme bg-theme-panel/80 text-theme-muted transition hover:bg-accent-light">
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 space-y-3 overflow-y-auto p-4 scrollbar-thin">
              {cart.length ? cart.map((item) => (
                <div key={item._id} className="flex items-center gap-3 rounded-3xl border border-theme bg-theme-panel p-3">
                  <div className="h-20 w-20 overflow-hidden rounded-2xl bg-accent-light">
                    <img src={getProductDisplayImage(item)} alt={item.name} className="h-full w-full object-cover" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-semibold text-theme">{item.name}</div>
                    <div className="mt-1 text-sm text-accent">PKR {Number(item.price || 0).toLocaleString()}</div>
                    <div className="mt-3 inline-flex items-center gap-2 rounded-2xl border border-theme bg-theme-panel p-1">
                      <button onClick={() => updateQty(item._id, item.qty - 1)} className="grid h-9 w-9 place-items-center rounded-xl bg-[var(--surface-2)] text-theme-muted transition hover:bg-accent-light"><Minus size={14} /></button>
                      <span className="min-w-8 text-center text-sm font-semibold text-theme">{item.qty}</span>
                      <button onClick={() => updateQty(item._id, item.qty + 1)} className="grid h-9 w-9 place-items-center rounded-xl bg-[var(--surface-2)] text-theme-muted transition hover:bg-accent-light"><Plus size={14} /></button>
                    </div>
                  </div>
                  <button onClick={() => removeFromCart(item._id)} className="rounded-2xl border border-theme bg-theme-panel px-3 py-2 text-xs text-theme-muted transition hover:border-accent hover:text-theme">
                    Remove
                  </button>
                </div>
              )) : (
                <div className="grid h-full place-items-center rounded-4xl border border-dashed border-theme p-8 text-center text-theme-muted">
                  <div>
                    <ShoppingBag className="mx-auto mb-3 text-accent" size={34} />
                    <p className="text-lg font-semibold text-theme">Your cart is empty</p>
                    <p className="mt-2 text-sm text-theme-muted">Start with cases, chargers, or a bundle deal.</p>
                    <Link to="/products" onClick={closeCart} className="mt-5 inline-flex items-center gap-2 rounded-2xl btn-primary px-4 py-3 text-sm font-semibold text-on-accent">
                      Browse products <ArrowRight size={16} />
                    </Link>
                  </div>
                </div>
              )}
            </div>

            <div className="border-t border-theme p-5">
              <div className="flex items-center justify-between text-sm text-theme-muted">
                <span>Subtotal</span>
                <span>PKR {subtotal.toLocaleString()}</span>
              </div>
              <div className="mt-2 flex items-center justify-between text-sm text-accent">
                <span>Total</span>
                <span className="text-base font-bold">PKR {discountedTotal.toLocaleString()}</span>
              </div>
              <button onClick={goCheckout} className="mt-4 w-full rounded-2xl btn-primary px-4 py-3 text-sm font-semibold text-on-accent transition hover:scale-[1.01]">
                Proceed to checkout
              </button>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
