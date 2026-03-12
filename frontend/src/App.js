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
import NotFoundPage from './pages/NotFoundPage';
import PrivateRoute from './components/common/PrivateRoute';
import AdminRoute from './components/common/AdminRoute';

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
          <Route path="/login"                  element={<LoginPage />} />
          <Route path="/register"               element={<RegisterPage />} />
          <Route path="/profile"                element={<PrivateRoute><ProfilePage /></PrivateRoute>} />
          <Route path="/admin/*"                element={<AdminRoute><AdminDashboard /></AdminRoute>} />
          <Route path="*"                       element={<NotFoundPage />} />
        </Routes>
      </main>
      <Footer />
    </>
  );
}
