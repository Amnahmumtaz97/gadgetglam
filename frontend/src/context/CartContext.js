import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { getAssistantSessionId, getLastCartActivity, setLastCartActivity } from '../utils/assistantSession';

const CartContext = createContext();

export function CartProvider({ children }) {
  const [cart, setCart] = useState(() => {
    try { return JSON.parse(localStorage.getItem('gg_cart')) || []; }
    catch { return []; }
  });
  const [couponCode, setCouponCode] = useState(() => localStorage.getItem('gg_coupon_code') || '');
  const [couponDiscountPercent, setCouponDiscountPercent] = useState(() => Number(localStorage.getItem('gg_coupon_percent') || 0));
  const [lastCartActivity, setLastCartActivityState] = useState(() => getLastCartActivity());

  const trackCartActivity = () => {
    const ts = new Date().toISOString();
    setLastCartActivity(ts);
    setLastCartActivityState(ts);

    axios.post('/api/assistant/event', {
      sessionId: getAssistantSessionId(),
      type: 'cart_activity'
    }).catch(() => {});
  };

  useEffect(() => {
    localStorage.setItem('gg_cart', JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    localStorage.setItem('gg_coupon_code', couponCode);
    localStorage.setItem('gg_coupon_percent', String(couponDiscountPercent));
  }, [couponCode, couponDiscountPercent]);

  const addToCart = (product, qty = 1) => {
    setCart(prev => {
      const exists = prev.find(i => i._id === product._id);
      if (exists) {
        toast.success('Quantity updated!');
        trackCartActivity();
        return prev.map(i => i._id === product._id ? { ...i, qty: i.qty + qty } : i);
      }
      toast.success('Added to cart!');
      trackCartActivity();
      return [...prev, { ...product, qty }];
    });
  };

  const removeFromCart = (id) => {
    setCart(prev => prev.filter(i => i._id !== id));
    trackCartActivity();
    toast('Removed from cart', { icon: '🗑️' });
  };

  const updateQty = (id, qty) => {
    if (qty < 1) return removeFromCart(id);
    setCart(prev => prev.map(i => i._id === id ? { ...i, qty } : i));
    trackCartActivity();
  };

  const clearCart = () => {
    setCart([]);
    trackCartActivity();
  };

  const applyCoupon = (code) => {
    const normalized = String(code || '').trim().toUpperCase();
    if (!normalized) return false;

    if (normalized === 'GLAM10') {
      setCouponCode(normalized);
      setCouponDiscountPercent(10);
      trackCartActivity();
      toast.success('Coupon applied! 10% off 🎉');
      return true;
    }

    toast.error('Invalid coupon code');
    return false;
  };

  const clearCoupon = () => {
    setCouponCode('');
    setCouponDiscountPercent(0);
  };

  const totalItems = cart.reduce((s, i) => s + i.qty, 0);
  const subtotal = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const couponDiscount = Math.round(subtotal * (couponDiscountPercent / 100));
  const totalPrice = subtotal;
  const discountedTotal = Math.max(0, subtotal - couponDiscount);

  return (
    <CartContext.Provider value={{
      cart,
      addToCart,
      removeFromCart,
      updateQty,
      clearCart,
      totalItems,
      subtotal,
      totalPrice,
      couponCode,
      couponDiscountPercent,
      couponDiscount,
      discountedTotal,
      applyCoupon,
      clearCoupon,
      lastCartActivity
    }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);
