import { useEffect, useState } from 'react';
import { api, getToken } from '../api/client';

export default function Notifications() {
  const [items, setItems] = useState([]);
  const [msg, setMsg] = useState('');

  async function load() {
    setMsg('');
    if (!getToken()) { setMsg('Please login first.'); return; }
    const res = await api.get('/api/notifications');
    setItems(res.data.items || []);
  }

  async function markRead(id) {
    await api.post(`/api/notifications/${id}/read`);
    load();
  }

  useEffect(()=>{ load(); }, []);

  if (msg) return <div className="card">{msg}</div>;

  return (
    <div className="grid" style={{gap:16}}>
      <div className="card">
        <h2 style={{marginTop:0}}>Notifications</h2>
        <div className="small">Booking confirmations, offers, and alerts.</div>
      </div>

      {items.map(n => (
        <div className="card" key={n.id} style={{opacity: n.is_read ? 0.75 : 1}}>
          <div className="row" style={{alignItems:'center'}}>
            <div style={{fontWeight:900}}>{n.title}</div>
            <span className="badge">{n.category}</span>
            <div style={{flex:1}} />
            {!n.is_read && <button className="btn secondary" onClick={()=>markRead(n.id)}>Mark read</button>}
          </div>
          <div className="small" style={{marginTop:6}}>{n.body}</div>
          <div className="small" style={{marginTop:6}}>Created: {new Date(n.created_at).toLocaleString()}</div>
        </div>
      ))}

      {items.length === 0 && <div className="card">No notifications yet.</div>}
    </div>
  );
}
