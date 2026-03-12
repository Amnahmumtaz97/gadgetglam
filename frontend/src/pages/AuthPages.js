// SAVE EACH AS SEPARATE FILES IN YOUR PROJECT

// ── LoginPage.js ──────────────────────────────────────────
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import SEOHead from '../components/common/SEOHead';
import toast from 'react-hot-toast';

export function LoginPage() {
  const [form, setForm] = useState({ email: '', password: '' });
  const { login } = useAuth();
  const navigate   = useNavigate();

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
    <>
      <SEOHead title="Sign In | GadgetGlam" description="Sign into your GadgetGlam account." />
      <div style={styles.page}>
        <div style={styles.card}>
          <div style={styles.logo}>Gadget<span style={{color:'var(--purple-light)'}}>Glam</span></div>
          <h1 style={styles.heading}>Welcome Back</h1>
          <form onSubmit={handleSubmit} style={styles.form}>
            <label style={styles.label}>Email
              <input type="email" required style={styles.input} value={form.email}
                onChange={e => setForm(f => ({...f, email: e.target.value}))} placeholder="you@example.com" />
            </label>
            <label style={styles.label}>Password
              <input type="password" required style={styles.input} value={form.password}
                onChange={e => setForm(f => ({...f, password: e.target.value}))} placeholder="••••••••" />
            </label>
            <button type="submit" className="btn-primary" style={{width:'100%',padding:'14px'}}>Sign In</button>
          </form>
          <p style={{textAlign:'center',marginTop:'20px',fontSize:'14px',color:'var(--gray-500)'}}>
            Don't have an account? <Link to="/register" style={{color:'var(--purple)',fontWeight:'600'}}>Register</Link>
          </p>
        </div>
      </div>
    </>
  );
}

// ── RegisterPage.js ───────────────────────────────────────
export function RegisterPage() {
  const [form, setForm] = useState({ first_name:'', last_name:'', email:'', password:'' });
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await register(form);
      toast.success('Account created! Welcome to GadgetGlam 💜');
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    }
  };

  return (
    <>
      <SEOHead title="Create Account | GadgetGlam" description="Join GadgetGlam for the best phone accessories in Pakistan." />
      <div style={styles.page}>
        <div style={styles.card}>
          <div style={styles.logo}>Gadget<span style={{color:'var(--purple-light)'}}>Glam</span></div>
          <h1 style={styles.heading}>Create Account</h1>
          <form onSubmit={handleSubmit} style={styles.form}>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'12px'}}>
              <label style={styles.label}>First Name
                <input type="text" required style={styles.input} value={form.first_name}
                  onChange={e => setForm(f=>({...f,first_name:e.target.value}))} placeholder="Ali" />
              </label>
              <label style={styles.label}>Last Name
                <input type="text" required style={styles.input} value={form.last_name}
                  onChange={e => setForm(f=>({...f,last_name:e.target.value}))} placeholder="Khan" />
              </label>
            </div>
            <label style={styles.label}>Email
              <input type="email" required style={styles.input} value={form.email}
                onChange={e => setForm(f=>({...f,email:e.target.value}))} placeholder="you@example.com" />
            </label>
            <label style={styles.label}>Password
              <input type="password" required minLength={6} style={styles.input} value={form.password}
                onChange={e => setForm(f=>({...f,password:e.target.value}))} placeholder="Min 6 characters" />
            </label>
            <button type="submit" className="btn-primary" style={{width:'100%',padding:'14px'}}>Create Account</button>
          </form>
          <p style={{textAlign:'center',marginTop:'20px',fontSize:'14px',color:'var(--gray-500)'}}>
            Already have an account? <Link to="/login" style={{color:'var(--purple)',fontWeight:'600'}}>Sign In</Link>
          </p>
        </div>
      </div>
    </>
  );
}

const styles = {
  page:    { minHeight:'80vh', display:'flex', alignItems:'center', justifyContent:'center', padding:'40px 20px' },
  card:    { background:'#fff', borderRadius:'24px', padding:'48px', width:'100%', maxWidth:'440px', boxShadow:'0 8px 40px rgba(124,58,237,.12)', border:'1.5px solid var(--gray-200)' },
  logo:    { fontFamily:'var(--font-display)', fontSize:'28px', color:'var(--purple)', fontWeight:'900', textAlign:'center', marginBottom:'8px' },
  heading: { fontFamily:'var(--font-display)', fontSize:'24px', textAlign:'center', marginBottom:'28px', color:'var(--gray-900)' },
  form:    { display:'flex', flexDirection:'column', gap:'16px' },
  label:   { display:'flex', flexDirection:'column', gap:'5px', fontSize:'13px', fontWeight:'600', color:'var(--gray-700)' },
  input:   { border:'1.5px solid var(--gray-200)', borderRadius:'10px', padding:'11px 14px', fontFamily:'var(--font-body)', fontSize:'14px', outline:'none' }
};
