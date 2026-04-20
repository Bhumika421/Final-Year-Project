import { useEffect, useState } from 'react';
import { api, getToken } from '../api/client';

function timeAgo(d) {
  const diff = Math.floor((Date.now() - new Date(d)) / 1000);
  if (diff < 60) return 'Just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return new Date(d).toLocaleDateString('en-NP', { day: 'numeric', month: 'short', year: 'numeric' });
}

function getCategoryMeta(cat) {
  if (!cat) return { icon: '🔔', accent: '#a8d96b', bg: 'rgba(168,217,107,0.12)', label: 'general' };
  if (cat.includes('payment') || cat.includes('paid'))
    return { icon: '💳', accent: '#60a5fa', bg: 'rgba(96,165,250,0.12)', label: 'payment' };
  if (cat.includes('booking'))
    return { icon: '📋', accent: '#a8d96b', bg: 'rgba(168,217,107,0.12)', label: 'booking' };
  if (cat.includes('offer') || cat.includes('promo'))
    return { icon: '🎁', accent: '#fbbf24', bg: 'rgba(251,191,36,0.12)', label: 'offer' };
  if (cat.includes('support'))
    return { icon: '💬', accent: '#a78bfa', bg: 'rgba(167,139,250,0.12)', label: 'support' };
  if (cat.includes('alert'))
    return { icon: '⚠️', accent: '#f87171', bg: 'rgba(248,113,113,0.12)', label: 'alert' };
  return { icon: '🔔', accent: '#a8d96b', bg: 'rgba(168,217,107,0.12)', label: cat };
}

export default function Notifications() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');
  const [filter, setFilter] = useState('all');

  async function load() {
    setMsg('');
    if (!getToken()) { setMsg('Please login first.'); setLoading(false); return; }
    try {
      const res = await api.get('/api/notifications');
      setItems(res.data.items || []);
    } catch {
      setMsg('Failed to load notifications.');
    } finally {
      setLoading(false);
    }
  }

  async function markRead(id) {
    await api.post(`/api/notifications/${id}/read`);
    setItems(prev => prev.map(n => n.id === id ? { ...n, is_read: 1 } : n));
  }

  async function markAllRead() {
    const unread = items.filter(n => !n.is_read);
    await Promise.all(unread.map(n => api.post(`/api/notifications/${n.id}/read`)));
    setItems(prev => prev.map(n => ({ ...n, is_read: 1 })));
  }

  useEffect(() => { load(); }, []);

  const unreadCount = items.filter(n => !n.is_read).length;
  const filtered = filter === 'unread' ? items.filter(n => !n.is_read) : items;

  if (msg) return (
    <div style={{ maxWidth: 680, margin: '80px auto', padding: '0 24px', fontFamily: "'DM Sans', sans-serif", color: '#f87171', textAlign: 'center', fontSize: 14 }}>
      {msg}
    </div>
  );

  return (
    <>
      <style>{css}</style>
      <div className="nf-wrap">

        {/* Hero Header */}
        <div className="nf-hero">
          <div className="nf-hero-left">
            <div className="nf-eyebrow">
              <span className="nf-eyebrow-dot" />
              Activity Feed
            </div>
            <h1 className="nf-title">Notifications</h1>
            <p className="nf-sub">Stay updated with your bookings, payments & alerts.</p>
          </div>
          {unreadCount > 0 && (
            <div className="nf-hero-badge">
              <span className="nf-hero-num">{unreadCount}</span>
              <span className="nf-hero-label">unread</span>
            </div>
          )}
        </div>

        {/* Toolbar */}
        <div className="nf-toolbar">
          <div className="nf-filters">
            {[
              { key: 'all', label: `All`, count: items.length },
              { key: 'unread', label: `Unread`, count: unreadCount },
            ].map(f => (
              <button
                key={f.key}
                className={`nf-filter-btn ${filter === f.key ? 'active' : ''}`}
                onClick={() => setFilter(f.key)}
              >
                {f.label}
                <span className="nf-filter-count">{f.count}</span>
              </button>
            ))}
          </div>
          {unreadCount > 0 && (
            <button className="nf-markall-btn" onClick={markAllRead}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              Mark all read
            </button>
          )}
        </div>

        {/* Notification List */}
        <div className="nf-list">

          {/* Loading Skeletons */}
          {loading && [1, 2, 3, 4].map(i => (
            <div key={i} className="nf-skeleton">
              <div className="nf-sk-icon" />
              <div className="nf-sk-lines">
                <div className="nf-sk-line" style={{ width: '60%' }} />
                <div className="nf-sk-line" style={{ width: '85%', opacity: 0.6 }} />
                <div className="nf-sk-line" style={{ width: '35%', opacity: 0.4 }} />
              </div>
            </div>
          ))}

          {/* Empty State */}
          {!loading && filtered.length === 0 && (
            <div className="nf-empty">
              <div className="nf-empty-ring">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="rgba(168,217,107,0.5)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                  <path d="M13.73 21a2 2 0 01-3.46 0"/>
                  <line x1="1" y1="1" x2="23" y2="23"/>
                </svg>
              </div>
              <div className="nf-empty-title">
                {filter === 'unread' ? 'All caught up!' : 'No notifications yet'}
              </div>
              <div className="nf-empty-sub">
                {filter === 'unread'
                  ? 'You have no unread notifications.'
                  : 'Booking confirmations and updates will appear here.'}
              </div>
            </div>
          )}

          {/* Items */}
          {!loading && filtered.map((n, idx) => {
            const meta = getCategoryMeta(n.category);
            const isUnread = !n.is_read;
            return (
              <div
                key={n.id}
                className={`nf-item ${isUnread ? 'unread' : ''}`}
                style={{ animationDelay: `${idx * 40}ms` }}
              >
                {/* Left accent bar */}
                {isUnread && <div className="nf-accent-bar" style={{ background: meta.accent }} />}

                {/* Icon bubble */}
                <div className="nf-icon-bubble" style={{ background: meta.bg }}>
                  <span style={{ fontSize: 20 }}>{meta.icon}</span>
                </div>

                {/* Content */}
                <div className="nf-content">
                  <div className="nf-content-top">
                    <div className="nf-content-title-row">
                      <span className="nf-content-title">{n.title}</span>
                      {isUnread && <span className="nf-new-dot" style={{ background: meta.accent }} />}
                    </div>
                    <span
                      className="nf-cat-pill"
                      style={{ background: meta.bg, color: meta.accent }}
                    >
                      {meta.label}
                    </span>
                  </div>

                  <p className="nf-content-body">{n.body}</p>

                  <div className="nf-content-footer">
                    <div className="nf-time-wrap">
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                        <circle cx="12" cy="12" r="10"/>
                        <polyline points="12 6 12 12 16 14"/>
                      </svg>
                      {timeAgo(n.created_at)}
                    </div>
                    {isUnread && (
                      <button
                        className="nf-read-btn"
                        style={{ borderColor: meta.accent + '44', color: meta.accent }}
                        onClick={() => markRead(n.id)}
                      >
                        Mark read
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </>
  );
}

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=DM+Sans:wght@300;400;500;600;700&display=swap');

  .nf-wrap { max-width: 700px; margin: 0 auto; padding: 52px 24px 100px; font-family: 'DM Sans', sans-serif; color: #e8e4df; }

  .nf-hero { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 36px; gap: 20px; }
  .nf-hero-left { flex: 1; }
  .nf-eyebrow { display: flex; align-items: center; gap: 8px; font-size: 11px; font-weight: 700; letter-spacing: 0.16em; text-transform: uppercase; color: rgba(168,217,107,0.7); margin-bottom: 12px; }
  .nf-eyebrow-dot { width: 6px; height: 6px; border-radius: 50%; background: #a8d96b; animation: pulse 2s infinite; }
  @keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.5;transform:scale(0.8)} }
  .nf-title { font-family: 'Playfair Display', serif; font-size: clamp(28px,4vw,42px); font-weight: 700; color: #fff; margin: 0 0 10px; line-height: 1.1; }
  .nf-sub { font-size: 13px; color: rgba(232,228,223,0.35); margin: 0; line-height: 1.6; }

  .nf-hero-badge { display: flex; flex-direction: column; align-items: center; justify-content: center; width: 72px; height: 72px; border-radius: 20px; background: rgba(168,217,107,0.08); border: 1px solid rgba(168,217,107,0.2); flex-shrink: 0; }
  .nf-hero-num { font-family: 'Playfair Display', serif; font-size: 28px; font-weight: 700; color: #a8d96b; line-height: 1; }
  .nf-hero-label { font-size: 10px; font-weight: 600; color: rgba(168,217,107,0.5); text-transform: uppercase; letter-spacing: 0.08em; }

  .nf-toolbar { display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; gap: 12px; flex-wrap: wrap; }
  .nf-filters { display: flex; gap: 6px; }
  .nf-filter-btn { display: flex; align-items: center; gap: 8px; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); color: rgba(232,228,223,0.45); font-size: 13px; font-weight: 500; padding: 8px 18px; border-radius: 100px; cursor: pointer; font-family: 'DM Sans', sans-serif; transition: all 0.18s; }
  .nf-filter-btn:hover { background: rgba(255,255,255,0.07); color: #e8e4df; }
  .nf-filter-btn.active { background: rgba(168,217,107,0.1); border-color: rgba(168,217,107,0.3); color: #a8d96b; font-weight: 600; }
  .nf-filter-count { background: rgba(255,255,255,0.08); color: rgba(232,228,223,0.5); font-size: 11px; font-weight: 700; padding: 1px 8px; border-radius: 100px; }
  .nf-filter-btn.active .nf-filter-count { background: rgba(168,217,107,0.15); color: #a8d96b; }

  .nf-markall-btn { display: flex; align-items: center; gap: 7px; background: none; border: 1px solid rgba(168,217,107,0.2); color: rgba(168,217,107,0.65); font-size: 12px; font-weight: 600; padding: 7px 16px; border-radius: 100px; cursor: pointer; font-family: 'DM Sans', sans-serif; transition: all 0.18s; }
  .nf-markall-btn:hover { background: rgba(168,217,107,0.08); color: #a8d96b; border-color: rgba(168,217,107,0.4); }

  .nf-list { display: flex; flex-direction: column; gap: 10px; }

  .nf-skeleton { display: flex; align-items: flex-start; gap: 14px; background: #0d1210; border: 1px solid rgba(255,255,255,0.05); border-radius: 18px; padding: 20px; }
  .nf-sk-icon { width: 48px; height: 48px; border-radius: 14px; background: rgba(255,255,255,0.05); flex-shrink: 0; animation: shimmer 1.5s infinite; }
  .nf-sk-lines { flex: 1; display: flex; flex-direction: column; gap: 8px; padding-top: 4px; }
  .nf-sk-line { height: 12px; border-radius: 6px; background: rgba(255,255,255,0.05); animation: shimmer 1.5s infinite; }
  @keyframes shimmer { 0%,100%{opacity:0.6} 50%{opacity:1} }

  .nf-item { position: relative; display: flex; align-items: flex-start; gap: 16px; background: #0d1210; border: 1px solid rgba(255,255,255,0.06); border-radius: 18px; padding: 20px 20px 18px 22px; transition: border-color 0.2s, transform 0.18s; overflow: hidden; animation: fadeUp 0.35s ease both; }
  @keyframes fadeUp { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
  .nf-item:hover { border-color: rgba(168,217,107,0.15); transform: translateY(-2px); }
  .nf-item.unread { background: #0f1713; }

  .nf-accent-bar { position: absolute; left: 0; top: 14px; bottom: 14px; width: 3px; border-radius: 0 3px 3px 0; }

  .nf-icon-bubble { width: 50px; height: 50px; border-radius: 15px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }

  .nf-content { flex: 1; min-width: 0; }
  .nf-content-top { display: flex; align-items: flex-start; justify-content: space-between; gap: 10px; margin-bottom: 7px; flex-wrap: wrap; }
  .nf-content-title-row { display: flex; align-items: center; gap: 8px; }
  .nf-content-title { font-size: 14px; font-weight: 700; color: #fff; line-height: 1.3; }
  .nf-new-dot { width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0; }
  .nf-cat-pill { font-size: 10px; font-weight: 700; padding: 3px 10px; border-radius: 100px; text-transform: capitalize; letter-spacing: 0.04em; white-space: nowrap; flex-shrink: 0; }

  .nf-content-body { font-size: 13px; color: rgba(232,228,223,0.48); line-height: 1.65; margin: 0 0 12px; }

  .nf-content-footer { display: flex; align-items: center; justify-content: space-between; gap: 10px; }
  .nf-time-wrap { display: flex; align-items: center; gap: 5px; font-size: 11px; color: rgba(232,228,223,0.22); }

  .nf-read-btn { background: none; border: 1px solid; border-radius: 100px; padding: 4px 13px; font-size: 11px; font-weight: 600; cursor: pointer; font-family: 'DM Sans', sans-serif; transition: all 0.16s; opacity: 0.8; }
  .nf-read-btn:hover { opacity: 1; }

  .nf-empty { text-align: center; padding: 64px 20px; background: #0d1210; border: 1px solid rgba(255,255,255,0.05); border-radius: 22px; }
  .nf-empty-ring { width: 72px; height: 72px; border-radius: 50%; border: 1px solid rgba(168,217,107,0.15); background: rgba(168,217,107,0.05); display: flex; align-items: center; justify-content: center; margin: 0 auto 20px; }
  .nf-empty-title { font-family: 'Playfair Display', serif; font-size: 20px; color: #fff; margin-bottom: 8px; }
  .nf-empty-sub { font-size: 13px; color: rgba(232,228,223,0.3); line-height: 1.65; max-width: 300px; margin: 0 auto; }

  @media(max-width: 520px) {
    .nf-wrap { padding: 32px 16px 60px; }
    .nf-toolbar { flex-direction: column; align-items: flex-start; }
    .nf-hero-badge { width: 60px; height: 60px; border-radius: 16px; }
    .nf-hero-num { font-size: 22px; }
  }
`;