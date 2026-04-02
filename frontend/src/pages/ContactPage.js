import React, { useState } from 'react';
import SEOHead from '../components/common/SEOHead';
import toast from 'react-hot-toast';

const initialForm = { name: '', email: '', subject: '', message: '' };

export default function ContactPage() {
  const [form, setForm] = useState(initialForm);
  const [submitting, setSubmitting] = useState(false);

  const onChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim() || !form.message.trim()) {
      toast.error('Please fill in name, email, and message.');
      return;
    }

    setSubmitting(true);
    setTimeout(() => {
      toast.success('Thanks! Your message has been received.');
      setForm(initialForm);
      setSubmitting(false);
    }, 800);
  };

  return (
    <>
      <SEOHead
        title="Contact Us"
        description="Contact GadgetGlam support for help with orders, delivery, returns, and product assistance."
        keywords="contact gadgetglam, customer support pakistan, order help"
        canonical="https://www.gadgetglam.pk/contact"
      />

      <div className="container" style={{ padding: '42px 0 84px' }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '36px', marginBottom: '10px' }}>Contact Us</h1>
        <p style={{ color: 'var(--gray-600)', marginBottom: '24px' }}>
          Reach out for order support, payment issues, or product questions.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: '1.1fr .9fr', gap: '20px' }}>
          <form onSubmit={onSubmit} style={{ background: '#fff', border: '1.5px solid var(--gray-200)', borderRadius: '16px', padding: '20px' }}>
            <div style={{ display: 'grid', gap: '12px' }}>
              <input name="name" value={form.name} onChange={onChange} placeholder="Your name" style={inputStyle} />
              <input name="email" value={form.email} onChange={onChange} placeholder="Your email" style={inputStyle} />
              <input name="subject" value={form.subject} onChange={onChange} placeholder="Subject" style={inputStyle} />
              <textarea name="message" value={form.message} onChange={onChange} rows={6} placeholder="Write your message" style={{ ...inputStyle, resize: 'vertical' }} />
            </div>

            <button type="submit" className="btn-primary" style={{ marginTop: '14px', minWidth: '150px', opacity: submitting ? 0.7 : 1 }} disabled={submitting}>
              {submitting ? 'Sending...' : 'Send Message'}
            </button>
          </form>

          <aside style={{ display: 'grid', gap: '12px' }}>
            <InfoCard title="Customer Support" body="Email: support@gadgetglam.pk" />
            <InfoCard title="Phone" body="+92 300 0000000" />
            <InfoCard title="Support Hours" body="Monday to Saturday, 10:00 AM - 8:00 PM" />
            <InfoCard title="Address" body="Lahore, Pakistan" />
          </aside>
        </div>
      </div>
    </>
  );
}

function InfoCard({ title, body }) {
  return (
    <div style={{ background: '#fff', border: '1.5px solid var(--gray-200)', borderRadius: '14px', padding: '16px' }}>
      <h2 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '6px' }}>{title}</h2>
      <p style={{ color: 'var(--gray-600)', fontSize: '14px' }}>{body}</p>
    </div>
  );
}

const inputStyle = {
  width: '100%',
  border: '1.5px solid var(--gray-200)',
  borderRadius: '10px',
  padding: '10px 12px',
  fontSize: '14px',
  outline: 'none',
  fontFamily: 'inherit',
  boxSizing: 'border-box'
};
