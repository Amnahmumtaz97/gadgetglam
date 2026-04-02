import React, { useState } from 'react';
import SEOHead from '../components/common/SEOHead';

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

      <div className="container" style={{ padding: '42px 0 84px' }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '36px', marginBottom: '8px' }}>Frequently Asked Questions</h1>
        <p style={{ color: 'var(--gray-600)', marginBottom: '20px' }}>
          Quick answers to common customer questions.
        </p>

        <div style={{ display: 'grid', gap: '12px' }}>
          {FAQ_ITEMS.map((item, idx) => {
            const isOpen = idx === openIdx;
            return (
              <article key={item.q} style={{ background: '#fff', border: '1.5px solid var(--gray-200)', borderRadius: '14px', overflow: 'hidden' }}>
                <button
                  onClick={() => setOpenIdx(isOpen ? -1 : idx)}
                  style={{
                    width: '100%',
                    border: 'none',
                    background: '#fff',
                    padding: '16px',
                    fontSize: '15px',
                    fontWeight: '700',
                    textAlign: 'left',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    cursor: 'pointer'
                  }}
                >
                  <span>{item.q}</span>
                  <span style={{ color: 'var(--purple)' }}>{isOpen ? '−' : '+'}</span>
                </button>
                {isOpen && (
                  <div style={{ borderTop: '1px solid var(--gray-100)', padding: '14px 16px', color: 'var(--gray-600)', lineHeight: 1.7 }}>
                    {item.a}
                  </div>
                )}
              </article>
            );
          })}
        </div>
      </div>
    </>
  );
}
