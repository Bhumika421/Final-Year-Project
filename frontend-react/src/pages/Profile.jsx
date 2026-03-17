import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api, getToken, clearToken } from '../api/client';

function getUser() {
  try { return JSON.parse(localStorage.getItem('user') || 'null'); } catch { return null; }
}

export default function Profile() {
  const nav = useNavigate();
  const [user, setUser] = useState(getUser);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ full_name: '', current_password: '', new_password: '', confirm_password: '' });
  const [msg, setMsg] = useState({ text: '', type: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!getToken()) { nav('/login'); return; }
    api.get('/api/auth/me')
      .then(res => {
        const u = res.data.user || res.data;
        setUser(u);
        setForm(f => ({ ...f, full_name: u.full_name || '' }));
      })
      .catch(() => {
        const u = getUser();
        if (u) setForm(f => ({ ...f, full_name: u.full_name || '' }));
      })
      .finally(() => setLoading(false));
  }, []);

  function logout() {
    clearToken();
    localStorage.removeItem('user');
    window.dispatchEvent(new Event('auth-change'));
    nav('/');
  }

  async function saveProfile(e) {
    e.preventDefault();
    setMsg({ text: '', type: '' });

    if (form.new_password && form.new_password !== form.confirm_password) {
      setMsg({ text: 'New passwords do not match!', type: 'err' });
      return;
    }

    setSaving(true);
    try {
      const payload = {};
      if (form.full_name && form.full_name !== user?.full_name) payload.full_name = form.full_name;
      if (form.new_password) {
        payload.current_password = form.current_password;
        payload.new_password = form.new_password;
      }
      if (Object.keys(payload).length === 0) {
        setMsg({ text: 'No changes to save.', type: 'err' });
        setSaving(false);
        return;
      }

      const res = await api.put('/api/auth/update', payload);
      const updatedUser = res.data.user;
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
      window.dispatchEvent(new Event('auth-change'));
      setForm(f => ({ ...f, current_password: '', new_password: '', confirm_password: '' }));
      setEditing(false);
      setMsg({ text: 'Profile updated successfully!', type: 'ok' });
    } catch (e) {
      setMsg({ text: e?.response?.data?.error || 'Update failed.', type: 'err' });
    } finally {
      setSaving(false);
    }
  }

  const initials = (user?.full_name || user?.email || 'U')[0].toUpperCase();

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=DM+Sans:wght@300;400;500;600&display=swap');
        .pf-wrap { max-width: 700px; margin: 0 auto; padding: 40px 24px 60px; font-family: 'DM Sans', sans-serif; }
        .pf-tag { font-size: 11px; font-weight: 600; letter-spacing: 0.12em; text-transform: uppercase; color: #a8d96b; margin-bottom: 8px; }
        .pf-title { font-family: 'Playfair Display', serif; font-size: clamp(26px, 4vw, 36px); font-weight: 700; color: #fff; margin: 0 0 28px; }
        .pf-card { background: #131918; border: 1px solid rgba(255,255,255,0.07); border-radius: 20px; padding: 28px; margin-bottom: 16px; }
        .pf-avatar-row { display: flex; align-items: center; gap: 20px; margin-bottom: 24px; }
        .pf-avatar { width: 72px; height: 72px; background: linear-gradient(135deg, #a8d96b, #5fa832); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 28px; font-weight: 700; color: #1a2010; flex-shrink: 0; }
        .pf-name { font-family: 'Playfair Display', serif; font-size: 22px; font-weight: 700; color: #fff; margin: 0 0 6px; }
        .pf-role { display: inline-block; background: rgba(168,217,107,0.12); border: 1px solid rgba(168,217,107,0.25); color: #a8d96b; font-size: 11px; font-weight: 700; padding: 3px 12px; border-radius: 100px; text-transform: capitalize; }
        .pf-divider { height: 1px; background: rgba(255,255,255,0.07); margin: 20px 0; }
        .pf-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
        .pf-label { font-size: 11px; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase; color: rgba(240,237,232,0.4); margin-bottom: 5px; }
        .pf-value { font-size: 15px; color: #f0ede8; font-weight: 500; }
        .pf-input { width: 100%; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.08); border-radius: 12px; padding: 11px 14px; color: #f0ede8; font-family: 'DM Sans', sans-serif; font-size: 14px; outline: none; transition: border-color 0.2s; box-sizing: border-box; margin-top: 6px; }
        .pf-input:focus { border-color: rgba(168,217,107,0.5); }
        .pf-input::placeholder { color: rgba(240,237,232,0.2); }
        .pf-btn-row { display: flex; gap: 10px; flex-wrap: wrap; margin-top: 4px; }
        .pf-btn { flex: 1; min-width: 120px; text-align: center; background: rgba(168,217,107,0.1); color: #a8d96b; border: 1px solid rgba(168,217,107,0.25); border-radius: 100px; padding: 11px 20px; font-family: 'DM Sans', sans-serif; font-size: 14px; font-weight: 600; cursor: pointer; text-decoration: none; transition: background 0.2s; display: inline-block; }
        .pf-btn:hover { background: rgba(168,217,107,0.2); }
        .pf-btn-solid { background: #a8d96b; color: #1a2010; border: none; }
        .pf-btn-solid:hover { background: #c1e88d; }
        .pf-btn-danger { background: rgba(248,113,113,0.08); color: #f87171; border: 1px solid rgba(248,113,113,0.2); }
        .pf-btn-danger:hover { background: rgba(248,113,113,0.18); }
        .pf-btn-ghost { background: transparent; color: rgba(240,237,232,0.5); border: 1px solid rgba(255,255,255,0.1); }
        .pf-btn-ghost:hover { background: rgba(255,255,255,0.05); color: #fff; }
        .pf-msg-ok { background: rgba(168,217,107,0.1); border: 1px solid rgba(168,217,107,0.25); color: #a8d96b; border-radius: 12px; padding: 10px 14px; font-size: 13px; margin-bottom: 16px; }
        .pf-msg-err { background: rgba(248,113,113,0.08); border: 1px solid rgba(248,113,113,0.2); color: #f87171; border-radius: 12px; padding: 10px 14px; font-size: 13px; margin-bottom: 16px; }
        .pf-skeleton { background: linear-gradient(90deg, #131918 25%, #1a2218 50%, #131918 75%); background-size: 200% 100%; animation: shimmer 1.4s infinite; border-radius: 20px; height: 200px; margin-bottom: 16px; }
        @keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
        @media (max-width: 480px) { .pf-grid { grid-template-columns: 1fr; } .pf-btn-row { flex-direction: column; } }
      `}</style>

      <div className="pf-wrap">
        <div className="pf-tag">👤 My Account</div>
        <h1 className="pf-title">Profile</h1>

        {msg.text && <div className={msg.type === 'ok' ? 'pf-msg-ok' : 'pf-msg-err'}>{msg.text}</div>}

        {loading ? (
          <>
            <div className="pf-skeleton" />
            <div className="pf-skeleton" style={{height: 120}} />
          </>
        ) : (
          <>
            {/* Avatar + Info */}
            <div className="pf-card">
              <div className="pf-avatar-row">
                <div className="pf-avatar">{initials}</div>
                <div>
                  <div className="pf-name">{user?.full_name || 'Traveler'}</div>
                  <span className="pf-role">{user?.role || 'Customer'}</span>
                </div>
              </div>

              <div className="pf-divider" />

              <div className="pf-grid">
                <div>
                  <div className="pf-label">Email</div>
                  <div className="pf-value">{user?.email}</div>
                </div>
                <div>
                  <div className="pf-label">Account Status</div>
                  <div className="pf-value" style={{color: '#a8d96b', textTransform: 'capitalize'}}>{user?.verification_status || 'Verified'}</div>
                </div>
              </div>

              <div className="pf-divider" />

              {!editing ? (
                <button className="pf-btn" onClick={() => { setEditing(true); setMsg({text:'',type:''}); }}>
                  ✏️ Edit Profile
                </button>
              ) : (
                <form onSubmit={saveProfile}>
                  <div style={{marginBottom: 16}}>
                    <div className="pf-label">Full Name</div>
                    <input className="pf-input" value={form.full_name} onChange={e => setForm(f => ({...f, full_name: e.target.value}))} placeholder="Your full name" />
                  </div>

                  <div className="pf-divider" />
                  <div className="pf-label" style={{marginBottom: 12}}>Change Password (optional)</div>

                  <div className="pf-grid" style={{marginBottom: 12}}>
                    <div>
                      <div className="pf-label">Current Password</div>
                      <input className="pf-input" type="password" value={form.current_password} onChange={e => setForm(f => ({...f, current_password: e.target.value}))} placeholder="Current password" />
                    </div>
                    <div>
                      <div className="pf-label">New Password</div>
                      <input className="pf-input" type="password" value={form.new_password} onChange={e => setForm(f => ({...f, new_password: e.target.value}))} placeholder="New password" />
                    </div>
                  </div>
                  <div style={{marginBottom: 20}}>
                    <div className="pf-label">Confirm New Password</div>
                    <input className="pf-input" type="password" value={form.confirm_password} onChange={e => setForm(f => ({...f, confirm_password: e.target.value}))} placeholder="Repeat new password" />
                  </div>

                  <div className="pf-btn-row">
                    <button type="submit" className="pf-btn pf-btn-solid" disabled={saving}>{saving ? 'Saving...' : 'Save Changes'}</button>
                    <button type="button" className="pf-btn pf-btn-ghost" onClick={() => { setEditing(false); setMsg({text:'',type:''}); }}>Cancel</button>
                  </div>
                </form>
              )}
            </div>

            {/* Quick Links */}
            <div className="pf-card">
              <div className="pf-label" style={{marginBottom: 14}}>Quick Links</div>
              <div className="pf-btn-row">
                <Link className="pf-btn" to="/dashboard">Dashboard</Link>
                <Link className="pf-btn" to="/bookings">My Bookings</Link>
                <Link className="pf-btn" to="/wishlist">Wishlist</Link>
                <Link className="pf-btn" to="/support">Support</Link>
              </div>
              <div className="pf-divider" />
              <button className="pf-btn pf-btn-danger" onClick={logout} style={{width: '100%'}}>Log out</button>
            </div>
          </>
        )}
      </div>
    </>
  );
}
