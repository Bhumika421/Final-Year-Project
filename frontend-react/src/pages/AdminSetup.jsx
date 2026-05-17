import { useState } from 'react';
import { api } from '../api/client';
import { useNavigate, Link } from 'react-router-dom';

export default function AdminSetup() {
  const nav = useNavigate();
  const [full_name, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm_password, setConfirmPassword] = useState('');
  const [setup_code, setSetupCode] = useState('');
  const [msg, setMsg] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setMsg('');
    setLoading(true);
    try {
      const res = await api.post('/api/auth/register-admin', {
        full_name, email, password, confirm_password, setup_code,
      });
      setSuccess(true);
      setTimeout(() => nav('/admin-login'), 3000);
    } catch (e) {
      setMsg(e?.response?.data?.error || 'Setup failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        .adms-root {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 40px 16px;
          font-family: 'Inter', sans-serif;
          background: #0f1117;
          position: relative;
          overflow: hidden;
        }

        .adms-root::before {
          content: '';
          position: absolute;
          width: 600px; height: 600px;
          background: radial-gradient(circle, rgba(99,102,241,0.1) 0%, transparent 70%);
          top: -150px; right: -100px;
          pointer-events: none;
        }

        .adms-root::after {
          content: '';
          position: absolute;
          width: 400px; height: 400px;
          background: radial-gradient(circle, rgba(139,92,246,0.07) 0%, transparent 70%);
          bottom: -100px; left: -100px;
          pointer-events: none;
        }

        .adms-card {
          position: relative;
          z-index: 1;
          width: min(480px, 92vw);
          background: #16181f;
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 20px;
          padding: 40px 36px;
          box-shadow: 0 24px 60px rgba(0,0,0,0.5);
        }

        .adms-header {
          display: flex;
          flex-direction: column;
          align-items: center;
          margin-bottom: 28px;
          text-align: center;
        }

        .adms-icon-wrap {
          width: 52px; height: 52px;
          background: linear-gradient(135deg, #4f46e5, #7c3aed);
          border-radius: 14px;
          display: flex; align-items: center; justify-content: center;
          font-size: 22px; margin-bottom: 16px;
          box-shadow: 0 8px 24px rgba(99,102,241,0.35);
        }

        .adms-title { font-size: 22px; font-weight: 700; color: #f1f2f6; margin-bottom: 6px; letter-spacing: -0.3px; }
        .adms-sub { font-size: 13px; color: rgba(241,242,246,0.35); line-height: 1.5; }

        .adms-notice {
          background: rgba(99,102,241,0.07);
          border: 1px solid rgba(99,102,241,0.15);
          border-radius: 10px; padding: 10px 14px;
          font-size: 12px; color: rgba(165,180,252,0.7);
          margin-bottom: 22px; text-align: center; line-height: 1.5;
        }

        .adms-err { background: rgba(239,68,68,0.08); border: 1px solid rgba(239,68,68,0.2); color: #f87171; border-radius: 10px; padding: 10px 14px; font-size: 13px; margin-bottom: 16px; text-align: center; }

        .adms-grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 16px; }
        .adms-field { margin-bottom: 16px; }

        .adms-lbl { font-size: 12px; font-weight: 500; color: rgba(241,242,246,0.45); display: block; margin-bottom: 7px; }

        .adms-input {
          width: 100%;
          background: #1e2130;
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 10px; padding: 12px 14px;
          color: #f1f2f6; font-family: 'Inter', sans-serif; font-size: 13.5px;
          outline: none; transition: border-color 0.2s, background 0.2s;
        }
        .adms-input:focus { border-color: rgba(99,102,241,0.5); background: #222640; }
        .adms-input::placeholder { color: rgba(241,242,246,0.16); }

        .adms-divider {
          display: flex; align-items: center; gap: 12px;
          margin: 4px 0 18px;
          color: rgba(241,242,246,0.15); font-size: 11px;
          letter-spacing: 0.1em; text-transform: uppercase;
        }
        .adms-divider::before, .adms-divider::after {
          content: ''; flex: 1; height: 1px; background: rgba(255,255,255,0.06);
        }

        .adms-btn {
          width: 100%;
          background: linear-gradient(135deg, #4f46e5, #7c3aed);
          color: #fff; border: none; border-radius: 10px; padding: 13px;
          font-family: 'Inter', sans-serif; font-size: 14px; font-weight: 600;
          cursor: pointer; transition: opacity 0.2s, transform 0.15s;
          box-shadow: 0 4px 16px rgba(99,102,241,0.3);
        }
        .adms-btn:hover:not(:disabled) { opacity: 0.88; transform: translateY(-1px); }
        .adms-btn:disabled { opacity: 0.5; cursor: not-allowed; }

        .adms-footer { margin-top: 24px; padding-top: 20px; border-top: 1px solid rgba(255,255,255,0.06); display: flex; justify-content: space-between; }
        .adms-link { font-size: 12px; color: #818cf8; text-decoration: none; font-weight: 500; }
        .adms-link:hover { color: #a5b4fc; }
        .adms-muted { font-size: 12px; color: rgba(241,242,246,0.25); text-decoration: none; }
        .adms-muted:hover { color: rgba(241,242,246,0.5); }

        .adms-back-home { position: absolute; top: 24px; left: 28px; display: flex; align-items: center; gap: 6px; font-size: 13px; color: rgba(241,242,246,0.3); text-decoration: none; transition: color 0.2s; z-index: 2; }
        .adms-back-home:hover { color: rgba(241,242,246,0.6); }

        .adms-success { text-align: center; padding: 20px 0; }
        .adms-success-icon { font-size: 52px; margin-bottom: 16px; }
        .adms-success-title { font-size: 22px; font-weight: 700; color: #f1f2f6; margin-bottom: 8px; }
        .adms-success-sub { font-size: 13px; color: rgba(241,242,246,0.38); line-height: 1.6; }
      `}</style>

      <div className="adms-root">
        <Link to="/" className="adms-back-home">← Home</Link>

        <div className="adms-card">
          {!success ? (
            <>
              <div className="adms-header">
                <div className="adms-icon-wrap"></div>
                <h1 className="adms-title">Admin Setup</h1>
                <p className="adms-sub">One-time setup · Only one admin allowed</p>
              </div>

              <div className="adms-notice">
                This page is for initial setup only. Keep your setup code secure.
              </div>

              {msg && <div className="adms-err">{msg}</div>}

              <form onSubmit={submit}>
                <div className="adms-grid2">
                  <div>
                    <label className="adms-lbl">Full Name</label>
                    <input className="adms-input" placeholder="Admin name"
                      value={full_name} onChange={e => setFullName(e.target.value)} required />
                  </div>
                  <div>
                    <label className="adms-lbl">Email</label>
                    <input className="adms-input" type="email" placeholder="admin@email.com"
                      value={email} onChange={e => setEmail(e.target.value)} required />
                  </div>
                </div>

                <div className="adms-grid2">
                  <div>
                    <label className="adms-lbl">Password</label>
                    <input className="adms-input" type="password" placeholder="Min 8 chars"
                      value={password} onChange={e => setPassword(e.target.value)} required />
                  </div>
                  <div>
                    <label className="adms-lbl">Confirm Password</label>
                    <input className="adms-input" type="password" placeholder="Repeat"
                      value={confirm_password} onChange={e => setConfirmPassword(e.target.value)} required />
                  </div>
                </div>

                <div className="adms-field">
                  <label className="adms-lbl">Setup Code</label>
                  <input className="adms-input" type="password" placeholder="Provided by system owner"
                    value={setup_code} onChange={e => setSetupCode(e.target.value)} required />
                </div>

                <div className="adms-divider">secure setup</div>

                <button className="adms-btn" type="submit" disabled={loading}>
                  {loading ? 'Creating...' : 'Create Admin Account'}
                </button>
              </form>

            </>
          ) : (
            <div className="adms-success">
              <div className="adms-success-icon"></div>
              <h2 className="adms-success-title">Account Created!</h2>
              <p className="adms-success-sub">
                Admin account is ready.<br />
                Redirecting to login...
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}