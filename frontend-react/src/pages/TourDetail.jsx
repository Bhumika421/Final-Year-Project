import { useEffect, useState } from 'react';
import { api, getToken } from '../api/client';
import { useParams, useNavigate } from 'react-router-dom';
import L from 'leaflet';

export default function TourDetail() {
  const { id } = useParams();
  const nav = useNavigate();
  const [tour, setTour] = useState(null);
  const [msg, setMsg] = useState({ text: '', type: '' });
  const [travelers, setTravelers] = useState([{ name: '', age: '', contact: '' }]);
  const [usePoints, setUsePoints] = useState(false);
  const [booking, setBooking] = useState(false);

  useEffect(() => {
    api.get(`/api/tours/${id}`).then(res => setTour(res.data.tour)).catch(() => {});
  }, [id]);

  useEffect(() => {
    if (!tour?.latitude || !tour?.longitude) return;
    const map = L.map('td-map', { zoomControl: true }).setView([Number(tour.latitude), Number(tour.longitude)], 11);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 18 }).addTo(map);
    L.marker([Number(tour.latitude), Number(tour.longitude)]).addTo(map).bindPopup(tour.destination);
    return () => map.remove();
  }, [tour]);

  function setTraveler(i, k, v) {
    setTravelers(prev => prev.map((t, idx) => idx === i ? { ...t, [k]: v } : t));
  }

  async function addWishlist() {
    setMsg({ text: '', type: '' });
    if (!getToken()) { setMsg({ text: 'Please login first.', type: 'err' }); return; }
    try {
      await api.post('/api/wishlist', { tour_id: Number(id) });
      setMsg({ text: '❤️ Added to wishlist!', type: 'ok' });
    } catch (e) {
      setMsg({ text: e?.response?.data?.error || 'Failed to add.', type: 'err' });
    }
  }

  async function bookNow() {
    setMsg({ text: '', type: '' });
    if (!getToken()) { setMsg({ text: 'Please login first.', type: 'err' }); return; }
    setBooking(true);
    try {
      const res = await api.post('/api/bookings', { tour_id: Number(id), travelers, use_loyalty_points: usePoints });
      nav(`/payment/${res.data.booking_id}`, { state: { total: res.data.total_usd, code: res.data.booking_code } });
    } catch (e) {
      setMsg({ text: e?.response?.data?.error || 'Booking failed.', type: 'err' });
    } finally {
      setBooking(false);
    }
  }

  if (!tour) return (
    <div style={{ maxWidth: 900, margin: '80px auto', padding: '0 24px', fontFamily: 'DM Sans, sans-serif', color: '#fff', textAlign: 'center' }}>
      Loading tour...
    </div>
  );

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=DM+Sans:wght@300;400;500;600&display=swap');
        .td-wrap { max-width: 900px; margin: 0 auto; padding: 40px 24px 60px; font-family: 'DM Sans', sans-serif; }
        .td-card { background: #131918; border: 1px solid rgba(255,255,255,0.07); border-radius: 20px; overflow: hidden; margin-bottom: 20px; }
        .td-card-body { padding: 28px; }
        .td-img { width: 100%; height: 320px; object-fit: cover; display: block; }
        .td-tag { font-size: 11px; font-weight: 600; letter-spacing: 0.12em; text-transform: uppercase; color: #a8d96b; margin-bottom: 8px; }
        .td-title { font-family: 'Playfair Display', serif; font-size: clamp(24px, 4vw, 34px); font-weight: 700; color: #fff; margin: 0 0 12px; }
        .td-meta { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 16px; }
        .td-pill { font-size: 12px; font-weight: 600; background: rgba(255,255,255,0.06); color: rgba(240,237,232,0.6); border-radius: 100px; padding: 4px 12px; }
        .td-pill-green { background: rgba(168,217,107,0.12); color: #a8d96b; }
        .td-price { font-family: 'Playfair Display', serif; font-size: 32px; font-weight: 700; color: #a8d96b; margin: 0 0 4px; }
        .td-price-sub { font-size: 13px; color: rgba(240,237,232,0.4); margin-bottom: 16px; }
        .td-desc { font-size: 15px; color: rgba(240,237,232,0.65); line-height: 1.7; margin-bottom: 20px; }
        .td-divider { height: 1px; background: rgba(255,255,255,0.07); margin: 20px 0; }
        .td-btn-row { display: flex; gap: 12px; flex-wrap: wrap; }
        .td-btn { background: #a8d96b; color: #1a2010; border: none; border-radius: 100px; padding: 12px 28px; font-family: 'DM Sans', sans-serif; font-size: 14px; font-weight: 700; cursor: pointer; transition: background 0.2s; text-decoration: none; display: inline-block; }
        .td-btn:hover { background: #c1e88d; }
        .td-btn-ghost { background: rgba(168,217,107,0.1); color: #a8d96b; border: 1px solid rgba(168,217,107,0.25); border-radius: 100px; padding: 12px 28px; font-family: 'DM Sans', sans-serif; font-size: 14px; font-weight: 600; cursor: pointer; transition: background 0.2s; }
        .td-btn-ghost:hover { background: rgba(168,217,107,0.2); }
        .td-section-title { font-family: 'Playfair Display', serif; font-size: 20px; font-weight: 700; color: #fff; margin: 0 0 16px; }
        .td-itin { display: flex; flex-direction: column; gap: 12px; }
        .td-itin-item { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06); border-radius: 12px; padding: 14px 18px; }
        .td-itin-day { font-size: 13px; font-weight: 700; color: #a8d96b; margin-bottom: 4px; }
        .td-itin-title { font-size: 15px; font-weight: 600; color: #fff; margin-bottom: 4px; }
        .td-itin-details { font-size: 13px; color: rgba(240,237,232,0.5); }
        .td-traveler { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06); border-radius: 14px; padding: 18px; margin-bottom: 12px; }
        .td-traveler-title { font-size: 13px; font-weight: 700; color: #a8d96b; margin-bottom: 12px; }
        .td-traveler-grid { display: grid; grid-template-columns: 2fr 1fr 2fr; gap: 12px; }
        .td-input-label { font-size: 11px; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase; color: rgba(240,237,232,0.4); margin-bottom: 5px; }
        .td-input { width: 100%; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.08); border-radius: 10px; padding: 10px 12px; color: #f0ede8; font-family: 'DM Sans', sans-serif; font-size: 13px; outline: none; transition: border-color 0.2s; box-sizing: border-box; }
        .td-input:focus { border-color: rgba(168,217,107,0.4); }
        .td-points-row { display: flex; align-items: center; gap: 10px; margin-bottom: 20px; }
        .td-points-label { font-size: 13px; color: rgba(240,237,232,0.55); }
        .td-msg-ok { background: rgba(168,217,107,0.1); border: 1px solid rgba(168,217,107,0.25); color: #a8d96b; border-radius: 12px; padding: 10px 14px; font-size: 13px; margin-bottom: 16px; }
        .td-msg-err { background: rgba(248,113,113,0.08); border: 1px solid rgba(248,113,113,0.2); color: #f87171; border-radius: 12px; padding: 10px 14px; font-size: 13px; margin-bottom: 16px; }
        @media (max-width: 560px) { .td-traveler-grid { grid-template-columns: 1fr; } .td-btn-row { flex-direction: column; } }
      `}</style>

      <div className="td-wrap">

        {/* Hero Card */}
        <div className="td-card">
          <img className="td-img" src={tour.image_url || `https://picsum.photos/seed/tour${id}/1200/800`} alt={tour.title} />
          <div className="td-card-body">
            <div className="td-tag">🏔 Tour Details</div>
            <h1 className="td-title">{tour.title}</h1>
            <div className="td-meta">
              {tour.destination && <span className="td-pill">{tour.destination}</span>}
              {tour.category && <span className="td-pill">{tour.category}</span>}
              {tour.duration_days && <span className="td-pill">{tour.duration_days} days</span>}
              {tour.rating && <span className="td-pill td-pill-green">★ {Number(tour.rating).toFixed(1)}</span>}
            </div>
            <div className="td-price">${Number(tour.price_usd).toFixed(2)}</div>
            <div className="td-price-sub">per person</div>
            {tour.description && <p className="td-desc">{tour.description}</p>}
            <div className="td-divider" />
            {msg.text && <div className={msg.type === 'ok' ? 'td-msg-ok' : 'td-msg-err'}>{msg.text}</div>}
            <div className="td-btn-row">
              <button className="td-btn-ghost" onClick={addWishlist}>❤️ Add to Wishlist</button>
            </div>
          </div>
        </div>

        {/* Itinerary */}
        <div className="td-card">
          <div className="td-card-body">
            <div className="td-section-title">Day-wise Itinerary</div>
            {(tour.itinerary || []).length === 0 ? (
              <div style={{ fontSize: 14, color: 'rgba(240,237,232,0.4)' }}>No itinerary set yet.</div>
            ) : (
              <div className="td-itin">
                {tour.itinerary.map((d, idx) => (
                  <div key={idx} className="td-itin-item">
                    <div className="td-itin-day">Day {d.day}</div>
                    <div className="td-itin-title">{d.title}</div>
                    <div className="td-itin-details">{d.details}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Map */}
        <div className="td-card">
          <div className="td-card-body">
            <div className="td-section-title">Location Map</div>
            {!tour.latitude || !tour.longitude ? (
              <div style={{ fontSize: 14, color: 'rgba(240,237,232,0.4)' }}>No map coordinates available.</div>
            ) : (
              <div id="td-map" style={{ height: 320, borderRadius: 12, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.08)' }} />
            )}
          </div>
        </div>

        {/* Booking */}
        <div className="td-card">
          <div className="td-card-body">
            <div className="td-section-title">Book This Tour</div>
            <div style={{ fontSize: 13, color: 'rgba(240,237,232,0.45)', marginBottom: 20 }}>Add traveler details below to proceed with booking.</div>

            {travelers.map((t, i) => (
              <div key={i} className="td-traveler">
                <div className="td-traveler-title">Traveler {i + 1}</div>
                <div className="td-traveler-grid">
                  <div>
                    <div className="td-input-label">Full Name</div>
                    <input className="td-input" placeholder="Ram Sharma" value={t.name} onChange={e => setTraveler(i, 'name', e.target.value)} />
                  </div>
                  <div>
                    <div className="td-input-label">Age</div>
                    <input className="td-input" placeholder="25" value={t.age} onChange={e => setTraveler(i, 'age', e.target.value)} />
                  </div>
                  <div>
                    <div className="td-input-label">Contact</div>
                    <input className="td-input" placeholder="98XXXXXXXX" value={t.contact} onChange={e => setTraveler(i, 'contact', e.target.value)} />
                  </div>
                </div>
              </div>
            ))}

            <button className="td-btn-ghost" style={{ marginBottom: 20 }} onClick={() => setTravelers(prev => [...prev, { name: '', age: '', contact: '' }])}>
              + Add Traveler
            </button>

            <div className="td-divider" />

            <div className="td-points-row">
              <input type="checkbox" id="usePoints" checked={usePoints} onChange={e => setUsePoints(e.target.checked)} style={{ width: 16, height: 16, accentColor: '#a8d96b' }} />
              <label htmlFor="usePoints" className="td-points-label">Use loyalty points (if available)</label>
            </div>

            {msg.text && <div className={msg.type === 'ok' ? 'td-msg-ok' : 'td-msg-err'}>{msg.text}</div>}

            <button className="td-btn" onClick={bookNow} disabled={booking} style={{ width: '100%', textAlign: 'center' }}>
              {booking ? 'Processing...' : 'Proceed to Payment →'}
            </button>
          </div>
        </div>

      </div>
    </>
  );
}
