import { useState } from 'react';
import { api, saveToken, setAuthToken } from '../api/client';
import { useNavigate, Link } from 'react-router-dom';
import { mdiEye, mdiEyeOff } from '@mdi/js';

export default function AgencyLogin() {
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
      const res = await api.post('/api/auth/login', { email, password, login_as: 'agency' });
      const token = res.data.token || res.data.access_token || res.data.data?.token;
      const user  = res.data.user  || res.data.data?.user  || { email, role: 'agency' };
      if (token) { saveToken(token); setAuthToken(token); }
      localStorage.setItem('user', JSON.stringify(user));
      window.dispatchEvent(new Event('auth-change'));
      window.location.href = '/agency';
    } catch (e) {
      setMsg(e?.response?.data?.error || 'Agency login failed. Check your credentials.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=DM+Sans:wght@300;400;500;600&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        .ag-root {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 40px 16px;
          font-family: 'DM Sans', sans-serif;
          background: #080c14;
        }

        .ag-card {
          display: flex;
          width: min(960px, 100%);
          min-height: 580px;
          border-radius: 28px;
          overflow: hidden;
          box-shadow: 0 40px 100px rgba(0,0,0,0.6);
          border: 1px solid rgba(59,111,212,0.15);
        }

        .ag-form-side {
          width: 420px;
          flex-shrink: 0;
          background: #0a0f1c;
          padding: 52px 44px;
          display: flex;
          flex-direction: column;
          justify-content: center;
          overflow-y: auto;
        }
        @media(max-width:700px){ .ag-form-side { width: 100%; padding: 40px 28px; } }

        .ag-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 40px;
        }

        .ag-logo {
          display: flex;
          align-items: center;
          gap: 8px;
          text-decoration: none;
        }

        .ag-logo-icon {
          width: 34px;
          height: 34px;
          background: linear-gradient(135deg, #2d5bbf, #3b6fd4);
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 16px;
        }

        .ag-logo-text {
          font-family: 'Playfair Display', serif;
          font-size: 15px;
          font-weight: 700;
          color: #f0ede8;
        }

        .ag-back {
          font-size: 12px;
          color: rgba(240,237,232,0.35);
          text-decoration: none;
          transition: color 0.2s;
        }
        .ag-back:hover { color: #3b6fd4; }

        .ag-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: rgba(59,111,212,0.12);
          border: 1px solid rgba(59,111,212,0.25);
          color: #6b9eff;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.13em;
          text-transform: uppercase;
          padding: 5px 12px;
          border-radius: 100px;
          margin-bottom: 14px;
        }

        .ag-title {
          font-family: 'Playfair Display', serif;
          font-size: 27px;
          font-weight: 700;
          color: #f0ede8;
          margin-bottom: 6px;
        }

        .ag-sub {
          font-size: 13px;
          color: rgba(240,237,232,0.38);
          margin-bottom: 30px;
          line-height: 1.5;
        }

        .ag-err {
          background: rgba(248,113,113,0.08);
          border: 1px solid rgba(248,113,113,0.18);
          color: #f87171;
          border-radius: 10px;
          padding: 10px 13px;
          font-size: 12.5px;
          margin-bottom: 16px;
        }

        .ag-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 6px;
        }

        .ag-lbl {
          font-size: 10px;
          font-weight: 700;
          color: rgba(240,237,232,0.32);
          letter-spacing: 0.1em;
          text-transform: uppercase;
        }

        .ag-input {
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
        }
        .ag-input:focus {
          border-color: rgba(59,111,212,0.5);
          background: rgba(59,111,212,0.04);
        }
        .ag-input::placeholder { color: rgba(240,237,232,0.16); }

        .ag-pw { position: relative; }
        .ag-eye {
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
        .ag-eye:hover { color: rgba(240,237,232,0.65); }

        .ag-btn {
          width: 100%;
          background: linear-gradient(135deg, #2d5bbf, #3b6fd4);
          color: #fff;
          border: none;
          border-radius: 100px;
          padding: 13px;
          font-family: 'DM Sans', sans-serif;
          font-size: 14.5px;
          font-weight: 700;
          cursor: pointer;
          transition: opacity 0.2s, transform 0.15s;
          margin-top: 4px;
          box-shadow: 0 4px 20px rgba(59,111,212,0.3);
        }
        .ag-btn:hover:not(:disabled) { opacity: 0.9; transform: scale(1.015); }
        .ag-btn:disabled { opacity: 0.55; cursor: not-allowed; }

        .ag-hr { height: 1px; background: rgba(255,255,255,0.06); margin: 20px 0; }

        .ag-bottom {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 8px;
        }

        .ag-link {
          font-size: 12px;
          color: #6b9eff;
          text-decoration: none;
          font-weight: 500;
        }
        .ag-link:hover { text-decoration: underline; }

        .ag-muted {
          font-size: 11.5px;
          color: rgba(240,237,232,0.3);
          text-decoration: none;
        }
        .ag-muted:hover { color: rgba(240,237,232,0.55); }

        /* RIGHT — Image */
        .ag-img-side {
          flex: 1;
          position: relative;
          display: none;
          overflow: hidden;
        }
        @media(min-width:700px){ .ag-img-side { display: flex; } }

        .ag-img-side img {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          object-position: center;
        }

        .ag-img-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(
            135deg,
            rgba(8,12,20,0.2) 0%,
            rgba(8,12,20,0.72) 100%
          );
          z-index: 1;
        }

        .ag-img-content {
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

        .ag-img-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: rgba(59,111,212,0.15);
          border: 1px solid rgba(59,111,212,0.3);
          color: white;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.13em;
          text-transform: uppercase;
          padding: 5px 14px;
          border-radius: 100px;
          margin-bottom: 20px;
        }

        .ag-img-title {
          font-family: 'Playfair Display', serif;
          font-size: clamp(22px, 2.8vw, 34px);
          font-weight: 700;
          color: #fff;
          line-height: 1.25;
          text-shadow: 0 4px 24px rgba(0,0,0,0.4);
          margin-bottom: 12px;
          text-transform: uppercase;
          letter-spacing: 0.02em;
        }

     .ag-img-title em { color: rgba(255,255,255,0.85); }

        .ag-img-desc {
          font-size: 13px;
          color: rgba(255,255,255,0.5);
          line-height: 1.6;
          max-width: 280px;
          margin: 0 auto 24px;
        }

        .ag-img-stats {
          display: flex;
          gap: 24px;
          justify-content: center;
          padding-top: 20px;
          border-top: 1px solid rgba(255,255,255,0.1);
          width: 100%;
          max-width: 300px;
          margin: 0 auto;
        }

        .ag-stat-num {
          font-family: 'Playfair Display', serif;
          font-size: 22px;
          font-weight: 700;
          color: white ;
        }

        .ag-stat-lbl {
          font-size: 10px;
          color: rgba(255,255,255,0.35);
          margin-top: 2px;
          text-transform: uppercase;
          letter-spacing: 0.06em;
        }
      `}</style>

      <div className="ag-root">
        <div className="ag-card">

          {/* LEFT — Form */}
          <div className="ag-form-side">
            <div className="ag-top">
              <Link to="/" className="ag-logo">
                <div className="ag-logo-icon">✈</div>
                <span className="ag-logo-text">Safe Journey</span>
              </Link>
              <Link to="/" className="ag-back">← Home</Link>
            </div>

            <div className="ag-badge">Agency Portal</div>
            <h1 className="ag-title">Agency Login</h1>
            <p className="ag-sub">Access your dashboard to manage packages, bookings and payments.</p>

            {msg && <div className="ag-err">{msg}</div>}

            <form onSubmit={submit}>
              <div className="ag-row"><span className="ag-lbl">Email</span></div>
              <input className="ag-input" type="email" placeholder="agency@email.com"
                value={email} onChange={e => setEmail(e.target.value)} required />

              <div className="ag-row"><span className="ag-lbl">Password</span></div>
              <div className="ag-pw">
                <input className="ag-input" type={showPassword ? 'text' : 'password'}
                  placeholder="Your password" value={password}
                  onChange={e => setPassword(e.target.value)} required />
                <button type="button" className="ag-eye" onClick={() => setShowPassword(!showPassword)}>
                  <svg viewBox="0 0 24 24" width="17" height="17" fill="currentColor">
                    <path d={showPassword ? mdiEye : mdiEyeOff} />
                  </svg>
                </button>
              </div>

              <button className="ag-btn" type="submit" disabled={loading}>
                {loading ? 'Logging in...' : 'Login as Agency'}
              </button>
            </form>

            <div className="ag-hr" />
            <div className="ag-bottom">
              <Link className="ag-link" to="/agency-signup">Create agency account →</Link>
              <Link className="ag-muted" to="/login">Customer login</Link>
            </div>
          </div>

          {/* RIGHT — Image */}
          <div className="ag-img-side">
            <img
              src="https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=900&q=85"
              alt="Nepal agency"
            />
            <div className="ag-img-overlay" />
            <div className="ag-img-content">
              <div className="ag-img-badge">✈ For Travel Agencies</div>
              <div className="ag-img-title">
                Grow your
                <em>travel business</em>
                with us
              </div>
              <p className="ag-img-desc">
                List your packages, manage bookings and reach thousands of travelers across Nepal.
              </p>
              <div className="ag-img-stats">
                <div>
                  <div className="ag-stat-num">50+</div>
                  <div className="ag-stat-lbl">Agencies</div>
                </div>
                <div>
                  <div className="ag-stat-num">5K+</div>
                  <div className="ag-stat-lbl">Travelers</div>
                </div>
                <div>
                  <div className="ag-stat-num">200+</div>
                  <div className="ag-stat-lbl">Packages</div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </>
  );
}