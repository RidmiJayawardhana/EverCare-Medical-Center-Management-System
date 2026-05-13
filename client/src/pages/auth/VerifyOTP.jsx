import { useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import toast from 'react-hot-toast';

export function VerifyOTP() {
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const { state } = useLocation();
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.post('/auth/verify-otp', { userId: state?.userId, otp });
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      toast.success('Email verified! Welcome to EverCare.');
      navigate(`/${data.user.role}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  const resend = async () => {
    try {
      await api.post('/auth/resend-otp', { userId: state?.userId });
      toast.success('OTP resent — check server console');
    } catch { toast.error('Failed to resend'); }
  };

  return (
    <div className="auth-wrapper flex-center" style={{ flexDirection: 'column' }}>
      <div style={{ background: 'white', padding: 48, borderRadius: 20, maxWidth: 420, width: '100%', boxShadow: 'var(--shadow-lg)', textAlign: 'center' }}>
        <div style={{ fontSize: 56, marginBottom: 16 }}>📧</div>
        <h2 style={{ marginBottom: 8 }}>Verify Your Email</h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: 8, fontSize: 14 }}>
          {state?.email ? `OTP sent to ${state.email}` : 'Check your email for the 6-digit OTP'}
        </p>
        <p style={{ color: 'var(--primary)', fontSize: 13, marginBottom: 28 }}>In mock mode — check the server console for OTP</p>
        <form onSubmit={handleSubmit}>
          <input className="form-control" placeholder="Enter 6-digit OTP" value={otp} onChange={e => setOtp(e.target.value)} maxLength={6} style={{ textAlign: 'center', fontSize: 24, letterSpacing: 8, marginBottom: 20 }} required />
          <button type="submit" className="btn btn-primary btn-lg" disabled={loading} style={{ width: '100%', justifyContent: 'center' }}>
            {loading ? 'Verifying...' : 'Verify OTP'}
          </button>
        </form>
        <button onClick={resend} style={{ marginTop: 16, background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontSize: 14 }}>
          Resend OTP
        </button>
        <div style={{ marginTop: 16 }}><Link to="/login" style={{ fontSize: 13, color: 'var(--text-muted)' }}>← Back to Login</Link></div>
      </div>
    </div>
  );
}

export function ForgotPassword() {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({ email: '', userId: '', otp: '', password: '', confirmPassword: '' });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const sendOTP = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.post('/auth/forgot-password', { email: form.email });
      setForm(f => ({ ...f, userId: data.userId }));
      toast.success('OTP sent — check server console');
      setStep(2);
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setLoading(false); }
  };

  const resetPass = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) return toast.error('Passwords do not match');
    setLoading(true);
    try {
      const { data } = await api.post('/auth/reset-password', { userId: form.userId, otp: form.otp, password: form.password });
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      toast.success('Password reset!');
      navigate(`/${data.user.role}`);
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setLoading(false); }
  };

  return (
    <div className="auth-wrapper flex-center">
      <div style={{ background: 'white', padding: 48, borderRadius: 20, maxWidth: 420, width: '100%', boxShadow: 'var(--shadow-lg)' }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🔐</div>
          <h2>Reset Password</h2>
        </div>
        {step === 1 ? (
          <form onSubmit={sendOTP}>
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input className="form-control" type="email" placeholder="your@email.com" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />
            </div>
            <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: '100%', justifyContent: 'center' }}>
              {loading ? 'Sending...' : 'Send OTP'}
            </button>
          </form>
        ) : (
          <form onSubmit={resetPass}>
            <div className="form-group">
              <label className="form-label">OTP (check server console)</label>
              <input className="form-control" placeholder="6-digit OTP" value={form.otp} onChange={e => setForm({ ...form, otp: e.target.value })} required />
            </div>
            <div className="form-group">
              <label className="form-label">New Password</label>
              <input className="form-control" type="password" placeholder="Min 8 characters" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required />
            </div>
            <div className="form-group">
              <label className="form-label">Confirm Password</label>
              <input className="form-control" type="password" value={form.confirmPassword} onChange={e => setForm({ ...form, confirmPassword: e.target.value })} required />
            </div>
            <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: '100%', justifyContent: 'center' }}>
              {loading ? 'Resetting...' : 'Reset Password'}
            </button>
          </form>
        )}
        <div style={{ textAlign: 'center', marginTop: 16 }}><Link to="/login" style={{ fontSize: 13, color: 'var(--text-muted)' }}>← Back to Login</Link></div>
      </div>
    </div>
  );
}

export default VerifyOTP;
