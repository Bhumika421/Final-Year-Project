import { useState } from 'react';
import { api, saveToken, setAuthToken } from '../api/client';
import { useNavigate, Link } from 'react-router-dom';
import { mdiEye, mdiEyeOff } from '@mdi/js';

export default function AdminLogin() {
  const nav = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [admin_code, setAdminCode] = useState('');
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setMsg('');
    setLoading(true);
    try {
      const res = await api.post('/api/auth/login', { email, password, login_as: 'admin', admin_code });
      saveToken(res.data.token);
      setAuthToken(res.data.token);
      const user = res.data.user || { email, role: 'admin' };
      localStorage.setItem('user', JSON.stringify(user));
      window.dispatchEvent(new Event('auth-change'));
      nav('/admin');
    } catch (e) {
      setMsg(e?.response?.data?.error || 'Admin login failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        .adm-root {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: 'Inter', sans-serif;
          background: #0f1117;
          position: relative;
          overflow: hidden;
        }

        /* background glow effects */
        .adm-root::before {
          content: '';
          position: absolute;
          width: 600px;
          height: 600px;
          background: radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 70%);
          top: -100px;
          left: -100px;
          pointer-events: none;
        }

        .adm-root::after {
          content: '';
          position: absolute;
          width: 500px;
          height: 500px;
          background: radial-gradient(circle, rgba(139,92,246,0.08) 0%, transparent 70%);
          bottom: -100px;
          right: -100px;
          pointer-events: none;
        }

        .adm-card {
          position: relative;
          z-index: 1;
          width: min(440px, 92vw);
          background: #16181f;
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 20px;
          padding: 40px 36px;
          box-shadow: 0 24px 60px rgba(0,0,0,0.5);
        }

        /* top logo area */
        .adm-header {
          display: flex;
          flex-direction: column;
          align-items: center;
          margin-bottom: 32px;
          text-align: center;
        }

        .adm-icon-wrap {
          width: 52px;
          height: 52px;
          background: linear-gradient(135deg, #4f46e5, #7c3aed);
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 22px;
          margin-bottom: 16px;
          box-shadow: 0 8px 24px rgba(99,102,241,0.35);
        }

        .adm-title {
          font-size: 22px;
          font-weight: 700;
          color: #f1f2f6;
          margin-bottom: 6px;
          letter-spacing: -0.3px;
        }

        .adm-sub {
          font-size: 13px;
          color: rgba(241,242,246,0.38);
          line-height: 1.5;
        }

        /* alert */
        .adm-err {
          background: rgba(239,68,68,0.08);
          border: 1px solid rgba(239,68,68,0.2);
          color: #f87171;
          border-radius: 10px;
          padding: 10px 14px;
          font-size: 13px;
          margin-bottom: 18px;
          text-align: center;
        }

        .adm-notice {
          background: rgba(99,102,241,0.07);
          border: 1px solid rgba(99,102,241,0.15);
          border-radius: 10px;
          padding: 10px 14px;
          font-size: 12px;
          color: rgba(165,180,252,0.7);
          margin-bottom: 22px;
          text-align: center;
          line-height: 1.5;
        }

        /* fields */
        .adm-field { margin-bottom: 16px; }

        .adm-lbl {
          font-size: 12px;
          font-weight: 500;
          color: rgba(241,242,246,0.5);
          display: block;
          margin-bottom: 7px;
          letter-spacing: 0.02em;
        }

        .adm-input {
          width: 100%;
          background: #1e2130;
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 10px;
          padding: 12px 14px;
          color: #f1f2f6;
          font-family: 'Inter', sans-serif;
          font-size: 14px;
          outline: none;
          transition: border-color 0.2s, background 0.2s;
        }
        .adm-input:focus {
          border-color: rgba(99,102,241,0.5);
          background: #222640;
        }
        .adm-input::placeholder { color: rgba(241,242,246,0.18); }

        .adm-pw-wrap { position: relative; }
        .adm-eye {
          position: absolute;
          right: 12px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          color: rgba(241,242,246,0.3);
          cursor: pointer;
          padding: 0;
          display: flex;
        }
        .adm-eye:hover { color: rgba(241,242,246,0.65); }

        /* divider */
        .adm-divider {
          display: flex;
          align-items: center;
          gap: 12px;
          margin: 4px 0 18px;
          color: rgba(241,242,246,0.15);
          font-size: 11px;
          letter-spacing: 0.1em;
          text-transform: uppercase;
        }
        .adm-divider::before, .adm-divider::after {
          content: '';
          flex: 1;
          height: 1px;
          background: rgba(255,255,255,0.06);
        }

        /* button */
        .adm-btn {
          width: 100%;
          background: linear-gradient(135deg, #4f46e5, #7c3aed);
          color: #fff;
          border: none;
          border-radius: 10px;
          padding: 13px;
          font-family: 'Inter', sans-serif;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: opacity 0.2s, transform 0.15s;
          box-shadow: 0 4px 16px rgba(99,102,241,0.3);
          letter-spacing: 0.02em;
        }
        .adm-btn:hover:not(:disabled) { opacity: 0.88; transform: translateY(-1px); }
        .adm-btn:disabled { opacity: 0.5; cursor: not-allowed; }

        /* bottom links */
        .adm-footer {
          margin-top: 24px;
          padding-top: 20px;
          border-top: 1px solid rgba(255,255,255,0.06);
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .adm-link {
          font-size: 12px;
          color: #818cf8;
          text-decoration: none;
          font-weight: 500;
        }
        .adm-link:hover { color: #a5b4fc; }

        .adm-muted {
          font-size: 12px;
          color: rgba(241,242,246,0.25);
          text-decoration: none;
        }
        .adm-muted:hover { color: rgba(241,242,246,0.5); }

        /* back to home */
        .adm-back-home {
          position: absolute;
          top: 24px;
          left: 28px;
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 13px;
          color: rgba(241,242,246,0.3);
          text-decoration: none;
          transition: color 0.2s;
          z-index: 2;
        }
        .adm-back-home:hover { color: rgba(241,242,246,0.6); }
      `}</style>

      <div className="adm-root">
        <Link to="/" className="adm-back-home">← Home</Link>

        <div className="adm-card">
          <div className="adm-header">
            <div className="adm-icon-wrap">🛡</div>
            <h1 className="adm-title">Admin Panel</h1>
            <p className="adm-sub">Restricted access — authorized personnel only</p>
          </div>

          <div className="adm-notice">
             All login attempts are monitored and logged
          </div>

          {msg && <div className="adm-err">{msg}</div>}

          <form onSubmit={submit}>
            <div className="adm-field">
              <label className="adm-lbl">Email address</label>
              <input className="adm-input" type="email" placeholder="admin@safejourney.com"
                value={email} onChange={e => setEmail(e.target.value)} required />
            </div>

            <div className="adm-field">
              <label className="adm-lbl">Password</label>
              <div className="adm-pw-wrap">
                <input className="adm-input" type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••" value={password}
                  onChange={e => setPassword(e.target.value)} required />
                <button type="button" className="adm-eye" onClick={() => setShowPassword(!showPassword)}>
                  <svg viewBox="0 0 24 24" width="17" height="17" fill="currentColor">
                    <path d={showPassword ? mdiEye : mdiEyeOff} />
                  </svg>
                </button>
              </div>
            </div>

            <div className="adm-field">
              <label className="adm-lbl">Verification code</label>
              <input className="adm-input" type="password" placeholder="System provided code"
                value={admin_code} onChange={e => setAdminCode(e.target.value)} required />
            </div>

            <div className="adm-divider">secure login</div>

            <button className="adm-btn" type="submit" disabled={loading}>
              {loading ? 'Verifying...' : 'Sign in to Admin Panel'}
            </button>
          </form>

          <div className="adm-footer">
            <Link className="adm-link" to="/admin-setup">First time setup →</Link>
            <Link className="adm-muted" to="/login">Customer login</Link>
          </div>
        </div>
      </div>
    </>
  );
}