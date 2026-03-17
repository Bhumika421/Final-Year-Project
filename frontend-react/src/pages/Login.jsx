import { useState } from 'react';
import { api, saveToken, setAuthToken } from '../api/client';
import { useNavigate, Link } from 'react-router-dom';
import { mdiEye, mdiEyeOff } from '@mdi/js';

export default function Login() {
  const nav = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setMsg('');
    setLoading(true);
    try {
      const res = await api.post('/api/auth/login', { email, password, login_as: 'customer' });

      // token fix — backend le kun naam le pathaunu ni handle garcha
      const token = res.data.token || res.data.access_token || res.data.jwt || res.data.data?.token;
      if (token) {
        saveToken(token);
        setAuthToken(token);
      }

      const user = res.data.user || res.data.data?.user || { email, role: 'customer' };
      localStorage.setItem('user', JSON.stringify(user));
      window.dispatchEvent(new Event('auth-change'));

      nav('/');
    } catch (e) {
      setMsg(e?.response?.data?.error || e?.response?.data?.message || 'Login failed. Check your email and password.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=DM+Sans:wght@300;400;500;600&display=swap');
        .auth-wrap { min-height: 80vh; display: grid; place-items: center; padding: 40px 16px; font-family: 'DM Sans', sans-serif; }
        .auth-box { width: min(460px, 100%); background: #131918; border: 1px solid rgba(255,255,255,0.07); border-radius: 24px; padding: 36px 32px; }
        .auth-tag { font-size: 11px; font-weight: 600; letter-spacing: 0.12em; text-transform: uppercase; color: #a8d96b; margin-bottom: 10px; }
        .auth-title { font-family: 'Playfair Display', serif; font-size: 28px; font-weight: 700; color: #fff; margin: 0 0 6px; }
        .auth-sub { font-size: 13px; color: rgba(240,237,232,0.45); margin: 0 0 28px; }
        .auth-label { font-size: 11px; font-weight: 600; color: rgba(240,237,232,0.4); margin-bottom: 6px; letter-spacing: 0.1em; text-transform: uppercase; display: block; }
        .auth-input { width: 100%; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.08); border-radius: 12px; padding: 12px 14px; color: #f0ede8; font-family: 'DM Sans', sans-serif; font-size: 14px; outline: none; transition: border-color 0.2s; box-sizing: border-box; margin-bottom: 16px; }
        .auth-input:focus { border-color: rgba(168,217,107,0.5); background: rgba(168,217,107,0.04); }
        .auth-input::placeholder { color: rgba(240,237,232,0.2); }
        .auth-btn { width: 100%; background: #a8d96b; color: #1a2010; border: none; border-radius: 100px; padding: 14px; font-family: 'DM Sans', sans-serif; font-size: 15px; font-weight: 700; cursor: pointer; transition: background 0.2s, transform 0.15s; margin-top: 4px; }
        .auth-btn:hover:not(:disabled) { background: #c1e88d; transform: scale(1.02); }
        .auth-btn:disabled { opacity: 0.6; cursor: not-allowed; }
        .auth-err { background: rgba(248,113,113,0.08); border: 1px solid rgba(248,113,113,0.2); color: #f87171; border-radius: 12px; padding: 11px 14px; font-size: 13px; margin-bottom: 18px; }
        .auth-divider { height: 1px; background: rgba(255,255,255,0.07); margin: 22px 0; }
        .auth-links { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px; }
        .auth-link { font-size: 13px; color: #a8d96b; text-decoration: none; font-weight: 500; }
        .auth-link:hover { text-decoration: underline; }
        .auth-small-links { display: flex; gap: 16px; }
        .password-field-wrapper { position: relative; display: flex; align-items: center; justify-content: center; }
        .password-toggle-btn { position: absolute; right: 14px; background: none; border: none; color: rgba(240,237,232,0.5); cursor: pointer; font-size: 18px; padding: 0; display: flex; align-items: center; justify-content: center; height: 100%; transition: color 0.2s; bottom: 8px; }
        .password-toggle-btn:hover { color: rgba(240,237,232,0.8); }
      `}</style>

      <div className="auth-wrap">
        <div className="auth-box"> 
          <div className="auth-tag">👤 Customer Portal</div>
          <h1 className="auth-title">Welcome back</h1>
          <p className="auth-sub">Login to access your bookings, wishlist and dashboard.</p>

          {msg && <div className="auth-err">{msg}</div>}

          <form onSubmit={submit}>
            <label className="auth-label">Email</label>
            <input className="auth-input" type="email" placeholder="you@email.com" value={email} onChange={e => setEmail(e.target.value)} required />

            <label className="auth-label">Password</label>
            <div className="password-field-wrapper">
              <input className="auth-input" type={showPassword ? 'text' : 'password'} placeholder="Your password" value={password} onChange={e => setPassword(e.target.value)} required />
              <button type="button" className="password-toggle-btn" onClick={() => setShowPassword(!showPassword)}>
                <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                  <path d={showPassword ? mdiEye : mdiEyeOff} />
                </svg>
              </button>
            </div>

            <button className="auth-btn" type="submit" disabled={loading}>
              {loading ? 'Logging in...' : 'Log in'}
            </button>
          </form>

          <div className="auth-divider" />
          <div className="auth-links">
            <Link className="auth-link" to="/signup">Create account →</Link>
            <div className="auth-small-links">
              <Link className="auth-link" to="/agency-login">Agency</Link>
              <Link className="auth-link" to="/admin-login">Admin</Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
