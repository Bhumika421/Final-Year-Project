import { useEffect, useState, useRef } from 'react';
import { api, getToken } from '../api/client';
import { useParams, useNavigate } from 'react-router-dom';
import L from 'leaflet';
import { getLoyaltyLevel, getNextLevel, calcDiscountedPrice, getBookingsCount } from '../utils/loyalty';

const USD_TO_NPR = 133;
const BACKEND = 'http://localhost/safe-journey-planner/backend-php/public';

function getImageUrl(img) {
  if (!img) return null;
  if (img.startsWith('http')) return img;
  return BACKEND + img;
}

function ImageSlider({ images, fallback }) {
  const [current, setCurrent] = useState(0);
  const allImages = images && images.length > 0 ? images : (fallback ? [fallback] : []);

  if (allImages.length === 0) return (
    <div style={{
      width: '100%', height: 420, background: '#131918',
      borderRadius: 24, display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      border: '1px solid rgba(255,255,255,0.06)'
    }}>
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5">
        <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/>
        <polyline points="21 15 16 10 5 21"/>
      </svg>
      <div style={{fontSize: 13, color: 'rgba(255,255,255,0.2)', marginTop: 12}}>No image uploaded</div>
    </div>
  );

  const prev = () => setCurrent(i => (i - 1 + allImages.length) % allImages.length);
  const next = () => setCurrent(i => (i + 1) % allImages.length);

  return (
    <div className="td-slider">
      <img className="td-slider-img" src={allImages[current]} alt={`Slide ${current + 1}`}
        onError={e => { e.target.style.display = 'none'; e.target.parentElement.style.background = '#131918'; }} />
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

// CHAT BOX — Floating button + slide panel
function ChatBox({ tourId, agencyName }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const bottomRef = useRef(null);
  const user = (() => { try { return JSON.parse(localStorage.getItem('user') || 'null'); } catch { return null; } })();

  async function loadMessages() {
    try {
      const res = await api.get(`/api/messages?tour_id=${tourId}`);
      const msgs = res.data.messages || [];
      setMessages(msgs);
      if (!open) setUnread(msgs.filter(m => m.sender_role === 'agency' && !m.is_read).length);
    } catch {}
    finally { setLoading(false); }
  }

  useEffect(() => {
    if (open) {
      setLoading(true);
      loadMessages();
      setUnread(0);
      const iv = setInterval(loadMessages, 5000);
      return () => clearInterval(iv);
    }
  }, [open, tourId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function send() {
    if (!input.trim() || sending) return;
    setSending(true);
    try {
      await api.post('/api/messages', { tour_id: tourId, message: input.trim() });
      setInput('');
      await loadMessages();
    } catch {}
    finally { setSending(false); }
  }

  function timeAgo(d) {
    const diff = Math.floor((Date.now() - new Date(d)) / 1000);
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return new Date(d).toLocaleDateString();
  }

  if (!getToken()) return null;

  const agencyInitial = (agencyName || 'A')[0].toUpperCase();

  return (
    <>
      <style>{`
        .chat-fab { position: fixed; bottom: 28px; right: 28px; z-index: 1000; display: flex; flex-direction: column; align-items: flex-end; gap: 10px; }
        .chat-fab-label { background: #131918; border: 1px solid rgba(168,217,107,0.25); color: #a8d96b; font-size: 12px; font-weight: 600; padding: 6px 14px; border-radius: 100px; white-space: nowrap; animation: chatFadeUp 0.3s ease; font-family: 'DM Sans', sans-serif; }
        @keyframes chatFadeUp { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
        .chat-fab-btn { width: 56px; height: 56px; border-radius: 50%; background: linear-gradient(135deg,#a8d96b,#5fa832); border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; box-shadow: 0 8px 32px rgba(168,217,107,0.35); transition: transform 0.2s, box-shadow 0.2s; position: relative; }
        .chat-fab-btn:hover { transform: scale(1.08); box-shadow: 0 12px 40px rgba(168,217,107,0.45); }
        .chat-fab-badge { position: absolute; top: -4px; right: -4px; background: #f87171; color: #fff; font-size: 10px; font-weight: 800; min-width: 18px; height: 18px; border-radius: 100px; display: flex; align-items: center; justify-content: center; border: 2px solid #0a0e0d; padding: 0 3px; }
        .chat-panel { position: fixed; bottom: 96px; right: 28px; width: 360px; height: 480px; background: #0f1612; border: 1px solid rgba(168,217,107,0.2); border-radius: 20px; box-shadow: 0 24px 64px rgba(0,0,0,0.6); z-index: 999; display: flex; flex-direction: column; overflow: hidden; animation: chatPanelIn 0.25s cubic-bezier(0.4,0,0.2,1); }
        @keyframes chatPanelIn { from { opacity:0; transform:translateY(20px) scale(0.95); } to { opacity:1; transform:translateY(0) scale(1); } }
        .chat-panel-head { display: flex; align-items: center; gap: 12px; padding: 16px 18px; background: linear-gradient(135deg,#1a2e1a,#0f1e10); border-bottom: 1px solid rgba(168,217,107,0.12); flex-shrink: 0; }
        .chat-panel-avatar { width: 40px; height: 40px; border-radius: 50%; background: linear-gradient(135deg,#a8d96b,#5fa832); display: flex; align-items: center; justify-content: center; font-size: 16px; font-weight: 700; color: #0f1410; flex-shrink: 0; box-shadow: 0 0 0 2px rgba(168,217,107,0.3); }
        .chat-panel-info { flex: 1; }
        .chat-panel-name { font-size: 14px; font-weight: 700; color: #fff; font-family: 'DM Sans', sans-serif; }
        .chat-panel-status { font-size: 11px; color: rgba(168,217,107,0.7); display: flex; align-items: center; gap: 5px; margin-top: 2px; }
        .chat-panel-status-dot { width: 6px; height: 6px; border-radius: 50%; background: #a8d96b; flex-shrink: 0; }
        .chat-close-btn { width: 28px; height: 28px; border-radius: 8px; background: rgba(255,255,255,0.06); border: none; color: rgba(240,237,232,0.5); cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.2s; flex-shrink: 0; }
        .chat-close-btn:hover { background: rgba(248,113,113,0.15); color: #f87171; }
        .chat-messages { flex: 1; overflow-y: auto; padding: 14px 16px; display: flex; flex-direction: column; gap: 10px; scrollbar-width: thin; scrollbar-color: rgba(168,217,107,0.1) transparent; }
        .chat-messages::-webkit-scrollbar { width: 3px; }
        .chat-messages::-webkit-scrollbar-thumb { background: rgba(168,217,107,0.1); border-radius: 10px; }
        .chat-empty { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; color: rgba(240,237,232,0.3); font-size: 13px; gap: 8px; padding: 20px; text-align: center; font-family: 'DM Sans', sans-serif; }
        .chat-empty-icon { width: 48px; height: 48px; border-radius: 50%; background: rgba(168,217,107,0.06); border: 1px solid rgba(168,217,107,0.12); display: flex; align-items: center; justify-content: center; color: rgba(168,217,107,0.3); margin-bottom: 4px; }
        .chat-bubble-wrap { display: flex; flex-direction: column; gap: 2px; }
        .chat-bubble-wrap.me { align-items: flex-end; }
        .chat-bubble-wrap.them { align-items: flex-start; }
        .chat-bubble { max-width: 82%; padding: 9px 13px; border-radius: 14px; font-size: 13.5px; line-height: 1.5; color: #f0ede8; word-break: break-word; font-family: 'DM Sans', sans-serif; }
        .chat-bubble.me { background: rgba(168,217,107,0.18); border: 1px solid rgba(168,217,107,0.28); border-bottom-right-radius: 4px; }
        .chat-bubble.them { background: rgba(255,255,255,0.07); border: 1px solid rgba(255,255,255,0.1); border-bottom-left-radius: 4px; }
        .chat-time { font-size: 10px; color: rgba(240,237,232,0.25); padding: 0 4px; font-family: 'DM Sans', sans-serif; }
        .chat-input-wrap { padding: 12px 14px; border-top: 1px solid rgba(255,255,255,0.06); display: flex; gap: 8px; flex-shrink: 0; background: #0d1210; }
        .chat-input { flex: 1; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.09); border-radius: 10px; padding: 9px 13px; color: #f0ede8; font-family: 'DM Sans', sans-serif; font-size: 13px; outline: none; transition: border-color 0.2s; }
        .chat-input:focus { border-color: rgba(168,217,107,0.4); }
        .chat-input::placeholder { color: rgba(240,237,232,0.2); }
        .chat-send-btn { width: 38px; height: 38px; border-radius: 10px; background: #a8d96b; border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; color: #0f1410; transition: all 0.2s; flex-shrink: 0; }
        .chat-send-btn:hover:not(:disabled) { background: #c1e88d; transform: scale(1.05); }
        .chat-send-btn:disabled { opacity: 0.4; cursor: not-allowed; }
        @media(max-width:480px) { .chat-panel { width: calc(100vw - 32px); right: 16px; bottom: 84px; } .chat-fab { right: 16px; bottom: 20px; } }
      `}</style>

      {/* Floating Button */}
      <div className="chat-fab">
        {!open && (
          <div className="chat-fab-label">Message {agencyName || 'Agency'}</div>
        )}
        <button className="chat-fab-btn" onClick={() => setOpen(v => !v)}>
          {open ? (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0f1410" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          ) : (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#0f1410" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
            </svg>
          )}
          {!open && unread > 0 && <span className="chat-fab-badge">{unread}</span>}
        </button>
      </div>

      {/* Chat Panel */}
      {open && (
        <div className="chat-panel">
          {/* Header */}
          <div className="chat-panel-head">
            <div className="chat-panel-avatar">{agencyInitial}</div>
            <div className="chat-panel-info">
              <div className="chat-panel-name">{agencyName || 'Travel Agency'}</div>
              <div className="chat-panel-status">
                <div className="chat-panel-status-dot" />
                Online
              </div>
            </div>
            <button className="chat-close-btn" onClick={() => setOpen(false)}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>

          {/* Messages */}
          <div className="chat-messages">
            {loading && messages.length === 0 && (
              <div className="chat-empty">
                <div className="chat-empty-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                </div>
                Loading messages...
              </div>
            )}
            {!loading && messages.length === 0 && (
              <div className="chat-empty">
                <div className="chat-empty-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
                </div>
                <div style={{fontWeight: 600, color: 'rgba(240,237,232,0.5)'}}>Start the conversation</div>
                <div>Ask about this tour, dates, or availability</div>
              </div>
            )}
            {messages.map(m => {
              const isMe = m.sender_id === user?.id;
              return (
                <div key={m.id} className={`chat-bubble-wrap ${isMe ? 'me' : 'them'}`}>
                  <div className={`chat-bubble ${isMe ? 'me' : 'them'}`}>{m.message}</div>
                  <div className="chat-time">{isMe ? 'You' : m.sender_name} · {timeAgo(m.created_at)}</div>
                </div>
              );
            })}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="chat-input-wrap">
            <input
              className="chat-input"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()}
              placeholder="Type a message..."
            />
            <button className="chat-send-btn" onClick={send} disabled={sending || !input.trim()}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13"/>
                <polygon points="22 2 15 22 11 13 2 9 22 2"/>
              </svg>
            </button>
          </div>
        </div>
      )}
    </>
  );
}

export default function TourDetail() {
  const { id } = useParams();
  const nav = useNavigate();
  const [tour, setTour] = useState(null);
  const [msg, setMsg] = useState({ text: '', type: '' });
  const [travelers, setTravelers] = useState([{ name: '', age: '', contact: '' }]);
  const [useDiscount, setUseDiscount] = useState(true);
  const [booking, setBooking] = useState(false);
  const [bookingNotice, setBookingNotice] = useState('');
  const [wishlistToast, setWishlistToast] = useState(false);
  const [wishlistToastMsg, setWishlistToastMsg] = useState('Added to wishlist!');
  const [fieldErrors, setFieldErrors] = useState([]);
  const [completedBookings, setCompletedBookings] = useState(0);
  const [loyaltyLoaded, setLoyaltyLoaded] = useState(false);

  useEffect(() => {
    if (!getToken()) { setLoyaltyLoaded(true); return; }
    getBookingsCount().then(count => { setCompletedBookings(count); setLoyaltyLoaded(true); });
  }, []);

  const loyaltyLevel = getLoyaltyLevel(completedBookings);
  const nextLevel = getNextLevel(completedBookings);
  const isLoggedIn = !!getToken();

  useEffect(() => {
    if (!id || id === 'undefined') { nav('/tours'); return; }
    api.get(`/api/tours/${id}`)
      .then(res => setTour(res.data.tour))
      .catch(() => nav('/tours'));
  }, [id]);

  useEffect(() => {
    if (!tour?.latitude || !tour?.longitude) return;
    const container = L.DomUtil.get('td-map');
    if (container?._leaflet_id) return;
    const map = L.map('td-map', { zoomControl: true }).setView([Number(tour.latitude), Number(tour.longitude)], 13);
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '&copy; OpenStreetMap' }).addTo(map);
    L.marker([Number(tour.latitude), Number(tour.longitude)]).addTo(map).bindPopup(tour.destination);
    return () => map.remove();
  }, [tour]);

  function setTraveler(i, k, v) {
    setTravelers(prev => prev.map((t, idx) => idx === i ? { ...t, [k]: v } : t));
    setFieldErrors(prev => { const u = [...prev]; if (u[i]) u[i] = { ...u[i], [k]: '' }; return u; });
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
    if (!getToken()) { nav('/login', { state: { from: `/tours/${id}` } }); return; }
    let hasError = false;
    const errors = travelers.map((t, i) => {
      const err = { name: '', contact: '' };
      if (!t.name || !t.name.trim()) {
        err.name = 'Full name is required.';
        if (!hasError) { setMsg({ text: `Traveler ${i+1}: Please enter full name.`, type: 'err' }); hasError = true; }
      }
      const contact = (t.contact || '').replace(/\s/g, '');
      if (!contact) {
        err.contact = 'Contact number is required.';
        if (!hasError) { setMsg({ text: `Traveler ${i+1}: Please enter contact number.`, type: 'err' }); hasError = true; }
      } else if (!/^\d{10}$/.test(contact)) {
        err.contact = 'Please enter a valid 10-digit number.';
        if (!hasError) { setMsg({ text: `Traveler ${i+1}: Please enter a valid 10-digit number.`, type: 'err' }); hasError = true; }
      }
      if (t.age && (Number(t.age) < 1 || Number(t.age) > 99)) {
    err.age = 'Age must be between 1 and 99.';
    if (!hasError) { setMsg({ text: `Traveler ${i+1}: Age must be between 1 and 99.`, type: 'err' }); hasError = true; }
  }
      return err;
    });
    setFieldErrors(errors);
    if (hasError) return;
    setBooking(true);
    try {
      const res = await api.post('/api/bookings', { tour_id: Number(id), travelers, use_loyalty_discount: useDiscount });
      setBookingNotice('Booking request submitted. Please wait for agency approval before payment.');
      setTimeout(() => {
        nav(`/payment/${res.data.booking_id}`, { state: { total: res.data.total_usd, code: res.data.booking_code } });
      }, 1200);
    } catch (e) {
      setMsg({ text: e?.response?.data?.error || 'Booking failed.', type: 'err' });
    } finally { setBooking(false); }
  }

  if (!tour) return (
    <div style={{ maxWidth: 900, margin: '80px auto', padding: '0 24px', fontFamily: 'DM Sans, sans-serif', color: '#fff', textAlign: 'center' }}>
      {!id || id === 'undefined' ? (
        <>
          <p>Tour not found.</p>
          <button onClick={() => nav('/tours')} style={{ background: '#a8d96b', color: '#1a2010', border: 'none', borderRadius: 100, padding: '10px 24px', marginTop: 16, cursor: 'pointer', fontFamily: 'DM Sans', fontWeight: 600 }}>Browse Tours</button>
        </>
      ) : 'Loading tour...'}
    </div>
  );

  const rawImages = tour.images && Array.isArray(tour.images) ? tour.images :
    tour.images_json ? (() => { try { return JSON.parse(tour.images_json); } catch { return []; } })() : [];
  const images = rawImages.map(img => getImageUrl(img)).filter(Boolean);
  const fallbackImage = tour.image_url ? getImageUrl(tour.image_url) : null;

  const priceUSD = Number(tour.price_usd);
  const willApplyDiscount = isLoggedIn && useDiscount;
  const effectiveBookings = willApplyDiscount ? completedBookings : 0;
  const { discounted, savings, discountPct } = calcDiscountedPrice(priceUSD, effectiveBookings);
  const discountedNPR = Math.round(discounted * USD_TO_NPR);
  const originalNPR = Math.round(priceUSD * USD_TO_NPR);
  const savingsNPR = Math.round(savings * USD_TO_NPR);
  const finalPriceNPR = willApplyDiscount ? discountedNPR : originalNPR;
  const bookingsToNext = nextLevel ? Math.max(0, nextLevel.minBookings - completedBookings) : 0;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=DM+Sans:wght@300;400;500;600&display=swap');
        .td-wrap { max-width: 1200px; margin: 0 auto; padding: 40px 24px 60px; font-family: 'DM Sans', sans-serif; }
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
        .td-price-block { margin-bottom: 20px; }
        .td-price-original { font-size: 15px; color: rgba(240,237,232,0.4); text-decoration: line-through; margin-bottom: 2px; }
        .td-price-discounted { font-size: 36px; font-weight: 700; color: #a8d96b; letter-spacing: -0.02em; line-height: 1; margin-bottom: 4px; }
        .td-price-no-discount { font-size: 36px; font-weight: 700; color: #f0ede8; letter-spacing: -0.02em; line-height: 1; margin-bottom: 4px; }
        .td-price-sub { font-size: 13px; color: rgba(240,237,232,0.4); margin-bottom: 10px; }
        .td-price-savings { display: inline-flex; align-items: center; gap: 6px; background: rgba(168,217,107,0.12); border: 1px solid rgba(168,217,107,0.25); color: #a8d96b; font-size: 12px; font-weight: 600; padding: 4px 12px; border-radius: 100px; }
        .td-loyalty-badge { display: flex; align-items: center; gap: 10px; background: rgba(168,217,107,0.06); border: 1px solid rgba(168,217,107,0.18); border-radius: 12px; padding: 10px 14px; margin-bottom: 16px; }
        .td-loyalty-icon-wrap { width: 36px; height: 36px; border-radius: 10px; background: rgba(168,217,107,0.15); border: 1px solid rgba(168,217,107,0.25); display: flex; align-items: center; justify-content: center; color: #c1e88d; flex-shrink: 0; }
        .td-loyalty-text { flex: 1; }
        .td-loyalty-level { font-size: 11px; font-weight: 700; color: #a8d96b; text-transform: uppercase; letter-spacing: 0.08em; }
        .td-loyalty-hint { font-size: 11px; color: rgba(240,237,232,0.4); margin-top: 2px; }
        .td-loyalty-guest { background: rgba(168,217,107,0.06); border: 1px solid rgba(168,217,107,0.18); border-radius: 12px; padding: 12px 14px; margin-bottom: 16px; font-size: 12px; color: rgba(240,237,232,0.7); line-height: 1.5; }
        .td-loyalty-guest strong { color: #c1e88d; }
        .td-next-level { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06); border-radius: 10px; padding: 10px 14px; margin-bottom: 16px; }
        .td-next-level-text { font-size: 11px; color: rgba(240,237,232,0.4); margin-bottom: 6px; }
        .td-next-level-bar { height: 4px; background: rgba(255,255,255,0.08); border-radius: 100px; overflow: hidden; }
        .td-next-level-fill { height: 100%; background: linear-gradient(90deg,#a8d96b,#c1e88d); border-radius: 100px; transition: width 0.6s ease; }
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
        .td-discount-toggle { display: flex; align-items: flex-start; gap: 10px; padding: 12px 14px; background: rgba(168,217,107,0.06); border: 1px solid rgba(168,217,107,0.18); border-radius: 10px; margin-bottom: 16px; cursor: pointer; transition: background 0.2s; }
        .td-discount-toggle:hover { background: rgba(168,217,107,0.1); }
        .td-discount-toggle input { width: 16px; height: 16px; accentColor: #a8d96b; margin-top: 2px; flex-shrink: 0; }
        .td-discount-toggle-text { flex: 1; }
        .td-discount-toggle-title { font-size: 13px; font-weight: 600; color: #f0ede8; margin-bottom: 2px; }
        .td-discount-toggle-desc { font-size: 11px; color: rgba(240,237,232,0.55); line-height: 1.4; }
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
        @media (max-width: 768px) { .td-main { grid-template-columns: 1fr; } .td-slider { height: 280px; } }
      `}</style>

      <div className="td-wrap">
        {/* Hero Slider */}
        <div style={{ position: 'relative' }}>
          <ImageSlider images={images} fallback={fallbackImage} />
          <div className="td-hero-body">
            <div className="td-tag">Tour Details</div>
            <h1 className="td-title">{tour.title}</h1>
            <div className="td-meta">
              {tour.destination && <span className="td-pill">{tour.destination}</span>}
              {tour.category && <span className="td-pill">{tour.category}</span>}
              {tour.duration_days && <span className="td-pill">{tour.duration_days} days</span>}
              {tour.rating && <span className="td-pill td-pill-green">&#9733; {Number(tour.rating).toFixed(1)}</span>}
            </div>
          </div>
        </div>

        {/* Main 2-column */}
        <div className="td-main">
          {/* Left Info */}
          <div className="td-card">
            <div className="td-price-block">
              {willApplyDiscount && discountPct > 0 ? (
                <>
                  <div className="td-price-original">NPR {new Intl.NumberFormat('en-NP').format(originalNPR)} per person</div>
                  <div className="td-price-discounted">NPR {new Intl.NumberFormat('en-NP').format(discountedNPR)}</div>
                  <div className="td-price-sub">per person after loyalty discount</div>
                  <div className="td-price-savings">You save NPR {new Intl.NumberFormat('en-NP').format(savingsNPR)} ({discountPct}% off)</div>
                </>
              ) : (
                <>
                  <div className="td-price-no-discount">NPR {new Intl.NumberFormat('en-NP').format(originalNPR)}</div>
                  <div className="td-price-sub">per person</div>
                </>
              )}
            </div>

            {isLoggedIn && loyaltyLoaded && (
              <div className="td-loyalty-badge">
                <div className="td-loyalty-icon-wrap">
                  <svg width="18" height="18" viewBox="0 0 16 16" fill="currentColor"><path d="M8 1l2 4.5 5 .5-3.5 3.5 1 5L8 12l-4.5 2.5 1-5L1 6l5-.5z"/></svg>
                </div>
                <div className="td-loyalty-text">
                  <div className="td-loyalty-level">{loyaltyLevel.name} - Level {loyaltyLevel.level} · {Math.round(loyaltyLevel.discount * 100)}% discount</div>
                  <div className="td-loyalty-hint">{completedBookings} paid booking{completedBookings !== 1 ? 's' : ''} completed</div>
                </div>
              </div>
            )}

            {!isLoggedIn && (
              <div className="td-loyalty-guest">
                <strong>Sign in to save 10-20% off</strong> on every tour with our travel rewards program.
              </div>
            )}

            {isLoggedIn && nextLevel && (
              <div className="td-next-level">
                <div className="td-next-level-text">
                  {bookingsToNext} more booking{bookingsToNext !== 1 ? 's' : ''} to reach{' '}
                  <strong style={{ color: nextLevel.color }}>{nextLevel.name} (Level {nextLevel.level})</strong>{' '}
                  - unlock {Math.round(nextLevel.discount * 100)}% off
                </div>
                <div className="td-next-level-bar">
                  <div className="td-next-level-fill" style={{ width: `${Math.min(100, (completedBookings / nextLevel.minBookings) * 100)}%` }} />
                </div>
              </div>
            )}

            <div className="td-divider" />
            <div className="td-info-row"><span className="td-info-label">Destination</span><span className="td-info-value">{tour.destination}</span></div>
            <div className="td-info-row"><span className="td-info-label">Category</span><span className="td-info-value">{tour.category}</span></div>
            <div className="td-info-row"><span className="td-info-label">Duration</span><span className="td-info-value">{tour.duration_days} days</span></div>
            <div className="td-info-row"><span className="td-info-label">Rating</span><span className="td-info-value">&#9733; {Number(tour.rating).toFixed(1)}</span></div>
            {tour.description && (<><div className="td-divider" /><p className="td-desc">{tour.description}</p></>)}
          </div>

          {/* Right Booking */}
          <div className="td-card">
            <div className="td-section-title">Book This Tour</div>
            <div style={{ fontSize: 13, color: 'rgba(240,237,232,0.4)', marginBottom: 20 }}>Add traveler details to proceed.</div>

            {travelers.map((t, i) => (
              <div key={i} className="td-traveler">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <div className="td-traveler-title">Traveler {i + 1}</div>
                  {i > 0 && <button className="td-remove-btn" onClick={() => setTravelers(prev => prev.filter((_, idx) => idx !== i))}>Remove</button>}
                </div>
                <div className="td-traveler-grid">
                  <div>
                    <div className="td-input-label">Name</div>
                    <input className={`td-input ${fieldErrors[i]?.name ? 'td-input-error' : ''}`} placeholder="Ram Sharma" value={t.name} onChange={e => setTraveler(i, 'name', e.target.value)} />
                    {fieldErrors[i]?.name && <div className="td-field-err">{fieldErrors[i].name}</div>}
                  </div>
                  <div>
                    <div className="td-input-label">Age</div>
                    <input className="td-input" placeholder="25" value={t.age} onChange={e => setTraveler(i, 'age', e.target.value.replace(/\D/g, '').slice(0, 2))} />
                    {fieldErrors[i]?.age && <div className="td-field-err">{fieldErrors[i].age}</div>}
                  </div>
                  <div>
                    <div className="td-input-label">Contact</div>
                    <input className={`td-input ${fieldErrors[i]?.contact ? 'td-input-error' : ''}`} placeholder="98XXXXXXXX" value={t.contact} maxLength={10} onChange={e => setTraveler(i, 'contact', e.target.value.replace(/\D/g, '').slice(0, 10))} />
                    {fieldErrors[i]?.contact && <div className="td-field-err">{fieldErrors[i].contact}</div>}
                  </div>
                </div>
              </div>
            ))}

            {travelers.length < 6 && (
              <button className="td-add-traveler" onClick={() => setTravelers(prev => [...prev, { name: '', age: '', contact: '' }])}>+ Add Traveler</button>
            )}

            {isLoggedIn && loyaltyLoaded && (
              <label className="td-discount-toggle">
                <input type="checkbox" checked={useDiscount} onChange={e => setUseDiscount(e.target.checked)} />
                <div className="td-discount-toggle-text">
                  <div className="td-discount-toggle-title">Apply {Math.round(loyaltyLevel.discount * 100)}% {loyaltyLevel.name} discount</div>
                  <div className="td-discount-toggle-desc">Your tier-based loyalty discount will be automatically applied at checkout</div>
                </div>
              </label>
            )}

            {bookingNotice && <div className="td-msg-ok">{bookingNotice}</div>}
            {msg.text && <div className={msg.type === 'ok' ? 'td-msg-ok' : 'td-msg-err'}>{msg.text}</div>}

            <button className="td-btn" onClick={bookNow} disabled={booking}>
              {booking ? 'Processing...' : `Book Now - NPR ${new Intl.NumberFormat('en-NP').format(finalPriceNPR * travelers.length)}`}
            </button>

            {wishlistToast && (
              <div className={`td-toast ${wishlistToastMsg.includes('Already') ? 'red' : 'green'}`}>{wishlistToastMsg}</div>
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

      {/* Floating Chat Button */}
      <ChatBox
        tourId={Number(id)}
        agencyName={tour.agency_business_name || tour.agency_name}
      />
    </>
  );
}