import React from 'react';
import { Link } from 'react-router-dom';
import SEOHead from '../components/common/SEOHead';

export default function AboutPage() {
  return (
    <>
      <SEOHead
        title="About Us"
        description="Learn about GadgetGlam, our mission, and why thousands of customers trust us for premium phone accessories in Pakistan."
        keywords="about gadgetglam, phone accessories pakistan, gadgetglam mission"
        canonical="https://www.gadgetglam.pk/about"
      />

      <div className="container" style={{ padding: '42px 0 84px' }}>
        <section style={{ background: '#fff', border: '1.5px solid var(--gray-200)', borderRadius: '20px', padding: '28px' }}>
          <p style={{ color: 'var(--purple)', fontWeight: '700', fontSize: '12px', letterSpacing: '0.6px', textTransform: 'uppercase', marginBottom: '10px' }}>
            About GadgetGlam
          </p>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '38px', lineHeight: 1.2, marginBottom: '12px' }}>
            Built For People Who Love Their Phones
          </h1>
          <p style={{ color: 'var(--gray-600)', fontSize: '16px', lineHeight: 1.75, maxWidth: '780px' }}>
            GadgetGlam is a Pakistan-focused phone accessories store built around one idea: quality should feel premium, look premium,
            and still stay affordable. From protective cases to fast chargers, we curate products that match daily needs, style, and reliability.
          </p>
        </section>

        <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginTop: '20px' }}>
          {[
            { emoji: '🎯', title: 'Our Mission', text: 'Make premium accessories accessible and trustworthy for everyone in Pakistan.' },
            { emoji: '✅', title: 'Our Promise', text: 'Clear product details, fair prices, and transparent support at every step.' },
            { emoji: '⚡', title: 'Our Standards', text: 'Fast delivery workflows, quality checks, and customer-first communication.' },
          ].map((item) => (
            <article key={item.title} style={{ background: '#fff', border: '1.5px solid var(--gray-200)', borderRadius: '16px', padding: '20px' }}>
              <div style={{ fontSize: '26px', marginBottom: '8px' }}>{item.emoji}</div>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '22px', marginBottom: '8px' }}>{item.title}</h2>
              <p style={{ color: 'var(--gray-600)', fontSize: '14px', lineHeight: 1.65 }}>{item.text}</p>
            </article>
          ))}
        </section>

        <section style={{ marginTop: '20px', background: 'var(--purple-faint)', border: '1px solid rgba(108,68,255,.15)', borderRadius: '16px', padding: '22px' }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '24px', marginBottom: '8px' }}>Need help right now?</h2>
          <p style={{ color: 'var(--gray-700)', marginBottom: '14px' }}>
            Our support pages cover delivery, returns, payments, and account help.
          </p>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <Link to="/help" className="btn-primary">Open Help Center</Link>
            <Link to="/contact" style={{ padding: '10px 16px', borderRadius: '10px', border: '1.5px solid var(--gray-300)', textDecoration: 'none', color: 'var(--gray-700)', fontWeight: '600' }}>
              Contact Us
            </Link>
          </div>
        </section>
      </div>
    </>
  );
}
