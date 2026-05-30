import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api/client";

function getUser() {
  try { return JSON.parse(localStorage.getItem('user') || 'null'); } catch { return null; }
}
const BACKEND = 'http://localhost/safe-journey-planner/backend-php/public';
const ICONS = {
  dashboard: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>,
  tours: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/><line x1="8" y1="2" x2="8" y2="18"/><line x1="16" y1="6" x2="16" y2="22"/></svg>,
  bookings: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg>,
  add: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>,
  messages: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>,
  loyalty: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
  profile: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  map: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/><line x1="8" y1="2" x2="8" y2="18"/><line x1="16" y1="6" x2="16" y2="22"/></svg>,
  check: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>,
  clock: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
  bag: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg>,
  close: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  img: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>,
  menu: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>,
  pin: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>,
  upload: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/><path d="M20.39 18.39A5 5 0 0018 9h-1.26A8 8 0 103 16.3"/></svg>,
  trash: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/></svg>,
  edit: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
  bell: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></svg>,
  home: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
  send: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>,
  msgIcon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>,
  info: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>,
};

const categories = ["Adventure", "Cultural", "Wildlife", "Trekking", "Pilgrimage", "Family", "Luxury", "General"];
const EMPTY_FORM = { title: "", destination: "", category: "Adventure", duration_days: 3, price_usd: 199, image_url: "", description: "", latitude: "", longitude: "" };

const LOYALTY_TIERS = [
  { level: 1, name: 'Explorer', minBookings: 0, discount: 10, color: '#a8d96b', bg: 'rgba(168,217,107,0.08)', border: 'rgba(168,217,107,0.25)', icon: '', benefits: [{ icon: '', title: '10% off all tours', desc: 'Automatic discount on every verified tour package' }, { icon: '', title: 'Email support', desc: 'Standard customer support for all bookings' }] },
  { level: 2, name: 'Adventurer', minBookings: 5, discount: 15, color: '#60c3f5', bg: 'rgba(96,195,245,0.08)', border: 'rgba(96,195,245,0.25)', icon: '', benefits: [{ icon: '', title: '15% off all tours', desc: 'Bigger discount on all verified tour packages' }, { icon: '', title: 'Free airport pickup', desc: 'Complimentary pickup service at Level 2' }, { icon: '', title: 'Priority booking', desc: 'Get early access to popular tours at Level 2' }] },
  { level: 3, name: 'Elite Traveler', minBookings: 10, discount: 20, color: '#f5c842', bg: 'rgba(245,200,66,0.08)', border: 'rgba(245,200,66,0.25)', icon: '', benefits: [{ icon: '', title: '20% off all tours', desc: 'Maximum discount on all verified tour packages' }, { icon: '', title: 'Dedicated concierge', desc: 'Personal travel concierge for Elite members' }, { icon: '', title: 'Free itinerary custom', desc: 'Fully customize your tour itinerary at Level 3' }] },
];

function LoyaltyTiersTab() {
  return (
    <>
      <style>{`
        .lt-wrap { max-width: 960px; }
        .lt-header { margin-bottom: 28px; }
        .lt-header-tag { font-size: 11px; font-weight: 600; letter-spacing: 0.14em; text-transform: uppercase; color: #a8d96b; margin-bottom: 8px; }
        .lt-header-title { font-family: 'Playfair Display', serif; font-size: 26px; font-weight: 700; color: #fff; margin-bottom: 8px; }
        .lt-header-desc { font-size: 14px; color: rgba(232,228,223,0.45); line-height: 1.6; max-width: 560px; }
        .lt-info-banner { display: flex; align-items: flex-start; gap: 12px; background: rgba(168,217,107,0.06); border: 1px solid rgba(168,217,107,0.18); border-radius: 14px; padding: 16px 20px; margin-bottom: 28px; }
        .lt-info-icon { color: #a8d96b; flex-shrink: 0; margin-top: 1px; }
        .lt-info-text { font-size: 13px; color: rgba(232,228,223,0.6); line-height: 1.6; }
        .lt-info-text strong { color: #a8d96b; }
        .lt-tiers { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 32px; }
        .lt-tier-card { border-radius: 20px; padding: 24px; display: flex; flex-direction: column; gap: 16px; position: relative; overflow: hidden; transition: transform 0.2s, box-shadow 0.2s; }
        .lt-tier-card:hover { transform: translateY(-4px); box-shadow: 0 20px 48px rgba(0,0,0,0.4); }
        .lt-tier-top { display: flex; align-items: center; justify-content: space-between; }
        .lt-tier-badge { display: inline-flex; align-items: center; gap: 6px; font-size: 11px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; padding: 4px 12px; border-radius: 100px; }
        .lt-tier-emoji { font-size: 22px; }
        .lt-tier-name { font-family: 'Playfair Display', serif; font-size: 20px; font-weight: 700; color: #fff; margin-bottom: 4px; }
        .lt-tier-req { font-size: 12px; color: rgba(232,228,223,0.4); }
        .lt-tier-discount { display: flex; align-items: baseline; gap: 4px; }
        .lt-tier-discount-num { font-family: 'Playfair Display', serif; font-size: 48px; font-weight: 700; line-height: 1; }
        .lt-tier-discount-pct { font-size: 18px; font-weight: 700; color: rgba(232,228,223,0.5); }
        .lt-tier-discount-label { font-size: 12px; color: rgba(232,228,223,0.4); margin-top: 4px; }
        .lt-tier-divider { height: 1px; background: rgba(255,255,255,0.07); }
        .lt-tier-benefits { display: flex; flex-direction: column; gap: 10px; }
        .lt-tier-benefit { display: flex; align-items: flex-start; gap: 10px; }
        .lt-tier-benefit-icon { font-size: 16px; flex-shrink: 0; margin-top: 1px; }
        .lt-tier-benefit-title { font-size: 13px; font-weight: 600; color: #fff; margin-bottom: 2px; }
        .lt-tier-benefit-desc { font-size: 11px; color: rgba(232,228,223,0.4); line-height: 1.4; }
        .lt-calc-section { background: #0d1210; border: 1px solid rgba(255,255,255,0.07); border-radius: 20px; padding: 24px; }
        .lt-calc-title { font-family: 'Playfair Display', serif; font-size: 18px; font-weight: 700; color: #fff; margin-bottom: 6px; }
        .lt-calc-desc { font-size: 13px; color: rgba(232,228,223,0.4); margin-bottom: 20px; }
        .lt-calc-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
        .lt-calc-col { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06); border-radius: 14px; padding: 16px; }
        .lt-calc-col-name { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 12px; }
        .lt-calc-row { display: flex; justify-content: space-between; align-items: center; font-size: 12px; color: rgba(232,228,223,0.45); padding: 5px 0; border-bottom: 1px solid rgba(255,255,255,0.04); }
        .lt-calc-row:last-child { border-bottom: none; }
        .lt-calc-row.highlight { color: #fff; font-weight: 600; font-size: 13px; }
        .lt-calc-row.profit { font-size: 14px; font-weight: 700; }
        .lt-calc-val { font-weight: 600; color: #e8e4df; }
        .lt-calc-val.strike { text-decoration: line-through; color: rgba(232,228,223,0.3); font-weight: 400; }
        @media (max-width: 880px) { .lt-tiers { grid-template-columns: 1fr; } .lt-calc-grid { grid-template-columns: 1fr; } }
      `}</style>
      <div className="lt-wrap">
        <div className="lt-header">
          <div className="lt-header-tag">✦ Customer Loyalty Program</div>
          <div className="lt-header-title">Loyalty Discount Tiers</div>
          <div className="lt-header-desc">Here are the discounts your customers automatically receive based on their loyalty level. Understanding these helps you price your tours smartly to protect your profit margin.</div>
        </div>
        <div className="lt-info-banner">
          <div className="lt-info-icon">{ICONS.info}</div>
          <div className="lt-info-text"><strong>Important for pricing:</strong> Customers receive automatic discounts based on how many bookings they have completed. When setting your tour price, factor in the maximum discount (20%) so your profit margin stays protected even for Elite Traveler customers.</div>
        </div>
        <div className="lt-tiers">
          {LOYALTY_TIERS.map(tier => (
            <div key={tier.level} className="lt-tier-card" style={{ background: tier.bg, border: `1px solid ${tier.border}` }}>
              <div style={{ position: 'absolute', top: -40, right: -40, width: 120, height: 120, borderRadius: '50%', background: tier.color, opacity: 0.08, pointerEvents: 'none' }} />
              <div className="lt-tier-top">
                <div className="lt-tier-badge" style={{ background: `${tier.color}20`, border: `1px solid ${tier.color}40`, color: tier.color }}>Level {tier.level}</div>
                <span className="lt-tier-emoji">{tier.icon}</span>
              </div>
              <div>
                <div className="lt-tier-name">{tier.name}</div>
                <div className="lt-tier-req">{tier.minBookings === 0 ? 'All customers start here' : `Unlocks after ${tier.minBookings} bookings`}</div>
              </div>
              <div>
                <div className="lt-tier-discount">
                  <span className="lt-tier-discount-num" style={{ color: tier.color }}>{tier.discount}</span>
                  <span className="lt-tier-discount-pct" style={{ color: tier.color }}>%</span>
                </div>
                <div className="lt-tier-discount-label">discount on all tours</div>
              </div>
              <div className="lt-tier-divider" />
              <div className="lt-tier-benefits">
                {tier.benefits.map((b, i) => (
                  <div key={i} className="lt-tier-benefit">
                    <span className="lt-tier-benefit-icon">{b.icon}</span>
                    <div><div className="lt-tier-benefit-title">{b.title}</div><div className="lt-tier-benefit-desc">{b.desc}</div></div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="lt-calc-section">
          <div className="lt-calc-title">Pricing Example — NPR 10,000 Tour</div>
          <div className="lt-calc-desc">See how your profit changes across loyalty levels for a tour priced at NPR 10,000 (with NPR 7,000 actual cost).</div>
          <div className="lt-calc-grid">
            {LOYALTY_TIERS.map(tier => {
              const price = 10000, cost = 7000;
              const customerPays = price * (1 - tier.discount / 100);
              const profit = customerPays - cost;
              return (
                <div key={tier.level} className="lt-calc-col" style={{ borderColor: tier.border }}>
                  <div className="lt-calc-col-name" style={{ color: tier.color }}>{tier.icon} {tier.name}</div>
                  <div className="lt-calc-row"><span>Tour price</span><span className="lt-calc-val strike">NPR {price.toLocaleString()}</span></div>
                  <div className="lt-calc-row"><span>Discount</span><span className="lt-calc-val" style={{ color: tier.color }}>−{tier.discount}%</span></div>
                  <div className="lt-calc-row highlight"><span>Customer pays</span><span className="lt-calc-val" style={{ color: tier.color }}>NPR {customerPays.toLocaleString()}</span></div>
                  <div className="lt-calc-row"><span>Your cost</span><span className="lt-calc-val" style={{ color: '#f87171' }}>−NPR {cost.toLocaleString()}</span></div>
                  <div className="lt-calc-row profit"><span style={{ color: profit > 0 ? '#a8d96b' : '#f87171' }}>Your profit</span><span className="lt-calc-val" style={{ color: profit > 0 ? '#a8d96b' : '#f87171' }}>NPR {profit.toLocaleString()}</span></div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}

function NotificationBell() {
  const [notifs, setNotifs] = useState([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropRef = useRef(null);
  const unread = notifs.filter(n => !n.is_read).length;

  async function fetchNotifs() {
    setLoading(true);
    try { const res = await api.get('/api/notifications'); setNotifs(res.data.items || []); } catch {}
    finally { setLoading(false); }
  }
  async function markRead(id) {
    try { await api.post(`/api/notifications/${id}/read`); setNotifs(prev => prev.map(n => n.id === id ? { ...n, is_read: 1 } : n)); } catch {}
  }
  async function markAllRead() {
    const ids = notifs.filter(n => !n.is_read).map(n => n.id);
    await Promise.all(ids.map(id => api.post(`/api/notifications/${id}/read`)));
    setNotifs(prev => prev.map(n => ({ ...n, is_read: 1 })));
  }
  useEffect(() => { fetchNotifs(); const iv = setInterval(fetchNotifs, 30000); return () => clearInterval(iv); }, []);
  useEffect(() => {
    function handler(e) { if (dropRef.current && !dropRef.current.contains(e.target)) setOpen(false); }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);
  function timeAgo(d) {
    const diff = Math.floor((Date.now() - new Date(d)) / 1000);
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff/60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff/3600)}h ago`;
    return `${Math.floor(diff/86400)}d ago`;
  }
  return (
    <div ref={dropRef} style={{position:'relative'}}>
      <button className="ag-bell-btn" onClick={() => { setOpen(v => !v); if (!open) fetchNotifs(); }}>
        {ICONS.bell}
        {unread > 0 && <span className="ag-bell-badge">{unread > 9 ? '9+' : unread}</span>}
      </button>
      {open && (
        <div className="ag-notif-drop">
          <div className="ag-notif-head">
            <span className="ag-notif-title">Notifications</span>
            {unread > 0 && <button className="ag-notif-markall" onClick={markAllRead}>Mark all read</button>}
          </div>
          <div className="ag-notif-list">
            {loading && notifs.length === 0 && <div className="ag-notif-empty">Loading...</div>}
            {!loading && notifs.length === 0 && <div className="ag-notif-empty"><span>No notifications yet</span></div>}
            {notifs.map(n => (
              <div key={n.id} className={`ag-notif-item ${!n.is_read ? 'unread' : ''}`} onClick={() => !n.is_read && markRead(n.id)}>
                <div className="ag-notif-body">
                  <div className="ag-notif-ntitle">{n.title}</div>
                  <div className="ag-notif-nbody">{n.body}</div>
                  <div className="ag-notif-time">{timeAgo(n.created_at)}</div>
                </div>
                {!n.is_read && <div className="ag-notif-dot" />}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function RejectModal({ booking, onClose, onConfirm }) {
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  async function submit() {
    setLoading(true);
    await onConfirm(booking.id, reason || 'Rejected by agency');
    setLoading(false);
  }
  return (
    <div className="ag-modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: '#0d1210', border: '1px solid rgba(248,113,113,0.2)', borderRadius: 18, padding: 28, width: '100%', maxWidth: 420 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 18, fontWeight: 700, color: '#fff' }}>Reject Booking?</div>
          <button className="ag-close-btn" onClick={onClose}>{ICONS.close}</button>
        </div>
        <div className="ag-field" style={{ marginBottom: 20 }}>
          <label>Reason (optional)</label>
          <textarea className="ag-input ag-textarea" style={{ minHeight: 80 }} placeholder="e.g. Tour full, dates unavailable..." value={reason} onChange={e => setReason(e.target.value)} />
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="ag-cancel-btn" onClick={onClose} style={{ flex: 1 }}>Cancel</button>
          <button onClick={submit} disabled={loading} style={{ flex: 1, background: loading ? 'rgba(248,113,113,0.4)' : '#ef4444', border: 'none', borderRadius: 100, padding: '10px 22px', color: '#fff', fontSize: 13, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', fontFamily: "'DM Sans', sans-serif" }}>
            {loading ? 'Rejecting...' : 'Reject Booking'}
          </button>
        </div>
      </div>
    </div>
  );
}

function EditModal({ tour, onClose, onSaved, setErr }) {
  const [form, setForm] = useState({
    title: tour.title || '', destination: tour.destination || '', category: tour.category || 'Adventure',
    duration_days: tour.duration_days || 3, price_usd: tour.price_usd || 199,
    image_url: tour.image_url || '', description: tour.description || '',
    latitude: tour.latitude || '', longitude: tour.longitude || '',
  });
  const [itinerary, setItinerary] = useState(() => {
    if (Array.isArray(tour.itinerary) && tour.itinerary.length > 0) return tour.itinerary;
    try { const p = JSON.parse(tour.itinerary_json || '[]'); return p.length > 0 ? p : [{ day: 1, title: '', details: '' }]; }
    catch { return [{ day: 1, title: '', details: '' }]; }
  });
  const [saving, setSaving] = useState(false);

  function updateItin(i, k, v) { setItinerary(prev => prev.map((d, idx) => idx === i ? { ...d, [k]: v } : d)); }
  function addDay() { setItinerary(prev => [...prev, { day: prev.length + 1, title: '', details: '' }]); }
  function removeDay(i) { setItinerary(prev => prev.filter((_, idx) => idx !== i).map((d, idx) => ({ ...d, day: idx + 1 }))); }

  async function save() {
    setSaving(true);
    try {
      await api.put(`/api/agency/tours/${tour.id}`, { ...form, duration_days: Number(form.duration_days), price_usd: Number(form.price_usd), latitude: form.latitude ? Number(form.latitude) : null, longitude: form.longitude ? Number(form.longitude) : null, itinerary });
      onSaved(); onClose();
    } catch (e) { setErr(e?.response?.data?.error || 'Update failed'); }
    finally { setSaving(false); }
  }

  return (
    <div className="ag-modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="ag-modal">
        <div className="ag-modal-head">
          <div><h2 className="ag-form-title">Edit Tour</h2><p className="ag-form-sub">Changes will go to admin for re-review</p></div>
          <button className="ag-close-btn" onClick={onClose}>{ICONS.close}</button>
        </div>
        <div className="ag-modal-body">
          <div className="ag-form-section">Basic Info</div>
          <div className="ag-form-row2">
            <div className="ag-field"><label>Tour Title</label><input className="ag-input" value={form.title} onChange={e => setForm(f => ({...f, title: e.target.value}))} /></div>
            <div className="ag-field"><label>Destination</label><input className="ag-input" value={form.destination} onChange={e => setForm(f => ({...f, destination: e.target.value}))} /></div>
          </div>
          <div className="ag-form-section">Details</div>
          <div className="ag-form-row3">
            <div className="ag-field"><label>Category</label><select className="ag-input" value={form.category} onChange={e => setForm(f => ({...f, category: e.target.value}))}>{categories.map(c => <option key={c}>{c}</option>)}</select></div>
            <div className="ag-field"><label>Duration (days)</label><input className="ag-input" type="number" min="1" value={form.duration_days} onChange={e => setForm(f => ({...f, duration_days: e.target.value}))} /></div>
            <div className="ag-field"><label>Price (USD)</label><input className="ag-input" type="number" min="0" step="0.01" value={form.price_usd} onChange={e => setForm(f => ({...f, price_usd: e.target.value}))} /></div>
          </div>
          <div className="ag-form-section">Location</div>
          <div className="ag-form-row2">
            <div className="ag-field"><label>Latitude</label><input className="ag-input" type="number" step="any" value={form.latitude} onChange={e => setForm(f => ({...f, latitude: e.target.value}))} placeholder="e.g. 27.9881" /></div>
            <div className="ag-field"><label>Longitude</label><input className="ag-input" type="number" step="any" value={form.longitude} onChange={e => setForm(f => ({...f, longitude: e.target.value}))} placeholder="e.g. 86.9250" /></div>
          </div>
          <div className="ag-form-section">Description</div>
          <div className="ag-field"><textarea className="ag-input ag-textarea" value={form.description} onChange={e => setForm(f => ({...f, description: e.target.value}))} placeholder="Describe your tour..." /></div>
          <div className="ag-form-section">Day-wise Itinerary</div>
          <div style={{display:'flex', flexDirection:'column', gap:10}}>
            {itinerary.map((day, i) => (
              <div key={i} className="ag-itin-row">
                <div className="ag-itin-day-badge">Day {day.day}</div>
                <div style={{flex:1, display:'flex', flexDirection:'column', gap:6}}>
                  <input className="ag-input" placeholder={`Day ${day.day} title`} value={day.title} onChange={e => updateItin(i, 'title', e.target.value)} />
                  <textarea className="ag-input" style={{minHeight:60, resize:'vertical'}} placeholder="Details..." value={day.details} onChange={e => updateItin(i, 'details', e.target.value)} />
                </div>
                {itinerary.length > 1 && <button className="ag-itin-remove" onClick={() => removeDay(i)}>{ICONS.trash}</button>}
              </div>
            ))}
            <button className="ag-itin-add" onClick={addDay}>+ Add Day</button>
          </div>
        </div>
        <div className="ag-modal-footer">
          <button className="ag-cancel-btn" onClick={onClose}>Cancel</button>
          <button className="ag-submit-btn" onClick={save} disabled={saving}>{saving ? 'Saving...' : 'Save Changes'}</button>
        </div>
      </div>
    </div>
  );
}

function MessagesTab() {
  const [threads, setThreads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeThread, setActiveThread] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [msgLoading, setMsgLoading] = useState(false);
  const bottomRef = useRef(null);

  async function loadThreads() {
    try { const res = await api.get('/api/messages/threads'); setThreads(res.data.threads || []); } catch {}
    finally { setLoading(false); }
  }
  async function loadMessages(thread) {
    setMsgLoading(true);
    try { const res = await api.get(`/api/messages?tour_id=${thread.tour_id}&customer_id=${thread.customer_id}`); setMessages(res.data.messages || []); } catch {}
    finally { setMsgLoading(false); }
  }
  useEffect(() => { loadThreads(); const iv = setInterval(loadThreads, 10000); return () => clearInterval(iv); }, []);
  useEffect(() => { if (activeThread) { loadMessages(activeThread); const iv = setInterval(() => loadMessages(activeThread), 5000); return () => clearInterval(iv); } }, [activeThread]);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  async function send() {
    if (!input.trim() || sending || !activeThread) return;
    setSending(true);
    try {
      await api.post('/api/messages', { tour_id: activeThread.tour_id, receiver_id: activeThread.customer_id, message: input.trim() });
      setInput(''); await loadMessages(activeThread); await loadThreads();
    } catch {} finally { setSending(false); }
  }
  function timeAgo(d) {
    const diff = Math.floor((Date.now() - new Date(d)) / 1000);
    if (diff < 60) return 'Just now'; if (diff < 3600) return `${Math.floor(diff/60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff/3600)}h ago`; return new Date(d).toLocaleDateString();
  }

  return (
    <>
      <style>{`
        .msg-wrap{display:grid;grid-template-columns:280px 1fr;height:calc(100vh - 150px);border-radius:20px;overflow:hidden;border:1px solid rgba(168,217,107,0.1);background:#0d1210;}
        .msg-threads{display:flex;flex-direction:column;border-right:1px solid rgba(255,255,255,0.06);overflow:hidden;}
        .msg-threads-head{padding:20px 18px 14px;border-bottom:1px solid rgba(255,255,255,0.06);flex-shrink:0;background:linear-gradient(135deg,#111a10,#0d1210);}
        .msg-threads-title{font-family:'Playfair Display',serif;font-size:16px;font-weight:700;color:#fff;margin-bottom:3px;}
        .msg-threads-sub{font-size:11px;color:rgba(240,237,232,0.3);}
        .msg-threads-list{flex:1;overflow-y:auto;scrollbar-width:thin;scrollbar-color:rgba(168,217,107,0.1) transparent;}
        .msg-threads-list::-webkit-scrollbar{width:3px;} .msg-threads-list::-webkit-scrollbar-thumb{background:rgba(168,217,107,0.1);border-radius:10px;}
        .msg-thread-item{display:flex;align-items:center;gap:11px;padding:13px 16px;cursor:pointer;border-bottom:1px solid rgba(255,255,255,0.04);transition:background 0.15s;position:relative;}
        .msg-thread-item:hover{background:rgba(255,255,255,0.03);} .msg-thread-item.active{background:rgba(168,217,107,0.07);border-left:3px solid #a8d96b;padding-left:13px;}
        .msg-thread-avatar{width:40px;height:40px;border-radius:50%;background:linear-gradient(135deg,#a8d96b,#5fa832);display:flex;align-items:center;justify-content:center;font-size:15px;font-weight:700;color:#0f1410;flex-shrink:0;}
        .msg-thread-info{flex:1;min-width:0;} .msg-thread-name{font-size:13px;font-weight:700;color:#fff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-bottom:2px;}
        .msg-thread-tour{font-size:11px;color:rgba(240,237,232,0.35);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-bottom:2px;}
        .msg-thread-preview{font-size:11px;color:rgba(240,237,232,0.22);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
        .msg-thread-badge{background:#a8d96b;color:#0f1410;font-size:10px;font-weight:800;min-width:18px;height:18px;border-radius:100px;display:flex;align-items:center;justify-content:center;padding:0 5px;flex-shrink:0;}
        .msg-threads-empty{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;padding:40px 20px;color:rgba(240,237,232,0.25);font-size:13px;text-align:center;flex:1;}
        .msg-chat{display:flex;flex-direction:column;overflow:hidden;background:#0a0e0d;}
        .msg-chat-empty{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;color:rgba(240,237,232,0.25);font-size:13px;text-align:center;padding:20px;}
        .msg-chat-head{display:flex;align-items:center;gap:12px;padding:15px 20px;border-bottom:1px solid rgba(255,255,255,0.06);background:#0d1210;flex-shrink:0;}
        .msg-chat-avatar{width:38px;height:38px;border-radius:50%;background:linear-gradient(135deg,#a8d96b,#5fa832);display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:700;color:#0f1410;flex-shrink:0;}
        .msg-chat-name{font-size:14px;font-weight:700;color:#fff;} .msg-chat-tour{font-size:11px;color:rgba(240,237,232,0.35);margin-top:2px;}
        .msg-messages{flex:1;overflow-y:auto;padding:16px 20px;display:flex;flex-direction:column;gap:10px;scrollbar-width:thin;scrollbar-color:rgba(255,255,255,0.06) transparent;}
        .msg-messages::-webkit-scrollbar{width:3px;} .msg-messages::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.06);border-radius:10px;}
        .msg-bubble-wrap{display:flex;flex-direction:column;gap:3px;} .msg-bubble-wrap.me{align-items:flex-end;} .msg-bubble-wrap.them{align-items:flex-start;}
        .msg-bubble{max-width:72%;padding:10px 14px;border-radius:16px;font-size:13.5px;line-height:1.5;color:#f0ede8;word-break:break-word;}
        .msg-bubble.me{background:rgba(168,217,107,0.16);border:1px solid rgba(168,217,107,0.25);border-bottom-right-radius:4px;}
        .msg-bubble.them{background:rgba(255,255,255,0.07);border:1px solid rgba(255,255,255,0.1);border-bottom-left-radius:4px;}
        .msg-time{font-size:10px;color:rgba(240,237,232,0.22);padding:0 4px;}
        .msg-input-wrap{padding:14px 18px;border-top:1px solid rgba(255,255,255,0.06);display:flex;gap:10px;flex-shrink:0;background:#0d1210;}
        .msg-input{flex:1;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.09);border-radius:12px;padding:11px 15px;color:#f0ede8;font-family:'DM Sans',sans-serif;font-size:13.5px;outline:none;transition:border-color 0.2s;}
        .msg-input:focus{border-color:rgba(168,217,107,0.4);} .msg-input::placeholder{color:rgba(240,237,232,0.18);}
        .msg-send-btn{width:42px;height:42px;border-radius:12px;background:#a8d96b;border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;color:#0f1410;transition:all 0.2s;flex-shrink:0;}
        .msg-send-btn:hover:not(:disabled){background:#c1e88d;transform:scale(1.05);} .msg-send-btn:disabled{opacity:0.4;cursor:not-allowed;}
        @media(max-width:768px){.msg-wrap{grid-template-columns:1fr;height:auto;}}
      `}</style>
      <div className="msg-wrap">
        <div className="msg-threads">
          <div className="msg-threads-head">
            <div className="msg-threads-title">Messages</div>
            <div className="msg-threads-sub">{threads.length} conversation{threads.length !== 1 ? 's' : ''}</div>
          </div>
          <div className="msg-threads-list">
            {loading && <div className="msg-threads-empty"><div>Loading...</div></div>}
            {!loading && threads.length === 0 && <div className="msg-threads-empty"><div style={{color:'rgba(168,217,107,0.3)'}}>{ICONS.msgIcon}</div><div style={{fontWeight:600,color:'rgba(240,237,232,0.4)'}}>No messages yet</div><div>Customers will message you here</div></div>}
            {threads.map(t => (
              <div key={`${t.tour_id}-${t.customer_id}`} className={`msg-thread-item ${activeThread?.tour_id === t.tour_id && activeThread?.customer_id === t.customer_id ? 'active' : ''}`} onClick={() => setActiveThread(t)}>
                <div className="msg-thread-avatar">{(t.customer_name || 'C')[0].toUpperCase()}</div>
                <div className="msg-thread-info">
                  <div className="msg-thread-name">{t.customer_name}</div>
                  <div className="msg-thread-tour">{t.tour_title}</div>
                  <div className="msg-thread-preview">{t.last_message}</div>
                </div>
                {t.unread_count > 0 && <div className="msg-thread-badge">{t.unread_count}</div>}
              </div>
            ))}
          </div>
        </div>
        <div className="msg-chat">
          {!activeThread ? (
            <div className="msg-chat-empty">
              <div style={{color:'rgba(168,217,107,0.2)'}}>{ICONS.msgIcon}</div>
              <div style={{fontSize:15,fontWeight:700,color:'rgba(240,237,232,0.4)'}}>Select a conversation</div>
              <div>Pick a customer from the left to reply</div>
            </div>
          ) : (
            <>
              <div className="msg-chat-head">
                <div className="msg-chat-avatar">{(activeThread.customer_name || 'C')[0].toUpperCase()}</div>
                <div><div className="msg-chat-name">{activeThread.customer_name}</div><div className="msg-chat-tour">{activeThread.tour_title} · {activeThread.destination}</div></div>
              </div>
              <div className="msg-messages">
                {msgLoading && messages.length === 0 && <div style={{textAlign:'center',color:'rgba(240,237,232,0.3)',fontSize:13,paddingTop:30}}>Loading messages...</div>}
                {!msgLoading && messages.length === 0 && <div style={{textAlign:'center',color:'rgba(240,237,232,0.25)',fontSize:13,paddingTop:40}}>No messages yet. Say hello!</div>}
                {messages.map(m => { const isMe = m.sender_role === 'agency'; return (
                  <div key={m.id} className={`msg-bubble-wrap ${isMe ? 'me' : 'them'}`}>
                    <div className={`msg-bubble ${isMe ? 'me' : 'them'}`}>{m.message}</div>
                    <div className="msg-time">{isMe ? 'You' : m.sender_name} · {timeAgo(m.created_at)}</div>
                  </div>
                ); })}
                <div ref={bottomRef} />
              </div>
              <div className="msg-input-wrap">
                <input className="msg-input" value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()} placeholder={`Reply to ${activeThread.customer_name}...`} />
                <button className="msg-send-btn" onClick={send} disabled={sending || !input.trim()}>{ICONS.send}</button>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}

export default function Agency() {
  const nav = useNavigate();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [myTours, setMyTours] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);
  const [editingTour, setEditingTour] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [rejectModal, setRejectModal] = useState({ open: false, booking: null });
  const [unreadMessages, setUnreadMessages] = useState(0);

  const user = getUser();
  const [form, setForm] = useState(EMPTY_FORM);
  const [itinerary, setItinerary] = useState([{ day: 1, title: '', details: '' }]);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  function updateItin(i, k, v) { setItinerary(prev => prev.map((d, idx) => idx === i ? { ...d, [k]: v } : d)); }
  function addItinDay() { setItinerary(prev => [...prev, { day: prev.length + 1, title: '', details: '' }]); }
  function removeItinDay(i) { setItinerary(prev => prev.filter((_, idx) => idx !== i).map((d, idx) => ({ ...d, day: idx + 1 }))); }

  async function load() {
    setErr("");
    try {
      const [mine, b] = await Promise.allSettled([api.get("/api/agency/tours"), api.get("/api/agency/bookings")]);
      if (mine.status === 'rejected' || b.status === 'rejected') {
        const status = mine.reason?.response?.status || b.reason?.response?.status || 0;
        if (status === 401 || status === 403) { localStorage.removeItem('sjp_token'); localStorage.removeItem('user'); nav('/agency-login'); return; }
        setErr(mine.reason?.response?.data?.error || b.reason?.response?.data?.error || 'Failed to load');
      }
      setMyTours(mine.status === 'fulfilled' ? (mine.value.data.items || []) : []);
      setBookings(b.status === 'fulfilled' ? (b.value.data.items || []) : []);
    } catch (ex) { setErr(ex?.response?.data?.error || "Failed to load data"); }
    finally { setLoading(false); }
  }

  async function loadUnread() {
    try { const res = await api.get('/api/messages/unread'); setUnreadMessages(res.data.count || 0); } catch {}
  }

  useEffect(() => {
    const token = localStorage.getItem('sjp_token');
    const u = getUser();
    if (!token || !u) { nav('/agency-login'); return; }
    if (u.role !== 'agency') { nav('/dashboard'); return; }
    load(); loadUnread();
    const iv = setInterval(loadUnread, 15000);
    return () => clearInterval(iv);
  }, []);

  async function deleteTour(id) {
    if (!window.confirm('Are you sure you want to delete this tour?')) return;
    setActionLoading(id + '-delete');
    try { await api.delete(`/api/agency/tours/${id}`); setSuccessMsg("Tour deleted successfully."); setTimeout(() => setSuccessMsg(""), 4000); await load(); }
    catch (e) { setErr(e?.response?.data?.error || "Failed to delete tour"); }
    finally { setActionLoading(null); }
  }

  async function confirmBooking(id) {
    setActionLoading(id + '-confirm');
    try { await api.post(`/api/agency/bookings/${id}/confirm`); setSuccessMsg("Booking confirmed!"); setTimeout(() => setSuccessMsg(""), 4000); await load(); }
    catch (e) { setErr(e?.response?.data?.error || "Failed to confirm"); }
    finally { setActionLoading(null); }
  }

  function rejectBooking(booking) { setRejectModal({ open: true, booking }); }

  async function confirmReject(id, reason) {
    setRejectModal({ open: false, booking: null }); setActionLoading(id + '-reject');
    try { await api.post(`/api/agency/bookings/${id}/reject`, { reason }); setSuccessMsg("Booking rejected."); setTimeout(() => setSuccessMsg(""), 4000); await load(); }
    catch (e) { setErr(e?.response?.data?.error || "Failed to reject"); }
    finally { setActionLoading(null); }
  }

  function handleFileSelect(e) {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    if (selectedFiles.length + files.length > 5) { setErr("Maximum 5 images!"); return; }
    setSelectedFiles(prev => [...prev, ...files]);
    files.forEach(file => { const reader = new FileReader(); reader.onload = (ev) => setPreviews(prev => [...prev, { url: ev.target.result, name: file.name }]); reader.readAsDataURL(file); });
  }

  function removeImage(index) { setSelectedFiles(prev => prev.filter((_, i) => i !== index)); setPreviews(prev => prev.filter((_, i) => i !== index)); }

  async function uploadImages() {
    if (!selectedFiles.length) return [];
    setUploading(true); setErr('');
    try {
      const formData = new FormData();
      selectedFiles.forEach(file => formData.append('images[]', file));
      const res = await api.post('/api/upload/images', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      if (!res.data.urls || res.data.urls.length === 0) { setErr('Upload failed.'); return []; }
      return res.data.urls;
    } catch (ex) { setErr(ex?.response?.data?.error || 'Image upload failed.'); return []; }
    finally { setUploading(false); }
  }

  async function createTour(e) {
    e.preventDefault(); setErr(""); setSubmitting(true);
    try {
      let imageUrl = form.image_url; let imagesJson = null;
      if (selectedFiles.length > 0) {
        const urls = await uploadImages();
        if (!urls || urls.length === 0) { setSubmitting(false); return; }
        imageUrl = urls[0]; imagesJson = JSON.stringify(urls);
      }
      if (!imageUrl) { setErr("Please upload an image or provide an image URL."); setSubmitting(false); return; }
      await api.post("/api/agency/tours", { ...form, image_url: imageUrl, images_json: imagesJson, itinerary, latitude: form.latitude ? Number(form.latitude) : null, longitude: form.longitude ? Number(form.longitude) : null });
      setForm(EMPTY_FORM); setSelectedFiles([]); setPreviews([]);
      setItinerary([{ day: 1, title: '', details: '' }]);
      setSuccessMsg("Tour submitted for admin review!"); setTimeout(() => setSuccessMsg(""), 4000);
      setActiveTab('tours'); await load();
    } catch (ex) { setErr(ex?.response?.data?.error || "Failed to create tour"); }
    finally { setSubmitting(false); }
  }

  const approvedCount   = myTours.filter(t => t.approval_status === 'approved').length;
  const pendingCount    = myTours.filter(t => t.approval_status === 'pending').length;
  const rejectedCount   = myTours.filter(t => t.approval_status === 'rejected').length;
  const pendingBookings = bookings.filter(b => b.status === 'pending').length;
  const filteredTours   = filterStatus === 'all' ? myTours : myTours.filter(t => t.approval_status === filterStatus);

  function statusColor(s) { if (s === 'approved') return '#a8d96b'; if (s === 'pending') return '#f59e0b'; if (s === 'rejected') return '#f87171'; return '#94a3b8'; }
  function bColor(s) { if (s === 'confirmed') return '#a8d96b'; if (s === 'pending') return '#f59e0b'; if (s === 'cancelled') return '#f87171'; if (s === 'paid') return '#60a5fa'; return '#94a3b8'; }

  function logout() { localStorage.removeItem('sjp_token'); localStorage.removeItem('user'); window.location.href = '/agency-login'; }

  if (user && user.verification_status && user.verification_status !== 'verified') {
    return (<><style>{styles}</style><div className="ag-verify-wrap"><div className="ag-verify-card"><div className="ag-verify-icon">{ICONS.clock}</div><h2>Pending Verification</h2><p>Your agency account is <b>{user.verification_status}</b>. Dashboard unlocks after admin approval.</p></div></div></>);
  }

  const agencyName = user?.full_name || user?.name || 'Agency';
  const initials = agencyName.slice(0, 2).toUpperCase();

  const navItems = [
    { id: 'dashboard', label: 'Dashboard',    icon: ICONS.dashboard },
    { id: 'profile',   label: 'My Profile',   icon: ICONS.profile },
    { id: 'tours',     label: 'My Tours',     icon: ICONS.tours },
    { id: 'bookings',  label: 'Bookings',     icon: ICONS.bookings },
    { id: 'messages',  label: 'Messages',     icon: ICONS.messages },
    { id: 'loyalty',   label: 'Loyalty Tiers',icon: ICONS.loyalty },
    { id: 'add',       label: 'Add Tour',     icon: ICONS.add },
  ];

  const pageTitles = { dashboard: 'Dashboard', profile: 'My Profile', tours: 'My Tours', bookings: 'Bookings', messages: 'Messages', loyalty: 'Loyalty Tiers', add: 'Add Tour' };

  return (
    <>
      <style>{styles}</style>

      {rejectModal.open && <RejectModal booking={rejectModal.booking} onClose={() => setRejectModal({ open: false, booking: null })} onConfirm={confirmReject} />}
      {editingTour && <EditModal tour={editingTour} onClose={() => setEditingTour(null)} onSaved={() => { setSuccessMsg("Tour updated!"); setTimeout(() => setSuccessMsg(""), 4000); load(); }} setErr={setErr} />}

      <div className="ag-root">
        <aside className={`ag-sidebar ${sidebarOpen ? 'open' : ''}`}>
          <div className="ag-sidebar-logo">
            <div className="ag-logo-icon">{ICONS.pin}</div>
            <div>
              <div className="ag-logo-name">Safe Journey</div>
              <div className="ag-logo-sub">Agency Portal</div>
            </div>
          </div>
          <nav className="ag-nav">
            <div className="ag-nav-label">MENU</div>
            {navItems.map(item => (
              <button key={item.id} className={`ag-nav-item ${activeTab === item.id ? 'active' : ''}`}
                onClick={() => { setActiveTab(item.id); setSidebarOpen(false); if (item.id === 'messages') setUnreadMessages(0); }}>
                <span className="ag-nav-icon">{item.icon}</span>
                <span>{item.label}</span>
                {item.id === 'bookings' && pendingBookings > 0 && <span className="ag-nav-badge">{pendingBookings}</span>}
                {item.id === 'messages' && unreadMessages > 0 && <span className="ag-nav-badge" style={{background:'#60a5fa'}}>{unreadMessages}</span>}
                {item.id === 'loyalty' && <span className="ag-nav-badge" style={{background:'rgba(168,217,107,0.2)',color:'#a8d96b',border:'1px solid rgba(168,217,107,0.3)'}}>3</span>}
              </button>
            ))}
          </nav>
          <div className="ag-sidebar-footer">
            <div className="ag-sidebar-user">
              <div className="ag-avatar-sm">{initials}</div>
              <div style={{minWidth:0}}>
                <div className="ag-sidebar-uname">{agencyName}</div>
                <div className="ag-sidebar-urole">Agency</div>
              </div>
            </div>
            <button className="ag-logout-btn" onClick={logout}>Log out</button>
          </div>
        </aside>

        {sidebarOpen && <div className="ag-overlay" onClick={() => setSidebarOpen(false)} />}

        <main className="ag-main">
          <div className="ag-topbar">
            <div className="ag-topbar-left">
              <button className="ag-hamburger" onClick={() => setSidebarOpen(v => !v)}>{ICONS.menu}</button>
              <div>
                <h1 className="ag-page-title">{pageTitles[activeTab] || 'Dashboard'}</h1>
                <p className="ag-page-sub">Welcome back, <b style={{color:'#a8d96b'}}>{agencyName}</b></p>
              </div>
            </div>
            <div className="ag-topbar-right">
              {activeTab !== 'add' && <button className="ag-add-btn" onClick={() => setActiveTab('add')}>{ICONS.add} <span>Add Tour</span></button>}
              <NotificationBell />
              <div className="ag-avatar" style={{cursor:'pointer'}} onClick={() => setActiveTab('profile')}>{initials}</div>
            </div>
          </div>

          {err && <div className="ag-alert ag-alert-err">{err}</div>}
          {successMsg && <div className="ag-alert ag-alert-ok">✓ {successMsg}</div>}

          {/* DASHBOARD */}
          {activeTab === 'dashboard' && (
            <div className="ag-content">
              <div className="ag-stats">
                {[
                  { num: myTours.length,  label: 'Total Tours',   icon: ICONS.map,   color: '#a8d96b' },
                  { num: approvedCount,   label: 'Approved',       icon: ICONS.check, color: '#a8d96b' },
                  { num: pendingCount,    label: 'Pending Review', icon: ICONS.clock, color: '#f59e0b' },
                  { num: bookings.length, label: 'Bookings',       icon: ICONS.bag,   color: '#60a5fa' },
                ].map((s, i) => (
                  <div className="ag-stat-card" key={i} style={{'--accent': s.color}}>
                    <div className="ag-stat-icon-wrap">{s.icon}</div>
                    <div className="ag-stat-num">{loading ? '—' : s.num}</div>
                    <div className="ag-stat-label">{s.label}</div>
                    <div className="ag-stat-bar" />
                  </div>
                ))}
              </div>
              <div className="ag-two-col">
                <div className="ag-card">
                  <div className="ag-card-head"><span className="ag-card-title">Recent Tours</span><button className="ag-viewall" onClick={() => setActiveTab('tours')}>View all</button></div>
                  {loading ? <div className="ag-skeleton" /> : myTours.length === 0 ? (
                    <div className="ag-empty-sm">No tours yet. <button className="ag-link" onClick={() => setActiveTab('add')}>Add your first</button></div>
                  ) : myTours.slice(0, 5).map(t => (
                    <div key={t.id} className="ag-mini-row">
                      <div className="ag-mini-dot" style={{ background: statusColor(t.approval_status) }} />
                      <div className="ag-mini-info"><span className="ag-mini-name">{t.title}</span><span className="ag-mini-meta">{t.destination} · {t.duration_days}d</span></div>
                      <span className="ag-mini-badge" style={{ background: statusColor(t.approval_status)+'22', color: statusColor(t.approval_status) }}>{t.approval_status}</span>
                    </div>
                  ))}
                </div>
                <div className="ag-card">
                  <div className="ag-card-head"><span className="ag-card-title">Recent Bookings</span><button className="ag-viewall" onClick={() => setActiveTab('bookings')}>View all</button></div>
                  {loading ? <div className="ag-skeleton" /> : bookings.length === 0 ? (
                    <div className="ag-empty-sm">No bookings yet.</div>
                  ) : bookings.slice(0, 5).map(b => (
                    <div key={b.id} className="ag-mini-row">
                      <div className="ag-mini-avatar">{(b.customer_name || 'C')[0].toUpperCase()}</div>
                      <div className="ag-mini-info"><span className="ag-mini-name">{b.customer_name}</span><span className="ag-mini-meta">{b.title}</span></div>
                      <span className="ag-mini-badge" style={{background: bColor(b.status)+'22', color: bColor(b.status)}}>{b.status}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* PROFILE */}
          {activeTab === 'profile' && (
            <div className="ag-content">
              <div style={{ maxWidth: 680 }}>

                {/* Profile Header */}
                <div style={{ background: 'linear-gradient(135deg, #111a10, #0d1210)', border: '1px solid rgba(168,217,107,0.15)', borderRadius: 22, padding: 28, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 22 }}>
                  <div style={{ width: 80, height: 80, borderRadius: 20, background: 'linear-gradient(135deg, #a8d96b, #5fa832)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, fontWeight: 700, color: '#0a0e0d', flexShrink: 0, boxShadow: '0 0 0 4px rgba(168,217,107,0.15)' }}>
                    {initials}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, fontWeight: 700, color: '#fff', marginBottom: 4 }}>{agencyName}</div>
                    <div style={{ fontSize: 13, color: 'rgba(232,228,223,0.4)', marginBottom: 10 }}>{user?.email || ''}</div>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 11, fontWeight: 700, background: 'rgba(168,217,107,0.12)', border: '1px solid rgba(168,217,107,0.25)', color: '#a8d96b', padding: '4px 12px', borderRadius: 100, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Agency</span>
                      <span style={{ fontSize: 11, fontWeight: 700, background: 'rgba(96,195,245,0.1)', border: '1px solid rgba(96,195,245,0.2)', color: '#60c3f5', padding: '4px 12px', borderRadius: 100, textTransform: 'uppercase', letterSpacing: '0.06em' }}>✓ Verified</span>
                    </div>
                  </div>
                </div>

                {/* Stats */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 16 }}>
                  {[
                    { label: 'Total Tours',    value: myTours.length,  color: '#a8d96b' },
                    { label: 'Approved Tours', value: approvedCount,   color: '#34d399' },
                    { label: 'Total Bookings', value: bookings.length, color: '#60c3f5' },
                  ].map(s => (
                    <div key={s.label} style={{ background: '#0d1210', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 14, padding: '16px 18px', textAlign: 'center' }}>
                      <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 28, fontWeight: 700, color: s.color, lineHeight: 1, marginBottom: 6 }}>{s.value}</div>
                      <div style={{ fontSize: 11, color: 'rgba(232,228,223,0.35)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{s.label}</div>
                    </div>
                  ))}
                </div>

                {/* Account Info */}
                <div style={{ background: '#0d1210', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 18, padding: 24, marginBottom: 16 }}>
                  <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(168,217,107,0.5)', borderBottom: '1px solid rgba(168,217,107,0.1)', paddingBottom: 8, marginBottom: 18 }}>Account Information</div>
                  {[
                    { label: 'Full Name',       value: agencyName },
                    { label: 'Email',           value: user?.email || '—' },
                    { label: 'Role',            value: 'Agency Partner' },
                    { label: 'Account Status',  value: 'Verified', highlight: true },
                    { label: 'Tours Listed',    value: `${myTours.length} tour${myTours.length !== 1 ? 's' : ''}` },
                    { label: 'Pending Bookings',value: `${pendingBookings} awaiting action`, highlight: pendingBookings > 0 },
                  ].map(row => (
                    <div key={row.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                      <span style={{ fontSize: 13, color: 'rgba(232,228,223,0.4)' }}>{row.label}</span>
                      <span style={{ fontSize: 13, fontWeight: 600, color: row.highlight ? '#a8d96b' : '#fff' }}>{row.value}</span>
                    </div>
                  ))}
                </div>

                {/* Quick Actions */}
                <div style={{ background: '#0d1210', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 18, padding: 24, marginBottom: 16 }}>
                  <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(168,217,107,0.5)', borderBottom: '1px solid rgba(168,217,107,0.1)', paddingBottom: 8, marginBottom: 18 }}>Quick Actions</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {[
                      { icon: ICONS.add, label: 'Add New Tour', desc: 'Submit a new tour package for review', tab: 'add', color: '#a8d96b', bg: 'rgba(168,217,107,0.06)', border: 'rgba(168,217,107,0.15)', hoverBg: 'rgba(168,217,107,0.1)' },
                      { icon: ICONS.bookings, label: 'View Bookings', desc: pendingBookings > 0 ? `${pendingBookings} booking${pendingBookings > 1 ? 's' : ''} awaiting your action` : 'Manage all customer bookings', tab: 'bookings', color: '#60c3f5', bg: 'rgba(96,195,245,0.05)', border: 'rgba(96,195,245,0.12)', hoverBg: 'rgba(96,195,245,0.1)' },
                      { icon: ICONS.messages, label: 'Messages', desc: unreadMessages > 0 ? `${unreadMessages} unread message${unreadMessages > 1 ? 's' : ''}` : 'Chat with your customers', tab: 'messages', color: '#f59e0b', bg: 'rgba(245,158,11,0.05)', border: 'rgba(245,158,11,0.12)', hoverBg: 'rgba(245,158,11,0.1)' },
                    ].map(action => (
                      <button key={action.tab} onClick={() => setActiveTab(action.tab)}
                        style={{ display: 'flex', alignItems: 'center', gap: 12, background: action.bg, border: `1px solid ${action.border}`, borderRadius: 12, padding: '14px 16px', cursor: 'pointer', textAlign: 'left', width: '100%', fontFamily: "'DM Sans', sans-serif", transition: 'background 0.2s' }}
                        onMouseEnter={e => e.currentTarget.style.background = action.hoverBg}
                        onMouseLeave={e => e.currentTarget.style.background = action.bg}>
                        <span style={{ color: action.color }}>{action.icon}</span>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>{action.label}</div>
                          <div style={{ fontSize: 11, color: 'rgba(232,228,223,0.35)' }}>{action.desc}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Danger Zone */}
                <div style={{ background: 'rgba(248,113,113,0.04)', border: '1px solid rgba(248,113,113,0.12)', borderRadius: 18, padding: 24 }}>
                  <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(248,113,113,0.5)', borderBottom: '1px solid rgba(248,113,113,0.1)', paddingBottom: 8, marginBottom: 16 }}>Account</div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#fff', marginBottom: 3 }}>Log out of your account</div>
                      <div style={{ fontSize: 12, color: 'rgba(232,228,223,0.35)' }}>You will be redirected to the agency login page</div>
                    </div>
                    <button onClick={logout}
                      style={{ background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.25)', color: '#f87171', borderRadius: 100, padding: '9px 22px', fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'background 0.2s' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(248,113,113,0.2)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'rgba(248,113,113,0.1)'}>
                      Log out
                    </button>
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* TOURS */}
          {activeTab === 'tours' && (
            <div className="ag-content">
              <div className="ag-filter-row">
                {[{key:'all',label:`All (${myTours.length})`},{key:'approved',label:`Approved (${approvedCount})`},{key:'pending',label:`Pending (${pendingCount})`},{key:'rejected',label:`Rejected (${rejectedCount})`}].map(f => (
                  <button key={f.key} className={`ag-filter-btn ${filterStatus === f.key ? 'active' : ''}`} onClick={() => setFilterStatus(f.key)}>{f.label}</button>
                ))}
              </div>
              {loading ? <div className="ag-tours-grid">{[1,2,3].map(i => <div key={i} className="ag-skeleton" style={{height:220}} />)}</div>
              : filteredTours.length === 0 ? (
                <div className="ag-empty-full"><div className="ag-empty-icon">{ICONS.map}</div><h3>No tours yet</h3><p>Add your first tour package to get started</p><button className="ag-add-btn" onClick={() => setActiveTab('add')}>{ICONS.add} <span>Add Tour</span></button></div>
              ) : (
                <div className="ag-tours-grid">
                  {filteredTours.map(t => (
                    <div key={t.id} className="ag-tour-card">
                      <div className="ag-tour-img-wrap">
                        {t.image_url ? <img className="ag-tour-img" src={t.image_url?.startsWith('http') ? t.image_url : `${BACKEND}${t.image_url}`} alt={t.title} /> : <div className="ag-tour-img-ph">{ICONS.img}</div>}
                        <span className="ag-tour-badge" style={{ background: statusColor(t.approval_status), color: '#0a0e0d' }}>{t.approval_status}</span>
                      </div>
                      <div className="ag-tour-body">
                        <h3 className="ag-tour-name">{t.title}</h3>
                        <div className="ag-tour-meta">{t.destination} · {t.category}</div>
                        <div className="ag-tour-row"><span className="ag-tour-days">{t.duration_days} days</span><span className="ag-tour-price">${Number(t.price_usd).toFixed(0)}</span></div>
                        {t.approval_status === 'rejected' && t.rejection_reason && <div className="ag-rejection">{t.rejection_reason}</div>}
                        <div className="ag-tour-actions">
                          <button className="ag-edit-btn" onClick={() => setEditingTour(t)} disabled={actionLoading === t.id + '-delete'}>{ICONS.edit} Edit</button>
                          <button className="ag-delete-btn" onClick={() => deleteTour(t.id)} disabled={actionLoading === t.id + '-delete'}>{actionLoading === t.id + '-delete' ? '...' : <>{ICONS.trash} Delete</>}</button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* BOOKINGS */}
          {activeTab === 'bookings' && (
            <div className="ag-content">
              {loading ? [1,2,3].map(i => <div key={i} className="ag-skeleton" style={{marginBottom:10}} />) :
               bookings.length === 0 ? (
                <div className="ag-empty-full"><div className="ag-empty-icon">{ICONS.bag}</div><h3>No bookings yet</h3><p>Customer bookings will appear once your tours are approved</p></div>
              ) : bookings.map(b => (
                <div key={b.id} className="ag-booking-card">
                  <div className="ag-booking-top">
                    <div className="ag-booking-customer"><div className="ag-mini-avatar">{(b.customer_name||'C')[0].toUpperCase()}</div><div><div className="ag-mini-name">{b.customer_name}</div><div className="ag-mini-meta">{b.customer_email}</div></div></div>
                    <span className="ag-mini-badge" style={{background: bColor(b.status)+'22', color: bColor(b.status), fontSize:12, padding:'4px 14px'}}>{b.status}</span>
                  </div>
                  <div className="ag-booking-info-row">
                    <div><div className="ag-booking-tour">{b.title}</div><div className="ag-mini-meta">{b.destination} · Code: {b.booking_code}</div></div>
                    <div className="ag-booking-amount">NPR {new Intl.NumberFormat('en-NP').format(Math.round(Number(b.total_usd||0)*133))}</div>
                  </div>
                  {b.status === 'pending' && (
                    <div className="ag-booking-actions">
                      <button className="ag-confirm-btn" onClick={() => confirmBooking(b.id)} disabled={actionLoading === b.id+'-confirm'}>{actionLoading === b.id+'-confirm' ? 'Confirming...' : 'Confirm'}</button>
                      <button className="ag-reject-btn" onClick={() => rejectBooking(b)} disabled={actionLoading === b.id+'-reject'}>{actionLoading === b.id+'-reject' ? 'Rejecting...' : 'Reject'}</button>
                    </div>
                  )}
                  {b.status === 'confirmed' && <div className="ag-booking-note">Confirmed — Waiting for customer payment</div>}
                  {b.status === 'paid' && <div className="ag-booking-note" style={{color:'#60a5fa',borderColor:'rgba(96,165,250,0.2)',background:'rgba(96,165,250,0.05)'}}>Payment received</div>}
                  {b.status === 'cancelled' && <div className="ag-booking-note" style={{color:'#f87171',borderColor:'rgba(248,113,113,0.2)',background:'rgba(248,113,113,0.05)'}}>Rejected</div>}
                </div>
              ))}
            </div>
          )}

          {/* MESSAGES */}
          {activeTab === 'messages' && <div className="ag-content"><MessagesTab /></div>}

          {/* LOYALTY */}
          {activeTab === 'loyalty' && <div className="ag-content"><LoyaltyTiersTab /></div>}

          {/* ADD TOUR */}
          {activeTab === 'add' && (
            <div className="ag-content">
              <div className="ag-form-card">
                <div className="ag-form-header">
                  <div><h2 className="ag-form-title">New Tour Package</h2><p className="ag-form-sub">Submit your tour — admin will review before it goes live</p></div>
                  <button className="ag-close-btn" onClick={() => setActiveTab('dashboard')}>{ICONS.close}</button>
                </div>
                <form onSubmit={createTour} className="ag-form">
                  <div className="ag-form-section">Basic Info</div>
                  <div className="ag-form-row2">
                    <div className="ag-field"><label>Tour Title</label><input className="ag-input" value={form.title} onChange={e => setForm(f => ({...f, title: e.target.value}))} placeholder="e.g. Everest Base Camp Trek" required /></div>
                    <div className="ag-field">
                      <label>Destination</label>
                      <select className="ag-input" value={form.destination} onChange={e => setForm(f => ({...f, destination: e.target.value}))} required>
                        <option value="">Select destination</option>
                        {["Kathmandu","Pokhara","Chitwan","Lumbini","Bhaktapur","Nagarkot","Bandipur","Everest Region","Annapurna Region","Mustang","Ilam","Rara","Other"].map(d => <option key={d}>{d}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="ag-form-section">Details</div>
                  <div className="ag-form-row3">
                    <div className="ag-field"><label>Category</label><select className="ag-input" value={form.category} onChange={e => setForm(f => ({...f, category: e.target.value}))}>{categories.map(c => <option key={c}>{c}</option>)}</select></div>
                    <div className="ag-field"><label>Duration (days)</label><input className="ag-input" type="number" min="1" value={form.duration_days} onChange={e => setForm(f => ({...f, duration_days: +e.target.value}))} required /></div>
                    <div className="ag-field"><label>Price (USD)</label><input className="ag-input" type="number" min="0" step="0.01" value={form.price_usd} onChange={e => setForm(f => ({...f, price_usd: +e.target.value}))} required /></div>
                  </div>
                  <div className="ag-form-section">Location</div>
                  <div className="ag-form-row2">
                    <div className="ag-field"><label>Latitude</label><input className="ag-input" type="number" step="any" value={form.latitude} onChange={e => setForm(f => ({...f, latitude: e.target.value}))} placeholder="e.g. 27.9881" /></div>
                    <div className="ag-field"><label>Longitude</label><input className="ag-input" type="number" step="any" value={form.longitude} onChange={e => setForm(f => ({...f, longitude: e.target.value}))} placeholder="e.g. 86.9250" /></div>
                  </div>
                  <div className="ag-form-section">Photos</div>
                  <div className="ag-upload-area" onClick={() => fileInputRef.current?.click()}
                    onDragOver={e => { e.preventDefault(); e.currentTarget.classList.add('drag'); }}
                    onDragLeave={e => e.currentTarget.classList.remove('drag')}
                    onDrop={e => { e.preventDefault(); e.currentTarget.classList.remove('drag'); const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/')); if (files.length) handleFileSelect({ target: { files } }); }}>
                    <div className="ag-upload-icon">{ICONS.upload}</div>
                    <div className="ag-upload-text">Click to select or drag and drop photos</div>
                    <div className="ag-upload-sub">JPG, PNG, WEBP · Max 5MB · Up to 5 photos</div>
                    <input ref={fileInputRef} type="file" accept="image/*" multiple style={{display:'none'}} onChange={handleFileSelect} />
                  </div>
                  {previews.length > 0 && (
                    <div className="ag-preview-grid">
                      {previews.map((p, i) => (
                        <div key={i} className="ag-preview-item">
                          <img src={p.url} alt={p.name} className="ag-preview-img" />
                          {i === 0 && <span className="ag-preview-main">Main</span>}
                          <button type="button" className="ag-preview-remove" onClick={() => removeImage(i)}>{ICONS.trash}</button>
                        </div>
                      ))}
                      {previews.length < 5 && <div className="ag-preview-add" onClick={() => fileInputRef.current?.click()}><span style={{fontSize:24,color:'rgba(168,217,107,0.4)'}}>+</span><span style={{fontSize:11,color:'rgba(232,228,223,0.3)'}}>Add more</span></div>}
                    </div>
                  )}
                  <div className="ag-form-section">Description</div>
                  <div className="ag-field"><textarea className="ag-input ag-textarea" value={form.description} onChange={e => setForm(f => ({...f, description: e.target.value}))} placeholder="Describe your tour..." /></div>
                  <div className="ag-form-section">Day-wise Itinerary</div>
                  <div style={{display:'flex', flexDirection:'column', gap:10}}>
                    {itinerary.map((day, i) => (
                      <div key={i} className="ag-itin-row">
                        <div className="ag-itin-day-badge">Day {day.day}</div>
                        <div style={{flex:1, display:'flex', flexDirection:'column', gap:6}}>
                          <input className="ag-input" placeholder={`Day ${day.day} title`} value={day.title} onChange={e => updateItin(i, 'title', e.target.value)} />
                          <textarea className="ag-input" style={{minHeight:60, resize:'vertical'}} placeholder="Details about this day..." value={day.details} onChange={e => updateItin(i, 'details', e.target.value)} />
                        </div>
                        {itinerary.length > 1 && <button type="button" className="ag-itin-remove" onClick={() => removeItinDay(i)}>{ICONS.trash}</button>}
                      </div>
                    ))}
                    <button type="button" className="ag-itin-add" onClick={addItinDay}>+ Add Day</button>
                  </div>
                  <div className="ag-form-actions">
                    <button type="button" className="ag-cancel-btn" onClick={() => setActiveTab('dashboard')}>Cancel</button>
                    <button type="submit" className="ag-submit-btn" disabled={submitting || uploading}>{uploading ? 'Uploading...' : submitting ? 'Submitting...' : 'Submit for Review'}</button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </main>
      </div>
    </>
  );
}

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;1,700&family=DM+Sans:wght@300;400;500;600;700&display=swap');
  .ag-root{display:flex;min-height:100vh;background:#080c0b;font-family:'DM Sans',sans-serif;color:#e8e4df;}
  .ag-sidebar{width:236px;background:#0d1210;border-right:1px solid rgba(168,217,107,0.08);display:flex;flex-direction:column;position:fixed;left:0;top:0;bottom:0;z-index:200;transition:transform 0.26s ease;overflow:hidden;}
  .ag-sidebar-logo{display:flex;align-items:center;gap:12px;padding:22px 18px 18px;border-bottom:1px solid rgba(255,255,255,0.05);flex-shrink:0;}
  .ag-logo-icon{width:36px;height:36px;background:linear-gradient(135deg,#a8d96b,#5fa832);border-radius:10px;display:flex;align-items:center;justify-content:center;color:#0a0e0d;flex-shrink:0;}
  .ag-logo-name{font-family:'Playfair Display',serif;font-size:14px;font-weight:700;color:#fff;line-height:1.2;}
  .ag-logo-sub{font-size:10px;color:rgba(168,217,107,0.6);font-weight:500;letter-spacing:0.06em;text-transform:uppercase;}
  .ag-nav{flex:1;padding:18px 10px;display:flex;flex-direction:column;gap:2px;overflow-y:auto;}
  .ag-nav-label{font-size:10px;font-weight:600;letter-spacing:0.14em;color:rgba(232,228,223,0.22);padding:0 10px;margin-bottom:6px;}
  .ag-nav-item{display:flex;align-items:center;gap:11px;padding:10px 12px;border-radius:10px;color:rgba(232,228,223,0.5);font-size:13px;font-weight:500;cursor:pointer;border:none;background:none;width:100%;text-align:left;transition:all 0.16s;position:relative;font-family:'DM Sans',sans-serif;}
  .ag-nav-item:hover{background:rgba(255,255,255,0.05);color:#e8e4df;}
  .ag-nav-item.active{background:rgba(168,217,107,0.11);color:#a8d96b;font-weight:600;}
  .ag-nav-item.active::before{content:'';position:absolute;left:0;top:22%;bottom:22%;width:3px;background:#a8d96b;border-radius:0 3px 3px 0;}
  .ag-nav-icon{flex-shrink:0;display:flex;}
  .ag-nav-badge{margin-left:auto;background:#f59e0b;color:#0a0e0d;font-size:10px;font-weight:700;padding:2px 7px;border-radius:100px;}
  .ag-sidebar-footer{padding:10px;border-top:1px solid rgba(255,255,255,0.05);flex-shrink:0;display:flex;flex-direction:column;gap:6px;}
  .ag-sidebar-user{display:flex;align-items:center;gap:10px;padding:10px;border-radius:10px;background:rgba(255,255,255,0.04);}
  .ag-avatar-sm{width:32px;height:32px;border-radius:9px;background:linear-gradient(135deg,#a8d96b,#5fa832);color:#0a0e0d;font-size:12px;font-weight:700;display:flex;align-items:center;justify-content:center;flex-shrink:0;}
  .ag-sidebar-uname{font-size:13px;font-weight:600;color:#fff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:130px;}
  .ag-sidebar-urole{font-size:10px;color:#a8d96b;font-weight:500;text-transform:uppercase;letter-spacing:0.06em;}
  .ag-logout-btn{width:100%;padding:8px;border:1px solid rgba(248,113,113,0.2);border-radius:8px;background:transparent;color:rgba(248,113,113,0.7);cursor:pointer;font-size:12px;font-weight:600;transition:all 0.2s;font-family:'DM Sans',sans-serif;}
  .ag-logout-btn:hover{background:rgba(248,113,113,0.08);color:#f87171;}
  .ag-overlay{position:fixed;inset:0;background:rgba(0,0,0,0.5);z-index:150;}
  .ag-main{flex:1;margin-left:236px;display:flex;flex-direction:column;min-height:100vh;}
  .ag-topbar{display:flex;align-items:center;justify-content:space-between;padding:18px 28px;border-bottom:1px solid rgba(255,255,255,0.05);background:#080c0b;position:sticky;top:0;z-index:100;gap:16px;}
  .ag-topbar-left{display:flex;align-items:center;gap:14px;}
  .ag-topbar-right{display:flex;align-items:center;gap:10px;}
  .ag-page-title{font-family:'Playfair Display',serif;font-size:20px;font-weight:700;color:#fff;margin:0 0 2px;}
  .ag-page-sub{font-size:12px;color:rgba(232,228,223,0.38);margin:0;}
  .ag-hamburger{display:none;background:none;border:none;color:rgba(232,228,223,0.6);cursor:pointer;padding:6px;border-radius:8px;}
  .ag-avatar{width:34px;height:34px;border-radius:9px;background:linear-gradient(135deg,#a8d96b,#5fa832);color:#0a0e0d;font-size:13px;font-weight:700;display:flex;align-items:center;justify-content:center;transition:opacity 0.2s;}
  .ag-avatar:hover{opacity:0.8;}
  .ag-add-btn{display:flex;align-items:center;gap:7px;background:#a8d96b;color:#0a0e0d;border:none;border-radius:100px;padding:9px 18px;font-family:'DM Sans',sans-serif;font-size:13px;font-weight:600;cursor:pointer;transition:background 0.2s,transform 0.15s;}
  .ag-add-btn:hover{background:#c1e88d;transform:scale(1.03);}
  .ag-bell-btn{position:relative;width:36px;height:36px;border-radius:10px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.08);color:rgba(232,228,223,0.6);cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all 0.2s;flex-shrink:0;}
  .ag-bell-btn:hover{background:rgba(168,217,107,0.1);border-color:rgba(168,217,107,0.25);color:#a8d96b;}
  .ag-bell-badge{position:absolute;top:-5px;right:-5px;background:#f59e0b;color:#0a0e0d;font-size:9px;font-weight:800;min-width:16px;height:16px;border-radius:100px;display:flex;align-items:center;justify-content:center;padding:0 4px;border:2px solid #080c0b;}
  .ag-notif-drop{position:absolute;top:calc(100% + 10px);right:0;width:320px;background:#0d1210;border:1px solid rgba(255,255,255,0.1);border-radius:16px;box-shadow:0 16px 48px rgba(0,0,0,0.5);z-index:999;overflow:hidden;}
  .ag-notif-head{display:flex;align-items:center;justify-content:space-between;padding:14px 16px;border-bottom:1px solid rgba(255,255,255,0.06);}
  .ag-notif-title{font-family:'Playfair Display',serif;font-size:15px;font-weight:700;color:#fff;}
  .ag-notif-markall{background:none;border:none;color:rgba(168,217,107,0.7);font-size:11px;font-weight:600;cursor:pointer;font-family:'DM Sans',sans-serif;padding:0;}
  .ag-notif-markall:hover{color:#a8d96b;}
  .ag-notif-list{max-height:360px;overflow-y:auto;}
  .ag-notif-list::-webkit-scrollbar{width:3px;} .ag-notif-list::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.1);border-radius:10px;}
  .ag-notif-empty{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;padding:36px 20px;color:rgba(232,228,223,0.3);font-size:13px;}
  .ag-notif-item{display:flex;align-items:flex-start;gap:12px;padding:12px 16px;border-bottom:1px solid rgba(255,255,255,0.04);cursor:pointer;transition:background 0.16s;position:relative;}
  .ag-notif-item:last-child{border-bottom:none;} .ag-notif-item:hover{background:rgba(255,255,255,0.03);} .ag-notif-item.unread{background:rgba(168,217,107,0.04);}
  .ag-notif-body{flex:1;min-width:0;} .ag-notif-ntitle{font-size:13px;font-weight:600;color:#e8e4df;margin-bottom:3px;}
  .ag-notif-nbody{font-size:12px;color:rgba(232,228,223,0.45);line-height:1.4;margin-bottom:4px;} .ag-notif-time{font-size:10px;color:rgba(232,228,223,0.25);}
  .ag-notif-dot{width:7px;height:7px;border-radius:50%;background:#a8d96b;flex-shrink:0;margin-top:4px;}
  .ag-alert{padding:11px 18px;border-radius:10px;margin:14px 28px 0;font-size:13px;font-weight:500;}
  .ag-alert-err{background:rgba(248,113,113,0.1);border:1px solid rgba(248,113,113,0.25);color:#f87171;}
  .ag-alert-ok{background:rgba(168,217,107,0.1);border:1px solid rgba(168,217,107,0.25);color:#a8d96b;}
  .ag-content{padding:26px 28px 60px;}
  .ag-stats{display:grid;grid-template-columns:repeat(auto-fill,minmax(185px,1fr));gap:14px;margin-bottom:26px;}
  .ag-stat-card{background:#0d1210;border:1px solid rgba(255,255,255,0.06);border-radius:18px;padding:20px 18px;position:relative;overflow:hidden;transition:transform 0.2s,border-color 0.2s;}
  .ag-stat-card:hover{transform:translateY(-3px);border-color:rgba(168,217,107,0.18);}
  .ag-stat-icon-wrap{color:var(--accent);margin-bottom:14px;} .ag-stat-num{font-family:'Playfair Display',serif;font-size:34px;font-weight:700;color:var(--accent);line-height:1;margin-bottom:5px;}
  .ag-stat-label{font-size:11px;color:rgba(232,228,223,0.38);font-weight:500;text-transform:uppercase;letter-spacing:0.05em;}
  .ag-stat-bar{position:absolute;bottom:0;left:0;right:0;height:3px;background:linear-gradient(90deg,var(--accent),transparent);opacity:0.3;}
  .ag-two-col{display:grid;grid-template-columns:1fr 1fr;gap:16px;}
  .ag-card{background:#0d1210;border:1px solid rgba(255,255,255,0.06);border-radius:18px;padding:20px;}
  .ag-card-head{display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;}
  .ag-card-title{font-family:'Playfair Display',serif;font-size:16px;font-weight:700;color:#fff;}
  .ag-viewall{background:none;border:1px solid rgba(168,217,107,0.22);color:#a8d96b;font-size:11px;font-weight:600;padding:4px 12px;border-radius:100px;cursor:pointer;font-family:'DM Sans',sans-serif;transition:background 0.2s;}
  .ag-viewall:hover{background:rgba(168,217,107,0.08);}
  .ag-mini-row{display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.04);}
  .ag-mini-row:last-child{border-bottom:none;}
  .ag-mini-dot{width:7px;height:7px;border-radius:50%;flex-shrink:0;}
  .ag-mini-avatar{width:28px;height:28px;border-radius:8px;background:rgba(168,217,107,0.1);color:#a8d96b;font-size:11px;font-weight:700;display:flex;align-items:center;justify-content:center;flex-shrink:0;}
  .ag-mini-info{flex:1;min-width:0;} .ag-mini-name{display:block;font-size:13px;font-weight:600;color:#fff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
  .ag-mini-meta{display:block;font-size:11px;color:rgba(232,228,223,0.3);margin-top:1px;}
  .ag-mini-badge{font-size:10px;font-weight:600;padding:3px 9px;border-radius:100px;text-transform:capitalize;white-space:nowrap;flex-shrink:0;}
  .ag-empty-sm{font-size:13px;color:rgba(232,228,223,0.3);padding:10px 0;}
  .ag-link{background:none;border:none;color:#a8d96b;cursor:pointer;font-size:13px;font-family:'DM Sans',sans-serif;text-decoration:underline;padding:0;}
  .ag-filter-row{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:18px;}
  .ag-filter-btn{background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);color:rgba(232,228,223,0.45);font-size:12px;font-weight:500;padding:5px 14px;border-radius:100px;cursor:pointer;transition:all 0.2s;font-family:'DM Sans',sans-serif;}
  .ag-filter-btn.active{background:rgba(168,217,107,0.12);border-color:rgba(168,217,107,0.3);color:#a8d96b;font-weight:600;}
  .ag-tours-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:16px;}
  .ag-tour-card{background:#0d1210;border:1px solid rgba(255,255,255,0.06);border-radius:18px;overflow:hidden;transition:transform 0.2s,border-color 0.2s;}
  .ag-tour-card:hover{transform:translateY(-3px);border-color:rgba(168,217,107,0.18);}
  .ag-tour-img-wrap{position:relative;} .ag-tour-img{width:100%;height:150px;object-fit:cover;display:block;}
  .ag-tour-img-ph{width:100%;height:150px;background:rgba(168,217,107,0.04);display:flex;align-items:center;justify-content:center;color:rgba(168,217,107,0.2);}
  .ag-tour-badge{position:absolute;top:10px;right:10px;font-size:10px;font-weight:700;padding:3px 10px;border-radius:100px;text-transform:capitalize;}
  .ag-tour-body{padding:14px 16px;} .ag-tour-name{font-family:'Playfair Display',serif;font-size:15px;font-weight:700;color:#fff;margin:0 0 4px;}
  .ag-tour-meta{font-size:11px;color:rgba(232,228,223,0.38);margin-bottom:10px;}
  .ag-tour-row{display:flex;align-items:center;justify-content:space-between;}
  .ag-tour-days{font-size:12px;color:rgba(232,228,223,0.38);font-weight:500;} .ag-tour-price{font-size:17px;font-weight:700;color:#a8d96b;font-family:'Playfair Display',serif;}
  .ag-rejection{font-size:11px;color:#f87171;margin-top:8px;background:rgba(248,113,113,0.07);padding:5px 9px;border-radius:7px;}
  .ag-tour-actions{display:flex;gap:8px;margin-top:12px;}
  .ag-edit-btn{display:flex;align-items:center;gap:5px;flex:1;justify-content:center;background:rgba(168,217,107,0.1);color:#a8d96b;border:1px solid rgba(168,217,107,0.2);border-radius:8px;padding:7px 10px;font-family:'DM Sans',sans-serif;font-size:12px;font-weight:600;cursor:pointer;transition:background 0.2s;}
  .ag-edit-btn:hover:not(:disabled){background:rgba(168,217,107,0.2);} .ag-edit-btn:disabled{opacity:0.5;cursor:not-allowed;}
  .ag-delete-btn{display:flex;align-items:center;gap:5px;flex:1;justify-content:center;background:rgba(248,113,113,0.08);color:#f87171;border:1px solid rgba(248,113,113,0.2);border-radius:8px;padding:7px 10px;font-family:'DM Sans',sans-serif;font-size:12px;font-weight:600;cursor:pointer;transition:background 0.2s;}
  .ag-delete-btn:hover:not(:disabled){background:rgba(248,113,113,0.18);} .ag-delete-btn:disabled{opacity:0.5;cursor:not-allowed;}
  .ag-booking-card{background:#0d1210;border:1px solid rgba(255,255,255,0.06);border-radius:16px;padding:18px 20px;margin-bottom:12px;transition:border-color 0.2s;}
  .ag-booking-card:hover{border-color:rgba(168,217,107,0.12);}
  .ag-booking-top{display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;gap:10px;}
  .ag-booking-customer{display:flex;align-items:center;gap:10px;}
  .ag-booking-info-row{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:14px;flex-wrap:wrap;}
  .ag-booking-tour{font-size:14px;font-weight:600;color:#fff;margin-bottom:3px;}
  .ag-booking-amount{font-family:'Playfair Display',serif;font-size:18px;font-weight:700;color:#a8d96b;flex-shrink:0;}
  .ag-booking-actions{display:flex;gap:10px;}
  .ag-confirm-btn{background:#a8d96b;color:#0a0e0d;border:none;border-radius:100px;padding:9px 20px;font-family:'DM Sans',sans-serif;font-size:13px;font-weight:700;cursor:pointer;transition:background 0.2s,transform 0.15s;}
  .ag-confirm-btn:hover:not(:disabled){background:#c1e88d;transform:scale(1.03);} .ag-confirm-btn:disabled{opacity:0.5;cursor:not-allowed;}
  .ag-reject-btn{background:rgba(248,113,113,0.1);color:#f87171;border:1px solid rgba(248,113,113,0.25);border-radius:100px;padding:9px 20px;font-family:'DM Sans',sans-serif;font-size:13px;font-weight:600;cursor:pointer;transition:background 0.2s;}
  .ag-reject-btn:hover:not(:disabled){background:rgba(248,113,113,0.2);} .ag-reject-btn:disabled{opacity:0.5;cursor:not-allowed;}
  .ag-booking-note{font-size:12px;color:#a8d96b;background:rgba(168,217,107,0.06);border:1px solid rgba(168,217,107,0.15);border-radius:8px;padding:7px 12px;}
  .ag-empty-full{text-align:center;padding:60px 20px;}
  .ag-empty-icon{display:flex;justify-content:center;margin-bottom:12px;color:rgba(168,217,107,0.25);}
  .ag-empty-full h3{font-family:'Playfair Display',serif;font-size:20px;color:#fff;margin:0 0 8px;} .ag-empty-full p{font-size:13px;color:rgba(232,228,223,0.35);margin-bottom:20px;}
  .ag-form-card{background:#0d1210;border:1px solid rgba(168,217,107,0.1);border-radius:22px;padding:28px;max-width:760px;}
  .ag-form-header{display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:24px;gap:14px;}
  .ag-form-title{font-family:'Playfair Display',serif;font-size:20px;font-weight:700;color:#fff;margin:0 0 5px;}
  .ag-form-sub{font-size:13px;color:rgba(232,228,223,0.35);margin:0;}
  .ag-close-btn{background:rgba(255,255,255,0.05);border:none;color:rgba(232,228,223,0.45);width:30px;height:30px;border-radius:8px;cursor:pointer;display:flex;align-items:center;justify-content:center;flex-shrink:0;transition:background 0.16s;}
  .ag-close-btn:hover{background:rgba(248,113,113,0.1);color:#f87171;}
  .ag-form{display:flex;flex-direction:column;gap:14px;}
  .ag-form-section{font-size:10px;font-weight:600;letter-spacing:0.12em;text-transform:uppercase;color:rgba(168,217,107,0.5);border-bottom:1px solid rgba(168,217,107,0.1);padding-bottom:7px;margin-top:4px;}
  .ag-form-row2{display:grid;grid-template-columns:1fr 1fr;gap:12px;} .ag-form-row3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;}
  .ag-field{display:flex;flex-direction:column;gap:6px;}
  .ag-field label{font-size:11px;font-weight:600;color:rgba(232,228,223,0.38);letter-spacing:0.05em;text-transform:uppercase;}
  .ag-input{background:#080c0b;border:1px solid rgba(255,255,255,0.09);border-radius:10px;color:#e8e4df;font-family:'DM Sans',sans-serif;font-size:14px;padding:10px 14px;outline:none;transition:border-color 0.2s;width:100%;box-sizing:border-box;}
  .ag-input:focus{border-color:rgba(168,217,107,0.4);} .ag-textarea{min-height:90px;resize:vertical;} select.ag-input{cursor:pointer;}
  .ag-upload-area{border:2px dashed rgba(168,217,107,0.2);border-radius:14px;padding:32px 20px;text-align:center;cursor:pointer;transition:all 0.2s;background:rgba(168,217,107,0.02);}
  .ag-upload-area:hover,.ag-upload-area.drag{border-color:rgba(168,217,107,0.5);background:rgba(168,217,107,0.06);}
  .ag-upload-icon{display:flex;justify-content:center;color:rgba(168,217,107,0.5);margin-bottom:10px;}
  .ag-upload-text{font-size:14px;font-weight:600;color:rgba(232,228,223,0.7);margin-bottom:4px;} .ag-upload-sub{font-size:11px;color:rgba(232,228,223,0.3);}
  .ag-preview-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(120px,1fr));gap:10px;}
  .ag-preview-item{position:relative;border-radius:10px;overflow:hidden;aspect-ratio:1;}
  .ag-preview-img{width:100%;height:100%;object-fit:cover;display:block;}
  .ag-preview-main{position:absolute;bottom:6px;left:6px;background:#a8d96b;color:#0a0e0d;font-size:9px;font-weight:800;padding:2px 7px;border-radius:100px;text-transform:uppercase;}
  .ag-preview-remove{position:absolute;top:6px;right:6px;background:rgba(0,0,0,0.6);border:none;color:#f87171;border-radius:6px;padding:4px;cursor:pointer;display:flex;align-items:center;justify-content:center;}
  .ag-preview-remove:hover{background:rgba(248,113,113,0.3);}
  .ag-preview-add{border:2px dashed rgba(168,217,107,0.2);border-radius:10px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;cursor:pointer;aspect-ratio:1;}
  .ag-form-actions{display:flex;gap:10px;justify-content:flex-end;margin-top:6px;}
  .ag-cancel-btn{background:rgba(255,255,255,0.04);color:rgba(232,228,223,0.55);border:1px solid rgba(255,255,255,0.09);border-radius:100px;padding:10px 22px;font-family:'DM Sans',sans-serif;font-size:13px;font-weight:600;cursor:pointer;}
  .ag-cancel-btn:hover{background:rgba(255,255,255,0.08);color:#e8e4df;}
  .ag-submit-btn{background:#a8d96b;color:#0a0e0d;border:none;border-radius:100px;padding:10px 26px;font-family:'DM Sans',sans-serif;font-size:13px;font-weight:700;cursor:pointer;}
  .ag-submit-btn:hover:not(:disabled){background:#c1e88d;} .ag-submit-btn:disabled{opacity:0.5;cursor:not-allowed;}
  .ag-skeleton{background:linear-gradient(90deg,#0d1210 25%,#131a18 50%,#0d1210 75%);background-size:200% 100%;animation:shimmer 1.4s infinite;border-radius:14px;height:60px;}
  @keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}
  .ag-verify-wrap{min-height:80vh;display:flex;align-items:center;justify-content:center;font-family:'DM Sans',sans-serif;}
  .ag-verify-card{background:#0d1210;border:1px solid rgba(255,255,255,0.06);border-radius:22px;padding:44px;text-align:center;max-width:420px;}
  .ag-verify-icon{display:flex;justify-content:center;margin-bottom:16px;color:rgba(168,217,107,0.5);}
  .ag-verify-card h2{font-family:'Playfair Display',serif;color:#fff;margin:0 0 10px;font-size:22px;}
  .ag-verify-card p{color:rgba(232,228,223,0.42);font-size:14px;line-height:1.7;margin:0;}
  .ag-modal-overlay{position:fixed;inset:0;background:rgba(0,0,0,0.75);z-index:500;display:flex;align-items:center;justify-content:center;padding:20px;backdrop-filter:blur(4px);}
  .ag-modal{background:#0d1210;border:1px solid rgba(168,217,107,0.15);border-radius:22px;width:100%;max-width:680px;max-height:90vh;display:flex;flex-direction:column;}
  .ag-modal-head{display:flex;align-items:flex-start;justify-content:space-between;padding:24px 24px 0;gap:14px;flex-shrink:0;}
  .ag-modal-body{padding:20px 24px;overflow-y:auto;display:flex;flex-direction:column;gap:14px;flex:1;}
  .ag-modal-body::-webkit-scrollbar{width:4px;} .ag-modal-body::-webkit-scrollbar-thumb{background:rgba(168,217,107,0.2);border-radius:10px;}
  .ag-modal-footer{padding:16px 24px;border-top:1px solid rgba(255,255,255,0.06);display:flex;gap:10px;justify-content:flex-end;flex-shrink:0;}
  .ag-itin-row{display:flex;align-items:flex-start;gap:12px;background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.06);border-radius:12px;padding:14px;}
  .ag-itin-day-badge{background:rgba(168,217,107,0.12);color:#a8d96b;font-size:11px;font-weight:700;padding:4px 10px;border-radius:8px;white-space:nowrap;flex-shrink:0;margin-top:4px;}
  .ag-itin-remove{background:rgba(248,113,113,0.08);border:1px solid rgba(248,113,113,0.15);color:#f87171;border-radius:8px;padding:6px;cursor:pointer;display:flex;align-items:center;justify-content:center;flex-shrink:0;margin-top:4px;}
  .ag-itin-remove:hover{background:rgba(248,113,113,0.18);}
  .ag-itin-add{background:transparent;border:2px dashed rgba(168,217,107,0.2);border-radius:10px;color:rgba(168,217,107,0.6);font-family:'DM Sans',sans-serif;font-size:13px;font-weight:600;padding:10px;cursor:pointer;width:100%;transition:all 0.2s;}
  .ag-itin-add:hover{border-color:rgba(168,217,107,0.5);color:#a8d96b;background:rgba(168,217,107,0.04);}
  @media(max-width:880px){.ag-sidebar{transform:translateX(-100%)}.ag-sidebar.open{transform:translateX(0)}.ag-main{margin-left:0}.ag-hamburger{display:flex}.ag-two-col{grid-template-columns:1fr}.ag-form-row2,.ag-form-row3{grid-template-columns:1fr}.ag-content{padding:18px 16px 40px}.ag-topbar{padding:14px 16px}.ag-alert{margin:10px 16px 0}.ag-notif-drop{width:calc(100vw - 32px);right:-60px;}}
  @media(max-width:520px){.ag-stats{grid-template-columns:1fr 1fr}.ag-tours-grid{grid-template-columns:1fr}.ag-add-btn span{display:none}}
`;