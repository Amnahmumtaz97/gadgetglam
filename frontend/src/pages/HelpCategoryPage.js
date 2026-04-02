import React from 'react';
import { Link, useParams } from 'react-router-dom';
import SEOHead from '../components/common/SEOHead';

const HELP_CONTENT = {
  'orders-and-tracking': {
    title: 'Orders & Tracking',
    description: 'How tracking works and what each order status means.',
    points: [
      'Pending: Order created and awaiting confirmation.',
      'Confirmed: Order verified and prepared for dispatch.',
      'Dispatched: Parcel handed over to courier.',
      'Delivered: Order reached your address successfully.',
      'Status auto-updates happen in timed intervals while your order is active.'
    ]
  },
  payments: {
    title: 'Payments',
    description: 'Available payment methods and common payment issues.',
    points: [
      'Accepted methods: Cash on Delivery, JazzCash, EasyPaisa.',
      'Ensure mobile wallet details are correct during checkout.',
      'If payment succeeds but status appears delayed, refresh after a short wait.',
      'For failed wallet transactions, verify balance and network response.'
    ]
  },
  'returns-and-refunds': {
    title: 'Returns & Refunds',
    description: 'When returns are accepted and how refunds are processed.',
    points: [
      'Raise return request within 7 days for eligible products.',
      'Item should be in original condition where possible.',
      'Refunds are processed after return verification.',
      'Delivery damage or wrong-item cases are prioritized.'
    ]
  },
  'account-and-security': {
    title: 'Account & Security',
    description: 'Keep your account safe and updated.',
    points: [
      'Use a strong password and avoid sharing credentials.',
      'Update profile details to avoid delivery delays.',
      'Log out from shared devices after checkout.',
      'Contact support if you suspect unauthorized activity.'
    ]
  },
  privacy: {
    title: 'Privacy Policy',
    description: 'How customer data is collected and used.',
    points: [
      'We collect only necessary order and account information.',
      'Payment credentials are processed through selected payment providers.',
      'Customer data is used for fulfillment, support, and service improvements.',
      'You can request correction of profile information via support.'
    ]
  },
  terms: {
    title: 'Terms of Service',
    description: 'Rules and conditions for using GadgetGlam.',
    points: [
      'Product availability and pricing may change without prior notice.',
      'Orders may be cancelled due to verification or stock constraints.',
      'Misuse of platform or fraudulent activity may lead to account restriction.',
      'By placing an order, you agree to store policies and delivery terms.'
    ]
  }
};

export default function HelpCategoryPage({ forcedCategory }) {
  const { category } = useParams();
  const categoryKey = forcedCategory || category;
  const content = HELP_CONTENT[categoryKey];

  if (!content) {
    return (
      <div className="container" style={{ padding: '40px 0 80px' }}>
        <h1 style={{ fontFamily: 'var(--font-display)', marginBottom: '12px' }}>Help Topic Not Found</h1>
        <p style={{ color: 'var(--gray-600)', marginBottom: '16px' }}>This help category does not exist.</p>
        <Link to="/help" className="btn-primary">Back to Help Center</Link>
      </div>
    );
  }

  return (
    <>
      <SEOHead
        title={`${content.title} Help`}
        description={content.description}
        keywords={`gadgetglam ${content.title.toLowerCase()}, help, support`}
        canonical={`https://www.gadgetglam.pk/help/${categoryKey}`}
      />

      <div className="container" style={{ padding: '42px 0 84px' }}>
        <Link to="/help" style={{ display: 'inline-block', marginBottom: '12px', color: 'var(--purple)', textDecoration: 'none', fontWeight: '700' }}>
          ← Back to Help Center
        </Link>

        <article style={{ background: '#fff', border: '1.5px solid var(--gray-200)', borderRadius: '16px', padding: '22px' }}>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '34px', marginBottom: '10px' }}>{content.title}</h1>
          <p style={{ color: 'var(--gray-600)', marginBottom: '16px' }}>{content.description}</p>
          <ul style={{ paddingLeft: '18px', margin: 0, color: 'var(--gray-700)', lineHeight: 1.75 }}>
            {content.points.map((point) => (
              <li key={point}>{point}</li>
            ))}
          </ul>
        </article>
      </div>
    </>
  );
}
