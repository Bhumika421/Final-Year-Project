import { useState } from 'react';
import { api, saveToken, setAuthToken } from '../api/client';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { mdiEye, mdiEyeOff } from '@mdi/js';
import { useGoogleLogin } from '@react-oauth/google';

export default function Login() {
  const nav = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(false);

  // ✅ useGoogleLogin hook — fully custom button
  const googleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setMsg('');
      setLoading(true);
      try {
        // Get user info from Google using access token
        const userInfo = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${tokenResponse.access_token}` }
        }).then(r => r.json());

        const res = await api.post('/api/auth/google-login', {
          token: tokenResponse.access_token,
          user_info: userInfo
        });

        if (res.data.success) {
          saveToken(res.data.token);
          setAuthToken(res.data.token);
          localStorage.setItem('user', JSON.stringify(res.data.user));
          window.dispatchEvent(new Event('auth-change'));
          const from = location.state?.from || '/dashboard';
          nav(from, { replace: true });
        } else {
          setMsg(res.data.message || 'Google login failed.');
        }
      } catch (e) {
        console.error('Google login error:', e);
        setMsg('Google login failed. Please try again.');
      } finally {
        setLoading(false);
      }
    },
    onError: () => setMsg('Google login failed. Please try again.')
  });

  async function submit(e) {
    e.preventDefault();
    setMsg('');
    setLoading(true);
    try {
      const res = await api.post('/api/auth/login', { email, password, login_as: 'customer' });
      const token = res.data.token || res.data.access_token || res.data.jwt || res.data.data?.token;
      const user  = res.data.user  || res.data.data?.user  || { email, role: 'customer' };
      if (token) { saveToken(token); setAuthToken(token); }
      localStorage.setItem('user', JSON.stringify(user));
      window.dispatchEvent(new Event('auth-change'));
      const from = location.state?.from || '/dashboard';
      nav(from, { replace: true });
    } catch (e) {
      setMsg(e?.response?.data?.error || e?.response?.data?.message || 'Login failed.');
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
        .password-toggle-btn { position: absolute; right: 14px; background: none; border: none; color: rgba(240,237,232,0.5); cursor: pointer; padding: 0; display: flex; align-items: center; justify-content: center; height: 100%; transition: color 0.2s; bottom: 8px; }
        .password-toggle-btn:hover { color: rgba(240,237,232,0.8); }
        .or-text { text-align: center; font-size: 12px; color: rgba(240,237,232,0.3); margin: 18px 0 12px; letter-spacing: 0.08em; text-transform: uppercase; }
        .google-btn { display: flex; align-items: center; justify-content: center; gap: 10px; width: 100%; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.15); border-radius: 100px; padding: 12px 24px; color: #f0ede8; font-size: 14px; font-weight: 600; cursor: pointer; transition: background 0.2s, border-color 0.2s; font-family: 'DM Sans', sans-serif; }
        .google-btn:hover { background: rgba(255,255,255,0.09); border-color: rgba(255,255,255,0.25); }
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

          {/*  Clean custom Google button */}
          <div className="or-text">or continue with</div>
          <button type="button" className="google-btn" onClick={() => googleLogin()} disabled={loading}>
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </button>

          <div className="auth-divider" />
          <div className="auth-links">
            <Link className="auth-link" to="/signup">Create account →</Link>
            <div className="auth-small-links">
              <Link className="auth-link" to="/agency-login">Agency login</Link>
              <Link className="auth-link" to="/admin-login">Admin login</Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}