import { useState } from 'react';
import { api } from '../api/client';
import { Toast } from '../components/Toast.jsx';
import { useNavigate, Link } from 'react-router-dom';

export default function AdminSetup() {
  const nav = useNavigate();
  const [full_name, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm_password, setConfirmPassword] = useState('');
  const [setup_code, setSetupCode] = useState('');
  const [msg, setMsg] = useState('');

  async function submit(e) {
    e.preventDefault();
    setMsg('');
    try {
      const res = await api.post('/api/auth/register-admin', {
        full_name,
        email,
        password,
        confirm_password,
        setup_code,
      });
      setMsg(res.data.message || 'Admin account created.');
      setTimeout(() => nav('/admin-login'), 700);
    } catch (e) {
      setMsg(e?.response?.data?.error || 'Setup failed');
    }
  }

  return (
    <div style={{minHeight:'70vh', display:'grid', placeItems:'center'}}>
      <div className="card" style={{width:'min(520px, 92vw)'}}>
        <h2 style={{marginTop:0}}>Admin Account Setup</h2>
        <div className="small">
          This page is for first-time setup only. Only one admin account is allowed.
        </div>
        <Toast msg={msg} />

        <form className="grid" onSubmit={submit} style={{gap:12}}>
          <div>
            <div className="small">Full Name</div>
            <input className="input" value={full_name} onChange={e=>setFullName(e.target.value)} required />
          </div>
          <div>
            <div className="small">Admin Email</div>
            <input className="input" type="email" value={email} onChange={e=>setEmail(e.target.value)} required />
          </div>
          <div className="row">
            <div style={{flex:1}}>
              <div className="small">Password</div>
              <input className="input" type="password" value={password} onChange={e=>setPassword(e.target.value)} required />
            </div>
            <div style={{flex:1}}>
              <div className="small">Confirm Password</div>
              <input className="input" type="password" value={confirm_password} onChange={e=>setConfirmPassword(e.target.value)} required />
            </div>
          </div>
          <div>
            <div className="small">Setup Code</div>
            <input className="input" value={setup_code} onChange={e=>setSetupCode(e.target.value)} placeholder="Ask the system owner" required />
          </div>
          <button className="btn" type="submit">Create Admin Account</button>

          <div className="row" style={{justifyContent:'space-between'}}>
            <Link className="small" to="/admin-login">Admin login</Link>
            <Link className="small" to="/">Home</Link>
          </div>
        </form>
      </div>
    </div>
  );
}
