import { useState } from 'react';
import { api } from '../api/client';
import { Toast } from '../components/Toast.jsx';
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

  async function submit(e) {
    e.preventDefault();
    setMsg('');
    try {
      const res = await api.post('/api/auth/register-agency', {
        full_name,
        email,
        phone: phone || null,
        address: address || null,
        business_name,
        license_no,
        password,
        confirm_password,
      });
      setMsg(res.data.message || 'Agency account created.');
      setTimeout(() => nav('/agency-login'), 600);
    } catch (e) {
      setMsg(e?.response?.data?.error || 'Signup failed');
    }
  }

  return (
    <div style={{minHeight:'70vh', display:'grid', placeItems:'center'}}>
      <div className="card" style={{width:'min(520px, 92vw)'}}>
        <h2 style={{marginTop:0}}>Agency Sign Up</h2>
        <div className="small">
          Agency accounts are reviewed by the admin team before they can access the agency dashboard.
        </div>
        <Toast msg={msg} />

        <form className="grid" onSubmit={submit} style={{gap:12}}>
          <div className="row">
            <div style={{flex:1}}>
              <div className="small">Contact Name</div>
              <input className="input" value={full_name} onChange={e=>setFullName(e.target.value)} required />
            </div>
            <div style={{flex:1}}>
              <div className="small">Business Name</div>
              <input className="input" value={business_name} onChange={e=>setBusinessName(e.target.value)} required />
            </div>
          </div>

          <div className="row">
            <div style={{flex:1}}>
              <div className="small">Email</div>
              <input className="input" type="email" value={email} onChange={e=>setEmail(e.target.value)} required />
            </div>
            <div style={{flex:1}}>
              <div className="small">Phone (optional)</div>
              <input className="input" value={phone} onChange={e=>setPhone(e.target.value)} />
            </div>
          </div>

          <div>
            <div className="small">Address (optional)</div>
            <input className="input" value={address} onChange={e=>setAddress(e.target.value)} />
          </div>

          <div>
            <div className="small">License / Registration No.</div>
            <input className="input" value={license_no} onChange={e=>setLicenseNo(e.target.value)} required />
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

          <button className="btn" type="submit">Create Agency Account</button>
          <div className="row" style={{justifyContent:'space-between'}}>
            <Link className="small" to="/agency-login">Already have an agency account?</Link>
            <Link className="small" to="/login">Customer login</Link>
          </div>
        </form>
      </div>
    </div>
  );
}
