import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LockKeyhole, Mail, UserRound } from 'lucide-react';

const AUTH_HERO_IMAGE = '/assets/wireless-earbuds-with-neon-cyberpunk-style-lighting.jpg';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import SEOHead from '../components/common/SEOHead';
import OptimizedPicture from '../components/common/OptimizedPicture';
import toast from 'react-hot-toast';

export function LoginPage() {
  const [form, setForm] = useState({ email: '', password: '' });
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await login(form.email, form.password);
      toast.success('Welcome back!');
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
    }
  };

  return (
    <AuthShell
      title="Welcome Back"
      subtitle="Sign in to your GadgetGlam account and continue your premium gadget flow."
      seoTitle="Sign In | GadgetGlam"
    >
      <form onSubmit={handleSubmit} className="grid gap-4">
        <Field icon={Mail} label="Email">
          <input type="email" required value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} placeholder="you@example.com" className={inputClass} />
        </Field>
        <Field icon={LockKeyhole} label="Password">
          <input type="password" required value={form.password} onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))} placeholder="Enter your password" className={inputClass} />
        </Field>
        <button type="submit" className="mt-2 rounded-2xl bg-gradient-to-r from-[var(--accent-yellow)] via-[var(--accent-gold)] to-[var(--accent-gold)] px-5 py-4 text-sm font-bold text-on-accent shadow-[0_18px_44px_rgba(37,99,235,0.28)] transition hover:-translate-y-0.5 hover:shadow-[0_20px_54px_rgba(37,99,235,0.32)]">
          Sign In
        </button>
      </form>
      <p className="mt-6 text-center text-sm text-theme-muted">
        Do not have an account? <Link to="/register" className="font-bold text-[var(--accent-yellow)] hover:text-[var(--accent-gold)]">Register</Link>
      </p>
    </AuthShell>
  );
}

export function RegisterPage() {
  const [form, setForm] = useState({ first_name: '', last_name: '', email: '', password: '' });
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await register(form);
      toast.success('Account created! Welcome to GadgetGlam');
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    }
  };

  return (
    <AuthShell
      title="Create Account"
      subtitle="Join the premium gadget store for faster checkout, wishlist saves, and order tracking."
      seoTitle="Create Account | GadgetGlam"
    >
      <form onSubmit={handleSubmit} className="grid gap-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field icon={UserRound} label="First Name">
            <input type="text" required value={form.first_name} onChange={(e) => setForm((f) => ({ ...f, first_name: e.target.value }))} placeholder="Ali" className={inputClass} />
          </Field>
          <Field icon={UserRound} label="Last Name">
            <input type="text" required value={form.last_name} onChange={(e) => setForm((f) => ({ ...f, last_name: e.target.value }))} placeholder="Khan" className={inputClass} />
          </Field>
        </div>
        <Field icon={Mail} label="Email">
          <input type="email" required value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} placeholder="you@example.com" className={inputClass} />
        </Field>
        <Field icon={LockKeyhole} label="Password">
          <input type="password" required minLength={6} value={form.password} onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))} placeholder="Minimum 6 characters" className={inputClass} />
        </Field>
        <button type="submit" className="mt-2 rounded-2xl bg-gradient-to-r from-[var(--accent-yellow)] via-[var(--accent-gold)] to-[var(--accent-gold)] px-5 py-4 text-sm font-bold text-on-accent shadow-[0_18px_44px_rgba(37,99,235,0.28)] transition hover:-translate-y-0.5 hover:shadow-[0_20px_54px_rgba(37,99,235,0.32)]">
          Create Account
        </button>
      </form>
      <p className="mt-6 text-center text-sm text-theme-muted">
        Already have an account? <Link to="/login" className="font-bold text-[var(--accent-yellow)] hover:text-[var(--accent-gold)]">Sign In</Link>
      </p>
    </AuthShell>
  );
}

function AuthShell({ title, subtitle, seoTitle, children }) {
  return (
    <>
      <SEOHead title={seoTitle} description="Access your GadgetGlam account." />
      <div className="container page-shell">
        <div className="mx-auto grid max-w-6xl overflow-hidden rounded-[2.25rem] border border-theme bg-theme-panel shadow-card lg:grid-cols-[0.95fr_1.05fr]">
          <div className="relative hidden min-h-[620px] overflow-hidden border-r border-theme lg:block">
            <motion.div
              animate={{ scale: [1, 1.03, 1] }}
              transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute inset-0"
            >
              <OptimizedPicture
                src={AUTH_HERO_IMAGE}
                alt="Wireless earbuds with neon cyberpunk lighting"
                pictureClassName="block h-full w-full"
                className="h-full w-full object-cover object-center"
                loading="eager"
              />
            </motion.div>
            <div
              className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_30%,rgba(37,99,235,0.2),transparent_45%),linear-gradient(180deg,rgba(15,23,42,0.15)_0%,rgba(4,8,22,0.55)_55%,rgba(4,8,22,0.92)_100%)]"
              aria-hidden
            />
            <div className="absolute bottom-8 left-8 right-8 z-10 rounded-3xl border border-theme bg-theme-panel p-5 shadow-[0_18px_40px_rgba(2,6,23,0.35)] backdrop-blur-xl">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--accent-yellow)]/80">Secure customer hub</p>
              <h2 className="mt-3 text-3xl font-black text-theme">Luxury commerce, tuned for speed.</h2>
              <p className="mt-3 text-sm leading-6 text-theme-muted">Wishlist your favorite accessories, track orders, and move through checkout with a clean neon interface.</p>
            </div>
          </div>

          <div className="p-6 sm:p-10 lg:p-14">
            <Link to="/" className="text-2xl font-black tracking-tight text-theme">
              Gadget<span className="text-gradient">Glam</span>
            </Link>
            <h1 className="mt-12 text-4xl font-black tracking-tight text-theme">{title}</h1>
            <p className="mt-3 max-w-md text-sm leading-6 text-theme-muted">{subtitle}</p>
            <div className="mt-8">{children}</div>
          </div>
        </div>
      </div>
    </>
  );
}

function Field({ icon: Icon, label, children }) {
  return (
    <label className="block text-sm font-semibold text-theme-muted">
      <span className="mb-2 flex items-center gap-2"><Icon size={15} className="text-[var(--accent-yellow)]" /> {label}</span>
      {children}
    </label>
  );
}

const inputClass = 'input-theme w-full rounded-2xl px-4 py-3 transition';
