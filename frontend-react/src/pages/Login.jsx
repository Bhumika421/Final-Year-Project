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

  const googleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setMsg('');
      setLoading(true);
      try {
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
          nav(location.state?.from || '/dashboard', { replace: true });
        } else {
          setMsg(res.data.message || 'Google login failed.');
        }
      } catch (e) {
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
      nav(location.state?.from || '/dashboard', { replace: true });
    } catch (e) {
      setMsg(e?.response?.data?.error || e?.response?.data?.message || 'Login failed.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;1,600&family=DM+Sans:wght@300;400;500;600&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        .lp-root {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 40px 16px;
          font-family: 'DM Sans', sans-serif;
          background: #0d1410;
        }

        .lp-card {
          display: flex;
          flex-direction: row;
          width: min(960px, 100%);
          min-height: 580px;
          border-radius: 28px;
          overflow: hidden;
          box-shadow: 0 40px 100px rgba(0,0,0,0.55);
          border: 1px solid rgba(255,255,255,0.06);
        }

        /* ══ LEFT — Image ══ */
        .lp-img-side {
          flex: 1;
          position: relative;
          display: none;
          overflow: hidden;
        }
        @media(min-width:700px){ .lp-img-side { display: flex; } }

        .lp-img-side img {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          object-position: center;
          display: block;
        }

        .lp-img-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(
            135deg,
            rgba(10,20,13,0.2) 0%,
            rgba(10,20,13,0.55) 100%
          );
          z-index: 1;
        }

        .lp-img-text {
          position: relative;
          z-index: 2;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          width: 100%;
          padding: 40px 36px;
          text-align: center;
        }

        .lp-img-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: rgba(168,217,107,0.15);
          border: 1px solid rgba(168,217,107,0.3);
          color: #a8d96b;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.13em;
          text-transform: uppercase;
          padding: 5px 14px;
          border-radius: 100px;
          margin-bottom: 20px;
        }

        .lp-img-quote {
          font-family: 'Playfair Display', serif;
          font-size: clamp(22px, 2.8vw, 34px);
          font-weight: 700;
          color: #fff;
          line-height: 1.25;
          text-shadow: 0 4px 24px rgba(0,0,0,0.4);
          margin-bottom: 20px;
          text-transform: uppercase;
          letter-spacing: 0.02em;
        }

        .lp-img-quote em {
          font-style: italic;
          color: #c1e88d;
          display: block;
          text-transform: none;
          font-size: 0.85em;
          letter-spacing: 0;
          margin-top: 4px;
        }

        .lp-img-dots {
          display: flex;
          justify-content: center;
          gap: 8px;
          margin-top: 8px;
        }

        .lp-img-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: rgba(255,255,255,0.3);
        }
        .lp-img-dot.active {
          background: #a8d96b;
          width: 20px;
          border-radius: 3px;
        }

        /* ══ RIGHT — Form ══ */
        .lp-form-side {
          width: 400px;
          flex-shrink: 0;
          background: #111815;
          padding: 52px 44px;
          display: flex;
          flex-direction: column;
          justify-content: center;
          overflow-y: auto;
        }
        @media(max-width:699px){ .lp-form-side { width: 100%; padding: 40px 28px; } }

        .lp-logo {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 36px;
        }

        .lp-logo-icon {
          width: 32px;
          height: 32px;
          background: #a8d96b;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 16px;
        }

        .lp-logo-text {
          font-family: 'Playfair Display', serif;
          font-size: 15px;
          font-weight: 700;
          color: #f0ede8;
        }

        .lp-title {
          font-family: 'Playfair Display', serif;
          font-size: 27px;
          font-weight: 700;
          color: #f0ede8;
          margin-bottom: 6px;
        }

        .lp-sub {
          font-size: 13px;
          color: rgba(240,237,232,0.38);
          margin-bottom: 30px;
          line-height: 1.5;
        }

        .lp-err {
          background: rgba(248,113,113,0.08);
          border: 1px solid rgba(248,113,113,0.18);
          color: #f87171;
          border-radius: 10px;
          padding: 10px 13px;
          font-size: 12.5px;
          margin-bottom: 16px;
        }

        .lp-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 6px;
        }

        .lp-lbl {
          font-size: 10px;
          font-weight: 700;
          color: rgba(240,237,232,0.32);
          letter-spacing: 0.1em;
          text-transform: uppercase;
        }

        .lp-fgt {
          font-size: 11px;
          color: #a8d96b;
          text-decoration: none;
          font-weight: 500;
        }
        .lp-fgt:hover { text-decoration: underline; }

        .lp-input {
          width: 100%;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 10px;
          padding: 12px 14px;
          color: #f0ede8;
          font-family: 'DM Sans', sans-serif;
          font-size: 13.5px;
          outline: none;
          transition: border-color 0.2s, background 0.2s;
          margin-bottom: 14px;
          width: 100%;
        }
        .lp-input:focus {
          border-color: rgba(168,217,107,0.4);
          background: rgba(168,217,107,0.025);
        }
        .lp-input::placeholder { color: rgba(240,237,232,0.16); }

        .lp-pw { position: relative; }
        .lp-eye {
          position: absolute;
          right: 12px;
          top: 50%;
          transform: translateY(-70%);
          background: none;
          border: none;
          color: rgba(240,237,232,0.3);
          cursor: pointer;
          padding: 0;
          display: flex;
        }
        .lp-eye:hover { color: rgba(240,237,232,0.65); }

        .lp-btn {
          width: 100%;
          background: #a8d96b;
          color: #1a2010;
          border: none;
          border-radius: 100px;
          padding: 13px;
          font-family: 'DM Sans', sans-serif;
          font-size: 14.5px;
          font-weight: 700;
          cursor: pointer;
          transition: background 0.2s, transform 0.15s;
          margin-top: 4px;
        }
        .lp-btn:hover:not(:disabled) { background: #bfe87a; transform: scale(1.015); }
        .lp-btn:disabled { opacity: 0.55; cursor: not-allowed; }

        .lp-or {
          display: flex;
          align-items: center;
          gap: 10px;
          margin: 16px 0;
          color: rgba(240,237,232,0.18);
          font-size: 10px;
          letter-spacing: 0.1em;
          text-transform: uppercase;
        }
        .lp-or::before, .lp-or::after {
          content: '';
          flex: 1;
          height: 1px;
          background: rgba(255,255,255,0.06);
        }

        .lp-google {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 9px;
          width: 100%;
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.09);
          border-radius: 100px;
          padding: 11px 18px;
          color: #f0ede8;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.2s, border-color 0.2s;
          font-family: 'DM Sans', sans-serif;
        }
        .lp-google:hover { background: rgba(255,255,255,0.07); border-color: rgba(255,255,255,0.16); }

        .lp-hr { height: 1px; background: rgba(255,255,255,0.06); margin: 20px 0; }

        .lp-bottom {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 8px;
        }

        .lp-link {
          font-size: 12px;
          color: #a8d96b;
          text-decoration: none;
          font-weight: 500;
        }
        .lp-link:hover { text-decoration: underline; }

        .lp-muted {
          font-size: 11.5px;
          color: rgba(240,237,232,0.3);
          text-decoration: none;
        }
        .lp-muted:hover { color: rgba(240,237,232,0.55); }
        .lp-muted-group { display: flex; gap: 14px; }
      `}</style>

      <div className="lp-root">
        <div className="lp-card">

          {/* ══ LEFT — Image ══ */}
          <div className="lp-img-side">
            <img
              src="https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=900&q=85"
              alt="Nepal mountains"
            />
            <div className="lp-img-overlay" />
            <div className="lp-img-text">
              <div className="lp-img-badge">🏔 Nepal Travel</div>
              <div className="lp-img-quote">
                The journey of a
                <em>thousand miles</em>
                begins with one step
              </div>
              <div className="lp-img-dots">
                <div className="lp-img-dot active" />
                <div className="lp-img-dot" />
                <div className="lp-img-dot" />
              </div>
            </div>
          </div>

          {/* ══ RIGHT — Form ══ */}
          <div className="lp-form-side">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '36px' }}>
  {/*  Logo — click garda home jaucha */}
  <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none' }}>
    <div className="lp-logo-icon"></div>
    <span className="lp-logo-text">Safe Journey</span>
  </Link>

  {/* Back to Home link */}
  <Link to="/" style={{
    fontSize: '12px',
    color: 'rgba(240,237,232,0.4)',
    textDecoration: 'none',
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    transition: 'color 0.2s'
  }}
  onMouseEnter={e => e.currentTarget.style.color = '#a8d96b'}
  onMouseLeave={e => e.currentTarget.style.color = 'rgba(240,237,232,0.4)'}
  >
    ← Back to Home
  </Link>
</div>

            <h1 className="lp-title">Welcome back</h1>
            <p className="lp-sub">Login to access your bookings,<br />wishlist and dashboard.</p>

            {msg && <div className="lp-err">{msg}</div>}

            <form onSubmit={submit}>
              <div className="lp-row">
                <span className="lp-lbl">Email</span>
              </div>
              <input className="lp-input" type="email" placeholder="you@email.com"
                value={email} onChange={e => setEmail(e.target.value)} required />

              <div className="lp-row">
                <span className="lp-lbl">Password</span>
                <Link className="lp-fgt" to="/forgot-password">Forgot password?</Link>
              </div>
              <div className="lp-pw">
                <input className="lp-input" type={showPassword ? 'text' : 'password'}
                  placeholder="Your password" value={password}
                  onChange={e => setPassword(e.target.value)} required />
                <button type="button" className="lp-eye" onClick={() => setShowPassword(!showPassword)}>
                  <svg viewBox="0 0 24 24" width="17" height="17" fill="currentColor">
                    <path d={showPassword ? mdiEye : mdiEyeOff} />
                  </svg>
                </button>
              </div>

              <button className="lp-btn" type="submit" disabled={loading}>
                {loading ? 'Logging in...' : 'Log in'}
              </button>
            </form>

            <div className="lp-or">or continue with</div>

            <button type="button" className="lp-google" onClick={() => googleLogin()} disabled={loading}>
              <svg width="16" height="16" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continue with Google
            </button>

            <div className="lp-hr" />
            <div className="lp-bottom">
              <Link className="lp-link" to="/signup">Create account →</Link>
              <div className="lp-muted-group">
                <Link className="lp-muted" to="/agency-login">Agency</Link>
                <Link className="lp-muted" to="/admin-login">Admin</Link>
              </div>
            </div>
          </div>

        </div>
      </div>
    </>
  );
}