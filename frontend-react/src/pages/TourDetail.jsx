import { useEffect, useMemo, useState } from 'react';
import { api, getToken } from '../api/client';
import { useParams, useNavigate } from 'react-router-dom';
import { Toast } from '../components/Toast.jsx';
import L from 'leaflet';

export default function TourDetail() {
  const { id } = useParams();
  const nav = useNavigate();
  const [tour, setTour] = useState(null);
  const [msg, setMsg] = useState('');
  const [travelers, setTravelers] = useState([{ name:'', age:'', contact:'' }]);
  const [usePoints, setUsePoints] = useState(false);

  async function load() {
    const res = await api.get(`/api/tours/${id}`);
    setTour(res.data.tour);
  }

  useEffect(()=>{ load(); }, [id]);

  // Map
  useEffect(()=>{
    if (!tour) return;
    if (!tour.latitude || !tour.longitude) return;
    const map = L.map('map', { zoomControl: true }).setView([Number(tour.latitude), Number(tour.longitude)], 11);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 18 }).addTo(map);
    L.marker([Number(tour.latitude), Number(tour.longitude)]).addTo(map).bindPopup(tour.destination);
    return () => map.remove();
  }, [tour]);

  function setTraveler(i, k, v) {
    setTravelers(prev => prev.map((t, idx) => idx===i ? { ...t, [k]: v } : t));
  }

  function addTraveler() {
    setTravelers(prev => [...prev, { name:'', age:'', contact:'' }]);
  }

  async function addWishlist() {
    setMsg('');
    try {
      if (!getToken()) { setMsg('Please login first.'); return; }
      await api.post('/api/wishlist', { tour_id: Number(id) });
      setMsg('Added to wishlist ');
    } catch (e) {
      setMsg(e?.response?.data?.error || 'Failed');
    }
  }

  async function bookNow() {
    setMsg('');
    try {
      if (!getToken()) { setMsg('Please login first.'); return; }
      const res = await api.post('/api/bookings', { tour_id: Number(id), travelers, use_loyalty_points: usePoints });
      nav(`/payment/${res.data.booking_id}`, { state: { total: res.data.total_usd, code: res.data.booking_code }});
    } catch (e) {
      setMsg(e?.response?.data?.error || 'Booking failed');
    }
  }

  if (!tour) return <div className="card">Loading...</div>;

  return (
    <div className="grid" style={{gap:16}}>
      <div className="card">
        <img className="cover" style={{height:280}} src={tour.image_url || 'https://picsum.photos/seed/tourdetail/1200/800'} alt="" />
        <h2 style={{margin:'12px 0 6px'}}>{tour.title}</h2>
        <div className="small">{tour.destination} • {tour.category} • {tour.duration_days} days • ⭐ {tour.rating}</div>
        <div style={{marginTop:10, fontWeight:900, fontSize:22}}>${Number(tour.price_usd).toFixed(2)} <span className="small">per person</span></div>
        <p className="small">{tour.description}</p>
        <div className="row">
          <button className="btn secondary" onClick={addWishlist}>Add to Wishlist</button>
          <div style={{flex:1}} />
          <label className="small" style={{display:'flex',gap:8,alignItems:'center'}}>
            <input type="checkbox" checked={usePoints} onChange={e=>setUsePoints(e.target.checked)} />
            Use loyalty points (if available)
          </label>
        </div>
        <Toast msg={msg} />
      </div>

      <div className="card">
        <h3 style={{marginTop:0}}>Itinerary (day-wise)</h3>
        {(tour.itinerary || []).length === 0 ? <div className="small">No itinerary set yet.</div> : (
          <div className="grid">
            {tour.itinerary.map((d, idx) => (
              <div className="card" key={idx}>
                <div style={{fontWeight:800}}>Day {d.day}: {d.title}</div>
                <div className="small">{d.details}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="card">
        <h3 style={{marginTop:0}}>Location Map</h3>
        {!tour.latitude || !tour.longitude ? (
          <div className="small">No map coordinates available for this tour.</div>
        ) : (
          <div id="map" style={{height:320, borderRadius:12, overflow:'hidden', border:'1px solid rgba(255,255,255,0.08)'}} />
        )}
        <div className="small" style={{marginTop:8}}>Map uses OpenStreetMap tiles (no API key needed).</div>
      </div>

      <div className="card">
        <h3 style={{marginTop:0}}>Book this tour</h3>
        <div className="small">Add traveler details (for demo, only basic fields are required).</div>
        <hr/>
        <div className="grid">
          {travelers.map((t, i) => (
            <div className="card" key={i}>
              <div className="row">
                <div style={{flex:2}}>
                  <div className="small">Name</div>
                  <input className="input" value={t.name} onChange={e=>setTraveler(i,'name',e.target.value)} />
                </div>
                <div style={{flex:1}}>
                  <div className="small">Age</div>
                  <input className="input" value={t.age} onChange={e=>setTraveler(i,'age',e.target.value)} />
                </div>
                <div style={{flex:2}}>
                  <div className="small">Contact</div>
                  <input className="input" value={t.contact} onChange={e=>setTraveler(i,'contact',e.target.value)} />
                </div>
              </div>
            </div>
          ))}
          <div className="row">
            <button className="btn secondary" onClick={addTraveler}>+ Add traveler</button>
            <div style={{flex:1}} />
            <button className="btn" onClick={bookNow}>Proceed to Payment</button>
          </div>
        </div>
      </div>
    </div>
  );
}
