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
        .pf-tag { font-size: 11px; font-weight: 600; letter-spacing: 0.12em; text-transform: uppercase; margin-bottom: 8px; }
        .pf-title { font-family: 'Playfair Display', serif; font-size: clamp(26px, 4vw, 36px); font-weight: 700; color: #fff; margin: 0 0 28px; }
        .pf-card { background: #131918; border: 1px solid rgba(255,255,255,0.07); border-radius: 20px; padding: 28px; margin-bottom: 16px; }
        .pf-avatar-row { display: flex; align-items: center; gap: 20px; margin-bottom: 24px; }
        .pf-avatar { width: 72px; height: 72px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 28px; font-weight: 700; color: #fff; flex-shrink: 0; }
        .pf-name { font-family: 'Playfair Display', serif; font-size: 22px; font-weight: 700; color: #fff; margin: 0 0 6px; }
        .pf-role { display: inline-block; font-size: 11px; font-weight: 700; padding: 3px 12px; border-radius: 100px; text-transform: capitalize; border: 1px solid; }
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
        .pf-btn-purple { background: rgba(99,102,241,0.1); color: #a5b4fc; border: 1px solid rgba(99,102,241,0.25); }
        .pf-btn-purple:hover { background: rgba(99,102,241,0.2); }
        .pf-btn-blue { background: rgba(59,111,212,0.1); color: #6b9eff; border: 1px solid rgba(59,111,212,0.25); }
        .pf-btn-blue:hover { background: rgba(59,111,212,0.2); }
        .pf-msg-ok { background: rgba(168,217,107,0.1); border: 1px solid rgba(168,217,107,0.25); color: #a8d96b; border-radius: 12px; padding: 10px 14px; font-size: 13px; margin-bottom: 16px; }
        .pf-msg-err { background: rgba(248,113,113,0.08); border: 1px solid rgba(248,113,113,0.2); color: #f87171; border-radius: 12px; padding: 10px 14px; font-size: 13px; margin-bottom: 16px; }
        .pf-skeleton { background: linear-gradient(90deg, #131918 25%, #1a2218 50%, #131918 75%); background-size: 200% 100%; animation: shimmer 1.4s infinite; border-radius: 20px; height: 200px; margin-bottom: 16px; }
        @keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
        @media (max-width: 480px) { .pf-grid { grid-template-columns: 1fr; } .pf-btn-row { flex-direction: column; } }
      `}</style>

      <div className="pf-wrap">

        {/* Tag — role based */}
        <div className="pf-tag" style={{
          color: user?.role === 'admin' ? '#a5b4fc' :
                 user?.role === 'agency' ? '#6b9eff' : '#a8d96b'
        }}>
          {user?.role === 'admin' ? '🛡 Admin Account' :
           user?.role === 'agency' ? '🏢 Agency Account' :
           '👤 My Account'}
        </div>

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

                {/* Avatar color — role based */}
                <div className="pf-avatar" style={{
                  background: user?.role === 'admin'
                    ? 'linear-gradient(135deg, #4f46e5, #7c3aed)'
                    : user?.role === 'agency'
                    ? 'linear-gradient(135deg, #2d5bbf, #3b6fd4)'
                    : 'linear-gradient(135deg, #a8d96b, #5fa832)',
                  color: user?.role === 'admin' || user?.role === 'agency' ? '#fff' : '#1a2010'
                }}>
                  {initials}
                </div>

                <div>
                  <div className="pf-name">{user?.full_name || 'User'}</div>

                  {/* Role badge — role based color */}
                  <span className="pf-role" style={{
                    background: user?.role === 'admin' ? 'rgba(99,102,241,0.12)' :
                                user?.role === 'agency' ? 'rgba(59,111,212,0.12)' :
                                'rgba(168,217,107,0.12)',
                    borderColor: user?.role === 'admin' ? 'rgba(99,102,241,0.25)' :
                                 user?.role === 'agency' ? 'rgba(59,111,212,0.25)' :
                                 'rgba(168,217,107,0.25)',
                    color: user?.role === 'admin' ? '#a5b4fc' :
                           user?.role === 'agency' ? '#6b9eff' :
                           '#a8d96b',
                  }}>
                    {user?.role === 'admin' ? ' Super Admin' :
                     user?.role === 'agency' ? ' Agency' :
                     '👤 Customer'}
                  </span>
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
                  <div className="pf-value" style={{color: '#a8d96b', textTransform: 'capitalize'}}>
                    {user?.verification_status || 'Verified'}
                  </div>
                </div>
                {user?.role === 'agency' && user?.business_name && (
                  <div>
                    <div className="pf-label">Business Name</div>
                    <div className="pf-value">{user.business_name}</div>
                  </div>
                )}
                {user?.role === 'agency' && user?.license_no && (
                  <div>
                    <div className="pf-label">License No.</div>
                    <div className="pf-value">{user.license_no}</div>
                  </div>
                )}
              </div>

              <div className="pf-divider" />

              {!editing ? (
                <button className="pf-btn" onClick={() => { setEditing(true); setMsg({text:'',type:''}); }}
                  style={{
                    background: user?.role === 'admin' ? 'rgba(99,102,241,0.1)' :
                                user?.role === 'agency' ? 'rgba(59,111,212,0.1)' :
                                'rgba(168,217,107,0.1)',
                    color: user?.role === 'admin' ? '#a5b4fc' :
                           user?.role === 'agency' ? '#6b9eff' :
                           '#a8d96b',
                    borderColor: user?.role === 'admin' ? 'rgba(99,102,241,0.25)' :
                                 user?.role === 'agency' ? 'rgba(59,111,212,0.25)' :
                                 'rgba(168,217,107,0.25)',
                  }}>
                  ✏️ Edit Profile
                </button>
              ) : (
                <form onSubmit={saveProfile}>
                  <div style={{marginBottom: 16}}>
                    <div className="pf-label">Full Name</div>
                    <input className="pf-input" value={form.full_name}
                      onChange={e => setForm(f => ({...f, full_name: e.target.value}))}
                      placeholder="Your full name" />
                  </div>

                  <div className="pf-divider" />
                  <div className="pf-label" style={{marginBottom: 12}}>Change Password (optional)</div>

                  <div className="pf-grid" style={{marginBottom: 12}}>
                    <div>
                      <div className="pf-label">Current Password</div>
                      <input className="pf-input" type="password" value={form.current_password}
                        onChange={e => setForm(f => ({...f, current_password: e.target.value}))}
                        placeholder="Current password" />
                    </div>
                    <div>
                      <div className="pf-label">New Password</div>
                      <input className="pf-input" type="password" value={form.new_password}
                        onChange={e => setForm(f => ({...f, new_password: e.target.value}))}
                        placeholder="New password" />
                    </div>
                  </div>

                  <div style={{marginBottom: 20}}>
                    <div className="pf-label">Confirm New Password</div>
                    <input className="pf-input" type="password" value={form.confirm_password}
                      onChange={e => setForm(f => ({...f, confirm_password: e.target.value}))}
                      placeholder="Repeat new password" />
                  </div>

                  <div className="pf-btn-row">
                    <button type="submit" className="pf-btn pf-btn-solid" disabled={saving}>
                      {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                    <button type="button" className="pf-btn pf-btn-ghost"
                      onClick={() => { setEditing(false); setMsg({text:'',type:''}); }}>
                      Cancel
                    </button>
                  </div>
                </form>
              )}
            </div>

            {/* Quick Links — role based */}
            <div className="pf-card">
              <div className="pf-label" style={{marginBottom: 14}}>Quick Links</div>

              <div className="pf-btn-row">
                {/* Admin links */}
                {user?.role === 'admin' && <>
                  <Link className="pf-btn pf-btn-purple" to="/admin">🛡 Admin Panel</Link>
                  <Link className="pf-btn pf-btn-purple" to="/admin">Manage Agencies</Link>
                  <Link className="pf-btn pf-btn-purple" to="/admin">Manage Tours</Link>
                  <Link className="pf-btn pf-btn-purple" to="/admin">Support Tickets</Link>
                </>}

                {/* Agency links */}
                {user?.role === 'agency' && <>
                  <Link className="pf-btn pf-btn-blue" to="/agency"> Agency Dashboard</Link>
                  <Link className="pf-btn pf-btn-blue" to="/support">Support</Link>
                </>}

                {/* Customer links */}
                {user?.role === 'customer' && <>
                  <Link className="pf-btn" to="/dashboard">Dashboard</Link>
                  <Link className="pf-btn" to="/bookings">My Bookings</Link>
                  <Link className="pf-btn" to="/wishlist">Wishlist</Link>
                  <Link className="pf-btn" to="/support">Support</Link>
                </>}
              </div>

              {/* Admin special notice */}
              {user?.role === 'admin' && (
                <div style={{
                  background: 'rgba(99,102,241,0.07)',
                  border: '1px solid rgba(99,102,241,0.15)',
                  borderRadius: '12px',
                  padding: '12px 16px',
                  margin: '16px 0 0',
                  fontSize: '13px',
                  color: 'rgba(165,180,252,0.7)',
                  lineHeight: 1.5
                }}>
                  🛡 You are logged in as <strong style={{color: '#a5b4fc'}}>Super Admin</strong>. Full platform access enabled.
                </div>
              )}

              {/* Agency verification notice */}
              {user?.role === 'agency' && user?.verification_status === 'pending' && (
                <div style={{
                  background: 'rgba(217,119,6,0.07)',
                  border: '1px solid rgba(217,119,6,0.2)',
                  borderRadius: '12px',
                  padding: '12px 16px',
                  margin: '16px 0 0',
                  fontSize: '13px',
                  color: 'rgba(253,186,116,0.8)',
                  lineHeight: 1.5
                }}>
                  Your agency account is <strong>pending verification</strong>. Admin will review shortly.
                </div>
              )}

              <div className="pf-divider" />
              <button className="pf-btn pf-btn-danger" onClick={logout} style={{width: '100%'}}>
                Log out
              </button>
            </div>
          </>
        )}
      </div>
    </>
  );
}