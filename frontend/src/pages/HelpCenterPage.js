import React from 'react';
import { Link } from 'react-router-dom';
import SEOHead from '../components/common/SEOHead';
import './HelpCenterPage.css';

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

      <div className="container help-shell">
        <section className="help-hero">
          <h1 className="help-title">Help Center</h1>
          <p className="help-subtitle">
            Fast answers for orders, payments, refunds, and account safety. Pick a topic and get step-by-step guidance.
          </p>
          <div className="help-chip-row">
            <span className="help-chip">24/7 Self-Service</span>
            <span className="help-chip">Order Assistance</span>
            <span className="help-chip">Payments & Refunds</span>
          </div>
        </section>

        <div className="help-grid">
          {HELP_CATEGORIES.map((item) => (
            <Link
              key={item.slug}
              to={`/help/${item.slug}`}
              className="help-card"
            >
              <div className="help-emoji">{item.emoji}</div>
              <h2 className="help-card-title">{item.title}</h2>
              <p className="help-card-desc">{item.desc}</p>
            </Link>
          ))}
        </div>
      </div>
    </>
  );
}
