import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api/client";

function getUser() {
  try { return JSON.parse(localStorage.getItem('user') || 'null'); } catch { return null; }
}

const ICONS = {
  dashboard: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>,
  tours: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/><line x1="8" y1="2" x2="8" y2="18"/><line x1="16" y1="6" x2="16" y2="22"/></svg>,
  bookings: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg>,
  add: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>,
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
  bell: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></svg>,
  home: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
};

const categories = ["Adventure", "Cultural", "Wildlife", "Trekking", "Pilgrimage", "Family", "Luxury", "General"];
const EMPTY_FORM = { title: "", destination: "", category: "Adventure", duration_days: 3, price_usd: 199, image_url: "", description: "", latitude: "", longitude: "" };

function NotificationBell() {
  const [notifs, setNotifs] = useState([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropRef = useRef(null);
  const unread = notifs.filter(n => !n.is_read).length;

  async function fetchNotifs() {
    setLoading(true);
    try {
      const res = await api.get('/api/notifications');
      setNotifs(res.data.items || []);
    } catch { }
    finally { setLoading(false); }
  }

  async function markRead(id) {
    try {
      await api.post(`/api/notifications/${id}/read`);
      setNotifs(prev => prev.map(n => n.id === id ? { ...n, is_read: 1 } : n));
    } catch { }
  }

  async function markAllRead() {
    const ids = notifs.filter(n => !n.is_read).map(n => n.id);
    await Promise.all(ids.map(id => api.post(`/api/notifications/${id}/read`)));
    setNotifs(prev => prev.map(n => ({ ...n, is_read: 1 })));
  }

  useEffect(() => {
    fetchNotifs();
    const iv = setInterval(fetchNotifs, 30000);
    return () => clearInterval(iv);
  }, []);

  useEffect(() => {
    function handler(e) {
      if (dropRef.current && !dropRef.current.contains(e.target)) setOpen(false);
    }
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
            {!loading && notifs.length === 0 && <div className="ag-notif-empty"><span style={{fontSize:28}}>🔕</span><span>No notifications yet</span></div>}
            {notifs.map(n => (
              <div key={n.id} className={`ag-notif-item ${!n.is_read ? 'unread' : ''}`} onClick={() => !n.is_read && markRead(n.id)}>
                <div className="ag-notif-icon">{n.category?.includes('payment') ? '💳' : '📋'}</div>
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
  const user = getUser();
  const [form, setForm] = useState(EMPTY_FORM);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

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
    } finally { setLoading(false); }
  }

  useEffect(() => {
    const token = localStorage.getItem('sjp_token');
    const u = getUser();
    if (!token || !u) { nav('/agency-login'); return; }
    if (u.role !== 'agency') { nav('/dashboard'); return; }
    load();
  }, []);

  async function confirmBooking(id) {
    setActionLoading(id + '-confirm');
    try {
      await api.post(`/api/agency/bookings/${id}/confirm`);
      setSuccessMsg("Booking confirmed! Customer notified.");
      setTimeout(() => setSuccessMsg(""), 4000);
      await load();
    } catch (e) { setErr(e?.response?.data?.error || "Failed to confirm"); }
    finally { setActionLoading(null); }
  }

  async function rejectBooking(id) {
    const reason = prompt("Rejection reason (optional):") ?? "Rejected by agency";
    setActionLoading(id + '-reject');
    try {
      await api.post(`/api/agency/bookings/${id}/reject`, { reason });
      setSuccessMsg("Booking rejected. Customer notified.");
      setTimeout(() => setSuccessMsg(""), 4000);
      await load();
    } catch (e) { setErr(e?.response?.data?.error || "Failed to reject"); }
    finally { setActionLoading(null); }
  }

  function handleFileSelect(e) {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    if (selectedFiles.length + files.length > 5) { setErr("Maximum 5 images!"); return; }
    setSelectedFiles(prev => [...prev, ...files]);
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (ev) => setPreviews(prev => [...prev, { url: ev.target.result, name: file.name }]);
      reader.readAsDataURL(file);
    });
  }

  function removeImage(index) {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    setPreviews(prev => prev.filter((_, i) => i !== index));
  }

  async function uploadImages() {
    if (!selectedFiles.length) return [];
    setUploading(true);
    try {
      const formData = new FormData();
      selectedFiles.forEach(file => formData.append('images[]', file));
      const res = await api.post('/api/upload/images', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      return res.data.urls || [];
    } catch (ex) { setErr(ex?.response?.data?.error || "Upload failed"); return []; }
    finally { setUploading(false); }
  }

  async function createTour(e) {
    e.preventDefault();
    setErr(""); setSubmitting(true);
    try {
      let imageUrl = form.image_url;
      if (selectedFiles.length > 0) {
        const urls = await uploadImages();
        if (urls.length > 0) imageUrl = urls[0];
      }
      await api.post("/api/agency/tours", { ...form, image_url: imageUrl, latitude: form.latitude ? Number(form.latitude) : null, longitude: form.longitude ? Number(form.longitude) : null });
      setForm(EMPTY_FORM); setSelectedFiles([]); setPreviews([]);
      setSuccessMsg("Tour submitted for admin review!");
      setTimeout(() => setSuccessMsg(""), 4000);
      setActiveTab('tours');
      await load();
    } catch (ex) { setErr(ex?.response?.data?.error || "Failed to create tour"); }
    finally { setSubmitting(false); }
  }

  const approvedCount   = myTours.filter(t => t.approval_status === 'approved').length;
  const pendingCount    = myTours.filter(t => t.approval_status === 'pending').length;
  const rejectedCount   = myTours.filter(t => t.approval_status === 'rejected').length;
  const pendingBookings = bookings.filter(b => b.status === 'pending').length;

  function statusColor(s) {
    if (s === 'approved') return '#a8d96b';
    if (s === 'pending')  return '#f59e0b';
    if (s === 'rejected') return '#f87171';
    return '#94a3b8';
  }
  function bColor(s) {
    if (s === 'confirmed') return '#a8d96b';
    if (s === 'pending')   return '#f59e0b';
    if (s === 'cancelled') return '#f87171';
    if (s === 'paid')      return '#60a5fa';
    return '#94a3b8';
  }

  if (user && user.verification_status && user.verification_status !== 'verified' && user.verification_status !== null) {
    return (
      <>
        <style>{styles}</style>
        <div className="ag-verify-wrap">
          <div className="ag-verify-card">
            <div className="ag-verify-icon">{ICONS.clock}</div>
            <h2>Pending Verification</h2>
            <p>Your agency account is <b>{user.verification_status}</b>. Dashboard unlocks after admin approval.</p>
          </div>
        </div>
      </>
    );
  }

  const agencyName = user?.full_name || user?.name || 'Agency';
  const initials = agencyName.slice(0, 2).toUpperCase();
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: ICONS.dashboard },
    { id: 'tours',     label: 'My Tours',  icon: ICONS.tours },
    { id: 'bookings',  label: 'Bookings',  icon: ICONS.bookings },
    { id: 'add',       label: 'Add Tour',  icon: ICONS.add },
  ];

  function logout() {
    localStorage.removeItem('sjp_token');
    localStorage.removeItem('user');
    window.location.href = '/agency-login';
  }

  return (
    <>
      <style>{styles}</style>
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
                onClick={() => { setActiveTab(item.id); setSidebarOpen(false); }}>
                <span className="ag-nav-icon">{item.icon}</span>
                <span>{item.label}</span>
                {item.id === 'bookings' && pendingBookings > 0 &&
                  <span className="ag-nav-badge">{pendingBookings}</span>}
              </button>
            ))}
          </nav>
          <div className="ag-sidebar-footer">
            <a href="/" className="ag-home-link">{ICONS.home} <span>Back to Home</span></a>
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
                <h1 className="ag-page-title">
                  {activeTab === 'dashboard' ? 'Dashboard' : activeTab === 'tours' ? 'My Tours' : activeTab === 'bookings' ? 'Bookings' : 'Add Tour'}
                </h1>
                <p className="ag-page-sub">Welcome back, <b style={{color:'#a8d96b'}}>{agencyName}</b></p>
              </div>
            </div>
            <div className="ag-topbar-right">
              {activeTab !== 'add' && (
                <button className="ag-add-btn" onClick={() => setActiveTab('add')}>{ICONS.add} <span>Add Tour</span></button>
              )}
              <NotificationBell />
              <div className="ag-avatar">{initials}</div>
            </div>
          </div>

          {err && <div className="ag-alert ag-alert-err">{err}</div>}
          {successMsg && <div className="ag-alert ag-alert-ok">&#10003; {successMsg}</div>}

          {activeTab === 'dashboard' && (
            <div className="ag-content">
              <div className="ag-stats">
                {[
                  { num: myTours.length,  label: 'Total Tours',    icon: ICONS.map,   color: '#a8d96b' },
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
                  <div className="ag-card-head">
                    <span className="ag-card-title">Recent Tours</span>
                    <button className="ag-viewall" onClick={() => setActiveTab('tours')}>View all</button>
                  </div>
                  {loading ? <div className="ag-skeleton" /> : myTours.length === 0 ? (
                    <div className="ag-empty-sm">No tours yet. <button className="ag-link" onClick={() => setActiveTab('add')}>Add your first</button></div>
                  ) : myTours.slice(0, 5).map(t => (
                    <div key={t.id} className="ag-mini-row">
                      <div className="ag-mini-dot" style={{ background: statusColor(t.approval_status) }} />
                      <div className="ag-mini-info">
                        <span className="ag-mini-name">{t.title}</span>
                        <span className="ag-mini-meta">{t.destination} · {t.duration_days}d</span>
                      </div>
                      <span className="ag-mini-badge" style={{ background: statusColor(t.approval_status)+'22', color: statusColor(t.approval_status) }}>{t.approval_status}</span>
                    </div>
                  ))}
                </div>
                <div className="ag-card">
                  <div className="ag-card-head">
                    <span className="ag-card-title">Recent Bookings</span>
                    <button className="ag-viewall" onClick={() => setActiveTab('bookings')}>View all</button>
                  </div>
                  {loading ? <div className="ag-skeleton" /> : bookings.length === 0 ? (
                    <div className="ag-empty-sm">No bookings yet.</div>
                  ) : bookings.slice(0, 5).map(b => (
                    <div key={b.id} className="ag-mini-row">
                      <div className="ag-mini-avatar">{(b.customer_name || 'C')[0].toUpperCase()}</div>
                      <div className="ag-mini-info">
                        <span className="ag-mini-name">{b.customer_name}</span>
                        <span className="ag-mini-meta">{b.title}</span>
                      </div>
                      <span className="ag-mini-badge" style={{background: bColor(b.status)+'22', color: bColor(b.status)}}>{b.status}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'tours' && (
            <div className="ag-content">
              <div className="ag-filter-row">
                {[
                  { key: 'all', label: `All (${myTours.length})` },
                  { key: 'approved', label: `Approved (${approvedCount})` },
                  { key: 'pending', label: `Pending (${pendingCount})` },
                  { key: 'rejected', label: `Rejected (${rejectedCount})` },
                ].map(f => <span key={f.key} className="ag-filter-btn">{f.label}</span>)}
              </div>
              {loading ? (
                <div className="ag-tours-grid">{[1,2,3].map(i => <div key={i} className="ag-skeleton" style={{height:220}} />)}</div>
              ) : myTours.length === 0 ? (
                <div className="ag-empty-full">
                  <div className="ag-empty-icon">{ICONS.map}</div>
                  <h3>No tours yet</h3>
                  <p>Add your first tour package to get started</p>
                  <button className="ag-add-btn" onClick={() => setActiveTab('add')}>{ICONS.add} <span>Add Tour</span></button>
                </div>
              ) : (
                <div className="ag-tours-grid">
                  {myTours.map(t => (
                    <div key={t.id} className="ag-tour-card">
                      <div className="ag-tour-img-wrap">
                        {t.image_url ? <img className="ag-tour-img" src={t.image_url} alt={t.title} /> : <div className="ag-tour-img-ph">{ICONS.img}</div>}
                        <span className="ag-tour-badge" style={{ background: statusColor(t.approval_status), color: '#0a0e0d' }}>{t.approval_status}</span>
                      </div>
                      <div className="ag-tour-body">
                        <h3 className="ag-tour-name">{t.title}</h3>
                        <div className="ag-tour-meta">{t.destination} · {t.category}</div>
                        <div className="ag-tour-row">
                          <span className="ag-tour-days">{t.duration_days} days</span>
                          <span className="ag-tour-price">${Number(t.price_usd).toFixed(0)}</span>
                        </div>
                        {t.approval_status === 'rejected' && t.rejection_reason && (
                          <div className="ag-rejection">{t.rejection_reason}</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'bookings' && (
            <div className="ag-content">
              {loading ? [1,2,3].map(i => <div key={i} className="ag-skeleton" style={{marginBottom:10}} />) :
               bookings.length === 0 ? (
                <div className="ag-empty-full">
                  <div className="ag-empty-icon">{ICONS.bag}</div>
                  <h3>No bookings yet</h3>
                  <p>Customer bookings will appear once your tours are approved</p>
                </div>
              ) : bookings.map(b => (
                <div key={b.id} className="ag-booking-card">
                  <div className="ag-booking-top">
                    <div className="ag-booking-customer">
                      <div className="ag-mini-avatar">{(b.customer_name||'C')[0].toUpperCase()}</div>
                      <div>
                        <div className="ag-mini-name">{b.customer_name}</div>
                        <div className="ag-mini-meta">{b.customer_email}</div>
                      </div>
                    </div>
                    <span className="ag-mini-badge" style={{background: bColor(b.status)+'22', color: bColor(b.status), fontSize:12, padding:'4px 14px'}}>{b.status}</span>
                  </div>
                  <div className="ag-booking-info-row">
                    <div>
                      <div className="ag-booking-tour">{b.title}</div>
                      <div className="ag-mini-meta">{b.destination} · Code: {b.booking_code}</div>
                    </div>
                    <div className="ag-booking-amount">NPR {new Intl.NumberFormat('en-NP').format(Math.round(Number(b.total_usd||0)*133))}</div>
                  </div>
                  {b.status === 'pending' && (
                    <div className="ag-booking-actions">
                      <button className="ag-confirm-btn" onClick={() => confirmBooking(b.id)} disabled={actionLoading === b.id+'-confirm'}>
                        {actionLoading === b.id+'-confirm' ? 'Confirming...' : '✓ Confirm'}
                      </button>
                      <button className="ag-reject-btn" onClick={() => rejectBooking(b.id)} disabled={actionLoading === b.id+'-reject'}>
                        {actionLoading === b.id+'-reject' ? 'Rejecting...' : '✕ Reject'}
                      </button>
                    </div>
                  )}
                  {b.status === 'confirmed' && <div className="ag-booking-note">✓ Confirmed — Waiting for customer payment</div>}
                  {b.status === 'paid' && <div className="ag-booking-note" style={{color:'#60a5fa',borderColor:'rgba(96,165,250,0.2)',background:'rgba(96,165,250,0.05)'}}>💳 Payment received!</div>}
                  {b.status === 'cancelled' && <div className="ag-booking-note" style={{color:'#f87171',borderColor:'rgba(248,113,113,0.2)',background:'rgba(248,113,113,0.05)'}}>✕ Rejected</div>}
                </div>
              ))}
            </div>
          )}

          {activeTab === 'add' && (
            <div className="ag-content">
              <div className="ag-form-card">
                <div className="ag-form-header">
                  <div>
                    <h2 className="ag-form-title">New Tour Package</h2>
                    <p className="ag-form-sub">Submit your tour — admin will review before it goes live</p>
                  </div>
                  <button className="ag-close-btn" onClick={() => setActiveTab('dashboard')}>{ICONS.close}</button>
                </div>
                <form onSubmit={createTour} className="ag-form">
                  <div className="ag-form-section">Basic Info</div>
                  <div className="ag-form-row2">
                    <div className="ag-field"><label>Tour Title *</label><input className="ag-input" value={form.title} onChange={e => setForm(f => ({...f, title: e.target.value}))} placeholder="e.g. Everest Base Camp Trek" required /></div>
                    <div className="ag-field"><label>Destination *</label><input className="ag-input" value={form.destination} onChange={e => setForm(f => ({...f, destination: e.target.value}))} placeholder="e.g. Solukhumbu, Nepal" required /></div>
                  </div>
                  <div className="ag-form-section">Details</div>
                  <div className="ag-form-row3">
                    <div className="ag-field"><label>Category *</label><select className="ag-input" value={form.category} onChange={e => setForm(f => ({...f, category: e.target.value}))}>{categories.map(c => <option key={c}>{c}</option>)}</select></div>
                    <div className="ag-field"><label>Duration (days) *</label><input className="ag-input" type="number" min="1" value={form.duration_days} onChange={e => setForm(f => ({...f, duration_days: +e.target.value}))} required /></div>
                    <div className="ag-field"><label>Price (USD) *</label><input className="ag-input" type="number" min="0" step="0.01" value={form.price_usd} onChange={e => setForm(f => ({...f, price_usd: +e.target.value}))} required /></div>
                  </div>
                  <div className="ag-form-section">Location</div>
                  <div className="ag-form-row2">
                    <div className="ag-field"><label>Latitude</label><input className="ag-input" type="number" step="any" value={form.latitude} onChange={e => setForm(f => ({...f, latitude: e.target.value}))} placeholder="e.g. 27.9881" /></div>
                    <div className="ag-field"><label>Longitude</label><input className="ag-input" type="number" step="any" value={form.longitude} onChange={e => setForm(f => ({...f, longitude: e.target.value}))} placeholder="e.g. 86.9250" /></div>
                  </div>
                  <div className="ag-lat-hint">Tip: Google Maps → right click → coordinates copy gara</div>
                  <div className="ag-form-section">Photos</div>
                  <div className="ag-upload-area" onClick={() => fileInputRef.current?.click()}
                    onDragOver={e => { e.preventDefault(); e.currentTarget.classList.add('drag'); }}
                    onDragLeave={e => e.currentTarget.classList.remove('drag')}
                    onDrop={e => { e.preventDefault(); e.currentTarget.classList.remove('drag'); const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/')); if (files.length) handleFileSelect({ target: { files } }); }}>
                    <div className="ag-upload-icon">{ICONS.upload}</div>
                    <div className="ag-upload-text">Click to select or drag & drop photos</div>
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
                  <div className="ag-field"><label>Or paste Image URL</label><input className="ag-input" value={form.image_url} onChange={e => setForm(f => ({...f, image_url: e.target.value}))} placeholder="https://..." /></div>
                  <div className="ag-form-section">Description</div>
                  <div className="ag-field"><label>Description</label><textarea className="ag-input ag-textarea" value={form.description} onChange={e => setForm(f => ({...f, description: e.target.value}))} placeholder="Describe your tour..." /></div>
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
  .ag-home-link{display:flex;align-items:center;gap:10px;padding:9px 12px;border-radius:10px;color:rgba(232,228,223,0.45);font-size:13px;font-weight:500;text-decoration:none;transition:all 0.16s;}
  .ag-home-link:hover{background:rgba(255,255,255,0.05);color:#e8e4df;}
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
  .ag-avatar{width:34px;height:34px;border-radius:9px;background:linear-gradient(135deg,#a8d96b,#5fa832);color:#0a0e0d;font-size:13px;font-weight:700;display:flex;align-items:center;justify-content:center;}
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
  .ag-notif-list::-webkit-scrollbar{width:3px;}
  .ag-notif-list::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.1);border-radius:10px;}
  .ag-notif-empty{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;padding:36px 20px;color:rgba(232,228,223,0.3);font-size:13px;}
  .ag-notif-item{display:flex;align-items:flex-start;gap:12px;padding:12px 16px;border-bottom:1px solid rgba(255,255,255,0.04);cursor:pointer;transition:background 0.16s;position:relative;}
  .ag-notif-item:last-child{border-bottom:none;}
  .ag-notif-item:hover{background:rgba(255,255,255,0.03);}
  .ag-notif-item.unread{background:rgba(168,217,107,0.04);}
  .ag-notif-icon{font-size:18px;flex-shrink:0;margin-top:1px;}
  .ag-notif-body{flex:1;min-width:0;}
  .ag-notif-ntitle{font-size:13px;font-weight:600;color:#e8e4df;margin-bottom:3px;}
  .ag-notif-nbody{font-size:12px;color:rgba(232,228,223,0.45);line-height:1.4;margin-bottom:4px;}
  .ag-notif-time{font-size:10px;color:rgba(232,228,223,0.25);}
  .ag-notif-dot{width:7px;height:7px;border-radius:50%;background:#a8d96b;flex-shrink:0;margin-top:4px;}
  .ag-alert{padding:11px 18px;border-radius:10px;margin:14px 28px 0;font-size:13px;font-weight:500;}
  .ag-alert-err{background:rgba(248,113,113,0.1);border:1px solid rgba(248,113,113,0.25);color:#f87171;}
  .ag-alert-ok{background:rgba(168,217,107,0.1);border:1px solid rgba(168,217,107,0.25);color:#a8d96b;}
  .ag-content{padding:26px 28px 60px;}
  .ag-stats{display:grid;grid-template-columns:repeat(auto-fill,minmax(185px,1fr));gap:14px;margin-bottom:26px;}
  .ag-stat-card{background:#0d1210;border:1px solid rgba(255,255,255,0.06);border-radius:18px;padding:20px 18px;position:relative;overflow:hidden;transition:transform 0.2s,border-color 0.2s;}
  .ag-stat-card:hover{transform:translateY(-3px);border-color:rgba(168,217,107,0.18);}
  .ag-stat-icon-wrap{color:var(--accent);margin-bottom:14px;}
  .ag-stat-num{font-family:'Playfair Display',serif;font-size:34px;font-weight:700;color:var(--accent);line-height:1;margin-bottom:5px;}
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
  .ag-mini-info{flex:1;min-width:0;}
  .ag-mini-name{display:block;font-size:13px;font-weight:600;color:#fff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
  .ag-mini-meta{display:block;font-size:11px;color:rgba(232,228,223,0.3);margin-top:1px;}
  .ag-mini-badge{font-size:10px;font-weight:600;padding:3px 9px;border-radius:100px;text-transform:capitalize;white-space:nowrap;flex-shrink:0;}
  .ag-mini-price{font-size:13px;font-weight:600;color:#a8d96b;flex-shrink:0;}
  .ag-empty-sm{font-size:13px;color:rgba(232,228,223,0.3);padding:10px 0;}
  .ag-link{background:none;border:none;color:#a8d96b;cursor:pointer;font-size:13px;font-family:'DM Sans',sans-serif;text-decoration:underline;padding:0;}
  .ag-filter-row{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:18px;}
  .ag-filter-btn{background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);color:rgba(232,228,223,0.45);font-size:12px;font-weight:500;padding:5px 14px;border-radius:100px;}
  .ag-tours-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:16px;}
  .ag-tour-card{background:#0d1210;border:1px solid rgba(255,255,255,0.06);border-radius:18px;overflow:hidden;transition:transform 0.2s,border-color 0.2s;}
  .ag-tour-card:hover{transform:translateY(-3px);border-color:rgba(168,217,107,0.18);}
  .ag-tour-img-wrap{position:relative;}
  .ag-tour-img{width:100%;height:150px;object-fit:cover;display:block;}
  .ag-tour-img-ph{width:100%;height:150px;background:rgba(168,217,107,0.04);display:flex;align-items:center;justify-content:center;color:rgba(168,217,107,0.2);}
  .ag-tour-badge{position:absolute;top:10px;right:10px;font-size:10px;font-weight:700;padding:3px 10px;border-radius:100px;text-transform:capitalize;}
  .ag-tour-body{padding:14px 16px;}
  .ag-tour-name{font-family:'Playfair Display',serif;font-size:15px;font-weight:700;color:#fff;margin:0 0 4px;}
  .ag-tour-meta{font-size:11px;color:rgba(232,228,223,0.38);margin-bottom:10px;}
  .ag-tour-row{display:flex;align-items:center;justify-content:space-between;}
  .ag-tour-days{font-size:12px;color:rgba(232,228,223,0.38);font-weight:500;}
  .ag-tour-price{font-size:17px;font-weight:700;color:#a8d96b;font-family:'Playfair Display',serif;}
  .ag-rejection{font-size:11px;color:#f87171;margin-top:8px;background:rgba(248,113,113,0.07);padding:5px 9px;border-radius:7px;}
  .ag-booking-card{background:#0d1210;border:1px solid rgba(255,255,255,0.06);border-radius:16px;padding:18px 20px;margin-bottom:12px;transition:border-color 0.2s;}
  .ag-booking-card:hover{border-color:rgba(168,217,107,0.12);}
  .ag-booking-top{display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;gap:10px;}
  .ag-booking-customer{display:flex;align-items:center;gap:10px;}
  .ag-booking-info-row{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:14px;flex-wrap:wrap;}
  .ag-booking-tour{font-size:14px;font-weight:600;color:#fff;margin-bottom:3px;}
  .ag-booking-amount{font-family:'Playfair Display',serif;font-size:18px;font-weight:700;color:#a8d96b;flex-shrink:0;}
  .ag-booking-actions{display:flex;gap:10px;}
  .ag-confirm-btn{background:#a8d96b;color:#0a0e0d;border:none;border-radius:100px;padding:9px 20px;font-family:'DM Sans',sans-serif;font-size:13px;font-weight:700;cursor:pointer;transition:background 0.2s,transform 0.15s;}
  .ag-confirm-btn:hover:not(:disabled){background:#c1e88d;transform:scale(1.03);}
  .ag-confirm-btn:disabled{opacity:0.5;cursor:not-allowed;}
  .ag-reject-btn{background:rgba(248,113,113,0.1);color:#f87171;border:1px solid rgba(248,113,113,0.25);border-radius:100px;padding:9px 20px;font-family:'DM Sans',sans-serif;font-size:13px;font-weight:600;cursor:pointer;transition:background 0.2s;}
  .ag-reject-btn:hover:not(:disabled){background:rgba(248,113,113,0.2);}
  .ag-reject-btn:disabled{opacity:0.5;cursor:not-allowed;}
  .ag-booking-note{font-size:12px;color:#a8d96b;background:rgba(168,217,107,0.06);border:1px solid rgba(168,217,107,0.15);border-radius:8px;padding:7px 12px;}
  .ag-empty-full{text-align:center;padding:60px 20px;}
  .ag-empty-icon{display:flex;justify-content:center;margin-bottom:12px;color:rgba(168,217,107,0.25);}
  .ag-empty-full h3{font-family:'Playfair Display',serif;font-size:20px;color:#fff;margin:0 0 8px;}
  .ag-empty-full p{font-size:13px;color:rgba(232,228,223,0.35);margin-bottom:20px;}
  .ag-form-card{background:#0d1210;border:1px solid rgba(168,217,107,0.1);border-radius:22px;padding:28px;max-width:760px;}
  .ag-form-header{display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:24px;gap:14px;}
  .ag-form-title{font-family:'Playfair Display',serif;font-size:20px;font-weight:700;color:#fff;margin:0 0 5px;}
  .ag-form-sub{font-size:13px;color:rgba(232,228,223,0.35);margin:0;}
  .ag-close-btn{background:rgba(255,255,255,0.05);border:none;color:rgba(232,228,223,0.45);width:30px;height:30px;border-radius:8px;cursor:pointer;display:flex;align-items:center;justify-content:center;flex-shrink:0;transition:background 0.16s;}
  .ag-close-btn:hover{background:rgba(248,113,113,0.1);color:#f87171;}
  .ag-form{display:flex;flex-direction:column;gap:14px;}
  .ag-form-section{font-size:10px;font-weight:600;letter-spacing:0.12em;text-transform:uppercase;color:rgba(168,217,107,0.5);border-bottom:1px solid rgba(168,217,107,0.1);padding-bottom:7px;margin-top:4px;}
  .ag-form-row2{display:grid;grid-template-columns:1fr 1fr;gap:12px;}
  .ag-form-row3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;}
  .ag-field{display:flex;flex-direction:column;gap:6px;}
  .ag-field label{font-size:11px;font-weight:600;color:rgba(232,228,223,0.38);letter-spacing:0.05em;text-transform:uppercase;}
  .ag-input{background:#080c0b;border:1px solid rgba(255,255,255,0.09);border-radius:10px;color:#e8e4df;font-family:'DM Sans',sans-serif;font-size:14px;padding:10px 14px;outline:none;transition:border-color 0.2s;width:100%;box-sizing:border-box;}
  .ag-input:focus{border-color:rgba(168,217,107,0.4);}
  .ag-textarea{min-height:90px;resize:vertical;}
  select.ag-input{cursor:pointer;}
  .ag-lat-hint{font-size:11px;color:rgba(168,217,107,0.45);background:rgba(168,217,107,0.05);border:1px solid rgba(168,217,107,0.1);border-radius:8px;padding:8px 12px;}
  .ag-upload-area{border:2px dashed rgba(168,217,107,0.2);border-radius:14px;padding:32px 20px;text-align:center;cursor:pointer;transition:all 0.2s;background:rgba(168,217,107,0.02);}
  .ag-upload-area:hover,.ag-upload-area.drag{border-color:rgba(168,217,107,0.5);background:rgba(168,217,107,0.06);}
  .ag-upload-icon{display:flex;justify-content:center;color:rgba(168,217,107,0.5);margin-bottom:10px;}
  .ag-upload-text{font-size:14px;font-weight:600;color:rgba(232,228,223,0.7);margin-bottom:4px;}
  .ag-upload-sub{font-size:11px;color:rgba(232,228,223,0.3);}
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
  .ag-submit-btn:hover:not(:disabled){background:#c1e88d;}
  .ag-submit-btn:disabled{opacity:0.5;cursor:not-allowed;}
  .ag-skeleton{background:linear-gradient(90deg,#0d1210 25%,#131a18 50%,#0d1210 75%);background-size:200% 100%;animation:shimmer 1.4s infinite;border-radius:14px;height:60px;}
  @keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}
  .ag-verify-wrap{min-height:80vh;display:flex;align-items:center;justify-content:center;font-family:'DM Sans',sans-serif;}
  .ag-verify-card{background:#0d1210;border:1px solid rgba(255,255,255,0.06);border-radius:22px;padding:44px;text-align:center;max-width:420px;}
  .ag-verify-icon{display:flex;justify-content:center;margin-bottom:16px;color:rgba(168,217,107,0.5);}
  .ag-verify-card h2{font-family:'Playfair Display',serif;color:#fff;margin:0 0 10px;font-size:22px;}
  .ag-verify-card p{color:rgba(232,228,223,0.42);font-size:14px;line-height:1.7;margin:0;}
  @media(max-width:880px){.ag-sidebar{transform:translateX(-100%)}.ag-sidebar.open{transform:translateX(0)}.ag-main{margin-left:0}.ag-hamburger{display:flex}.ag-two-col{grid-template-columns:1fr}.ag-form-row2,.ag-form-row3{grid-template-columns:1fr}.ag-content{padding:18px 16px 40px}.ag-topbar{padding:14px 16px}.ag-alert{margin:10px 16px 0}.ag-notif-drop{width:calc(100vw - 32px);right:-60px;}}
  @media(max-width:520px){.ag-stats{grid-template-columns:1fr 1fr}.ag-tours-grid{grid-template-columns:1fr}.ag-add-btn span{display:none}}
`;