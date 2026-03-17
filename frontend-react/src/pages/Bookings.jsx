import { useEffect, useState } from 'react';
import { api, getToken } from '../api/client';
import { Link } from 'react-router-dom';

export default function Bookings() {
  const [items, setItems] = useState([]);
  const [msg, setMsg] = useState('');

  async function load() {
    setMsg('');
    if (!getToken()) { setMsg('Please login first.'); return; }
    const res = await api.get('/api/bookings');
    setItems(res.data.items || []);
  }

  useEffect(()=>{ load(); }, []);

  if (msg) return <div className="card">{msg}</div>;

  return (
    <div className="grid" style={{gap:16}}>
      <div className="card">
        <h2 style={{marginTop:0}}>Booking History</h2>
        <div className="small">Your bookings with status and generated itinerary (open a booking to see day-wise plan).</div>
      </div>

      {items.map(b => (
        <div className="card" key={b.id}>
          <div className="row" style={{alignItems:'center'}}>
            <img src={b.image_url || 'https://picsum.photos/seed/booking/300/200'} alt="" style={{width:120, height:80, borderRadius:12, objectFit:'cover'}} />
            <div style={{flex:1}}>
              <div style={{fontWeight:800}}>{b.title} • {b.destination}</div>
              <div className="small">Code: {b.booking_code} • Travelers: {(b.travelers||[]).length} • Total: ${Number(b.total_usd).toFixed(2)}</div>
              <div className="small">Status: <b>{b.status}</b> • Created: {new Date(b.created_at).toLocaleString()}</div>
            </div>
            {b.status !== 'paid' ? (
              <Link className="btn" to={`/payment/${b.id}`}>Pay now</Link>
            ) : (
              <Link className="btn secondary" to={`/payment/${b.id}`}>View receipt</Link>
            )}
          </div>
        </div>
      ))}

      {items.length === 0 && <div className="card">No bookings yet.</div>}
    </div>
  );
}
