import { useEffect, useState } from 'react';
import { api, getToken } from '../api/client';
import { useParams, useNavigate } from 'react-router-dom';
import L from 'leaflet';

const USD_TO_NPR = 133;
function toNPR(usd) {
  return 'NPR ' + new Intl.NumberFormat('en-NP').format(Math.round(Number(usd) * USD_TO_NPR));
}

// Image Slider Component
function ImageSlider({ images, fallback }) {
  const [current, setCurrent] = useState(0);
  const allImages = images && images.length > 0 ? images : (fallback ? [fallback] : []);

  if (allImages.length === 0) return (
    <div style={{ width: '100%', height: 420, background: '#131918', borderRadius: 24 }} />
  );

  const prev = () => setCurrent(i => (i - 1 + allImages.length) % allImages.length);
  const next = () => setCurrent(i => (i + 1) % allImages.length);

  return (
    <div className="td-slider">
      <img className="td-slider-img" src={allImages[current]} alt={`Slide ${current + 1}`} />
      <div className="td-hero-overlay" />

      {allImages.length > 1 && (
        <>
          <button className="td-slider-btn td-slider-prev" onClick={prev}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
          </button>
          <button className="td-slider-btn td-slider-next" onClick={next}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
          </button>
          <div className="td-slider-dots">
            {allImages.map((_, i) => (
              <button key={i} className={`td-slider-dot ${i === current ? 'active' : ''}`} onClick={() => setCurrent(i)} />
            ))}
          </div>
          <div className="td-slider-count">{current + 1} / {allImages.length}</div>
        </>
      )}
    </div>
  );
}

export default function TourDetail() {
  const { id } = useParams();
  const nav = useNavigate();
  const [tour, setTour] = useState(null);
  const [msg, setMsg] = useState({ text: '', type: '' });
  const [travelers, setTravelers] = useState([{ name: '', age: '', contact: '' }]);
  const [usePoints, setUsePoints] = useState(false);
  const [booking, setBooking] = useState(false);
  const [wishlistToast, setWishlistToast] = useState(false);
  const [wishlistToastMsg, setWishlistToastMsg] = useState('Added to wishlist!');
  const [fieldErrors, setFieldErrors] = useState([]);

  useEffect(() => {
    api.get(`/api/tours/${id}`).then(res => setTour(res.data.tour)).catch(() => {});
  }, [id]);

  useEffect(() => {
    if (!tour?.latitude || !tour?.longitude) return;
    const map = L.map('td-map', { zoomControl: true }).setView([Number(tour.latitude), Number(tour.longitude)], 13);
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '&copy; OpenStreetMap' }).addTo(map);
    L.marker([Number(tour.latitude), Number(tour.longitude)]).addTo(map).bindPopup(tour.destination);
    return () => map.remove();
  }, [tour]);

  function setTraveler(i, k, v) {
    setTravelers(prev => prev.map((t, idx) => idx === i ? { ...t, [k]: v } : t));
    // Clear field error on change
    setFieldErrors(prev => {
      const updated = [...prev];
      if (updated[i]) updated[i] = { ...updated[i], [k]: '' };
      return updated;
    });
  }

  async function addWishlist() {
    if (!getToken()) { setMsg({ text: 'Please login to add to wishlist.', type: 'err' }); return; }
    try {
      await api.post('/api/wishlist', { tour_id: Number(id) });
      setWishlistToastMsg('Added to wishlist!');
      setWishlistToast(true);
      setTimeout(() => setWishlistToast(false), 3000);
    } catch (e) {
      if (e?.response?.status === 409) {
        setWishlistToastMsg('Already in your wishlist!');
        setWishlistToast(true);
        setTimeout(() => setWishlistToast(false), 3000);
      } else {
        setMsg({ text: e?.response?.data?.error || 'Failed to add.', type: 'err' });
      }
    }
  }

  async function bookNow() {
    setMsg({ text: '', type: '' });
    if (!getToken()) { setMsg({ text: 'Please login to book.', type: 'err' }); return; }

    // ✅ VALIDATION
    let hasError = false;
    const errors = travelers.map((t, i) => {
      const err = { name: '', contact: '' };
      const num = i + 1;

      if (!t.name || !t.name.trim()) {
        err.name = `Full name is required.`;
        if (!hasError) {
          setMsg({ text: `Traveler ${num}: Please enter full name.`, type: 'err' });
          hasError = true;
        }
      }

      const contact = (t.contact || '').replace(/\s/g, '');
      if (!contact) {
        err.contact = `Contact number is required.`;
        if (!hasError) {
          setMsg({ text: `Traveler ${num}: Please enter contact number.`, type: 'err' });
          hasError = true;
        }
      } else if (!/^\d{10}$/.test(contact)) {
        err.contact = `Please enter a valid 10-digit number.`;
        if (!hasError) {
          setMsg({ text: `Traveler ${num}: Please enter a valid 10-digit number (e.g. 98XXXXXXXX).`, type: 'err' });
          hasError = true;
        }
      }

      return err;
    });

    setFieldErrors(errors);
    if (hasError) return;

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

  // Parse images
  const images = tour.images && Array.isArray(tour.images) ? tour.images :
                 tour.images_json ? (() => { try { return JSON.parse(tour.images_json); } catch { return []; } })() : [];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=DM+Sans:wght@300;400;500;600&display=swap');
        .td-wrap { max-width: 1200px; margin: 0 auto; padding: 40px 24px 60px; font-family: 'DM Sans', sans-serif; }

        /* SLIDER */
        .td-slider { position: relative; border-radius: 24px; overflow: hidden; margin-bottom: 28px; height: 520px; }
        .td-slider-img { width: 100%; height: 100%; object-fit: cover; display: block; transition: opacity 0.3s ease; }
        .td-hero-overlay { position: absolute; inset: 0; background: linear-gradient(to top, rgba(10,14,13,0.85) 0%, rgba(10,14,13,0.1) 60%); pointer-events: none; }
        .td-slider-btn { position: absolute; top: 50%; transform: translateY(-50%); background: rgba(0,0,0,0.45); border: 1px solid rgba(255,255,255,0.15); color: #fff; border-radius: 50%; width: 42px; height: 42px; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: background 0.2s; z-index: 10; backdrop-filter: blur(8px); }
        .td-slider-btn:hover { background: rgba(168,217,107,0.3); border-color: rgba(168,217,107,0.5); }
        .td-slider-prev { left: 16px; }
        .td-slider-next { right: 16px; }
        .td-slider-dots { position: absolute; bottom: 80px; left: 50%; transform: translateX(-50%); display: flex; gap: 6px; z-index: 10; }
        .td-slider-dot { width: 7px; height: 7px; border-radius: 50%; background: rgba(255,255,255,0.4); border: none; cursor: pointer; transition: all 0.2s; padding: 0; }
        .td-slider-dot.active { background: #a8d96b; width: 20px; border-radius: 4px; }
        .td-slider-count { position: absolute; top: 16px; right: 16px; background: rgba(0,0,0,0.45); color: #fff; font-size: 12px; font-weight: 600; padding: 4px 12px; border-radius: 100px; backdrop-filter: blur(8px); z-index: 10; }
        .td-hero-body { position: absolute; bottom: 0; left: 0; right: 0; padding: 32px; z-index: 5; }
        .td-tag { font-size: 11px; font-weight: 600; letter-spacing: 0.12em; text-transform: uppercase; color: #a8d96b; margin-bottom: 10px; }
        .td-title { font-family: 'Playfair Display', serif; font-size: clamp(26px, 4vw, 40px); font-weight: 700; color: #fff; margin: 0 0 14px; line-height: 1.2; }
        .td-meta { display: flex; flex-wrap: wrap; gap: 8px; }
        .td-pill { font-size: 12px; font-weight: 600; background: rgba(255,255,255,0.12); color: rgba(240,237,232,0.85); border-radius: 100px; padding: 4px 14px; backdrop-filter: blur(8px); }
        .td-pill-green { background: rgba(168,217,107,0.2); color: #a8d96b; }

        .td-main { display: grid; grid-template-columns: 1fr 370px; gap: 20px; margin-bottom: 20px; }
        .td-card { background: #131918; border: 1px solid rgba(255,255,255,0.07); border-radius: 20px; padding: 28px; }
        .td-price { font-family: 'DM Sans', sans-serif; font-size: 36px; font-weight: 700; color: #a8d96b; letter-spacing: -0.02em; margin-bottom: 4px; }
        .td-price-sub { font-size: 13px; color: rgba(240,237,232,0.4); margin-bottom: 20px; }
        .td-desc { font-size: 15px; color: rgba(240,237,232,0.65); line-height: 1.75; }
        .td-divider { height: 1px; background: rgba(255,255,255,0.07); margin: 20px 0; }
        .td-section-title { font-family: 'Playfair Display', serif; font-size: 18px; font-weight: 700; color: #fff; margin: 0 0 14px; }
        .td-info-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid rgba(255,255,255,0.05); font-size: 14px; }
        .td-info-label { color: rgba(240,237,232,0.4); }
        .td-info-value { color: #f0ede8; font-weight: 500; }
        .td-btn { width: 100%; background: #a8d96b; color: #1a2010; border: none; border-radius: 100px; padding: 14px; font-family: 'DM Sans', sans-serif; font-size: 15px; font-weight: 700; cursor: pointer; transition: background 0.2s; text-align: center; margin-bottom: 12px; }
        .td-btn:hover:not(:disabled) { background: #c1e88d; }
        .td-btn:disabled { opacity: 0.6; cursor: not-allowed; }
        .td-btn-ghost { width: 100%; background: rgba(168,217,107,0.08); color: #a8d96b; border: 1px solid rgba(168,217,107,0.2); border-radius: 100px; padding: 12px; font-family: 'DM Sans', sans-serif; font-size: 14px; font-weight: 600; cursor: pointer; transition: background 0.2s; text-align: center; }
        .td-btn-ghost:hover { background: rgba(168,217,107,0.15); }
        .td-points-row { display: flex; align-items: center; gap: 10px; margin-bottom: 16px; }
        .td-points-label { font-size: 13px; color: rgba(240,237,232,0.5); }
        .td-msg-ok { background: rgba(168,217,107,0.1); border: 1px solid rgba(168,217,107,0.2); color: #a8d96b; border-radius: 10px; padding: 10px 14px; font-size: 13px; margin-bottom: 12px; }
        .td-msg-err { background: rgba(248,113,113,0.08); border: 1px solid rgba(248,113,113,0.15); color: #f87171; border-radius: 10px; padding: 10px 14px; font-size: 13px; margin-bottom: 12px; }
        .td-field-err { color: #f87171; font-size: 11px; margin-top: 4px; font-weight: 500; }
        .td-input-error { border-color: rgba(248,113,113,0.5) !important; }
        .td-toast { position: fixed; top: 80px; right: 24px; border-radius: 12px; padding: 12px 20px; font-size: 13px; font-weight: 600; z-index: 9999; box-shadow: 0 8px 32px rgba(0,0,0,0.4); animation: toastIn 0.5s ease; }
        .td-toast.green { background: #1a2e1a; border: 1px solid rgba(168,217,107,0.4); color: #a8d96b; }
        .td-toast.red { background: #2e1a1a; border: 1px solid rgba(248,113,113,0.4); color: #f87171; }
        @keyframes toastIn { from { opacity: 0; transform: translateX(20px); } to { opacity: 1; transform: translateX(0); } }
        .td-full-card { background: #131918; border: 1px solid rgba(255,255,255,0.07); border-radius: 20px; padding: 28px; margin-bottom: 20px; overflow: hidden; }
        .td-itin { display: flex; flex-direction: column; gap: 10px; }
        .td-itin-item { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06); border-radius: 12px; padding: 14px 18px; display: flex; gap: 16px; align-items: flex-start; }
        .td-itin-day { font-size: 11px; font-weight: 700; color: #a8d96b; background: rgba(168,217,107,0.1); border-radius: 8px; padding: 4px 10px; white-space: nowrap; flex-shrink: 0; }
        .td-itin-title { font-size: 15px; font-weight: 600; color: #fff; margin-bottom: 4px; }
        .td-itin-details { font-size: 13px; color: rgba(240,237,232,0.5); line-height: 1.5; }
        .td-traveler { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06); border-radius: 14px; padding: 18px; margin-bottom: 12px; }
        .td-traveler-title { font-size: 12px; font-weight: 700; color: #a8d96b; letter-spacing: 0.08em; text-transform: uppercase; margin: 0; }
        .td-traveler-grid { display: grid; grid-template-columns: 1fr; gap: 10px; }
        .td-input-label { font-size: 11px; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase; color: rgba(240,237,232,0.35); margin-bottom: 5px; }
        .td-input { width: 100%; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.08); border-radius: 10px; padding: 12px 16px; color: #f0ede8; font-family: 'DM Sans', sans-serif; font-size: 15px; outline: none; transition: border-color 0.2s; box-sizing: border-box; }
        .td-input:focus { border-color: rgba(168,217,107,0.4); }
        .td-add-traveler { background: transparent; color: rgba(240,237,232,0.5); border: 1px dashed rgba(255,255,255,0.15); border-radius: 12px; padding: 12px; width: 100%; font-family: 'DM Sans', sans-serif; font-size: 13px; cursor: pointer; transition: all 0.2s; margin-bottom: 16px; }
        .td-add-traveler:hover { border-color: rgba(168,217,107,0.3); color: #a8d96b; }
        .td-remove-btn { background: rgba(248,113,113,0.1); border: 1px solid rgba(248,113,113,0.2); color: #f87171; border-radius: 8px; padding: 4px 10px; font-size: 12px; cursor: pointer; font-family: 'DM Sans', sans-serif; }
        @media (max-width: 768px) {
          .td-main { grid-template-columns: 1fr; }
          .td-traveler-grid { grid-template-columns: 1fr; }
          .td-slider { height: 280px; }
        }
      `}</style>

      <div className="td-wrap">

        {/* Hero Slider */}
        <div style={{ position: 'relative' }}>
          <ImageSlider images={images} fallback={tour.image_url || `https://picsum.photos/seed/tour${id}/1200/800`} />
          <div className="td-hero-body">
            <div className="td-tag">Tour Details</div>
            <h1 className="td-title">{tour.title}</h1>
            <div className="td-meta">
              {tour.destination && <span className="td-pill">{tour.destination}</span>}
              {tour.category && <span className="td-pill">{tour.category}</span>}
              {tour.duration_days && <span className="td-pill">{tour.duration_days} days</span>}
              {tour.rating && <span className="td-pill td-pill-green">★ {Number(tour.rating).toFixed(1)}</span>}
            </div>
          </div>
        </div>

        {/* Main 2-column */}
        <div className="td-main">
          {/* Left — Info */}
          <div className="td-card">
            <div className="td-price">{toNPR(tour.price_usd)}</div>
            <div className="td-price-sub">per person</div>
            <div className="td-divider" />
            <div className="td-info-row"><span className="td-info-label">Destination</span><span className="td-info-value">{tour.destination}</span></div>
            <div className="td-info-row"><span className="td-info-label">Category</span><span className="td-info-value">{tour.category}</span></div>
            <div className="td-info-row"><span className="td-info-label">Duration</span><span className="td-info-value">{tour.duration_days} days</span></div>
            <div className="td-info-row"><span className="td-info-label">Rating</span><span className="td-info-value">★ {Number(tour.rating).toFixed(1)}</span></div>
            {tour.description && (<><div className="td-divider" /><p className="td-desc">{tour.description}</p></>)}
          </div>

          {/* Right — Booking */}
          <div className="td-card">
            <div className="td-section-title">Book This Tour</div>
            <div style={{ fontSize: 13, color: 'rgba(240,237,232,0.4)', marginBottom: 20 }}>Add traveler details to proceed.</div>

            {travelers.map((t, i) => (
              <div key={i} className="td-traveler">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <div className="td-traveler-title">Traveler {i + 1}</div>
                  {i > 0 && (
                    <button className="td-remove-btn" onClick={() => setTravelers(prev => prev.filter((_, idx) => idx !== i))}>Remove</button>
                  )}
                </div>
                <div className="td-traveler-grid">

                  {/* NAME */}
                  <div>
                    <div className="td-input-label">Name</div>
                    <input
                      className={`td-input ${fieldErrors[i]?.name ? 'td-input-error' : ''}`}
                      placeholder="Ram Sharma"
                      value={t.name}
                      onChange={e => setTraveler(i, 'name', e.target.value)}
                    />
                    {fieldErrors[i]?.name && <div className="td-field-err">⚠ {fieldErrors[i].name}</div>}
                  </div>

                  {/* AGE */}
                  <div>
                    <div className="td-input-label">Age</div>
                    <input
                      className="td-input"
                      placeholder="25"
                      value={t.age}
                      onChange={e => setTraveler(i, 'age', e.target.value.replace(/\D/g, '').slice(0, 3))}
                    />
                  </div>

                  {/* CONTACT */}
                  <div>
                    <div className="td-input-label">Contact</div>
                    <input
                      className={`td-input ${fieldErrors[i]?.contact ? 'td-input-error' : ''}`}
                      placeholder="98XXXXXXXX"
                      value={t.contact}
                      maxLength={10}
                      onChange={e => setTraveler(i, 'contact', e.target.value.replace(/\D/g, '').slice(0, 10))}
                    />
                    {fieldErrors[i]?.contact && <div className="td-field-err">⚠ {fieldErrors[i].contact}</div>}
                  </div>

                </div>
              </div>
            ))}

            {travelers.length < 6 && (
              <button className="td-add-traveler" onClick={() => setTravelers(prev => [...prev, { name: '', age: '', contact: '' }])}>
                + Add Traveler
              </button>
            )}

            <div className="td-points-row">
              <input type="checkbox" id="usePoints" checked={usePoints} onChange={e => setUsePoints(e.target.checked)} style={{ width: 16, height: 16, accentColor: '#a8d96b' }} />
              <label htmlFor="usePoints" className="td-points-label">Use loyalty points</label>
            </div>

            {msg.text && <div className={msg.type === 'ok' ? 'td-msg-ok' : 'td-msg-err'}>{msg.text}</div>}

            <button className="td-btn" onClick={bookNow} disabled={booking}>
              {booking ? 'Processing...' : 'Book Now →'}
            </button>

            {wishlistToast && (
              <div className={`td-toast ${wishlistToastMsg.includes('Already') ? 'red' : 'green'}`}>
                {wishlistToastMsg}
              </div>
            )}
            <button className="td-btn-ghost" onClick={addWishlist}>Add to Wishlist</button>
          </div>
        </div>

        {/* Itinerary */}
        <div className="td-full-card">
          <div className="td-section-title">Day-wise Itinerary</div>
          {(tour.itinerary || []).length === 0 ? (
            <div style={{ fontSize: 14, color: 'rgba(240,237,232,0.35)' }}>No itinerary available for this tour yet.</div>
          ) : (
            <div className="td-itin">
              {tour.itinerary.map((d, idx) => (
                <div key={idx} className="td-itin-item">
                  <div className="td-itin-day">Day {d.day}</div>
                  <div>
                    <div className="td-itin-title">{d.title}</div>
                    <div className="td-itin-details">{d.details}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Map */}
        <div className="td-full-card">
          <div className="td-section-title">Location Map</div>
          {!tour.latitude || !tour.longitude ? (
            <div style={{ fontSize: 14, color: 'rgba(240,237,232,0.35)' }}>No map coordinates available.</div>
          ) : (
            <div id="td-map" style={{ height: 360, borderRadius: 14, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.08)', position: 'relative', zIndex: 1 }} />
          )}
        </div>

      </div>
    </>
  );
}