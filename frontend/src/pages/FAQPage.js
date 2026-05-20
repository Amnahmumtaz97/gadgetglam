import React, { useState } from 'react';
import SEOHead from '../components/common/SEOHead';
import { Link } from 'react-router-dom';
import './HelpCenterPage.css';

const FAQ_ITEMS = [
  {
    q: 'How long does delivery take?',
    a: 'Standard delivery usually takes 2 to 5 business days depending on your city and courier performance.'
  },
  {
    q: 'Can I pay with Cash on Delivery?',
    a: 'Yes. We support Cash on Delivery, JazzCash, and EasyPaisa for most orders.'
  },
  {
    q: 'How can I track my order?',
    a: 'Open My Orders after login. Order status updates automatically from Pending to Confirmed to Dispatched to Delivered.'
  },
  {
    q: 'What is your return policy?',
    a: 'You can request a return for eligible products within 7 days of delivery if the item is damaged or incorrect.'
  },
  {
    q: 'Do you sell original products?',
    a: 'We curate quality accessories and clearly mention compatibility and specs on each product listing.'
  },
  {
    q: 'How do I contact support quickly?',
    a: 'Use the Contact page for direct support. Include your order ID for faster help.'
  }
];

export default function FAQPage() {
  const [openIdx, setOpenIdx] = useState(0);

  return (
    <>
      <SEOHead
        title="FAQ"
        description="Frequently asked questions about GadgetGlam orders, delivery, returns, and payments."
        keywords="faq gadgetglam, delivery questions, payment questions"
        canonical="https://www.gadgetglam.pk/faq"
      />

      <div className="container help-shell">
        <section className="help-hero">
          <h1 className="help-title">Frequently Asked Questions</h1>
          <p className="help-subtitle">
            Quick answers for delivery, payments, returns, and account support.
          </p>
          <div className="help-chip-row">
            <Link to="/help" className="help-chip" style={{ textDecoration: 'none' }}>Browse Help Center</Link>
            <Link to="/contact" className="help-chip" style={{ textDecoration: 'none' }}>Contact Support</Link>
          </div>
        </section>

        <div className="faq-grid">
          {FAQ_ITEMS.map((item, idx) => {
            const isOpen = idx === openIdx;
            return (
              <article key={item.q} className={`faq-item ${isOpen ? 'open' : ''}`}>
                <button
                  onClick={() => setOpenIdx(isOpen ? -1 : idx)}
                  className="faq-question"
                >
                  <span>{item.q}</span>
                  <span className="faq-symbol">{isOpen ? '−' : '+'}</span>
                </button>
                <div className="faq-answer">{item.a}</div>
              </article>
            );
          })}
        </div>
      </div>
    </>
  );
}
