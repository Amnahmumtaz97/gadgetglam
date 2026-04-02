import React from 'react';
import { Link } from 'react-router-dom';
import SEOHead from '../components/common/SEOHead';

const HELP_CATEGORIES = [
  { slug: 'orders-and-tracking', title: 'Orders & Tracking', emoji: '📦', desc: 'Order statuses, delivery flow, and tracking details.' },
  { slug: 'payments', title: 'Payments', emoji: '💳', desc: 'JazzCash, EasyPaisa, COD, and payment troubleshooting.' },
  { slug: 'returns-and-refunds', title: 'Returns & Refunds', emoji: '↩️', desc: 'Eligibility, timelines, and return request process.' },
  { slug: 'account-and-security', title: 'Account & Security', emoji: '🔐', desc: 'Profile, login, password, and account safety help.' },
  { slug: 'privacy', title: 'Privacy Policy', emoji: '🛡️', desc: 'How we store and protect your personal information.' },
  { slug: 'terms', title: 'Terms of Service', emoji: '📜', desc: 'Usage terms, order terms, and legal information.' }
];

export default function HelpCenterPage() {
  return (
    <>
      <SEOHead
        title="Help Center"
        description="Browse GadgetGlam help topics including tracking, payments, returns, privacy, and account support."
        keywords="help center gadgetglam, order help, returns help"
        canonical="https://www.gadgetglam.pk/help"
      />

      <div className="container" style={{ padding: '42px 0 84px' }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '36px', marginBottom: '10px' }}>Help Center</h1>
        <p style={{ color: 'var(--gray-600)', marginBottom: '20px' }}>Choose a category to find detailed guidance.</p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px' }}>
          {HELP_CATEGORIES.map((item) => (
            <Link
              key={item.slug}
              to={`/help/${item.slug}`}
              style={{
                textDecoration: 'none',
                color: 'inherit',
                background: '#fff',
                border: '1.5px solid var(--gray-200)',
                borderRadius: '14px',
                padding: '18px'
              }}
            >
              <div style={{ fontSize: '24px', marginBottom: '8px' }}>{item.emoji}</div>
              <h2 style={{ fontSize: '18px', fontFamily: 'var(--font-display)', marginBottom: '8px' }}>{item.title}</h2>
              <p style={{ color: 'var(--gray-600)', fontSize: '14px', lineHeight: 1.6 }}>{item.desc}</p>
            </Link>
          ))}
        </div>
      </div>
    </>
  );
}
