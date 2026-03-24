import { useEffect, useState } from "react";
import { api } from "../api/client";

function getUser() {
  try { return JSON.parse(localStorage.getItem('user') || 'null'); } catch { return null; }
}

export default function Agency() {
  const [myTours, setMyTours] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const user = getUser();

  const [form, setForm] = useState({
    title: "", destination: "", category: "Adventure",
    duration_days: 3, price_usd: 199, image_url: "", description: ""
  });

  const categories = ["Adventure", "Cultural", "Wildlife", "Trekking", "Pilgrimage", "Family", "Luxury", "General"];

  async function load() {
    setErr("");
    try {
      const [mine, b] = await Promise.allSettled([
        api.get("/api/agency/tours"),
        api.get("/api/agency/bookings"),
      ]);
      setMyTours(mine.status === 'fulfilled' ? (mine.value.data.items || []) : []);
      setBookings(b.status === 'fulfilled' ? (b.value.data.items || []) : []);
    } catch (ex) {
      setErr(ex?.response?.data?.error || "Failed to load data");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function createTour(e) {
    e.preventDefault();
    setErr(""); setSubmitting(true);
    try {
      await api.post("/api/agency/tours", form);
      setForm({ title: "", destination: "", category: "Adventure", duration_days: 3, price_usd: 199, image_url: "", description: "" });
      setShowForm(false);
      setSuccessMsg("Tour submitted for admin review!");
      setTimeout(() => setSuccessMsg(""), 4000);
      await load();
    } catch (ex) {
      setErr(ex?.response?.data?.error || "Failed to create tour");
    } finally {
      setSubmitting(false);
    }
  }

  const approvedCount = myTours.filter(t => t.approval_status === 'approved').length;
  const pendingCount  = myTours.filter(t => t.approval_status === 'pending').length;
  const rejectedCount = myTours.filter(t => t.approval_status === 'rejected').length;

  function statusColor(s) {
    if (s === 'approved') return '#a8d96b';
    if (s === 'pending')  return '#f59e0b';
    if (s === 'rejected') return '#f87171';
    return '#94a3b8';
  }

  function bookingStatusColor(s) {
    if (s === 'confirmed') return '#a8d96b';
    if (s === 'pending')   return '#f59e0b';
    if (s === 'cancelled') return '#f87171';
    return '#94a3b8';
  }

  if (user && user.verification_status && user.verification_status !== 'verified') {
    return (
      <>
        <style>{baseStyles}</style>
        <div className="ag-wrap">
          <div className="ag-pending-card">
            <div className="ag-pending-icon">⏳</div>
            <h2>Account Pending Verification</h2>
            <p>Your agency account is <b>{user.verification_status}</b>. The dashboard will be available after admin verification.</p>
            {user.verification_status === 'rejected' && (
              <p style={{ color: '#f87171' }}>Please contact support for next steps.</p>
            )}
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <style>{baseStyles}</style>
      <div className="ag-wrap">

        {/* HEADER */}
        <div className="ag-header">
          <div>
            <div className="ag-tag">🏢 Agency Portal</div>
            <h1 className="ag-title">{user?.full_name || user?.name || 'Agency'}</h1>
            <p className="ag-sub">Manage your tours and track bookings</p>
          </div>
          <button className="ag-add-btn" onClick={() => setShowForm(v => !v)}>
            {showForm ? '✕ Cancel' : '+ Add Tour'}
          </button>
        </div>

        {/* MESSAGES */}
        {err && <div className="ag-error">{err}</div>}
        {successMsg && <div className="ag-success">✅ {successMsg}</div>}

        {/* STATS */}
        <div className="ag-stats">
          {[
            { num: myTours.length, label: 'Total Tours', icon: '🗺️' },
            { num: approvedCount,  label: 'Approved',    icon: '✅' },
            { num: pendingCount,   label: 'Pending',     icon: '⏳' },
            { num: bookings.length,label: 'Bookings',    icon: '🧳' },
          ].map((s, i) => (
            <div className="ag-stat" key={i}>
              <span className="ag-stat-icon">{s.icon}</span>
              <div className="ag-stat-num">{loading ? '—' : s.num}</div>
              <div className="ag-stat-label">{s.label}</div>
            </div>
          ))}
        </div>

        {/* ADD TOUR FORM */}
        {showForm && (
          <div className="ag-form-card">
            <h3 className="ag-section-title">New Tour Package</h3>
            <form onSubmit={createTour} className="ag-form">
              <div className="ag-form-row">
                <div className="ag-field">
                  <label>Tour Title *</label>
                  <input className="ag-input" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. Everest Base Camp Trek" required />
                </div>
                <div className="ag-field">
                  <label>Destination *</label>
                  <input className="ag-input" value={form.destination} onChange={e => setForm(f => ({ ...f, destination: e.target.value }))} placeholder="e.g. Solukhumbu, Nepal" required />
                </div>
              </div>
              <div className="ag-form-row">
                <div className="ag-field">
                  <label>Category *</label>
                  <select className="ag-input" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                    {categories.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div className="ag-field">
                  <label>Duration (days) *</label>
                  <input className="ag-input" type="number" min="1" value={form.duration_days} onChange={e => setForm(f => ({ ...f, duration_days: +e.target.value }))} required />
                </div>
                <div className="ag-field">
                  <label>Price (USD) *</label>
                  <input className="ag-input" type="number" min="0" step="0.01" value={form.price_usd} onChange={e => setForm(f => ({ ...f, price_usd: +e.target.value }))} required />
                </div>
              </div>
              <div className="ag-field">
                <label>Image URL</label>
                <input className="ag-input" value={form.image_url} onChange={e => setForm(f => ({ ...f, image_url: e.target.value }))} placeholder="https://... (optional)" />
              </div>
              <div className="ag-field">
                <label>Description</label>
                <textarea className="ag-input ag-textarea" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Describe your tour package..." />
              </div>
              <button className="ag-submit-btn" disabled={submitting}>
                {submitting ? 'Submitting...' : 'Submit for Review'}
              </button>
            </form>
          </div>
        )}

        {/* MY TOURS */}
        <div className="ag-section">
          <div className="ag-section-head">
            <div className="ag-section-title">My Tour Packages</div>
            <span className="ag-count">{myTours.length} tours</span>
          </div>
          {loading ? (
            <><div className="ag-skeleton"/><div className="ag-skeleton"/><div className="ag-skeleton"/></>
          ) : myTours.length === 0 ? (
            <div className="ag-empty">No tours yet. Click <b>+ Add Tour</b> to get started!</div>
          ) : (
            <div className="ag-tours-grid">
              {myTours.map(t => (
                <div key={t.id} className="ag-tour-card">
                  {t.image_url && <img className="ag-tour-img" src={t.image_url} alt={t.title} />}
                  <div className="ag-tour-body">
                    <div className="ag-tour-top">
                      <b className="ag-tour-name">{t.title}</b>
                      <span className="ag-badge" style={{ background: statusColor(t.approval_status) + '22', color: statusColor(t.approval_status) }}>
                        {t.approval_status}
                      </span>
                    </div>
                    <div className="ag-tour-meta">{t.destination} · {t.category} · {t.duration_days} days</div>
                    <div className="ag-tour-price">${Number(t.price_usd).toFixed(2)} <span>per person</span></div>
                    {t.approval_status === 'rejected' && t.rejection_reason && (
                      <div className="ag-rejection">⚠️ {t.rejection_reason}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* BOOKINGS */}
        <div className="ag-section">
          <div className="ag-section-head">
            <div className="ag-section-title">Customer Bookings</div>
            <span className="ag-count">{bookings.length} total</span>
          </div>
          {loading ? (
            <><div className="ag-skeleton"/><div className="ag-skeleton"/></>
          ) : bookings.length === 0 ? (
            <div className="ag-empty">No bookings yet. Bookings will appear here once customers book your approved tours.</div>
          ) : (
            <div className="ag-bookings">
              {bookings.map(b => (
                <div key={b.id} className="ag-booking-row">
                  <div className="ag-booking-info">
                    <b>{b.title}</b>
                    <div className="ag-booking-meta">{b.customer_name} · {b.customer_email}</div>
                  </div>
                  <div className="ag-booking-right">
                    <div className="ag-booking-amount">${Number(b.total_usd || 0).toFixed(2)}</div>
                    <span className="ag-badge" style={{ background: bookingStatusColor(b.status) + '22', color: bookingStatusColor(b.status) }}>
                      {b.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </>
  );
}

const baseStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=DM+Sans:wght@300;400;500;600&display=swap');
  .ag-wrap { max-width: 1100px; margin: 0 auto; padding: 40px 24px 60px; font-family: 'DM Sans', sans-serif; }
  .ag-header { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 32px; flex-wrap: wrap; gap: 16px; }
  .ag-tag { font-size: 12px; font-weight: 600; letter-spacing: 0.12em; text-transform: uppercase; color: #a8d96b; margin-bottom: 8px; }
  .ag-title { font-family: 'Playfair Display', serif; font-size: clamp(26px, 4vw, 40px); font-weight: 700; color: #fff; margin: 0 0 6px; }
  .ag-sub { font-size: 14px; color: rgba(240,237,232,0.45); margin: 0; }
  .ag-add-btn { background: #a8d96b; color: #1a2010; border: none; border-radius: 100px; padding: 12px 24px; font-family: 'DM Sans', sans-serif; font-size: 14px; font-weight: 700; cursor: pointer; transition: background 0.2s, transform 0.15s; white-space: nowrap; align-self: center; }
  .ag-add-btn:hover { background: #c1e88d; transform: scale(1.04); }

  .ag-error { background: rgba(248,113,113,0.1); border: 1px solid rgba(248,113,113,0.3); color: #f87171; padding: 12px 16px; border-radius: 12px; margin-bottom: 16px; font-size: 14px; }
  .ag-success { background: rgba(168,217,107,0.1); border: 1px solid rgba(168,217,107,0.3); color: #a8d96b; padding: 12px 16px; border-radius: 12px; margin-bottom: 16px; font-size: 14px; }

  .ag-stats { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 14px; margin-bottom: 32px; }
  .ag-stat { background: #131918; border: 1px solid rgba(255,255,255,0.07); border-radius: 18px; padding: 22px 20px; transition: transform 0.2s, border-color 0.2s; }
  .ag-stat:hover { transform: translateY(-3px); border-color: rgba(168,217,107,0.25); }
  .ag-stat-icon { font-size: 24px; display: block; margin-bottom: 12px; }
  .ag-stat-num { font-family: 'Playfair Display', serif; font-size: 32px; font-weight: 700; color: #a8d96b; line-height: 1; margin-bottom: 4px; }
  .ag-stat-label { font-size: 12px; color: rgba(240,237,232,0.45); }

  .ag-form-card { background: #131918; border: 1px solid rgba(168,217,107,0.2); border-radius: 20px; padding: 28px; margin-bottom: 28px; animation: fadeSlide 0.22s ease; }
  @keyframes fadeSlide { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
  .ag-form { display: flex; flex-direction: column; gap: 14px; margin-top: 16px; }
  .ag-form-row { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 12px; }
  .ag-field { display: flex; flex-direction: column; gap: 6px; }
  .ag-field label { font-size: 12px; font-weight: 600; color: rgba(240,237,232,0.5); letter-spacing: 0.04em; text-transform: uppercase; }
  .ag-input { background: #0e1310; border: 1px solid rgba(255,255,255,0.1); border-radius: 10px; color: #f0ede8; font-family: 'DM Sans', sans-serif; font-size: 14px; padding: 10px 14px; outline: none; transition: border-color 0.2s; width: 100%; box-sizing: border-box; }
  .ag-input:focus { border-color: rgba(168,217,107,0.5); }
  .ag-textarea { min-height: 80px; resize: vertical; }
  select.ag-input { cursor: pointer; }
  .ag-submit-btn { background: #a8d96b; color: #1a2010; border: none; border-radius: 100px; padding: 12px 28px; font-family: 'DM Sans', sans-serif; font-size: 14px; font-weight: 700; cursor: pointer; transition: background 0.2s, transform 0.15s; align-self: flex-start; }
  .ag-submit-btn:hover:not(:disabled) { background: #c1e88d; transform: scale(1.03); }
  .ag-submit-btn:disabled { opacity: 0.6; cursor: not-allowed; }

  .ag-section { margin-bottom: 32px; }
  .ag-section-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px; }
  .ag-section-title { font-family: 'Playfair Display', serif; font-size: 20px; font-weight: 700; color: #fff; }
  .ag-count { font-size: 12px; color: rgba(240,237,232,0.35); background: rgba(255,255,255,0.05); padding: 4px 12px; border-radius: 100px; }

  .ag-tours-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 14px; }
  .ag-tour-card { background: #131918; border: 1px solid rgba(255,255,255,0.07); border-radius: 16px; overflow: hidden; transition: transform 0.2s, border-color 0.2s; }
  .ag-tour-card:hover { transform: translateY(-3px); border-color: rgba(168,217,107,0.2); }
  .ag-tour-img { width: 100%; height: 140px; object-fit: cover; display: block; }
  .ag-tour-body { padding: 14px 16px; }
  .ag-tour-top { display: flex; align-items: flex-start; justify-content: space-between; gap: 8px; margin-bottom: 6px; }
  .ag-tour-name { font-size: 15px; font-weight: 600; color: #fff; flex: 1; }
  .ag-tour-meta { font-size: 12px; color: rgba(240,237,232,0.4); margin-bottom: 8px; }
  .ag-tour-price { font-size: 15px; font-weight: 700; color: #a8d96b; }
  .ag-tour-price span { font-size: 11px; font-weight: 400; color: rgba(240,237,232,0.35); }
  .ag-rejection { font-size: 12px; color: #f87171; margin-top: 8px; background: rgba(248,113,113,0.08); padding: 6px 10px; border-radius: 8px; }

  .ag-badge { font-size: 11px; font-weight: 700; padding: 3px 10px; border-radius: 100px; text-transform: capitalize; white-space: nowrap; flex-shrink: 0; }

  .ag-bookings { display: flex; flex-direction: column; gap: 10px; }
  .ag-booking-row { background: #131918; border: 1px solid rgba(255,255,255,0.07); border-radius: 14px; padding: 14px 18px; display: flex; align-items: center; justify-content: space-between; gap: 14px; flex-wrap: wrap; transition: border-color 0.2s; }
  .ag-booking-row:hover { border-color: rgba(168,217,107,0.15); }
  .ag-booking-info { flex: 1; min-width: 140px; }
  .ag-booking-info b { font-size: 14px; color: #fff; display: block; margin-bottom: 3px; }
  .ag-booking-meta { font-size: 12px; color: rgba(240,237,232,0.4); }
  .ag-booking-right { display: flex; align-items: center; gap: 10px; }
  .ag-booking-amount { font-size: 15px; font-weight: 700; color: #a8d96b; }

  .ag-empty { background: #131918; border: 1px solid rgba(255,255,255,0.07); border-radius: 14px; padding: 20px 18px; font-size: 13px; color: rgba(240,237,232,0.4); }
  .ag-skeleton { background: linear-gradient(90deg, #131918 25%, #1a2218 50%, #131918 75%); background-size: 200% 100%; animation: shimmer 1.4s infinite; border-radius: 14px; height: 64px; margin-bottom: 10px; }
  @keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }

  .ag-pending-card { background: #131918; border: 1px solid rgba(255,255,255,0.07); border-radius: 20px; padding: 40px; text-align: center; max-width: 480px; margin: 60px auto; }
  .ag-pending-icon { font-size: 48px; margin-bottom: 16px; }
  .ag-pending-card h2 { font-family: 'Playfair Display', serif; color: #fff; margin-bottom: 12px; }
  .ag-pending-card p { color: rgba(240,237,232,0.5); font-size: 14px; line-height: 1.6; }

  @media (max-width: 600px) { .ag-wrap { padding: 24px 16px 40px; } .ag-tours-grid { grid-template-columns: 1fr; } }
`;