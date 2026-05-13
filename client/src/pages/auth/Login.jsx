import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const user = await login(form.email, form.password);
      toast.success(`Welcome back, ${user.firstName}!`);
      navigate(`/${user.role}`);
    } catch (err) {
      const msg = err.response?.data?.message || 'Login failed';
      if (err.response?.data?.userId) {
        toast.error('Please verify your email first');
        navigate('/verify-otp', { state: { userId: err.response.data.userId } });
      } else {
        toast.error(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  const demoLogins = [
    { label: 'Admin', email: 'jayawardhanaridmi0125@gmail.com', password: '12345678rP@', color: '#6C63FF' },
    { label: 'Doctor', email: 'dr.fernando@evercare.com', password: 'Password@123', color: '#2A9D8F' },
    { label: 'Patient', email: 'john@example.com', password: 'Password@123', color: '#52B5E0' },
    { label: 'Receptionist', email: 'reception@evercare.com', password: 'Password@123', color: '#F4A261' },
    { label: 'Accountant', email: 'accounts@evercare.com', password: 'Password@123', color: '#81C784' },
  ];

  return (
    <div className="auth-wrapper">
      <div className="auth-illustration">
        <div style={{ textAlign: 'center', color: 'white', padding: 48 }}>
          <div style={{ fontSize: 80, marginBottom: 24 }}></div>
          <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: 60, marginBottom: 16, color: 'white' }}>EverCare</h2>
          <p style={{ fontSize: 40, opacity: 0.9, marginBottom: 8 }}>Medical Center</p>
          <p style={{ fontSize: 20, opacity: 0.75, maxWidth: 300, margin: '0 auto' }}>Comprehensive healthcare management for patients, doctors, and staff.</p>
          <div style={{ marginTop: 48, display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'center' }}>
            {['✓ Book appointments online', '✓ Manage patient records', '✓ Secure payment processing', '✓ Real-time notifications'].map(f => (
              <div key={f} style={{ background: 'rgba(255,255,255,0.15)', padding: '8px 20px', borderRadius: 20, fontSize: 13 }}>{f}</div>
            ))}
          </div>
        </div>
      </div>

      <div className="auth-panel">
        <div className="auth-logo">
          <h1>Welcome Back</h1>
          <p>Sign in to your EverCare account</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input className="form-control" type="email" placeholder="your@email.com" value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })} required />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <div style={{ position: 'relative' }}>
              <input className="form-control" type={showPass ? 'text' : 'password'} placeholder="••••••••" value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })} required style={{ paddingRight: 44 }} />
              <button type="button" onClick={() => setShowPass(!showPass)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 18 }}>
                {showPass ? '🙈' : '👁'}
              </button>
            </div>
          </div>
          <div style={{ textAlign: 'right', marginBottom: 20 }}>
            <Link to="/forgot-password" style={{ fontSize: 13, color: 'var(--primary)' }}>Forgot password?</Link>
          </div>
          <button type="submit" className="btn btn-primary btn-lg" disabled={loading} style={{ width: '100%', justifyContent: 'center' }}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: 20, fontSize: 14, color: 'var(--text-muted)' }}>
          New patient? <Link to="/register">Create account</Link>
        </p>

        <div style={{ marginTop: 32, padding: 16, background: 'var(--bg-main)', borderRadius: 12, border: '1px solid var(--border-light)' }}>
          <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: 'var(--text-muted)', marginBottom: 10 }}>Quick Demo Login</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {demoLogins.map(d => (
              <button key={d.label} onClick={() => setForm({ email: d.email, password: d.password })}
                style={{ padding: '5px 12px', borderRadius: 20, border: `1.5px solid ${d.color}`, background: 'transparent', color: d.color, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                {d.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
