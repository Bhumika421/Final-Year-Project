import { useState } from 'react';
import { api } from '../api/client';
import { useNavigate, Link } from 'react-router-dom';

export default function Signup() {
  const nav = useNavigate();
  const [form, setForm] = useState({ full_name: '', email: '', phone: '', address: '', password: '', confirm_password: '' });
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  function set(k, v) { setForm(prev => ({ ...prev, [k]: v })); }

  async function submit(e) {
    e.preventDefault();
    setMsg('');
    if (form.password !== form.confirm_password) { setMsg('Passwords do not match!'); return; }
    if (form.password.length < 8) { setMsg('Password must be at least 8 characters.'); return; }
    setLoading(true);
    try {
      await api.post('/api/auth/register', form);
      setSuccess(true);
      setTimeout(() => nav('/login'), 2000);
    } catch (e) {
      setMsg(e?.response?.data?.error || 'Signup failed. Try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=DM+Sans:wght@300;400;500;600&display=swap');
        .auth-wrap { min-height: 80vh; display: grid; place-items: center; padding: 40px 16px; font-family: 'DM Sans', sans-serif; }
        .auth-box { width: min(540px, 100%); background: #131918; border: 1px solid rgba(255,255,255,0.08); border-radius: 24px; padding: 36px 32px; }
        .auth-tag { font-size: 11px; font-weight: 600; letter-spacing: 0.12em; text-transform: uppercase; color: #a8d96b; margin-bottom: 10px; }
        .auth-title { font-family: 'Playfair Display', serif; font-size: 28px; font-weight: 700; color: #fff; margin: 0 0 6px; }
        .auth-sub { font-size: 13px; color: rgba(240,237,232,0.45); margin: 0 0 28px; }
        .auth-row { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
        .auth-group { margin-bottom: 16px; }
        .auth-label { font-size: 12px; font-weight: 600; color: rgba(240,237,232,0.5); margin-bottom: 6px; letter-spacing: 0.05em; text-transform: uppercase; display: block; }
        .auth-input { width: 100%; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; padding: 12px 14px; color: #f0ede8; font-family: 'DM Sans', sans-serif; font-size: 14px; outline: none; transition: border-color 0.2s; box-sizing: border-box; }
        .auth-input:focus { border-color: rgba(168,217,107,0.5); }
        .auth-input::placeholder { color: rgba(240,237,232,0.25); }
        .auth-hint { font-size: 11px; color: rgba(240,237,232,0.35); margin-top: 5px; }
        .auth-btn { width: 100%; background: #a8d96b; color: #1a2010; border: none; border-radius: 100px; padding: 14px; font-family: 'DM Sans', sans-serif; font-size: 15px; font-weight: 700; cursor: pointer; transition: background 0.2s; margin-top: 8px; }
        .auth-btn:hover:not(:disabled) { background: #c1e88d; }
        .auth-btn:disabled { opacity: 0.6; cursor: not-allowed; }
        .auth-err { background: rgba(248,113,113,0.1); border: 1px solid rgba(248,113,113,0.25); color: #f87171; border-radius: 12px; padding: 11px 14px; font-size: 13px; margin-bottom: 18px; }
        .auth-ok { background: rgba(168,217,107,0.1); border: 1px solid rgba(168,217,107,0.3); color: #a8d96b; border-radius: 12px; padding: 11px 14px; font-size: 13px; margin-bottom: 18px; }
        .auth-divider { height: 1px; background: rgba(255,255,255,0.07); margin: 20px 0; }
        .auth-links { display: flex; justify-content: center; }
        .auth-link { font-size: 13px; color: #a8d96b; text-decoration: none; }
        .auth-link:hover { text-decoration: underline; }
        @media (max-width: 480px) { .auth-row { grid-template-columns: 1fr; } }
      `}</style>

      <div className="auth-wrap">
        <div className="auth-box">
          <div className="auth-tag">🏔 Join Safe Journey</div>
          <h1 className="auth-title">Create account</h1>
          <p className="auth-sub">Sign up to book tours, save favorites and track your trips.</p>

          {msg && <div className="auth-err">{msg}</div>}
          {success && <div className="auth-ok">✅ Account created! Redirecting to login...</div>}

          {!success && (
            <form onSubmit={submit}>
              <div className="auth-row">
                <div className="auth-group">
                  <label className="auth-label">Full Name</label>
                  <input className="auth-input" placeholder="Ram Sharma" value={form.full_name} onChange={e => set('full_name', e.target.value)} required />
                </div>
                <div className="auth-group">
                  <label className="auth-label">Phone (optional)</label>
                  <input className="auth-input" placeholder="98XXXXXXXX" value={form.phone} onChange={e => set('phone', e.target.value)} />
                </div>
              </div>

              <div className="auth-row">
                <div className="auth-group">
                  <label className="auth-label">Email</label>
                  <input className="auth-input" type="email" placeholder="you@email.com" value={form.email} onChange={e => set('email', e.target.value)} required />
                </div>
                <div className="auth-group">
                  <label className="auth-label">Address (optional)</label>
                  <input className="auth-input" placeholder="Kathmandu" value={form.address} onChange={e => set('address', e.target.value)} />
                </div>
              </div>

              <div className="auth-row">
                <div className="auth-group">
                  <label className="auth-label">Password</label>
                  <input className="auth-input" type="password" placeholder="Min. 8 characters" value={form.password} onChange={e => set('password', e.target.value)} required />
                  <div className="auth-hint">Use upper/lower/number/special</div>
                </div>
                <div className="auth-group">
                  <label className="auth-label">Confirm Password</label>
                  <input className="auth-input" type="password" placeholder="Repeat password" value={form.confirm_password} onChange={e => set('confirm_password', e.target.value)} required />
                </div>
              </div>

              <button className="auth-btn" type="submit" disabled={loading}>
                {loading ? 'Creating account...' : 'Create Account'}
              </button>
            </form>
          )}

          <div className="auth-divider" />
          <div className="auth-links">
            <Link className="auth-link" to="/login">Already have an account? Log in →</Link>
          </div>
        </div>
      </div>
    </>
  );
}
