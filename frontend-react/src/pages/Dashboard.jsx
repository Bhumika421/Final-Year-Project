import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api, getToken } from '../api/client';

function getUser() {
  try { return JSON.parse(localStorage.getItem('user') || 'null'); } catch { return null; }
}

export default function Dashboard() {
  const nav = useNavigate();
  const localUser = getUser();
  const [user, setUser] = useState(localUser); // FIX: API bata fresh user data fetch garcha
  const [bookings, setBookings] = useState([]);
  const [wishlist, setWishlist] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (localUser?.role === 'agency') { nav('/agency'); return; }
    if (localUser?.role === 'admin')  { nav('/admin');  return; }
    if (!getToken()) { nav('/login'); return; }

    async function load() {
      try {
        const [me, b, w, n] = await Promise.allSettled([
          api.get('/api/auth/me'),        // FIX: fresh user data — loyalty_points included
          api.get('/api/bookings'),
          api.get('/api/wishlist'),
          api.get('/api/notifications'),
        ]);
        if (me.status === 'fulfilled') setUser(me.value.data.user || me.value.data);
        setBookings(b.status === 'fulfilled' ? (b.value.data.items || []) : []);
        setWishlist(w.status === 'fulfilled' ? (w.value.data.items || []) : []);
        setNotifications(n.status === 'fulfilled' ? (n.value.data.items || []) : []);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const unreadCount = notifications.filter(n => !n.is_read).length;

  function statusColor(s) {
    if (s === 'paid')      return '#a8d96b';
    if (s === 'confirmed') return '#60a5fa';
    if (s === 'pending')   return '#f59e0b';
    if (s === 'cancelled') return '#f87171';
    return '#94a3b8';
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=DM+Sans:wght@300;400;500;600&display=swap');
        .db-wrap { max-width: 1100px; margin: 0 auto; padding: 40px 24px 60px; font-family: 'DM Sans', sans-serif; }
        .db-greeting { margin-bottom: 36px; }
        .db-greeting-tag { font-size: 12px; font-weight: 600; letter-spacing: 0.12em; text-transform: uppercase; color: #a8d96b; margin-bottom: 8px; }
        .db-greeting h1 { font-family: 'Playfair Display', serif; font-size: clamp(28px, 4vw, 42px); font-weight: 700; color: #fff; margin: 0 0 8px; }
        .db-greeting p { font-size: 15px; color: rgba(240,237,232,0.5); margin: 0; }
        .db-stats { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 14px; margin-bottom: 32px; }
        .db-stat { background: #131918; border: 1px solid rgba(255,255,255,0.07); border-radius: 18px; padding: 24px 22px; text-decoration: none; transition: transform 0.2s, border-color 0.2s; display: block; }
        .db-stat:hover { transform: translateY(-4px); border-color: rgba(168,217,107,0.25); }
        .db-stat-icon { font-size: 26px; margin-bottom: 14px; display: block; }
        .db-stat-num { font-family: 'Playfair Display', serif; font-size: 32px; font-weight: 700; color: #a8d96b; line-height: 1; margin-bottom: 4px; }
        .db-stat-label { font-size: 13px; color: rgba(240,237,232,0.45); }

        /* Loyalty Points special card */
        .db-stat-points { background: linear-gradient(135deg, #1a2e1a, #131918); border: 1px solid rgba(168,217,107,0.25); border-radius: 18px; padding: 24px 22px; text-decoration: none; transition: transform 0.2s, border-color 0.2s; display: block; position: relative; overflow: hidden; }
        .db-stat-points:hover { transform: translateY(-4px); border-color: rgba(168,217,107,0.5); }
        .db-stat-points::before { content: ''; position: absolute; top: -20px; right: -20px; width: 80px; height: 80px; background: rgba(168,217,107,0.08); border-radius: 50%; }
        .db-points-num { font-family: 'Playfair Display', serif; font-size: 32px; font-weight: 700; color: #a8d96b; line-height: 1; margin-bottom: 4px; }
        .db-points-label { font-size: 13px; color: rgba(168,217,107,0.6); }
        .db-points-sub { font-size: 11px; color: rgba(240,237,232,0.3); margin-top: 6px; }

        .db-section { margin-bottom: 28px; }
        .db-section-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px; }
        .db-section-title { font-family: 'Playfair Display', serif; font-size: 20px; font-weight: 700; color: #fff; }
        .db-viewall { font-size: 13px; color: #a8d96b; text-decoration: none; border: 1px solid rgba(168,217,107,0.3); border-radius: 100px; padding: 5px 14px; transition: background 0.2s; }
        .db-viewall:hover { background: rgba(168,217,107,0.1); }
        .db-booking { background: #131918; border: 1px solid rgba(255,255,255,0.07); border-radius: 14px; padding: 16px 18px; margin-bottom: 10px; display: flex; align-items: center; gap: 14px; flex-wrap: wrap; }
        .db-booking-title { font-size: 15px; font-weight: 600; color: #fff; flex: 1; min-width: 140px; }
        .db-booking-meta { font-size: 12px; color: rgba(240,237,232,0.45); }
        .db-status { font-size: 11px; font-weight: 700; padding: 4px 12px; border-radius: 100px; text-transform: capitalize; }
        .db-quick { display: grid; grid-template-columns: repeat(auto-fill, minmax(155px, 1fr)); gap: 12px; }
        .db-quick-item { background: #131918; border: 1px solid rgba(255,255,255,0.07); border-radius: 16px; padding: 22px 18px; text-decoration: none; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px; transition: transform 0.2s, border-color 0.2s; }
        .db-quick-item:hover { transform: translateY(-3px); border-color: rgba(168,217,107,0.4); background: #1a2218; }
        .db-quick-icon { font-size: 22px; }
        .db-quick-label { font-family: 'Playfair Display', serif; font-size: 15px; font-weight: 700; color: #fff; text-align: center; letter-spacing: 0.01em; }
        .db-notif { background: #131918; border: 1px solid rgba(255,255,255,0.07); border-radius: 14px; padding: 14px 18px; margin-bottom: 10px; display: flex; gap: 12px; align-items: flex-start; }
        .db-notif-dot { width: 8px; height: 8px; border-radius: 50%; background: #a8d96b; margin-top: 5px; flex-shrink: 0; }
        .db-notif-dot.read { background: rgba(255,255,255,0.15); }
        .db-notif-title { font-size: 14px; font-weight: 600; color: #fff; margin-bottom: 3px; }
        .db-notif-body { font-size: 13px; color: rgba(240,237,232,0.5); }
        .db-empty { background: #131918; border: 1px solid rgba(255,255,255,0.07); border-radius: 14px; padding: 20px 18px; font-size: 13px; color: rgba(240,237,232,0.4); }
        .db-skeleton { background: linear-gradient(90deg, #131918 25%, #1a2218 50%, #131918 75%); background-size: 200% 100%; animation: shimmer 1.4s infinite; border-radius: 14px; height: 64px; margin-bottom: 10px; }
        @keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
      `}</style>

      <div className="db-wrap">
        <div className="db-greeting">
          <div className="db-greeting-tag"> Welcome back</div>
          <h1>{user?.full_name || user?.name || user?.email?.split('@')[0] || 'Traveler'}</h1>
          <p>Here's a summary of your account and recent activity.</p>
        </div>

        {/* Stats Grid */}
        <div className="db-stats">
          <Link to="/bookings" className="db-stat">
            <span className="db-stat-icon">🗓</span>
            <div className="db-stat-num">{loading ? '—' : bookings.length}</div>
            <div className="db-stat-label">Total Bookings</div>
          </Link>
          <Link to="/wishlist" className="db-stat">
            <span className="db-stat-icon"></span>
            <div className="db-stat-num">{loading ? '—' : wishlist.length}</div>
            <div className="db-stat-label">Wishlist Items</div>
          </Link>
          <Link to="/notifications" className="db-stat">
            <span className="db-stat-icon"></span>
            <div className="db-stat-num">{loading ? '—' : unreadCount}</div>
            <div className="db-stat-label">Unread Alerts</div>
          </Link>
          <Link to="/tours" className="db-stat">
            <span className="db-stat-icon"></span>
            <div className="db-stat-num">120+</div>
            <div className="db-stat-label">Tours Available</div>
          </Link>

          {/*  Loyalty Points Card */}
          <Link to="/profile" className="db-stat-points">
            <span className="db-stat-icon"></span>
            <div className="db-points-num">{loading ? '—' : (user?.loyalty_points || 0)}</div>
            <div className="db-points-label">Loyalty Points</div>
            <div className="db-points-sub">
              {!loading && (user?.loyalty_points > 0)
                ? `= NPR ${new Intl.NumberFormat('en-NP').format(Math.round((user.loyalty_points || 0) * 0.10))} discount`
                : 'Earn points with every booking!'}
            </div>
          </Link>
        </div>

        {/* Recent Bookings */}
        <div className="db-section">
          <div className="db-section-head">
            <div className="db-section-title">Recent Bookings</div>
            <Link to="/bookings" className="db-viewall">View all →</Link>
          </div>
          {loading ? (
            <><div className="db-skeleton"/><div className="db-skeleton"/></>
          ) : bookings.length === 0 ? (
            <div className="db-empty">No bookings yet. <Link to="/tours" style={{color:'#a8d96b'}}>Browse tours →</Link></div>
          ) : bookings.slice(0, 3).map(b => (
            <div className="db-booking" key={b.id}>
              <div className="db-booking-title">{b.title || b.tour_title || 'Tour Booking'}</div>
              <div className="db-booking-meta">Code: {b.booking_code}</div>
              <div className="db-booking-meta">${Number(b.total_usd || 0).toFixed(2)}</div>
              <span className="db-status" style={{background: statusColor(b.status)+'22', color: statusColor(b.status)}}>{b.status}</span>
            </div>
          ))}
        </div>

        {/* Recent Notifications */}
        <div className="db-section">
          <div className="db-section-head">
            <div className="db-section-title">Recent Notifications</div>
            <Link to="/notifications" className="db-viewall">View all →</Link>
          </div>
          {loading ? (
            <><div className="db-skeleton"/><div className="db-skeleton"/></>
          ) : notifications.length === 0 ? (
            <div className="db-empty">No notifications yet.</div>
          ) : notifications.slice(0, 3).map(n => (
            <div className="db-notif" key={n.id}>
              <div className={`db-notif-dot ${n.is_read ? 'read' : ''}`}/>
              <div>
                <div className="db-notif-title">{n.title}</div>
                <div className="db-notif-body">{n.body}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Quick Links */}
        <div className="db-section">
          <div className="db-section-head">
            <div className="db-section-title">Quick Links</div>
          </div>
          <div className="db-quick">
            {[
              { to: '/tours',         icon: '', label: 'Browse Tours' },
              { to: '/wishlist',      icon: '', label: 'My Wishlist' },
              { to: '/bookings',      icon: '', label: 'My Bookings' },
              { to: '/support',       icon: '', label: 'Get Support' },
              { to: '/notifications', icon: '', label: 'Notifications' },
              { to: '/profile',       icon: '', label: 'My Profile' },
            ].map(l => (
              <Link key={l.to} to={l.to} className="db-quick-item">
                <span className="db-quick-icon">{l.icon}</span>
                <span className="db-quick-label">{l.label}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}