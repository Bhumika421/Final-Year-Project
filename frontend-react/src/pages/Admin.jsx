import { useEffect, useState } from 'react';
import { api, getToken } from '../api/client';
import { Toast } from '../components/Toast.jsx';

export default function Admin() {
  const [msg, setMsg] = useState('');
  const [tours, setTours] = useState([]);
  const [pendingTours, setPendingTours] = useState([]);
  const [pendingAgencies, setPendingAgencies] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [newTour, setNewTour] = useState({ title:'', destination:'', category:'', duration_days:3, price_usd:199, rating:4.5, image_url:'', description:'', latitude:'', longitude:'' });
  const [broadcast, setBroadcast] = useState({ category:'offers', title:'', body:'', expires_at:'' });
  const [reply, setReply] = useState({ ticketId:'', text:'' });

  async function load() {
    setMsg('');
    if (!getToken()) { setMsg('Please login as admin first.'); return; }
    try {
      const resTours = await api.get('/api/admin/tours');
      setTours(resTours.data.items || []);
      const resPendingTours = await api.get('/api/admin/tours/pending');
      setPendingTours(resPendingTours.data.items || []);
      const resPendingAgencies = await api.get('/api/admin/agencies/pending');
      setPendingAgencies(resPendingAgencies.data.items || []);
      const resTickets = await api.get('/api/admin/support');
      setTickets(resTickets.data.items || []);
    } catch (e) {
      setMsg(e?.response?.data?.error || 'Admin access required');
    }
  }

  useEffect(()=>{ load(); }, []);

  function setTour(k,v){ setNewTour(p=>({...p,[k]:v})); }
  function setB(k,v){ setBroadcast(p=>({...p,[k]:v})); }

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
        itinerary: [
          { day: 1, title: 'Day 1', details: 'Edit this itinerary from database or extend admin UI later.' }
        ]
      });
      setMsg(`Tour created  ID: ${res.data.id}`);
      setNewTour({ title:'', destination:'', category:'', duration_days:3, price_usd:199, rating:4.5, image_url:'', description:'', latitude:'', longitude:'' });
      await load();
    } catch (e) {
      setMsg(e?.response?.data?.error || 'Create failed');
    }
  }

  async function deleteTour(id) {
    setMsg('');
    try {
      await api.delete(`/api/admin/tours/${id}`);
      setMsg('Tour deleted ');
      await load();
    } catch (e) {
      setMsg(e?.response?.data?.error || 'Delete failed');
    }
  }

  async function sendBroadcast() {
    setMsg('');
    try {
      await api.post('/api/admin/notifications/broadcast', broadcast);
      setMsg('Broadcast sent ');
      setBroadcast({ category:'offers', title:'', body:'', expires_at:'' });
    } catch (e) {
      setMsg(e?.response?.data?.error || 'Broadcast failed');
    }
  }

  async function sendReply(ticketId) {
    setMsg('');
    try {
      await api.post(`/api/admin/support/${ticketId}/reply`, { reply: reply.text });
      setMsg('Reply sent ');
      setReply({ ticketId:'', text:'' });
      await load();
    } catch (e) {
      setMsg(e?.response?.data?.error || 'Reply failed');
    }
  }

  async function verifyAgency(id, status) {
    setMsg('');
    try {
      await api.post(`/api/admin/agencies/${id}/verify`, { status });
      setMsg(`Agency ${status} `);
      await load();
    } catch (e) {
      setMsg(e?.response?.data?.error || 'Update failed');
    }
  }

  async function decideTour(id, decision) {
    setMsg('');
    const reason = decision === 'rejected' ? prompt('Reason (optional):') : null;
    try {
      await api.post(`/api/admin/tours/${id}/decide`, { decision, reason });
      setMsg(`Tour ${decision} `);
      await load();
    } catch (e) {
      setMsg(e?.response?.data?.error || 'Update failed');
    }
  }

  if (msg && msg.startsWith('Please login')) return <div className="card">{msg}</div>;

  return (
    <div className="grid" style={{gap:16}}>
      <div className="card">
        <h2 style={{marginTop:0}}>Admin Panel</h2>
        <div className="small">Manage tours (CRUD), view support tickets, and send notifications.</div>
        <Toast msg={msg} />
      </div>

      <div className="card">
        <h3 style={{marginTop:0}}>Create tour</h3>
        <div className="grid">
          <div className="row">
            <input className="input" style={{flex:2}} placeholder="Title" value={newTour.title} onChange={e=>setTour('title',e.target.value)} />
            <input className="input" style={{flex:1}} placeholder="Destination" value={newTour.destination} onChange={e=>setTour('destination',e.target.value)} />
          </div>
          <div className="row">
            <input className="input" style={{flex:1}} placeholder="Category" value={newTour.category} onChange={e=>setTour('category',e.target.value)} />
            <input className="input" style={{flex:1}} placeholder="Duration days" value={newTour.duration_days} onChange={e=>setTour('duration_days',e.target.value)} />
            <input className="input" style={{flex:1}} placeholder="Price USD" value={newTour.price_usd} onChange={e=>setTour('price_usd',e.target.value)} />
            <input className="input" style={{flex:1}} placeholder="Rating" value={newTour.rating} onChange={e=>setTour('rating',e.target.value)} />
          </div>
          <div className="row">
            <input className="input" style={{flex:2}} placeholder="Image URL" value={newTour.image_url} onChange={e=>setTour('image_url',e.target.value)} />
            <input className="input" style={{flex:1}} placeholder="Lat" value={newTour.latitude} onChange={e=>setTour('latitude',e.target.value)} />
            <input className="input" style={{flex:1}} placeholder="Lng" value={newTour.longitude} onChange={e=>setTour('longitude',e.target.value)} />
          </div>
          <textarea className="input" rows="3" placeholder="Description" value={newTour.description} onChange={e=>setTour('description',e.target.value)} />
          <button className="btn" onClick={createTour}>Create</button>
          <div className="small">Deletion is blocked if the tour has active bookings (requirement).</div>
        </div>
      </div>

      <div className="grid" style={{gridTemplateColumns:'repeat(auto-fit,minmax(320px,1fr))', gap:16}}>
        <div className="card">
          <h3 style={{marginTop:0}}>Agency Verification Requests</h3>
          <div className="small">Verify agencies before they can submit packages.</div>
          <hr />
          {pendingAgencies.length===0 && <div className="small">No pending agencies.</div>}
          {pendingAgencies.map(a => (
            <div key={a.id} className="card" style={{padding:12}}>
              <b>{a.business_name || a.full_name}</b>
              <div className="small">{a.email} {a.phone ? `• ${a.phone}` : ''}</div>
              <div className="small">License: <b style={{color:'white'}}>{a.license_no}</b></div>
              <div className="row" style={{marginTop:10}}>
                <button className="btn" onClick={()=>verifyAgency(a.id,'verified')}>Verify</button>
                <button className="btn danger" onClick={()=>verifyAgency(a.id,'rejected')}>Reject</button>
              </div>
            </div>
          ))}
        </div>

        <div className="card">
          <h3 style={{marginTop:0}}>Pending Package Approvals</h3>
          <div className="small">Approve agency-submitted tour packages to publish them to customers.</div>
          <hr />
          {pendingTours.length===0 && <div className="small">No pending packages.</div>}
          {pendingTours.map(t => (
            <div key={t.id} className="card" style={{padding:12}}>
              <div className="row" style={{alignItems:'center'}}>
                <b>{t.title}</b>
                <span className="badge">{t.destination}</span>
                <span className="badge">{t.category}</span>
                <div style={{flex:1}} />
                <span className="small">{Number(t.price_usd).toFixed(2)} USD</span>
              </div>
              <div className="small">Agency: {t.business_name || t.agency_contact} • {t.agency_email}</div>
              <div className="row" style={{marginTop:10}}>
                <button className="btn" onClick={()=>decideTour(t.id,'approved')}>Approve</button>
                <button className="btn danger" onClick={()=>decideTour(t.id,'rejected')}>Reject</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="card">
        <h3 style={{marginTop:0}}>Tours</h3>
        {tours.map(t=>(
          <div className="card" key={t.id}>
            <div className="row" style={{alignItems:'center'}}>
              <div style={{fontWeight:900}}>{t.title}</div>
              <span className="badge">{t.destination}</span>
              <span className="badge">{t.category}</span>
              <span className="badge">{t.approval_status}</span>
              <div style={{flex:1}} />
              <button className="btn danger" onClick={()=>deleteTour(t.id)}>Delete</button>
            </div>
            <div className="small">Price: ${Number(t.price_usd).toFixed(2)} • Rating: {t.rating}</div>
          </div>
        ))}
        {tours.length===0 && <div className="small">No tours.</div>}
      </div>

      <div className="card">
        <h3 style={{marginTop:0}}>Broadcast notification</h3>
        <div className="grid">
          <div className="row">
            <input className="input" style={{flex:1}} placeholder="Category (offers/booking/reminders/alerts)" value={broadcast.category} onChange={e=>setB('category',e.target.value)} />
            <input className="input" style={{flex:2}} placeholder="Title" value={broadcast.title} onChange={e=>setB('title',e.target.value)} />
          </div>
          <textarea className="input" rows="3" placeholder="Body" value={broadcast.body} onChange={e=>setB('body',e.target.value)} />
          <input className="input" placeholder="Expires at (optional) yyyy-mm-dd hh:mm:ss" value={broadcast.expires_at} onChange={e=>setB('expires_at',e.target.value)} />
          <button className="btn" onClick={sendBroadcast}>Send</button>
        </div>
      </div>

      <div className="card">
        <h3 style={{marginTop:0}}>Support tickets</h3>
        {tickets.map(t=>(
          <div className="card" key={t.id}>
            <div className="row" style={{alignItems:'center'}}>
              <div style={{fontWeight:900}}>{t.ticket_code}</div>
              <span className="badge">{t.status}</span>
              <div style={{flex:1}} />
              <div className="small">{new Date(t.created_at).toLocaleString()}</div>
            </div>
            <div className="small"><b>{t.name}</b> • {t.email} • <b>{t.category}</b></div>
            <div className="small" style={{marginTop:6}}>{t.message}</div>
            {t.admin_reply && <div className="small" style={{marginTop:6}}><b>Reply:</b> {t.admin_reply}</div>}
            <div className="row" style={{marginTop:10}}>
              <input className="input" style={{flex:1}} placeholder="Write reply..." value={reply.ticketId===t.id ? reply.text : ''} 
                     onChange={e=>setReply({ ticketId: t.id, text: e.target.value })} />
              <button className="btn secondary" onClick={()=>sendReply(t.id)}>Send reply</button>
            </div>
          </div>
        ))}
        {tickets.length===0 && <div className="small">No tickets.</div>}
      </div>
    </div>
  );
}
