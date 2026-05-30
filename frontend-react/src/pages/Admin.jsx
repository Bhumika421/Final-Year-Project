import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, getToken } from '../api/client';
import { Toast } from '../components/Toast.jsx';

function getUser() {
  try { return JSON.parse(localStorage.getItem('user') || 'null'); } catch { return null; }
}

const iStyle = {
  width:'100%', padding:'10px 12px', borderRadius:'10px',
  border:'1px solid rgba(255,255,255,0.1)',
  background:'rgba(11, 18, 32, 0.9)',
  color:'#e8eefc', fontSize:'14px', fontFamily:'inherit', boxSizing:'border-box'
};

function AdminProfileEdit({ user, onUpdated }) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    full_name: user?.full_name || '',
    current_password: '',
    new_password: '',
    confirm_password: ''
  });
  const [showPass, setShowPass] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');
  const [ok, setOk] = useState('');

  async function save(e) {
    e.preventDefault();
    setErr(''); setOk('');
    if (form.new_password && form.new_password !== form.confirm_password) {
      setErr('Passwords do not match!'); return;
    }
    const payload = {};
    if (form.full_name && form.full_name !== user?.full_name) payload.full_name = form.full_name;
    if (form.new_password) {
      payload.current_password = form.current_password;
      payload.new_password = form.new_password;
    }
    if (Object.keys(payload).length === 0) { setErr('No changes to save.'); return; }
    setSaving(true);
    try {
      const res = await api.put('/api/auth/update', payload);
      onUpdated(res.data.user);
      setForm(f => ({ ...f, current_password: '', new_password: '', confirm_password: '' }));
      setEditing(false);
      setOk('Profile updated successfully!');
      setTimeout(() => setOk(''), 3000);
    } catch (e) {
      setErr(e?.response?.data?.error || 'Update failed.');
    } finally { setSaving(false); }
  }

  const inputStyle = {
    width:'100%', background:'#1e2130',
    border:'1px solid rgba(255,255,255,0.07)',
    borderRadius:'10px', padding:'11px 13px',
    color:'#e8eefc', fontFamily:'inherit',
    fontSize:'14px', outline:'none', boxSizing:'border-box'
  };

  const labelStyle = {
    fontSize:'11px', fontWeight:'700',
    color:'rgba(232,238,252,0.35)',
    letterSpacing:'0.1em', textTransform:'uppercase',
    display:'block', marginBottom:'6px'
  };

  return (
    <div style={{background:'#0d1220', border:'1px solid rgba(99,102,241,0.15)', borderRadius:'16px', padding:'24px'}}>
      <div style={{fontSize:'14px', fontWeight:'700', color:'#e8eefc', marginBottom:'20px'}}>
        {editing ? 'Edit Profile' : 'Account Settings'}
      </div>
      {err && <div style={{background:'rgba(248,113,113,0.08)', border:'1px solid rgba(248,113,113,0.2)', color:'#f87171', borderRadius:'10px', padding:'10px 13px', fontSize:'13px', marginBottom:'14px'}}>{err}</div>}
      {ok && <div style={{background:'rgba(99,102,241,0.08)', border:'1px solid rgba(99,102,241,0.2)', color:'#a5b4fc', borderRadius:'10px', padding:'10px 13px', fontSize:'13px', marginBottom:'14px'}}>{ok}</div>}
      {!editing ? (
        <div style={{display:'flex', flexDirection:'column', gap:'12px'}}>
          <button onClick={() => { setEditing(true); setErr(''); setOk(''); }}
            style={{width:'100%', background:'linear-gradient(135deg, #4f46e5, #7c3aed)', color:'#fff', border:'none', borderRadius:'10px', padding:'12px', fontSize:'14px', fontWeight:'700', cursor:'pointer', boxShadow:'0 4px 16px rgba(99,102,241,0.25)'}}>
            Edit Profile & Password
          </button>
          <div style={{height:'1px', background:'rgba(255,255,255,0.06)'}} />
          <button onClick={() => { localStorage.removeItem('sjp_token'); localStorage.removeItem('user'); window.location.href = '/admin-login'; }}
            style={{width:'100%', background:'rgba(239,68,68,0.08)', color:'#f87171', border:'1px solid rgba(239,68,68,0.18)', borderRadius:'10px', padding:'12px', fontSize:'14px', fontWeight:'600', cursor:'pointer'}}>
            Logout
          </button>
        </div>
      ) : (
        <form onSubmit={save}>
          <div style={{marginBottom:'16px'}}>
            <label style={labelStyle}>Full Name</label>
            <input style={inputStyle} value={form.full_name} onChange={e => setForm(f => ({...f, full_name: e.target.value}))} placeholder="Your full name" />
          </div>
          <div style={{height:'1px', background:'rgba(255,255,255,0.06)', margin:'16px 0'}} />
          <div style={{...labelStyle, marginBottom:'14px'}}>Change Password (optional)</div>
          <div style={{marginBottom:'12px'}}>
            <label style={labelStyle}>Current Password</label>
            <div style={{position:'relative'}}>
              <input style={{...inputStyle, paddingRight:'44px'}} type={showPass ? 'text' : 'password'} value={form.current_password} onChange={e => setForm(f => ({...f, current_password: e.target.value}))} placeholder="Current password" />
              <button type="button" onClick={() => setShowPass(!showPass)} style={{position:'absolute', right:'12px', top:'50%', transform:'translateY(-50%)', background:'none', border:'none', color:'rgba(232,238,252,0.3)', cursor:'pointer', padding:0, fontSize:'13px'}}>
                {showPass ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>
          <div style={{marginBottom:'12px'}}>
            <label style={labelStyle}>New Password</label>
            <div style={{position:'relative'}}>
              <input style={{...inputStyle, paddingRight:'44px'}} type={showNew ? 'text' : 'password'} value={form.new_password} onChange={e => setForm(f => ({...f, new_password: e.target.value}))} placeholder="New password" />
              <button type="button" onClick={() => setShowNew(!showNew)} style={{position:'absolute', right:'12px', top:'50%', transform:'translateY(-50%)', background:'none', border:'none', color:'rgba(232,238,252,0.3)', cursor:'pointer', padding:0, fontSize:'13px'}}>
                {showNew ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>
          <div style={{marginBottom:'20px'}}>
            <label style={labelStyle}>Confirm New Password</label>
            <input style={inputStyle} type="password" value={form.confirm_password} onChange={e => setForm(f => ({...f, confirm_password: e.target.value}))} placeholder="Repeat new password" />
          </div>
          <div style={{display:'flex', gap:'10px'}}>
            <button type="submit" disabled={saving} style={{flex:1, background:'linear-gradient(135deg, #4f46e5, #7c3aed)', color:'#fff', border:'none', borderRadius:'10px', padding:'12px', fontSize:'14px', fontWeight:'700', cursor:'pointer', opacity: saving ? 0.6 : 1}}>
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
            <button type="button" onClick={() => { setEditing(false); setErr(''); setOk(''); }} style={{flex:1, background:'rgba(255,255,255,0.04)', color:'rgba(232,238,252,0.55)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:'10px', padding:'12px', fontSize:'14px', fontWeight:'600', cursor:'pointer'}}>
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

function EditUserModal({ user, onClose, onSaved }) {
  const [form, setForm] = useState({
    full_name: user.full_name || '',
    email: user.email || '',
    role: user.role || 'customer',
    verification_status: user.verification_status || 'pending',
    business_name: user.business_name || '',
    license_no: user.license_no || '',
    is_active: user.is_active ?? 1,
  });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');

  async function save() {
    setSaving(true); setErr('');
    try {
      await api.put(`/api/admin/users/${user.id}`, form);
      onSaved(); onClose();
    } catch (e) {
      setErr(e?.response?.data?.error || 'Update failed');
    } finally { setSaving(false); }
  }

  return (
    <div onClick={e => e.target === e.currentTarget && onClose()} style={{position:'fixed', inset:0, background:'rgba(0,0,0,0.75)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center', padding:'20px', backdropFilter:'blur(4px)'}}>
      <div style={{background:'#0d1220', border:'1px solid rgba(99,102,241,0.2)', borderRadius:'18px', width:'100%', maxWidth:'520px', maxHeight:'90vh', display:'flex', flexDirection:'column'}}>
        <div style={{padding:'22px 24px 0', display:'flex', justifyContent:'space-between', alignItems:'center', flexShrink:0}}>
          <div>
            <h2 style={{margin:'0 0 4px', color:'#e8eefc', fontSize:'18px', fontWeight:'900'}}>Edit User</h2>
            <p style={{margin:0, fontSize:'12px', color:'rgba(232,238,252,0.4)'}}>ID: {user.id} — changes save to database</p>
          </div>
          <button onClick={onClose} style={{background:'rgba(255,255,255,0.05)', border:'none', color:'rgba(232,238,252,0.5)', width:'30px', height:'30px', borderRadius:'8px', cursor:'pointer', fontSize:'16px'}}>x</button>
        </div>
        <div style={{padding:'20px 24px', overflowY:'auto', display:'flex', flexDirection:'column', gap:'12px', flex:1}}>
          {err && <div style={{background:'rgba(248,113,113,0.1)', border:'1px solid rgba(248,113,113,0.2)', color:'#f87171', padding:'10px 14px', borderRadius:'8px', fontSize:'13px'}}>{err}</div>}
          <div style={{fontSize:'10px', fontWeight:'700', letterSpacing:'0.1em', textTransform:'uppercase', color:'rgba(99,102,241,0.6)', borderBottom:'1px solid rgba(99,102,241,0.1)', paddingBottom:'6px'}}>Personal Info</div>
          <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px'}}>
            <div><div style={{fontSize:'11px', color:'rgba(232,238,252,0.4)', marginBottom:'5px', textTransform:'uppercase'}}>Full Name</div><input style={iStyle} value={form.full_name} onChange={e=>setForm(f=>({...f,full_name:e.target.value}))} /></div>
            <div><div style={{fontSize:'11px', color:'rgba(232,238,252,0.4)', marginBottom:'5px', textTransform:'uppercase'}}>Email</div><input style={iStyle} value={form.email} onChange={e=>setForm(f=>({...f,email:e.target.value}))} /></div>
          </div>
          <div style={{fontSize:'10px', fontWeight:'700', letterSpacing:'0.1em', textTransform:'uppercase', color:'rgba(99,102,241,0.6)', borderBottom:'1px solid rgba(99,102,241,0.1)', paddingBottom:'6px'}}>Role & Status</div>
          <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px'}}>
            <div>
              <div style={{fontSize:'11px', color:'rgba(232,238,252,0.4)', marginBottom:'5px', textTransform:'uppercase'}}>Role</div>
              <select style={iStyle} value={form.role} onChange={e=>setForm(f=>({...f,role:e.target.value}))}>
                <option value="customer">Customer</option>
                <option value="agency">Agency</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div>
              <div style={{fontSize:'11px', color:'rgba(232,238,252,0.4)', marginBottom:'5px', textTransform:'uppercase'}}>Verification Status</div>
              <select style={iStyle} value={form.verification_status} onChange={e=>setForm(f=>({...f,verification_status:e.target.value}))}>
                <option value="pending">Pending</option>
                <option value="verified">Verified</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
            <div>
              <div style={{fontSize:'11px', color:'rgba(232,238,252,0.4)', marginBottom:'5px', textTransform:'uppercase'}}>Active</div>
              <select style={iStyle} value={form.is_active} onChange={e=>setForm(f=>({...f,is_active:Number(e.target.value)}))}>
                <option value={1}>Active</option>
                <option value={0}>Inactive</option>
              </select>
            </div>
          </div>
          <div style={{fontSize:'10px', fontWeight:'700', letterSpacing:'0.1em', textTransform:'uppercase', color:'rgba(99,102,241,0.6)', borderBottom:'1px solid rgba(99,102,241,0.1)', paddingBottom:'6px'}}>Agency Info</div>
          <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px'}}>
            <div><div style={{fontSize:'11px', color:'rgba(232,238,252,0.4)', marginBottom:'5px', textTransform:'uppercase'}}>Business Name</div><input style={iStyle} value={form.business_name} onChange={e=>setForm(f=>({...f,business_name:e.target.value}))} placeholder="—" /></div>
            <div><div style={{fontSize:'11px', color:'rgba(232,238,252,0.4)', marginBottom:'5px', textTransform:'uppercase'}}>License No</div><input style={iStyle} value={form.license_no} onChange={e=>setForm(f=>({...f,license_no:e.target.value}))} placeholder="—" /></div>
          </div>
        </div>
        <div style={{padding:'16px 24px', borderTop:'1px solid rgba(255,255,255,0.06)', display:'flex', gap:'10px', justifyContent:'flex-end', flexShrink:0}}>
          <button onClick={onClose} style={{background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.09)', color:'rgba(232,238,252,0.55)', borderRadius:'100px', padding:'10px 22px', cursor:'pointer', fontSize:'13px', fontFamily:'inherit'}}>Cancel</button>
          <button onClick={save} disabled={saving} style={{background:'#6366f1', border:'none', color:'white', borderRadius:'100px', padding:'10px 26px', cursor:'pointer', fontWeight:'700', fontSize:'13px', fontFamily:'inherit', opacity: saving ? 0.6 : 1}}>
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}

function EditTourModal({ tour, onClose, onSaved }) {
  const [form, setForm] = useState({
    title: tour.title || '',
    destination: tour.destination || '',
    category: tour.category || '',
    duration_days: tour.duration_days || 1,
    price_usd: tour.price_usd || 0,
    rating: tour.rating || 4.5,
    image_url: tour.image_url || '',
    description: tour.description || '',
    latitude: tour.latitude || '',
    longitude: tour.longitude || '',
  });
  const [itinerary, setItinerary] = useState(() => {
    if (Array.isArray(tour.itinerary) && tour.itinerary.length > 0) return tour.itinerary;
    if (typeof tour.itinerary_json === 'string') {
      try { const p = JSON.parse(tour.itinerary_json); return p.length > 0 ? p : [{ day:1, title:'', details:'' }]; } catch {}
    }
    return [{ day:1, title:'', details:'' }];
  });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');

  function updateItin(i, k, v) {
    setItinerary(prev => prev.map((d, idx) => idx === i ? { ...d, [k]: v } : d));
  }

  async function save() {
    setSaving(true); setErr('');
    try {
      await api.put(`/api/admin/tours/${tour.id}`, {
        ...form,
        duration_days: Number(form.duration_days),
        price_usd: Number(form.price_usd),
        rating: Number(form.rating),
        latitude: form.latitude ? Number(form.latitude) : null,
        longitude: form.longitude ? Number(form.longitude) : null,
        itinerary,
      });
      onSaved(); onClose();
    } catch (e) {
      setErr(e?.response?.data?.error || 'Update failed');
    } finally { setSaving(false); }
  }

  return (
    <div onClick={e => e.target === e.currentTarget && onClose()} style={{position:'fixed', inset:0, background:'rgba(0,0,0,0.75)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center', padding:'20px', backdropFilter:'blur(4px)'}}>
      <div style={{background:'#0d1220', border:'1px solid rgba(99,102,241,0.2)', borderRadius:'18px', width:'100%', maxWidth:'660px', maxHeight:'90vh', display:'flex', flexDirection:'column'}}>
        <div style={{padding:'22px 24px 0', display:'flex', justifyContent:'space-between', alignItems:'center', flexShrink:0}}>
          <div>
            <h2 style={{margin:'0 0 4px', color:'#e8eefc', fontSize:'18px', fontWeight:'900'}}>Edit Tour</h2>
            <p style={{margin:0, fontSize:'12px', color:'rgba(232,238,252,0.4)'}}>Changes save directly to database</p>
          </div>
          <button onClick={onClose} style={{background:'rgba(255,255,255,0.05)', border:'none', color:'rgba(232,238,252,0.5)', width:'30px', height:'30px', borderRadius:'8px', cursor:'pointer', fontSize:'16px'}}>x</button>
        </div>
        <div style={{padding:'20px 24px', overflowY:'auto', display:'flex', flexDirection:'column', gap:'14px', flex:1}}>
          {err && <div style={{background:'rgba(248,113,113,0.1)', border:'1px solid rgba(248,113,113,0.2)', color:'#f87171', padding:'10px 14px', borderRadius:'8px', fontSize:'13px'}}>{err}</div>}
          <div style={{fontSize:'10px', fontWeight:'700', letterSpacing:'0.1em', textTransform:'uppercase', color:'rgba(99,102,241,0.6)', borderBottom:'1px solid rgba(99,102,241,0.1)', paddingBottom:'6px'}}>Basic Info</div>
          <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px'}}>
            <div><div style={{fontSize:'11px', color:'rgba(232,238,252,0.4)', marginBottom:'5px', textTransform:'uppercase'}}>Title</div><input style={iStyle} value={form.title} onChange={e=>setForm(f=>({...f,title:e.target.value}))} /></div>
            <div><div style={{fontSize:'11px', color:'rgba(232,238,252,0.4)', marginBottom:'5px', textTransform:'uppercase'}}>Destination</div><input style={iStyle} value={form.destination} onChange={e=>setForm(f=>({...f,destination:e.target.value}))} /></div>
            <div><div style={{fontSize:'11px', color:'rgba(232,238,252,0.4)', marginBottom:'5px', textTransform:'uppercase'}}>Category</div><input style={iStyle} value={form.category} onChange={e=>setForm(f=>({...f,category:e.target.value}))} /></div>
            <div><div style={{fontSize:'11px', color:'rgba(232,238,252,0.4)', marginBottom:'5px', textTransform:'uppercase'}}>Duration (days)</div><input style={iStyle} type="number" value={form.duration_days} onChange={e=>setForm(f=>({...f,duration_days:e.target.value}))} /></div>
            <div><div style={{fontSize:'11px', color:'rgba(232,238,252,0.4)', marginBottom:'5px', textTransform:'uppercase'}}>Price (USD)</div><input style={iStyle} type="number" value={form.price_usd} onChange={e=>setForm(f=>({...f,price_usd:e.target.value}))} /></div>
            <div><div style={{fontSize:'11px', color:'rgba(232,238,252,0.4)', marginBottom:'5px', textTransform:'uppercase'}}>Rating</div><input style={iStyle} type="number" step="0.1" min="0" max="5" value={form.rating} onChange={e=>setForm(f=>({...f,rating:e.target.value}))} /></div>
          </div>
          <div style={{fontSize:'10px', fontWeight:'700', letterSpacing:'0.1em', textTransform:'uppercase', color:'rgba(99,102,241,0.6)', borderBottom:'1px solid rgba(99,102,241,0.1)', paddingBottom:'6px'}}>Location & Image</div>
          <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px'}}>
            <div><div style={{fontSize:'11px', color:'rgba(232,238,252,0.4)', marginBottom:'5px', textTransform:'uppercase'}}>Latitude</div><input style={iStyle} type="number" step="any" value={form.latitude} onChange={e=>setForm(f=>({...f,latitude:e.target.value}))} placeholder="e.g. 27.9881" /></div>
            <div><div style={{fontSize:'11px', color:'rgba(232,238,252,0.4)', marginBottom:'5px', textTransform:'uppercase'}}>Longitude</div><input style={iStyle} type="number" step="any" value={form.longitude} onChange={e=>setForm(f=>({...f,longitude:e.target.value}))} placeholder="e.g. 86.9250" /></div>
          </div>
          <div><div style={{fontSize:'11px', color:'rgba(232,238,252,0.4)', marginBottom:'5px', textTransform:'uppercase'}}>Image URL</div><input style={iStyle} value={form.image_url} onChange={e=>setForm(f=>({...f,image_url:e.target.value}))} placeholder="https://..." /></div>
          <div style={{fontSize:'10px', fontWeight:'700', letterSpacing:'0.1em', textTransform:'uppercase', color:'rgba(99,102,241,0.6)', borderBottom:'1px solid rgba(99,102,241,0.1)', paddingBottom:'6px'}}>Description</div>
          <textarea style={{...iStyle, minHeight:'80px', resize:'vertical'}} value={form.description} onChange={e=>setForm(f=>({...f,description:e.target.value}))} placeholder="Tour description..." />
          <div style={{fontSize:'10px', fontWeight:'700', letterSpacing:'0.1em', textTransform:'uppercase', color:'rgba(99,102,241,0.6)', borderBottom:'1px solid rgba(99,102,241,0.1)', paddingBottom:'6px'}}>Day-wise Itinerary</div>
          <div style={{display:'flex', flexDirection:'column', gap:'10px'}}>
            {itinerary.map((day, i) => (
              <div key={i} style={{display:'flex', gap:'10px', background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.06)', borderRadius:'10px', padding:'12px', alignItems:'flex-start'}}>
                <div style={{background:'rgba(99,102,241,0.15)', color:'#a5b4fc', fontSize:'11px', fontWeight:'700', padding:'4px 10px', borderRadius:'6px', whiteSpace:'nowrap', flexShrink:0, marginTop:'4px'}}>Day {day.day}</div>
                <div style={{flex:1, display:'flex', flexDirection:'column', gap:'6px'}}>
                  <input style={iStyle} placeholder={`Day ${day.day} title`} value={day.title} onChange={e=>updateItin(i,'title',e.target.value)} />
                  <textarea style={{...iStyle, minHeight:'55px', resize:'vertical'}} placeholder="Details..." value={day.details} onChange={e=>updateItin(i,'details',e.target.value)} />
                </div>
                {itinerary.length > 1 && (
                  <button onClick={() => setItinerary(prev => prev.filter((_,idx)=>idx!==i).map((d,idx)=>({...d,day:idx+1})))}
                    style={{background:'rgba(248,113,113,0.1)', border:'1px solid rgba(248,113,113,0.15)', color:'#f87171', borderRadius:'7px', padding:'6px 8px', cursor:'pointer', flexShrink:0, marginTop:'4px'}}>x</button>
                )}
              </div>
            ))}
            <button onClick={() => setItinerary(prev=>[...prev,{day:prev.length+1,title:'',details:''}])}
              style={{background:'transparent', border:'2px dashed rgba(99,102,241,0.2)', borderRadius:'10px', color:'rgba(99,102,241,0.6)', padding:'10px', cursor:'pointer', fontSize:'13px', fontWeight:'600', fontFamily:'inherit'}}>
              + Add Day
            </button>
          </div>
        </div>
        <div style={{padding:'16px 24px', borderTop:'1px solid rgba(255,255,255,0.06)', display:'flex', gap:'10px', justifyContent:'flex-end', flexShrink:0}}>
          <button onClick={onClose} style={{background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.09)', color:'rgba(232,238,252,0.55)', borderRadius:'100px', padding:'10px 22px', cursor:'pointer', fontSize:'13px', fontFamily:'inherit'}}>Cancel</button>
          <button onClick={save} disabled={saving} style={{background:'#6366f1', border:'none', color:'white', borderRadius:'100px', padding:'10px 26px', cursor:'pointer', fontWeight:'700', fontSize:'13px', fontFamily:'inherit', opacity: saving ? 0.6 : 1}}>
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Admin() {
  const nav = useNavigate();
  const [msg, setMsg] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  const [user, setUser] = useState(getUser());
  const [tours, setTours] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [pendingTours, setPendingTours] = useState([]);
  const [pendingAgencies, setPendingAgencies] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [users, setUsers] = useState([]);
  const [refunds, setRefunds] = useState([]);
  const [editingTour, setEditingTour] = useState(null);
  const [editingUser, setEditingUser] = useState(null);
  const [stats, setStats] = useState({ totalUsers:0, activeTours:0, totalBookings:0, totalRevenue:0 });
  const [newTour, setNewTour] = useState({ title:'', destination:'', category:'', duration_days:3, price_usd:199, rating:4.5, image_url:'', description:'', latitude:'', longitude:'' });
  const [reply, setReply] = useState({ ticketId:'', text:'' });

  function showMsg(text) {
    setMsg(text);
    setTimeout(() => setMsg(''), 3500);
  }

  useEffect(() => {
    const u = getUser();
    if (!getToken()) { nav('/admin-login'); return; }
    if (!u) { nav('/admin-login'); return; }
    if (u.role !== 'admin') {
      if (u.role === 'agency') nav('/agency');
      else nav('/dashboard');
      return;
    }
    load();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => { load(); }, 5000);
    return () => clearInterval(interval);
  }, []);

  async function load() {
    try {
      const [resRefunds, resTours, resPendingTours, resPendingAgencies, resTickets, resBookings, resUsers] = await Promise.allSettled([
        api.get('/api/admin/refunds'),
        api.get('/api/admin/tours'),
        api.get('/api/admin/tours/pending'),
        api.get('/api/admin/agencies/pending'),
        api.get('/api/admin/support'),
        api.get('/api/admin/bookings'),
        api.get('/api/admin/users'),
      ]);
      const refundsData         = resRefunds.status         === 'fulfilled' ? (resRefunds.value.data.items         || []) : [];
      const toursData           = resTours.status           === 'fulfilled' ? (resTours.value.data.items           || []) : [];
      const pendingToursData    = resPendingTours.status    === 'fulfilled' ? (resPendingTours.value.data.items    || []) : [];
      const pendingAgenciesData = resPendingAgencies.status === 'fulfilled' ? (resPendingAgencies.value.data.items || []) : [];
      const ticketsData         = resTickets.status         === 'fulfilled' ? (resTickets.value.data.items         || []) : [];
      const bookingsData = resBookings.status === 'fulfilled' ? (resBookings.value.data.items || resBookings.value.data.bookings || []) : [];
      const usersData           = resUsers.status           === 'fulfilled' ? (resUsers.value.data.items           || []) : [];
      setRefunds(refundsData);
      setTours(toursData);
      setPendingTours(pendingToursData);
      setPendingAgencies(pendingAgenciesData);
      setTickets(ticketsData);
      setBookings(bookingsData);
      setUsers(usersData);
     const totalBookings = resBookings.status === 'fulfilled'
  ? (resBookings.value.data.meta?.total || bookingsData.length)
  : bookingsData.length;

const totalRevenue = bookingsData
  .filter(b => b.status === 'paid')
  .reduce((sum, b) => sum + (parseFloat(b.total_usd) || 0), 0);

setStats({
  totalUsers: usersData.length,
  activeTours: toursData.filter(t => t.approval_status === 'approved').length,
  totalBookings,
  totalRevenue,
});
    } catch (e) { console.error('Load error:', e); }
  }

  async function manualRefresh() { await load(); showMsg('Data refreshed'); }
  function setTour(k, v) { setNewTour(p => ({...p, [k]: v})); }

  async function createTour() {
    setMsg('');
    try {
      const res = await api.post('/api/admin/tours', {
        ...newTour,
        duration_days: Number(newTour.duration_days),
        price_usd: Number(newTour.price_usd),
        rating: Number(newTour.rating),
        latitude: newTour.latitude ? Number(newTour.latitude) : null,
        longitude: newTour.longitude ? Number(newTour.longitude) : null,
        itinerary: [{ day: 1, title: 'Day 1', details: 'Edit this itinerary.' }]
      });
      showMsg(`Tour created — ID: ${res.data.id}`);
      setNewTour({ title:'', destination:'', category:'', duration_days:3, price_usd:199, rating:4.5, image_url:'', description:'', latitude:'', longitude:'' });
      await load();
    } catch (e) { showMsg(e?.response?.data?.error || 'Create failed'); }
  }

  async function deleteTour(id) {
    if (!window.confirm('Delete this tour?')) return;
    setMsg('');
    try {
      await api.delete(`/api/admin/tours/${id}`);
      showMsg('Tour deleted');
      await load();
    } catch (e) { showMsg(e?.response?.data?.error || 'Delete failed'); }
  }

  async function sendReply(ticketId) {
    setMsg('');
    try {
      await api.post(`/api/admin/support/${ticketId}/reply`, { reply: reply.text });
      showMsg('Reply sent');
      setReply({ ticketId:'', text:'' });
      await load();
    } catch (e) { showMsg(e?.response?.data?.error || 'Reply failed'); }
  }

  async function verifyAgency(id, status) {
    setMsg('');
    try {
      await api.post(`/api/admin/agencies/${id}/verify`, { status });
      showMsg(`Agency ${status}`);
      await load();
    } catch (e) { showMsg(e?.response?.data?.error || 'Update failed'); }
  }

  async function decideTour(id, decision) {
    setMsg('');
    const reason = decision === 'rejected' ? prompt('Reason (optional):') : null;
    try {
      await api.post(`/api/admin/tours/${id}/decide`, { decision, reason });
      showMsg(`Tour ${decision}`);
      await load();
    } catch (e) { showMsg(e?.response?.data?.error || 'Update failed'); }
  }

  function logout() {
    localStorage.removeItem('sjp_token');
    localStorage.removeItem('user');
    nav('/admin-login');
  }

  function navBtn(tabName) {
    const active = activeTab === tabName;
    return {
      display:'flex', alignItems:'center', gap:'10px', width:'100%',
      padding:'10px 12px', border: active ? '1px solid rgba(99,102,241,0.3)' : '1px solid transparent',
      borderRadius:'10px', background: active ? 'rgba(99,102,241,0.15)' : 'transparent',
      color:'#e8eefc', cursor:'pointer', fontWeight:'600', fontSize:'14px',
      marginBottom:'4px', transition:'all 0.2s', textAlign:'left',
    };
  }

  const badgeStyle = { marginLeft:'auto', background:'rgba(239,68,68,0.2)', color:'#fca5a5', padding:'2px 6px', borderRadius:'4px', fontSize:'12px', fontWeight:'700' };

  return (
    <div style={{display:'flex', height:'100vh', background:'#0b1220'}}>

      {editingTour && <EditTourModal tour={editingTour} onClose={() => setEditingTour(null)} onSaved={() => { showMsg('Tour updated'); load(); }} />}
      {editingUser && <EditUserModal user={editingUser} onClose={() => setEditingUser(null)} onSaved={() => { showMsg('User updated'); load(); }} />}

      {/* ── SIDEBAR ── */}
      <div style={{width:'220px', background:'linear-gradient(180deg, rgba(11,18,32,0.98), rgba(15,24,48,0.96))', borderRight:'1px solid rgba(255,255,255,0.08)', padding:'20px 0', overflowY:'auto', position:'fixed', height:'100vh', left:0, top:0, display:'flex', flexDirection:'column'}}>

        {/* Logo */}
        <div style={{display:'flex', alignItems:'center', gap:'12px', padding:'0 16px 24px', borderBottom:'1px solid rgba(255,255,255,0.08)'}}>
          <div style={{width:'40px', height:'40px', borderRadius:'10px', background:'linear-gradient(135deg, #6366f1, #8b5cf6)', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:'900', color:'white', fontSize:'14px'}}>TA</div>
          <div>
            <div style={{fontWeight:'900', fontSize:'14px', color:'#e8eefc'}}>TourAdmin</div>
            <div style={{fontSize:'10px', opacity:'0.6', letterSpacing:'1px'}}>CONTROL PANEL</div>
          </div>
        </div>

        {/* Nav links */}
        <div style={{flex:1, padding:'16px 8px'}}>
          <div style={{paddingBottom:'16px'}}>
            <div style={{fontSize:'11px', fontWeight:'900', opacity:'0.5', padding:'0 12px 8px', letterSpacing:'1px', textTransform:'uppercase'}}>MAIN</div>
            <button onClick={() => setActiveTab('overview')} style={navBtn('overview')}>Overview</button>
          </div>
          <div style={{paddingBottom:'16px'}}>
            <div style={{fontSize:'11px', fontWeight:'900', opacity:'0.5', padding:'0 12px 8px', letterSpacing:'1px', textTransform:'uppercase'}}>MANAGEMENT</div>
            <button onClick={() => setActiveTab('agencies')} style={navBtn('agencies')}>Agencies <span style={badgeStyle}>{pendingAgencies.length}</span></button>
            <button onClick={() => setActiveTab('tours')} style={navBtn('tours')}>Tours <span style={badgeStyle}>{pendingTours.length}</span></button>
            <button onClick={() => setActiveTab('bookings')} style={navBtn('bookings')}>Bookings <span style={badgeStyle}>{bookings.length}</span></button>
            <button onClick={() => setActiveTab('users')} style={navBtn('users')}>Users <span style={badgeStyle}>{users.length}</span></button>
            <button onClick={() => setActiveTab('refunds')} style={navBtn('refunds')}>Refunds <span style={badgeStyle}>{refunds.filter(r=>r.status==='pending').length}</span></button>
          </div>
          <div>
            <div style={{fontSize:'11px', fontWeight:'900', opacity:'0.5', padding:'0 12px 8px', letterSpacing:'1px', textTransform:'uppercase'}}>COMMUNICATIONS</div>
            <button onClick={() => setActiveTab('support')} style={navBtn('support')}>Support <span style={badgeStyle}>{tickets.length}</span></button>
            <button onClick={() => setActiveTab('myprofile')} style={navBtn('myprofile')}>My Profile</button>
          </div>
        </div>

        {/* Bottom user card */}
        <div style={{borderTop:'1px solid rgba(255,255,255,0.08)', padding:'16px 12px'}}>
          <div
            onClick={() => setActiveTab('myprofile')}
            style={{display:'flex', alignItems:'center', gap:'10px', marginBottom:'12px', cursor:'pointer', borderRadius:'10px', padding:'6px', transition:'background 0.2s'}}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(99,102,241,0.08)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            <div style={{width:'36px', height:'36px', borderRadius:'50%', background:'linear-gradient(135deg, #6366f1, #8b5cf6)', display:'flex', alignItems:'center', justifyContent:'center', color:'white', fontWeight:'900', fontSize:'12px', flexShrink:0}}>
              {(user?.full_name || 'A')[0].toUpperCase()}
            </div>
            <div style={{flex:1, minWidth:0}}>
              <div style={{fontWeight:'700', fontSize:'12px', color:'#e8eefc', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'}}>{user?.full_name || 'Admin User'}</div>
              <div style={{fontSize:'11px', color:'#a5b4fc'}}>Super Admin</div>
            </div>
          </div>
          <button onClick={logout} style={{width:'100%', padding:'8px', border:'1px solid rgba(255,255,255,0.1)', borderRadius:'8px', background:'transparent', color:'#e8eefc', cursor:'pointer', fontSize:'12px', fontWeight:'600'}}>Logout</button>
        </div>
      </div>

      {/* ── MAIN CONTENT ── */}
      <div style={{flex:1, marginLeft:'220px', overflowY:'auto', background:'#0b1220'}}>

        {/* OVERVIEW */}
        {activeTab === 'overview' && (
          <div style={{padding:'32px'}}>
            <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'32px'}}>
              <div>
                <h1 style={{fontSize:'32px', fontWeight:'900', margin:'0 0 6px', color:'#e8eefc'}}>Dashboard Overview</h1>
                <p style={{fontSize:'14px', opacity:'0.7', margin:0, color:'rgba(232,238,252,0.75)'}}>Welcome back — here's what's happening today</p>
              </div>
              <button onClick={manualRefresh} style={{background:'#3b82f6', border:'none', color:'white', padding:'8px 14px', borderRadius:'8px', cursor:'pointer', fontWeight:'600', fontSize:'12px'}}>Refresh Now</button>
            </div>
            {msg && <Toast msg={msg} />}
            <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(260px, 1fr))', gap:'16px', marginBottom:'32px'}}>
              {[
                { num: stats.totalUsers.toLocaleString(), label:'Total Users', color:'59,130,246' },
                { num: stats.activeTours, label:'Active Tours', color:'16,185,129' },
                { num: stats.totalBookings.toLocaleString(), label:'Total Bookings', color:'217,119,6' },
                { num: '$'+(stats.totalRevenue>=1000?(stats.totalRevenue/1000).toFixed(1)+'K':stats.totalRevenue.toFixed(2)), label:'Total Revenue', color:'139,92,246' },
              ].map((s,i) => (
                <div key={i} style={{border:'1px solid rgba(255,255,255,0.06)', borderRadius:'14px', padding:'20px', background:`linear-gradient(135deg, rgba(${s.color}, 0.08), rgba(${s.color}, 0.02))`}}>
                  <div style={{fontSize:'28px', fontWeight:'900', color:'#e8eefc', marginBottom:'4px'}}>{s.num}</div>
                  <div style={{fontSize:'13px', color:'rgba(232,238,252,0.75)', marginBottom:'8px'}}>{s.label}</div>
                  <div style={{fontSize:'12px', color:'#86efac', fontWeight:'600'}}>Live data</div>
                </div>
              ))}
            </div>
            <div style={{display:'grid', gridTemplateColumns:'1.2fr 1fr', gap:'20px'}}>
              <div style={{background:'linear-gradient(180deg, rgba(18,26,45,0.98), rgba(11,18,32,0.96))', border:'1px solid rgba(255,255,255,0.06)', borderRadius:'14px', padding:'20px'}}>
                <div style={{display:'flex', alignItems:'center', gap:'12px', marginBottom:'16px'}}>
                  <h3 style={{margin:0, fontSize:'16px', color:'#e8eefc'}}>Pending Approvals</h3>
                  <span style={{background:'rgba(99,102,241,0.2)', color:'#a5b4fc', padding:'4px 8px', borderRadius:'6px', fontSize:'12px', fontWeight:'700'}}>{pendingTours.length}</span>
                </div>
                <table style={{width:'100%', borderCollapse:'collapse', fontSize:'13px'}}>
                  <thead><tr style={{borderBottom:'1px solid rgba(255,255,255,0.06)'}}>
                    {['TYPE','NAME','STATUS'].map(h => <th key={h} style={{textAlign:'left', padding:'10px', fontWeight:'700', color:'rgba(232,238,252,0.75)', fontSize:'11px'}}>{h}</th>)}
                  </tr></thead>
                  <tbody>
                    {pendingTours.length === 0 ? (
                      <tr><td colSpan="3" style={{textAlign:'center', padding:'20px', color:'rgba(232,238,252,0.75)'}}>No pending approvals</td></tr>
                    ) : pendingTours.map(t => (
                      <tr key={t.id} style={{borderBottom:'1px solid rgba(255,255,255,0.03)'}}>
                        <td style={{padding:'14px 10px'}}><span style={{padding:'4px 10px', borderRadius:'6px', fontSize:'12px', fontWeight:'600', background:'rgba(217,119,6,0.15)', color:'#fed7aa'}}>Tour</span></td>
                        <td style={{padding:'14px 10px', color:'#e8eefc', fontWeight:'600'}}>{t.title}</td>
                        <td style={{padding:'14px 10px', color:'#fed7aa', fontSize:'12px'}}>Pending</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div style={{background:'linear-gradient(180deg, rgba(18,26,45,0.98), rgba(11,18,32,0.96))', border:'1px solid rgba(255,255,255,0.06)', borderRadius:'14px', padding:'20px'}}>
                <h3 style={{margin:'0 0 20px', fontSize:'16px', color:'#e8eefc'}}>Revenue Chart</h3>
                <div style={{display:'flex', alignItems:'flex-end', gap:'8px', height:'140px'}}>
                  {[40,35,60,45,70,55,80,75,100].map((value, idx) => (
                    <div key={idx} style={{flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:'8px', height:'100%', justifyContent:'flex-end'}}>
                      <div style={{width:'100%', background:'linear-gradient(180deg, #6366f1, #8b5cf6)', borderRadius:'4px 4px 0 0', height:`${value}%`}}></div>
                      <div style={{fontSize:'11px', color:'rgba(232,238,252,0.75)', fontWeight:'600'}}>{['J','F','M','A','M','J','J','A','S'][idx]}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* MY PROFILE */}
        {activeTab === 'myprofile' && (
          <div style={{padding:'32px', maxWidth:'900px'}}>
            <div style={{marginBottom:'32px'}}>
              <div style={{fontSize:'11px', fontWeight:'700', letterSpacing:'0.12em', textTransform:'uppercase', color:'#a5b4fc', marginBottom:'8px'}}>Admin Account</div>
              <h1 style={{fontSize:'28px', fontWeight:'900', color:'#e8eefc', margin:'0 0 6px'}}>My Profile</h1>
              <p style={{fontSize:'13px', color:'rgba(232,238,252,0.4)', margin:0}}>Manage your admin account details and password</p>
            </div>
            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'20px'}}>
              <div style={{background:'#0d1220', border:'1px solid rgba(99,102,241,0.15)', borderRadius:'16px', padding:'24px'}}>
                <div style={{display:'flex', alignItems:'center', gap:'16px', marginBottom:'24px'}}>
                  <div style={{width:'64px', height:'64px', borderRadius:'16px', background:'linear-gradient(135deg, #4f46e5, #7c3aed)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'24px', fontWeight:'900', color:'#fff', boxShadow:'0 8px 24px rgba(99,102,241,0.3)'}}>
                    {(user?.full_name || 'A')[0].toUpperCase()}
                  </div>
                  <div>
                    <div style={{fontSize:'18px', fontWeight:'800', color:'#e8eefc', marginBottom:'4px'}}>{user?.full_name || 'Admin'}</div>
                    <div style={{display:'inline-flex', alignItems:'center', gap:'6px', background:'rgba(99,102,241,0.12)', border:'1px solid rgba(99,102,241,0.22)', color:'#a5b4fc', fontSize:'11px', fontWeight:'700', padding:'3px 10px', borderRadius:'100px'}}>
                      Super Admin
                    </div>
                  </div>
                </div>
                <div style={{height:'1px', background:'rgba(255,255,255,0.06)', margin:'0 0 20px'}} />
                {[
                  { label: 'Email', value: user?.email },
                  { label: 'Role', value: 'Administrator' },
                  { label: 'Status', value: 'Active & Verified' },
                  { label: 'Access Level', value: 'Full Platform Control' },
                ].map((row, i) => (
                  <div key={i} style={{display:'flex', justifyContent:'space-between', alignItems:'center', padding:'10px 0', borderBottom:'1px solid rgba(255,255,255,0.04)'}}>
                    <span style={{fontSize:'12px', color:'rgba(232,238,252,0.35)', textTransform:'uppercase', letterSpacing:'0.08em'}}>{row.label}</span>
                    <span style={{fontSize:'13px', color:'#e8eefc', fontWeight:'500'}}>{row.value}</span>
                  </div>
                ))}
                <div style={{height:'1px', background:'rgba(255,255,255,0.06)', margin:'20px 0'}} />
                <div style={{background:'rgba(99,102,241,0.06)', border:'1px solid rgba(99,102,241,0.12)', borderRadius:'10px', padding:'12px 14px', fontSize:'12px', color:'rgba(165,180,252,0.7)', lineHeight:1.5}}>
                  You have full administrative access to manage tours, agencies, users, bookings and notifications.
                </div>
              </div>
              <AdminProfileEdit
                user={user}
                onUpdated={(updatedUser) => {
                  setUser(updatedUser);
                  localStorage.setItem('user', JSON.stringify(updatedUser));
                  window.dispatchEvent(new Event('auth-change'));
                  showMsg('Profile updated');
                }}
              />
            </div>
          </div>
        )}

        {/* AGENCIES */}
        {activeTab === 'agencies' && (
          <div style={{padding:'32px'}}>
            <h2 style={{fontSize:'24px', fontWeight:'900', margin:'0 0 24px', color:'#e8eefc'}}>Agency Verification Requests</h2>
            {msg && <Toast msg={msg} />}
            {pendingAgencies.length === 0 ? (
              <div style={{textAlign:'center', padding:'40px 20px', color:'rgba(232,238,252,0.75)'}}>No pending agencies</div>
            ) : pendingAgencies.map(a => (
              <div key={a.id} style={{background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.06)', borderRadius:'10px', padding:'16px', marginBottom:'12px'}}>
                <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'8px'}}>
                  <h3 style={{margin:0, fontSize:'14px', color:'#e8eefc'}}>{a.business_name || a.full_name}</h3>
                  <span style={{background:'rgba(99,102,241,0.2)', color:'#a5b4fc', padding:'4px 8px', borderRadius:'6px', fontSize:'11px', fontWeight:'700'}}>Pending</span>
                </div>
                <p style={{margin:'8px 0', fontSize:'13px', color:'rgba(232,238,252,0.75)'}}>{a.email}</p>
                <p style={{margin:'8px 0', fontSize:'13px', color:'rgba(232,238,252,0.75)'}}>License: <strong style={{color:'white'}}>{a.license_no}</strong></p>
                <div style={{display:'flex', gap:'8px', marginTop:'12px'}}>
                  <button onClick={()=>verifyAgency(a.id,'verified')} style={{background:'#3b82f6', border:'none', color:'white', padding:'10px 14px', borderRadius:'10px', cursor:'pointer', fontWeight:'700'}}>Verify</button>
                  <button onClick={()=>verifyAgency(a.id,'rejected')} style={{background:'#ef4444', border:'none', color:'white', padding:'10px 14px', borderRadius:'10px', cursor:'pointer', fontWeight:'700'}}>Reject</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* TOURS */}
        {activeTab === 'tours' && (
          <div style={{padding:'32px'}}>
            <h2 style={{fontSize:'24px', fontWeight:'900', margin:'0 0 24px', color:'#e8eefc'}}>Manage Tours</h2>
            {msg && <Toast msg={msg} />}
            <div style={{background:'linear-gradient(180deg, rgba(18,26,45,0.98), rgba(11,18,32,0.96))', border:'1px solid rgba(255,255,255,0.06)', borderRadius:'14px', padding:'20px', marginBottom:'24px'}}>
              <h3 style={{marginTop:0, fontSize:'16px', color:'#e8eefc'}}>Create New Tour</h3>
              <div style={{display:'grid', gridTemplateColumns:'repeat(2, 1fr)', gap:'12px'}}>
                {[['Title','title'],['Destination','destination'],['Category','category'],['Duration (days)','duration_days'],['Price (USD)','price_usd'],['Rating','rating']].map(([ph,k])=>(
                  <input key={k} style={iStyle} placeholder={ph} value={newTour[k]} onChange={e=>setTour(k,e.target.value)} />
                ))}
                <input style={{...iStyle, gridColumn:'1/-1'}} placeholder="Image URL" value={newTour.image_url} onChange={e=>setTour('image_url',e.target.value)} />
                <textarea style={{...iStyle, gridColumn:'1/-1', resize:'vertical'}} rows="3" placeholder="Description" value={newTour.description} onChange={e=>setTour('description',e.target.value)} />
                <button onClick={createTour} style={{background:'#3b82f6', border:'none', color:'white', padding:'10px 14px', borderRadius:'10px', cursor:'pointer', fontWeight:'700', gridColumn:'1/-1', fontSize:'14px'}}>Create Tour</button>
              </div>
            </div>
            <div style={{background:'linear-gradient(180deg, rgba(18,26,45,0.98), rgba(11,18,32,0.96))', border:'1px solid rgba(255,255,255,0.06)', borderRadius:'14px', padding:'20px'}}>
              <h3 style={{marginTop:0, fontSize:'16px', color:'#e8eefc'}}>All Tours ({tours.length})</h3>
              {tours.length === 0 ? (
                <div style={{textAlign:'center', padding:'40px 20px', color:'rgba(232,238,252,0.75)'}}>No tours</div>
              ) : tours.map(t => (
                <div key={t.id} style={{display:'flex', alignItems:'center', justifyContent:'space-between', padding:'16px', border:'1px solid rgba(255,255,255,0.05)', borderRadius:'10px', marginBottom:'8px'}}>
                  <div style={{flex:1}}>
                    <h4 style={{margin:'0 0 4px', color:'#e8eefc', fontSize:'14px'}}>{t.title}</h4>
                    <p style={{margin:0, fontSize:'13px', color:'rgba(232,238,252,0.75)'}}>
                      {t.destination} • {t.category} • ${Number(t.price_usd).toFixed(2)} •
                      <span style={{marginLeft:'8px', padding:'2px 8px', borderRadius:'4px', fontSize:'11px', fontWeight:'700',
                        background: t.approval_status==='approved'?'rgba(16,185,129,0.2)':t.approval_status==='pending'?'rgba(217,119,6,0.2)':'rgba(239,68,68,0.2)',
                        color: t.approval_status==='approved'?'#86efac':t.approval_status==='pending'?'#fed7aa':'#fca5a5'
                      }}>{t.approval_status}</span>
                    </p>
                  </div>
                  <div style={{display:'flex', gap:'8px'}}>
                    {t.approval_status === 'pending' && (<>
                      <button onClick={()=>decideTour(t.id,'approved')} style={{background:'#10b981', border:'none', color:'white', padding:'8px 12px', borderRadius:'8px', cursor:'pointer', fontWeight:'600', fontSize:'12px'}}>Approve</button>
                      <button onClick={()=>decideTour(t.id,'rejected')} style={{background:'#ef4444', border:'none', color:'white', padding:'8px 12px', borderRadius:'8px', cursor:'pointer', fontWeight:'600', fontSize:'12px'}}>Reject</button>
                    </>)}
                    <button onClick={()=>setEditingTour(t)} style={{background:'rgba(99,102,241,0.15)', border:'1px solid rgba(99,102,241,0.3)', color:'#a5b4fc', padding:'8px 12px', borderRadius:'8px', cursor:'pointer', fontWeight:'600', fontSize:'12px'}}>Edit</button>
                    <button onClick={()=>deleteTour(t.id)} style={{background:'#ef4444', border:'none', color:'white', padding:'8px 12px', borderRadius:'8px', cursor:'pointer', fontWeight:'600', fontSize:'12px'}}>Delete</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* USERS */}
        {activeTab === 'users' && (
          <div style={{padding:'32px'}}>
            <h2 style={{fontSize:'24px', fontWeight:'900', margin:'0 0 24px', color:'#e8eefc'}}>All Users ({users.length})</h2>
            {msg && <Toast msg={msg} />}
            <div style={{background:'linear-gradient(180deg, rgba(18,26,45,0.98), rgba(11,18,32,0.96))', border:'1px solid rgba(255,255,255,0.06)', borderRadius:'14px', padding:'20px'}}>
              <table style={{width:'100%', borderCollapse:'collapse', fontSize:'13px'}}>
                <thead>
                  <tr style={{borderBottom:'1px solid rgba(255,255,255,0.06)'}}>
                    {['Name','Email','Role','Status','Business','Joined','Action'].map(h=>(
                      <th key={h} style={{textAlign:'left', padding:'10px 12px', fontWeight:'700', color:'rgba(232,238,252,0.5)', fontSize:'11px', textTransform:'uppercase'}}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {users.length === 0 ? (
                    <tr><td colSpan="7" style={{textAlign:'center', padding:'30px', color:'rgba(232,238,252,0.4)'}}>No users found</td></tr>
                  ) : users.map(u => (
                    <tr key={u.id} style={{borderBottom:'1px solid rgba(255,255,255,0.03)'}}>
                      <td style={{padding:'12px', color:'#e8eefc', fontWeight:'600'}}>{u.full_name}</td>
                      <td style={{padding:'12px', color:'rgba(232,238,252,0.6)'}}>{u.email}</td>
                      <td style={{padding:'12px'}}>
                        <span style={{padding:'3px 10px', borderRadius:'100px', fontSize:'11px', fontWeight:'700',
                          background: u.role==='admin'?'rgba(99,102,241,0.2)':u.role==='agency'?'rgba(217,119,6,0.2)':'rgba(16,185,129,0.2)',
                          color: u.role==='admin'?'#a5b4fc':u.role==='agency'?'#fed7aa':'#86efac'
                        }}>{u.role}</span>
                      </td>
                      <td style={{padding:'12px'}}>
                        <span style={{padding:'3px 10px', borderRadius:'100px', fontSize:'11px', fontWeight:'700',
                          background: u.verification_status==='verified'?'rgba(16,185,129,0.2)':u.verification_status==='pending'?'rgba(217,119,6,0.2)':'rgba(239,68,68,0.2)',
                          color: u.verification_status==='verified'?'#86efac':u.verification_status==='pending'?'#fed7aa':'#fca5a5'
                        }}>{u.verification_status}</span>
                      </td>
                      <td style={{padding:'12px', color:'rgba(232,238,252,0.5)'}}>{u.business_name || '—'}</td>
                      <td style={{padding:'12px', color:'rgba(232,238,252,0.4)', fontSize:'12px'}}>{new Date(u.created_at).toLocaleDateString()}</td>
                      <td style={{padding:'12px'}}>
                        <button onClick={() => setEditingUser(u)} style={{background:'rgba(99,102,241,0.15)', border:'1px solid rgba(99,102,241,0.3)', color:'#a5b4fc', padding:'6px 12px', borderRadius:'8px', cursor:'pointer', fontWeight:'600', fontSize:'12px'}}>Edit</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* BOOKINGS */}
        {activeTab === 'bookings' && (
          <div style={{padding:'32px'}}>
            <h2 style={{fontSize:'24px', fontWeight:'900', margin:'0 0 24px', color:'#e8eefc'}}>Bookings ({bookings.length})</h2>
            {msg && <Toast msg={msg} />}
            {bookings.length === 0 ? (
              <div style={{textAlign:'center', padding:'40px 20px', color:'rgba(232,238,252,0.75)'}}>No bookings yet</div>
            ) : (
              <div style={{background:'linear-gradient(180deg, rgba(18,26,45,0.98), rgba(11,18,32,0.96))', border:'1px solid rgba(255,255,255,0.06)', borderRadius:'14px', padding:'20px'}}>
                {bookings.map(b => (
                  <div key={b.id} style={{padding:'12px', border:'1px solid rgba(255,255,255,0.05)', borderRadius:'10px', marginBottom:'8px'}}>
                    <div style={{display:'flex', alignItems:'center', justifyContent:'space-between'}}>
                      <div>
                        <h4 style={{margin:'0 0 4px', color:'#e8eefc', fontSize:'14px'}}>Booking #{b.id}</h4>
                        <p style={{margin:0, fontSize:'13px', color:'rgba(232,238,252,0.75)'}}>Total: ${Number(b.total_usd||b.total_price||b.amount||0).toFixed(2)} • Status: {b.status}</p>
                      </div>
                      <span style={{background:'rgba(16,185,129,0.2)', color:'#86efac', padding:'4px 8px', borderRadius:'6px', fontSize:'12px', fontWeight:'700'}}>{b.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* REFUNDS */}
        {activeTab === 'refunds' && (
          <div style={{padding:'32px'}}>
            <h2 style={{fontSize:'24px', fontWeight:'900', margin:'0 0 24px', color:'#e8eefc'}}>Refund Requests ({refunds.length})</h2>
            {msg && <Toast msg={msg} />}
            {refunds.length === 0 ? (
              <div style={{textAlign:'center', padding:'40px', color:'rgba(232,238,252,0.4)'}}>No refund requests</div>
            ) : refunds.map(r => (
              <div key={r.id} style={{background:'linear-gradient(180deg,rgba(18,26,45,0.98),rgba(11,18,32,0.96))', border:'1px solid rgba(255,255,255,0.06)', borderRadius:'14px', padding:'20px', marginBottom:'16px'}}>
                <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:12}}>
                  <div>
                    <div style={{fontWeight:700, color:'#e8eefc', fontSize:15}}>{r.tour_title}</div>
                    <div style={{fontSize:12, color:'rgba(232,238,252,0.4)', marginTop:4}}>
                      {r.full_name} • {r.email} • Code: <span style={{fontFamily:'monospace'}}>{r.booking_code}</span>
                    </div>
                    <div style={{fontSize:13, color:'#a8d96b', marginTop:4}}>${Number(r.total_usd||0).toFixed(2)}</div>
                  </div>
                  <span style={{padding:'4px 12px', borderRadius:100, fontSize:11, fontWeight:700,
                    background: r.status==='pending'?'rgba(217,119,6,0.2)':r.status==='approved'?'rgba(16,185,129,0.2)':'rgba(239,68,68,0.2)',
                    color: r.status==='pending'?'#fed7aa':r.status==='approved'?'#86efac':'#fca5a5',
                  }}>{r.status}</span>
                </div>
                {r.reason && <div style={{fontSize:13, color:'rgba(232,238,252,0.5)', marginBottom:12}}>Reason: {r.reason}</div>}
                {r.status === 'pending' && (
                  <div style={{display:'flex', gap:8}}>
                    <button onClick={async () => {
                      try {
                        await api.post(`/api/admin/refunds/${r.id}/decide`, { status:'approved' });
                        showMsg('Refund approved'); load();
                      } catch(e) { showMsg(e?.response?.data?.error || 'Failed'); }
                    }} style={{background:'#10b981', border:'none', color:'white', padding:'8px 16px', borderRadius:8, cursor:'pointer', fontWeight:700, fontSize:12}}>Approve</button>
                    <button onClick={async () => {
                      const note = prompt('Rejection reason (optional):') || '';
                      try {
                        await api.post(`/api/admin/refunds/${r.id}/decide`, { status:'rejected', admin_note:note });
                        showMsg('Refund rejected'); load();
                      } catch(e) { showMsg(e?.response?.data?.error || 'Failed'); }
                    }} style={{background:'#ef4444', border:'none', color:'white', padding:'8px 16px', borderRadius:8, cursor:'pointer', fontWeight:700, fontSize:12}}>Reject</button>
                  </div>
                )}
                {r.admin_note && <div style={{fontSize:12, color:'rgba(232,238,252,0.4)', marginTop:8}}>Note: {r.admin_note}</div>}
              </div>
            ))}
          </div>
        )}

        {/* SUPPORT */}
        {activeTab === 'support' && (
          <div style={{padding:'32px'}}>
            <h2 style={{fontSize:'24px', fontWeight:'900', margin:'0 0 24px', color:'#e8eefc'}}>Support Tickets ({tickets.length})</h2>
            {msg && <Toast msg={msg} />}
            {tickets.length === 0 ? (
              <div style={{textAlign:'center', padding:'40px 20px', color:'rgba(232,238,252,0.75)'}}>No tickets</div>
            ) : tickets.map(t => (
              <div key={t.id} style={{background:'linear-gradient(180deg, rgba(18,26,45,0.98), rgba(11,18,32,0.96))', border:'1px solid rgba(255,255,255,0.06)', borderRadius:'14px', padding:'20px', marginBottom:'16px'}}>
                <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'12px'}}>
                  <h4 style={{margin:0, color:'#e8eefc'}}>{t.ticket_code}</h4>
                  <span style={{background:'rgba(99,102,241,0.2)', color:'#a5b4fc', padding:'4px 8px', borderRadius:'6px', fontSize:'12px', fontWeight:'700'}}>{t.status}</span>
                </div>
                <p style={{margin:'8px 0', fontSize:'13px', color:'rgba(232,238,252,0.75)'}}>{t.message}</p>
                {t.admin_reply && <p style={{margin:'8px 0', fontSize:'13px', color:'rgba(232,238,252,0.75)'}}><strong>Reply:</strong> {t.admin_reply}</p>}
                <div style={{display:'flex', gap:'8px', marginTop:'12px'}}>
                  <input style={{...iStyle, flex:1}} placeholder="Write reply..." value={reply.ticketId === t.id ? reply.text : ''} onChange={e=>setReply({ ticketId: t.id, text: e.target.value })} />
                  <button onClick={()=>sendReply(t.id)} style={{background:'rgba(31,41,55,0.65)', border:'1px solid rgba(255,255,255,0.1)', color:'white', padding:'10px 14px', borderRadius:'10px', cursor:'pointer', fontWeight:'700', whiteSpace:'nowrap'}}>Send</button>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}