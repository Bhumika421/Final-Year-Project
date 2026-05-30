import { useState } from 'react';
import { api } from '../api/client';
import { useNavigate, Link } from 'react-router-dom';

export default function AgencySignup() {
  const nav = useNavigate();
  const [full_name, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [business_name, setBusinessName] = useState('');
  const [license_no, setLicenseNo] = useState('');
  const [password, setPassword] = useState('');
  const [confirm_password, setConfirmPassword] = useState('');
  const [msg, setMsg] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setMsg('');
    setLoading(true);
    try {
      const res = await api.post('/api/auth/register-agency', {
        full_name, email,
        phone: phone || null,
        address: address || null,
        business_name, license_no,
        password, confirm_password,
      });
      setSuccess(true);
      setMsg(res.data.message || 'Agency account created!');
      setTimeout(() => nav('/agency-login'), 3000);
    } catch (e) {
      setMsg(e?.response?.data?.error || 'Signup failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=DM+Sans:wght@300;400;500;600&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        .as-root {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 40px 16px;
          font-family: 'DM Sans', sans-serif;
          background: #080c14;
        }

        .as-card {
          display: flex;
          width: min(1000px, 100%);
          min-height: 620px;
          border-radius: 28px;
          overflow: hidden;
          box-shadow: 0 40px 100px rgba(0,0,0,0.6);
          border: 1px solid rgba(59,111,212,0.15);
        }

        /* LEFT — Image */
        .as-img-side {
          flex: 1;
          position: relative;
          display: none;
          overflow: hidden;
        }
        @media(min-width:800px){ .as-img-side { display: flex; } }

        .as-img-side img {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          object-position: center;
        }

        .as-img-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, rgba(8,12,20,0.2) 0%, rgba(8,12,20,0.75) 100%);
          z-index: 1;
        }

        .as-img-content {
          position: relative;
          z-index: 2;
          display: flex;
          flex-direction: column;
          justify-content: flex-end;
          width: 100%;
          padding: 44px 40px;
        }

        .as-img-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: rgba(59,111,212,0.15);
          border: 1px solid rgba(59,111,212,0.3);
          color: #fff;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.13em;
          text-transform: uppercase;
          padding: 5px 14px;
          border-radius: 100px;
          margin-bottom: 16px;
          width: fit-content;
        }

        .as-img-title {
          font-family: 'Playfair Display', serif;
          font-size: clamp(24px, 2.5vw, 36px);
          font-weight: 700;
          color: #fff;
          line-height: 1.2;
          margin-bottom: 12px;
          text-shadow: 0 2px 16px rgba(0,0,0,0.4);
        }

        .as-img-title em {
          font-style: italic;
          color: #fff;
        }

        .as-img-desc {
          font-size: 13px;
          color: rgba(255,255,255,0.5);
          line-height: 1.6;
          max-width: 300px;
          margin-bottom: 24px;
        }

        .as-steps { display: flex; flex-direction: column; gap: 12px; }

        .as-step { display: flex; align-items: center; gap: 12px; }

        .as-step-num {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          background: rgba(59,111,212,0.15);
          border: 1px solid rgba(59,111,212,0.35);
          color: #fff;
          font-size: 12px;
          font-weight: 700;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .as-step-text { color: rgba(255,255,255,0.6); }

        /* RIGHT — Form */
        .as-form-side {
          width: 480px;
          flex-shrink: 0;
          background: #0a0f1c;
          padding: 44px;
          display: flex;
          flex-direction: column;
          justify-content: center;
          overflow-y: auto;
        }
        @media(max-width:799px){ .as-form-side { width: 100%; padding: 40px 28px; } }

        .as-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 28px;
        }

        .as-logo { display: flex; align-items: center; gap: 8px; text-decoration: none; }

        .as-logo-icon {
          width: 32px;
          height: 32px;
          background: linear-gradient(135deg, #2d5bbf, #3b6fd4);
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 15px;
        }

        .as-logo-text {
          font-family: 'Playfair Display', serif;
          font-size: 14px;
          font-weight: 700;
          color: #f0ede8;
        }

        .as-back { font-size: 12px; color: rgba(240,237,232,0.35); text-decoration: none; transition: color 0.2s; }
        .as-back:hover { color: #3b6fd4; }

        .as-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: rgba(59,111,212,0.1);
          border: 1px solid rgba(59,111,212,0.22);
          color: #6b9eff;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.13em;
          text-transform: uppercase;
          padding: 5px 12px;
          border-radius: 100px;
          margin-bottom: 10px;
        }

        .as-title { font-family: 'Playfair Display', serif; font-size: 24px; font-weight: 700; color: #f0ede8; margin-bottom: 4px; }
        .as-sub { font-size: 12.5px; color: rgba(240,237,232,0.35); margin-bottom: 16px; line-height: 1.5; }

        .as-err { background: rgba(248,113,113,0.08); border: 1px solid rgba(248,113,113,0.18); color: #f87171; border-radius: 10px; padding: 10px 13px; font-size: 12.5px; margin-bottom: 14px; }

        .as-notice {
          background: rgba(59,111,212,0.07);
          border: 1px solid rgba(59,111,212,0.18);
          border-radius: 10px;
          padding: 10px 13px;
          font-size: 12px;
          color: rgba(107,158,255,0.8);
          margin-bottom: 18px;
          line-height: 1.5;
        }

        .as-grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        .as-field { margin-bottom: 12px; }

        .as-lbl { font-size: 10px; font-weight: 700; color: rgba(240,237,232,0.32); letter-spacing: 0.1em; text-transform: uppercase; display: block; margin-bottom: 6px; }

        .as-input {
          width: 100%;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 10px;
          padding: 11px 13px;
          color: #f0ede8;
          font-family: 'DM Sans', sans-serif;
          font-size: 13px;
          outline: none;
          transition: border-color 0.2s, background 0.2s;
        }
        .as-input:focus { border-color: rgba(59,111,212,0.5); background: rgba(59,111,212,0.04); }
        .as-input::placeholder { color: rgba(240,237,232,0.16); }

        .as-btn {
          width: 100%;
          background: linear-gradient(135deg, #2d5bbf, #3b6fd4);
          color: #fff;
          border: none;
          border-radius: 100px;
          padding: 13px;
          font-family: 'DM Sans', sans-serif;
          font-size: 14px;
          font-weight: 700;
          cursor: pointer;
          transition: opacity 0.2s, transform 0.15s;
          margin-top: 6px;
          margin-bottom: 14px;
          box-shadow: 0 4px 20px rgba(59,111,212,0.25);
        }
        .as-btn:hover:not(:disabled) { opacity: 0.9; transform: scale(1.015); }
        .as-btn:disabled { opacity: 0.55; cursor: not-allowed; }

        .as-hr { height: 1px; background: rgba(255,255,255,0.06); margin: 4px 0 14px; }
        .as-bottom { display: flex; justify-content: space-between; align-items: center; }
        .as-link { font-size: 12px; color: #6b9eff; text-decoration: none; font-weight: 500; }
        .as-link:hover { text-decoration: underline; }
        .as-muted { font-size: 11.5px; color: rgba(240,237,232,0.3); text-decoration: none; }
        .as-muted:hover { color: rgba(240,237,232,0.55); }

        .as-success-wrap { text-align: center; padding: 40px 20px; }
        .as-success-icon { font-size: 56px; margin-bottom: 16px; }
        .as-success-title { font-family: 'Playfair Display', serif; font-size: 24px; font-weight: 700; color: #f0ede8; margin-bottom: 8px; }
        .as-success-sub { font-size: 13px; color: rgba(240,237,232,0.4); line-height: 1.6; }
      `}</style>

      <div className="as-root">
        <div className="as-card">

          {/* LEFT — Image */}
          <div className="as-img-side">
            <img
              src="https://images.unsplash.com/photo-1589182373726-e4f658ab50f0?w=900&q=85"
              alt="Nepal agency"
            />
            <div className="as-img-overlay" />
            <div className="as-img-content">
              <div className="as-img-badge">Partner With Us</div>
              <h2 className="as-img-title">
                List your tours,<br />
                <em>grow your agency</em>
              </h2>
              <p className="as-img-desc">
                Join Nepal's fastest growing travel platform and reach thousands of travelers.
              </p>
              <div className="as-steps">
                <div className="as-step">
                  <div className="as-step-num">1</div>
                  <div className="as-step-text">Create your agency account</div>
                </div>
                <div className="as-step">
                  <div className="as-step-num">2</div>
                  <div className="as-step-text">Admin verifies your license</div>
                </div>
                <div className="as-step">
                  <div className="as-step-num">3</div>
                  <div className="as-step-text">Start listing your tour packages</div>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT — Form */}
          <div className="as-form-side">
            {!success ? (
              <>
                <div className="as-top">
                  <Link to="/" className="as-logo">
                    <div className="as-logo-icon">✈</div>
                    <span className="as-logo-text">Safe Journey</span>
                  </Link>
                  <Link to="/" className="as-back">← Home</Link>
                </div>

                <div className="as-badge"> Agency Portal</div>
                <h1 className="as-title">Create Agency Account</h1>
                <p className="as-sub">Fill in your details — our team will review and verify your account.</p>

              
                

                {msg && <div className="as-err">{msg}</div>}

                <form onSubmit={submit}>
                  <div className="as-grid2">
                    <div className="as-field">
                      <label className="as-lbl">Contact Name</label>
                      <input className="as-input" placeholder="Full name"
                        value={full_name} onChange={e => setFullName(e.target.value)} required />
                    </div>
                    <div className="as-field">
                      <label className="as-lbl">Business Name</label>
                      <input className="as-input" placeholder="Name"
                        value={business_name} onChange={e => setBusinessName(e.target.value)} required />
                    </div>
                  </div>

                  <div className="as-grid2">
                    <div className="as-field">
                      <label className="as-lbl">Email</label>
                      <input className="as-input" type="email" placeholder="agency@email.com"
                        value={email} onChange={e => setEmail(e.target.value)} required />
                    </div>
                    <div className="as-field">
                      <label className="as-lbl">Phone (optional)</label>
                      <input className="as-input" placeholder="+977 98..."
                        value={phone} onChange={e => setPhone(e.target.value)} />
                    </div>
                  </div>

                  <div className="as-field">
                    <label className="as-lbl">Address (optional)</label>
                    <input className="as-input" placeholder="Thamel, Kathmandu"
                      value={address} onChange={e => setAddress(e.target.value)} />
                  </div>

                  <div className="as-field">
                    <label className="as-lbl">License / Registration No.</label>
                    <input className="as-input" placeholder="NTB-XXXX"
                      value={license_no} onChange={e => setLicenseNo(e.target.value)} required />
                  </div>

                  <div className="as-grid2">
                    <div className="as-field">
                      <label className="as-lbl">Password</label>
                      <input className="as-input" type="password" placeholder="Min 8 chars"
                        value={password} onChange={e => setPassword(e.target.value)} required />
                    </div>
                    <div className="as-field">
                      <label className="as-lbl">Confirm Password</label>
                      <input className="as-input" type="password" placeholder="Repeat password"
                        value={confirm_password} onChange={e => setConfirmPassword(e.target.value)} required />
                    </div>
                  </div>

                  <button className="as-btn" type="submit" disabled={loading}>
                    {loading ? 'Creating account...' : 'Create Agency Account'}
                  </button>
                </form>

                <div className="as-hr" />
                <div className="as-bottom">
                  <Link className="as-link" to="/agency-login">Already have an account?</Link>
                  <Link className="as-muted" to="/login">Customer login</Link>
                </div>
              </>
            ) : (
              <div className="as-success-wrap">
                <div className="as-success-icon"></div>
                <h2 className="as-success-title">Account Created!</h2>
                <p className="as-success-sub">
                  Your agency account has been submitted for review.<br />
                  You'll be notified once approved by our admin team.<br /><br />
                  Redirecting to login...
                </p>
              </div>
            )}
          </div>

        </div>
      </div>
    </>
  );
}