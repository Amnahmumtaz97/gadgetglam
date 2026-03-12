import React from 'react';
import { Link } from 'react-router-dom';
import './Footer.css';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-main container">
        <div className="footer-brand">
          <div className="footer-logo">Gadget<span>Glam</span></div>
          <p>Pakistan's premium destination for phone accessories. Quality gear for every device, delivered to your door.</p>
          <div className="footer-social">
            <a href="https://facebook.com/gadgetglam" target="_blank" rel="noopener noreferrer" aria-label="Facebook"><i className="fi fi-brands-facebook"></i></a>
            <a href="https://instagram.com/gadgetglam" target="_blank" rel="noopener noreferrer" aria-label="Instagram"><i className="fi fi-brands-instagram"></i></a>
            <a href="https://twitter.com/gadgetglam" target="_blank" rel="noopener noreferrer" aria-label="Twitter / X"><i className="fi fi-brands-twitter-alt"></i></a>
          </div>
        </div>

        <div className="footer-col">
          <h3>Shop</h3>
          <Link to="/category/cases">Phone Cases</Link>
          <Link to="/category/chargers">Chargers</Link>
          <Link to="/category/earphones">Earphones</Link>
          <Link to="/category/cables">Cables</Link>
          <Link to="/category/screen-guards">Screen Guards</Link>
          <Link to="/products?featured=true"><i className="fi fi-sr-flame" style={{marginRight:5,verticalAlign:'middle'}}></i>Hot Deals</Link>
        </div>

        <div className="footer-col">
          <h3>Account</h3>
          <Link to="/login">Sign In</Link>
          <Link to="/register">Register</Link>
          <Link to="/profile">My Profile</Link>
          <Link to="/profile?tab=orders">My Orders</Link>
          <Link to="/profile?tab=wishlist">Wishlist</Link>
        </div>

        <div className="footer-col">
          <h3>Help</h3>
          <Link to="/about">About Us</Link>
          <Link to="/contact">Contact</Link>
          <Link to="/faq">FAQ</Link>
          <Link to="/returns">Returns & Refunds</Link>
          <Link to="/privacy">Privacy Policy</Link>
          <Link to="/terms">Terms of Service</Link>
        </div>
      </div>

      <div className="footer-bottom container">
        <p>© {new Date().getFullYear()} GadgetGlam. All rights reserved.</p>
        <p>Built with 💜 in Pakistan · Powered by MERN Stack</p>
      </div>
    </footer>
  );
}
