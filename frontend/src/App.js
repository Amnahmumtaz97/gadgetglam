import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import HomePage from './pages/HomePage';
import ProductsPage from './pages/ProductsPage';
import ProductDetailPage from './pages/ProductDetailPage';
import CategoryPage from './pages/CategoryPage';
import CartPage from './pages/CartPage';
import CheckoutPage from './pages/CheckoutPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ProfilePage from './pages/ProfilePage';
import AdminDashboard from './pages/AdminDashboard';
import PaymentResultPage from './pages/PaymentResultPage';
import OrderTrackingPage from './pages/OrderTrackingPage';
import AboutPage from './pages/AboutPage';
import ContactPage from './pages/ContactPage';
import FAQPage from './pages/FAQPage';
import HelpCenterPage from './pages/HelpCenterPage';
import HelpCategoryPage from './pages/HelpCategoryPage';
import NotFoundPage from './pages/NotFoundPage';
import PrivateRoute from './components/common/PrivateRoute';
import AdminRoute from './components/common/AdminRoute';
import AIChatWidget from './components/common/AIChatWidget';

export default function App() {
  return (
    <>
      <Navbar />
      <main>
        <Routes>
          <Route path="/"                       element={<HomePage />} />
          <Route path="/products"               element={<ProductsPage />} />
          <Route path="/products/:slug"         element={<ProductDetailPage />} />
          <Route path="/category/:category"     element={<CategoryPage />} />
          <Route path="/cart"                   element={<CartPage />} />
          <Route path="/checkout"               element={<PrivateRoute><CheckoutPage /></PrivateRoute>} />
          <Route path="/payment-result"         element={<PaymentResultPage />} />
          <Route path="/orders"                 element={<PrivateRoute><OrderTrackingPage /></PrivateRoute>} />
          <Route path="/about"                  element={<AboutPage />} />
          <Route path="/contact"                element={<ContactPage />} />
          <Route path="/faq"                    element={<FAQPage />} />
          <Route path="/help"                   element={<HelpCenterPage />} />
          <Route path="/help/:category"         element={<HelpCategoryPage />} />
          <Route path="/returns"                element={<HelpCategoryPage forcedCategory="returns-and-refunds" />} />
          <Route path="/privacy"                element={<HelpCategoryPage forcedCategory="privacy" />} />
          <Route path="/terms"                  element={<HelpCategoryPage forcedCategory="terms" />} />
          <Route path="/login"                  element={<LoginPage />} />
          <Route path="/register"               element={<RegisterPage />} />
          <Route path="/profile"                element={<PrivateRoute><ProfilePage /></PrivateRoute>} />
          <Route path="/admin/*"                element={<AdminRoute><AdminDashboard /></AdminRoute>} />
          <Route path="*"                       element={<NotFoundPage />} />
        </Routes>
      </main>
      <Footer />
      <AIChatWidget />
    </>
  );
}
