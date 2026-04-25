import { useEffect, useState } from 'react';
import { api, getToken } from '../api/client';

const CATEGORY_CONFIG = {
  offers:      { icon: '', color: '#f5a623', bg: 'rgba(245,166,35,0.1)',   border: 'rgba(245,166,35,0.25)'  },
  booking:     { icon: '', color: '#34d399', bg: 'rgba(52,211,153,0.1)',   border: 'rgba(52,211,153,0.25)'  },
  confirmed:   { icon: '', color: '#60c3f5', bg: 'rgba(96,195,245,0.1)',   border: 'rgba(96,195,245,0.25)'  },
  alert:       { icon: '', color: '#f87171', bg: 'rgba(248,113,113,0.1)',  border: 'rgba(248,113,113,0.25)' },
  payment:     { icon: '', color: '#a8d96b', bg: 'rgba(168,217,107,0.1)', border: 'rgba(168,217,107,0.25)' },
  refund:      { icon: '', color: '#a5b4fc', bg: 'rgba(165,180,252,0.1)', border: 'rgba(165,180,252,0.25)' },
  system:      { icon: '', color: '#888',    bg: 'rgba(136,136,136,0.1)', border: 'rgba(136,136,136,0.2)'  },
};

function getCfg(cat) {
  return CATEGORY_CONFIG[cat?.toLowerCase()] || CATEGORY_CONFIG.system;
}

function timeAgo(dateStr) {
  const diff = (Date.now() - new Date(dateStr)) / 1000;
  if (diff < 60)   return `${Math.floor(diff)}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400)return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export default function Notifications() {
  const [items, setItems]       = useState([]);
  const [msg, setMsg]           = useState('');
  const [loading, setLoading]   = useState(true);
  const [filter, setFilter]     = useState('all');
  const [marking, setMarking]   = useState(null);

  async function load() {
    setMsg('');
    if (!getToken()) { setMsg('Please login first.'); setLoading(false); return; }
    try {
      const res = await api.get('/api/notifications');
      setItems(res.data.items || []);
    } catch {
      setMsg('Could not load notifications.');
    } finally {
      setLoading(false);
    }
  }

  async function markRead(id) {
    setMarking(id);
    try {
      await api.post(`/api/notifications/${id}/read`);
      setItems(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    } finally {
      setMarking(null);
    }
  }

  async function markAllRead() {
    const unread = items.filter(n => !n.is_read);
    await Promise.allSettled(unread.map(n => api.post(`/api/notifications/${n.id}/read`)));
    setItems(prev => prev.map(n => ({ ...n, is_read: true })));
  }

  useEffect(() => { load(); }, []);

  const categories  = ['all', ...new Set(items.map(n => n.category?.toLowerCase()).filter(Boolean))];
  const filtered    = filter === 'all' ? items : items.filter(n => n.category?.toLowerCase() === filter);
  const unreadCount = items.filter(n => !n.is_read).length;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&display=swap');
        @keyframes fadeUp   { from { opacity:0; transform:translateY(14px); } to { opacity:1; transform:translateY(0); } }
        @keyframes pulse    { 0%,100%{opacity:1} 50%{opacity:0.4} }
        @keyframes shimmer  { from{background-position:-200% 0} to{background-position:200% 0} }
        @keyframes ping     { 0%{transform:scale(1);opacity:1} 70%{transform:scale(2.2);opacity:0} 100%{transform:scale(2.2);opacity:0} }
        .notif-card { transition: border-color 0.2s, transform 0.2s, box-shadow 0.2s; }
        .notif-card:hover { border-color: #3a3a3a !important; transform: translateY(-1px); box-shadow: 0 8px 32px rgba(0,0,0,0.3); }
        .mark-btn { transition: background 0.15s, opacity 0.15s; }
        .mark-btn:hover { opacity: 0.85; }
        .filter-pill { transition: all 0.15s; }
        .filter-pill:hover { opacity: 0.85; }
      `}</style>

      <div style={{ maxWidth: 680, margin: '0 auto', padding: '0 0 48px', fontFamily: 'inherit' }}>

        {/* ── Header */}
        <div style={{ padding: '28px 0 20px', animation: 'fadeUp 0.3s ease both' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 28, fontWeight: 700, color: '#f0ece4', margin: 0 }}>
                  Notifications
                </h2>
                {unreadCount > 0 && (
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ position: 'absolute', width: 20, height: 20, borderRadius: '50%', background: '#a8d96b', opacity: 0.3, animation: 'ping 1.5s ease-out infinite' }} />
                    <div style={{ background: '#a8d96b', color: '#0a0e0d', borderRadius: 100, padding: '2px 8px', fontSize: 11, fontWeight: 800, lineHeight: 1.4, position: 'relative' }}>
                      {unreadCount}
                    </div>
                  </div>
                )}
              </div>
              <p style={{ fontSize: 13, color: '#555', margin: 0 }}>Booking updates, offers &amp; alerts</p>
            </div>
            {unreadCount > 0 && (
              <button onClick={markAllRead}
                style={{ background: 'rgba(168,217,107,0.08)', border: '1px solid rgba(168,217,107,0.25)', color: '#a8d96b', borderRadius: 100, padding: '8px 16px', fontSize: 12, fontWeight: 700, cursor: 'pointer', animation: 'fadeUp 0.35s ease both', animationDelay: '60ms' }}
                className="mark-btn">
                ✓ Mark all read
              </button>
            )}
          </div>
        </div>

        {/* ── Stats row */}
        {items.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 20, animation: 'fadeUp 0.35s ease both', animationDelay: '80ms' }}>
            {[
              { label: 'Total',  value: items.length,    color: '#aaa'     },
              { label: 'Unread', value: unreadCount,     color: '#a8d96b'  },
              { label: 'Read',   value: items.length - unreadCount, color: '#555' },
            ].map(s => (
              <div key={s.label} style={{ background: '#141414', border: '1px solid #222', borderRadius: 10, padding: '10px 14px', textAlign: 'center' }}>
                <div style={{ fontSize: 22, fontWeight: 700, color: s.color, lineHeight: 1 }}>{s.value}</div>
                <div style={{ fontSize: 10, color: '#555', marginTop: 3, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{s.label}</div>
              </div>
            ))}
          </div>
        )}

        {/* ── Filter pills */}
        {categories.length > 1 && (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16, animation: 'fadeUp 0.35s ease both', animationDelay: '100ms' }}>
            {categories.map(cat => {
              const cfg     = cat === 'all' ? null : getCfg(cat);
              const active  = filter === cat;
              return (
                <button key={cat} onClick={() => setFilter(cat)} className="filter-pill"
                  style={{
                    background: active ? (cfg ? cfg.bg : 'rgba(168,217,107,0.1)') : 'rgba(255,255,255,0.03)',
                    border: `1px solid ${active ? (cfg ? cfg.border : 'rgba(168,217,107,0.35)') : '#222'}`,
                    color: active ? (cfg ? cfg.color : '#a8d96b') : '#555',
                    borderRadius: 100, padding: '6px 14px', fontSize: 12, fontWeight: 600,
                    cursor: 'pointer', textTransform: 'capitalize', display: 'flex', alignItems: 'center', gap: 5,
                  }}>
                  {cfg && <span>{cfg.icon}</span>}
                  {cat}
                  {cat !== 'all' && (
                    <span style={{ background: 'rgba(255,255,255,0.08)', borderRadius: 100, padding: '1px 6px', fontSize: 10 }}>
                      {items.filter(n => n.category?.toLowerCase() === cat).length}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {/* ── Error */}
        {msg && (
          <div style={{ background: '#1a1010', border: '1px solid #3a1a1a', borderRadius: 12, padding: '16px 20px', color: '#f87171', fontSize: 14 }}>{msg}</div>
        )}

        {/* ── Loading */}
        {loading && (
          <div style={{ textAlign: 'center', padding: 60, color: '#444' }}>
            <div style={{ fontSize: 13, animation: 'pulse 1.4s ease infinite' }}>Loading notifications...</div>
          </div>
        )}

        {/* ── Empty */}
        {!loading && !msg && filtered.length === 0 && (
          <div style={{ background: '#141414', border: '1px solid #222', borderRadius: 16, padding: '48px 32px', textAlign: 'center', animation: 'fadeUp 0.4s ease both' }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}></div>
            <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 18, color: '#666', marginBottom: 6 }}>
              {filter === 'all' ? 'No notifications yet' : `No ${filter} notifications`}
            </div>
            <div style={{ fontSize: 13, color: '#444' }}>You're all caught up!</div>
          </div>
        )}

        {/* ── Notification cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {filtered.map((n, i) => {
            const cfg = getCfg(n.category);
            const isUnread = !n.is_read;
            return (
              <div key={n.id} className="notif-card"
                style={{
                  background: isUnread
                    ? `linear-gradient(135deg, #141414 0%, #161a14 100%)`
                    : 'linear-gradient(135deg, #111 0%, #131313 100%)',
                  border: `1px solid ${isUnread ? '#2a2a2a' : '#1c1c1c'}`,
                  borderRadius: 14,
                  overflow: 'hidden',
                  animation: `fadeUp 0.4s ease both`,
                  animationDelay: `${i * 50}ms`,
                  opacity: n.is_read ? 0.7 : 1,
                }}>

                {/* Unread accent bar */}
                {isUnread && (
                  <div style={{ height: 2, background: `linear-gradient(90deg, ${cfg.color}, transparent)` }} />
                )}

                <div style={{ padding: '14px 16px' }}>
                  {/* Top row */}
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>

                    {/* Icon */}
                    <div style={{
                      width: 38, height: 38, borderRadius: 10, flexShrink: 0,
                      background: cfg.bg, border: `1px solid ${cfg.border}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16,
                    }}>
                      {cfg.icon}
                    </div>

                    {/* Content */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
                        <div style={{ fontWeight: 700, fontSize: 14, color: isUnread ? '#f0ece4' : '#888', lineHeight: 1.3 }}>
                          {n.title}
                        </div>
                        {isUnread && (
                          <div style={{ width: 6, height: 6, borderRadius: '50%', background: cfg.color, flexShrink: 0 }} />
                        )}
                        <span style={{
                          display: 'inline-block', padding: '2px 8px', borderRadius: 100,
                          fontSize: 10, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase',
                          background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}`,
                        }}>
                          {n.category}
                        </span>
                      </div>

                      <p style={{ fontSize: 13, color: isUnread ? '#aaa' : '#555', margin: '0 0 8px', lineHeight: 1.5 }}>
                        {n.body}
                      </p>

                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                        <div style={{ fontSize: 11, color: '#444', display: 'flex', alignItems: 'center', gap: 4 }}>
                          <span></span>
                          <span title={new Date(n.created_at).toLocaleString()}>{timeAgo(n.created_at)}</span>
                          {n.expires_at && (
                            <span style={{ color: '#333', marginLeft: 6 }}>
                              · expires {new Date(n.expires_at).toLocaleDateString('en-US', { month:'short', day:'numeric' })}
                            </span>
                          )}
                        </div>

                        {isUnread && (
                          <button onClick={() => markRead(n.id)} disabled={marking === n.id} className="mark-btn"
                            style={{
                              background: 'rgba(168,217,107,0.08)', border: '1px solid rgba(168,217,107,0.2)',
                              color: '#a8d96b', borderRadius: 8, padding: '5px 12px',
                              fontSize: 11, fontWeight: 700, cursor: marking === n.id ? 'not-allowed' : 'pointer',
                              opacity: marking === n.id ? 0.5 : 1,
                            }}>
                            {marking === n.id ? '...' : '✓ Mark read'}
                          </button>
                        )}

                        {n.is_read && (
                          <span style={{ fontSize: 11, color: '#333', display: 'flex', alignItems: 'center', gap: 3 }}>
                            <span>✓</span> Read
                          </span>
                        )}
                      </div>
                    </div>
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