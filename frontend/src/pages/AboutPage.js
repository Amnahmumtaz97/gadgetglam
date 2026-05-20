import React from 'react';
import { Link } from 'react-router-dom';
import SEOHead from '../components/common/SEOHead';
import './AboutPage.css';

export default function AboutPage() {
  return (
    <>
      <SEOHead
        title="About Us"
        description="Learn about GadgetGlam, our mission, and why thousands of customers trust us for premium phone accessories in Pakistan."
        keywords="about gadgetglam, phone accessories pakistan, gadgetglam mission"
        canonical="https://www.gadgetglam.pk/about"
      />

      <div className="container about-shell">
        <section className="about-hero">
          <div className="about-eyebrow">About GadgetGlam</div>
          <h1 className="about-title">Built For People Who Love Their Phones</h1>
          <p className="about-lede">
            GadgetGlam is a Pakistan-focused phone accessories store built around one idea: quality should feel premium,
            look premium, and still stay affordable. From protective cases to fast chargers, we curate products that match
            daily needs, style, and reliability.
          </p>

          <div className="about-metrics">
            <div className="about-metric fade-up" style={{ animationDelay: '.05s' }}>
              <div className="about-metric-value">100%</div>
              <div className="about-metric-label">Accessory-first curation for practical daily use</div>
            </div>
            <div className="about-metric fade-up" style={{ animationDelay: '.12s' }}>
              <div className="about-metric-value">Fast</div>
              <div className="about-metric-label">Smooth browsing, checkout, and support workflows</div>
            </div>
            <div className="about-metric fade-up" style={{ animationDelay: '.19s' }}>
              <div className="about-metric-value">Pakistan</div>
              <div className="about-metric-label">Built for local customers, local delivery, and local payments</div>
            </div>
          </div>
        </section>

        <section className="about-grid">
          {[
            { emoji: '🎯', title: 'Our Mission', text: 'Make premium accessories accessible and trustworthy for everyone in Pakistan.' },
            { emoji: '✅', title: 'Our Promise', text: 'Clear product details, fair prices, and transparent support at every step.' },
            { emoji: '⚡', title: 'Our Standards', text: 'Fast delivery workflows, quality checks, and customer-first communication.' },
          ].map((item) => (
            <article key={item.title} className="about-card">
              <div className="about-card-emoji">{item.emoji}</div>
              <h2 className="about-card-title">{item.title}</h2>
              <p className="about-card-text">{item.text}</p>
            </article>
          ))}
        </section>

        <section className="about-story">
          <article className="about-story-panel">
            <div className="about-section-kicker">Why We Exist</div>
            <h2 className="about-section-title">A better accessories store should be easier to trust.</h2>
            <p className="about-section-text">
              We focus on a clean buying experience, product clarity, and support that actually answers the question.
              That means the right accessory categories, useful product details, and a checkout journey that feels calm,
              fast, and dependable.
            </p>
            <div className="about-bullet-list">
              <div className="about-bullet">
                <div className="about-bullet-dot" />
                <div>
                  <strong>Curated accessories</strong>
                  <span>Cases, chargers, cables, and other daily essentials selected for real-world use.</span>
                </div>
              </div>
              <div className="about-bullet">
                <div className="about-bullet-dot" />
                <div>
                  <strong>Simple support</strong>
                  <span>Order help, payment support, returns guidance, and account help in one place.</span>
                </div>
              </div>
              <div className="about-bullet">
                <div className="about-bullet-dot" />
                <div>
                  <strong>Built for trust</strong>
                  <span>Transparent product information and a consistent experience from browsing to delivery.</span>
                </div>
              </div>
            </div>
          </article>

          <aside className="about-cta-panel">
            <div>
              <div className="about-section-kicker">Need help right now?</div>
              <p className="about-cta-copy">
                Our support pages cover delivery, returns, payments, and account help. If you need something fast, start there.
              </p>
            </div>

            <div>
              <div className="about-actions">
                <Link to="/help" className="btn-primary">Open Help Center</Link>
                <Link to="/contact" className="about-secondary-link">Contact Us</Link>
              </div>
              <div className="about-quote">
                “Good accessories should solve a problem and still feel good to own.”
                <span>That idea shapes how GadgetGlam is built.</span>
              </div>
            </div>
          </aside>
        </section>
      </div>
    </>
  );
}
