import { useState } from 'react';
import { api, saveToken, setAuthToken } from '../api/client';
import { Toast } from '../components/Toast.jsx';
import { useNavigate, Link } from 'react-router-dom';
import { mdiEye, mdiEyeOff } from '@mdi/js';

export default function AgencyLogin() {
  const nav = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [msg, setMsg] = useState('');

  async function submit(e) {
    e.preventDefault();
    setMsg('');
    try {
      const res = await api.post('/api/auth/login', { email, password, login_as: 'agency' });
      saveToken(res.data.token);
      setAuthToken(res.data.token);

      // save user so navbar shows profile + Agency Dashboard link
      const user = res.data.user || { email, role: 'agency' };
      localStorage.setItem('user', JSON.stringify(user));
      window.dispatchEvent(new Event('auth-change'));

      nav('/agency');
    } catch (e) {
      setMsg(e?.response?.data?.error || 'Agency login failed');
    }
  }

  return (
    <div style={{ minHeight: '70vh', display: 'grid', placeItems: 'center' }}>
      <div className="card" style={{ width: 'min(460px, 92vw)' }}>
        <h2 style={{ marginTop: 0 }}>Agency Login</h2>
        <div className="small">Use this portal to manage your travel packages and bookings.</div>
        <Toast msg={msg} />
        <form className="grid" onSubmit={submit} style={{ gap: 12 }}>
          <div>
            <div className="small">Email</div>
            <input className="input" value={email} onChange={e => setEmail(e.target.value)} type="email" required />
          </div>
          <div>
            <div className="small">Password</div>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <input className="input" type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} required />
              <button type="button" style={{ position: 'absolute', right: '10px', background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', color: 'rgba(240,237,232,0.5)' }} onClick={() => setShowPassword(!showPassword)}>
                <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                  <path d={showPassword ? mdiEye : mdiEyeOff} />
                </svg>
              </button>
            </div>
          </div>
          <button className="btn" type="submit">Login as Agency</button>
          <div className="row" style={{ justifyContent: 'space-between' }}>
            <Link className="small" to="/agency-signup">Create agency account</Link>
            <Link className="small" to="/login">Customer login</Link>
          </div>
        </form>
      </div>
    </div>
  );
}
