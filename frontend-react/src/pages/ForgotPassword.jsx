import { useState } from 'react';
import { api } from '../api/client';
import { Link, useNavigate } from 'react-router-dom';
import { mdiEye, mdiEyeOff } from '@mdi/js';

export default function ForgotPassword() {
  const nav = useNavigate();
  const [step, setStep]         = useState(1); // 1=email, 2=otp, 3=newpass
  const [email, setEmail]       = useState('');
  const [otp, setOtp]           = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm]   = useState('');
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [msg, setMsg]           = useState('');
  const [err, setErr]           = useState('');
  const [loading, setLoading]   = useState(false);

  // Step 1 — Send OTP
  async function sendOtp(e) {
    e.preventDefault();
    setErr(''); setMsg('');
    setLoading(true);
    try {
      const res = await api.post('/api/auth/forgot-password', { email });
      if (res.data.ok) {
        setMsg(res.data.message);
        setStep(2);
      }
    } catch (e) {
      setErr(e?.response?.data?.error || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  }

  // Step 2 — Verify OTP
  async function verifyOtp(e) {
    e.preventDefault();
    setErr(''); setMsg('');
    setLoading(true);
    try {
      const res = await api.post('/api/auth/verify-otp', { email, otp });
      if (res.data.ok) {
        setMsg(res.data.message);
        setStep(3);
      }
    } catch (e) {
      setErr(e?.response?.data?.error || 'Invalid OTP.');
    } finally {
      setLoading(false);
    }
  }

  // Step 3 — Reset Password
  async function resetPassword(e) {
    e.preventDefault();
    setErr(''); setMsg('');
    setLoading(true);
    try {
      const res = await api.post('/api/auth/reset-password', {
        email, otp, password, confirm_password: confirm
      });
      if (res.data.ok) {
        setMsg(res.data.message);
        setTimeout(() => nav('/login'), 2000);
      }
    } catch (e) {
      setErr(e?.response?.data?.error || 'Something went wrong.');
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
        .auth-input:focus { border-color: rgba(168,217,107,0.5); }
        .auth-input::placeholder { color: rgba(240,237,232,0.2); }
        .auth-btn { width: 100%; background: #a8d96b; color: #1a2010; border: none; border-radius: 100px; padding: 14px; font-family: 'DM Sans', sans-serif; font-size: 15px; font-weight: 700; cursor: pointer; transition: background 0.2s; margin-top: 4px; }
        .auth-btn:hover:not(:disabled) { background: #c1e88d; }
        .auth-btn:disabled { opacity: 0.6; cursor: not-allowed; }
        .auth-err { background: rgba(248,113,113,0.08); border: 1px solid rgba(248,113,113,0.2); color: #f87171; border-radius: 12px; padding: 11px 14px; font-size: 13px; margin-bottom: 18px; }
        .auth-ok { background: rgba(168,217,107,0.08); border: 1px solid rgba(168,217,107,0.2); color: #a8d96b; border-radius: 12px; padding: 11px 14px; font-size: 13px; margin-bottom: 18px; }
        .auth-divider { height: 1px; background: rgba(255,255,255,0.07); margin: 22px 0; }
        .auth-link { font-size: 13px; color: #a8d96b; text-decoration: none; font-weight: 500; }
        .auth-link:hover { text-decoration: underline; }
        .pw-wrap { position: relative; }
        .pw-toggle { position: absolute; right: 14px; top: 50%; transform: translateY(-70%); background: none; border: none; color: rgba(240,237,232,0.5); cursor: pointer; padding: 0; }
        .steps { display: flex; gap: 8px; margin-bottom: 24px; }
        .step-dot { flex: 1; height: 4px; border-radius: 4px; background: rgba(255,255,255,0.1); transition: background 0.3s; }
        .step-dot.active { background: #a8d96b; }
        .otp-input { font-size: 28px; font-weight: 700; letter-spacing: 16px; text-align: center; }
      `}</style>

      <div className="auth-wrap">
        <div className="auth-box">

          {/* Step indicator */}
          <div className="steps">
            <div className={`step-dot ${step >= 1 ? 'active' : ''}`} />
            <div className={`step-dot ${step >= 2 ? 'active' : ''}`} />
            <div className={`step-dot ${step >= 3 ? 'active' : ''}`} />
          </div>

          {err && <div className="auth-err">{err}</div>}
          {msg && <div className="auth-ok">{msg}</div>}

          {/* Step 1 — Email */}
          {step === 1 && (
            <>
              <div className="auth-tag"> Password Recovery</div>
              <h1 className="auth-title">Forgot password?</h1>
              <p className="auth-sub">Enter your email and we'll send you a 6-digit OTP.</p>
              <form onSubmit={sendOtp}>
                <label className="auth-label">Email</label>
                <input className="auth-input" type="email" placeholder="you@email.com"
                  value={email} onChange={e => setEmail(e.target.value)} required />
                <button className="auth-btn" type="submit" disabled={loading}>
                  {loading ? 'Sending OTP...' : 'Send OTP'}
                </button>
              </form>
            </>
          )}

          {/* Step 2 — OTP */}
          {step === 2 && (
            <>
              <div className="auth-tag"> Check Your Email</div>
              <h1 className="auth-title">Enter OTP</h1>
              <p className="auth-sub">We sent a 6-digit code to <strong style={{color:'#a8d96b'}}>{email}</strong>. Expires in 10 minutes.</p>
              <form onSubmit={verifyOtp}>
                <label className="auth-label">OTP Code</label>
                <input className="auth-input otp-input" type="text" placeholder="000000"
                  value={otp} onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  maxLength={6} required />
                <button className="auth-btn" type="submit" disabled={loading || otp.length !== 6}>
                  {loading ? 'Verifying...' : 'Verify OTP'}
                </button>
              </form>
              <div className="auth-divider" />
              <span className="auth-link" style={{cursor:'pointer'}} onClick={() => { setStep(1); setErr(''); setMsg(''); }}>
                ← Change email
              </span>
            </>
          )}

          {/* Step 3 — New Password */}
          {step === 3 && (
            <>
              <div className="auth-tag"> New Password</div>
              <h1 className="auth-title">Reset password</h1>
              <p className="auth-sub">Enter your new password below.</p>
              <form onSubmit={resetPassword}>
                <label className="auth-label">New Password</label>
                <div className="pw-wrap">
                  <input className="auth-input" type={showPass ? 'text' : 'password'}
                    placeholder="New password" value={password}
                    onChange={e => setPassword(e.target.value)} required />
                  <button type="button" className="pw-toggle" onClick={() => setShowPass(!showPass)}>
                    <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                      <path d={showPass ? mdiEye : mdiEyeOff} />
                    </svg>
                  </button>
                </div>
                <label className="auth-label">Confirm Password</label>
                <div className="pw-wrap">
                  <input className="auth-input" type={showConfirm ? 'text' : 'password'}
                    placeholder="Confirm password" value={confirm}
                    onChange={e => setConfirm(e.target.value)} required />
                  <button type="button" className="pw-toggle" onClick={() => setShowConfirm(!showConfirm)}>
                    <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                      <path d={showConfirm ? mdiEye : mdiEyeOff} />
                    </svg>
                  </button>
                </div>
                <button className="auth-btn" type="submit" disabled={loading}>
                  {loading ? 'Resetting...' : 'Reset Password'}
                </button>
              </form>
            </>
          )}

          <div className="auth-divider" />
          <Link className="auth-link" to="/login">← Back to login</Link>
        </div>
      </div>
    </>
  );
}