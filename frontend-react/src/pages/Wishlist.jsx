import { useEffect, useState } from 'react';
import { api, getToken } from '../api/client';
import { Link, useNavigate } from 'react-router-dom';

export default function Wishlist() {
  const nav = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');

  async function load() {
    if (!getToken()) { nav('/login'); return; }
    try {
      const res = await api.get('/api/wishlist');
      setItems(res.data.items || []);
    } catch { setItems([]); }
    finally { setLoading(false); }
  }

  async function remove(id) {
    try {
      await api.delete(`/api/wishlist/${id}`);
      setMsg('Removed from wishlist');
      load();
      setTimeout(() => setMsg(''), 2500);
    } catch { setMsg('Failed to remove'); }
  }

  useEffect(() => { load(); }, []);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=DM+Sans:wght@300;400;500;600&display=swap');
        .wl-wrap { max-width: 1100px; margin: 0 auto; padding: 40px 24px 60px; font-family: 'DM Sans', sans-serif; }
        .wl-head { margin-bottom: 32px; }
        .wl-head-tag { font-size: 12px; font-weight: 600; letter-spacing: 0.12em; text-transform: uppercase; color: #a8d96b; margin-bottom: 8px; }
        .wl-head h1 { font-family: 'Playfair Display', serif; font-size: clamp(26px, 4vw, 38px); font-weight: 700; color: #fff; margin: 0 0 6px; }
        .wl-head p { font-size: 14px; color: rgba(240,237,232,0.45); margin: 0; }
        .wl-toast { background: rgba(168,217,107,0.12); border: 1px solid rgba(168,217,107,0.3); color: #a8d96b; border-radius: 10px; padding: 10px 16px; font-size: 13px; margin-bottom: 20px; }
        .wl-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 18px; }
        .wl-card { background: #131918; border: 1px solid rgba(255,255,255,0.07); border-radius: 20px; overflow: hidden; transition: transform 0.22s, border-color 0.22s; }
        .wl-card:hover { transform: translateY(-5px); border-color: rgba(168,217,107,0.2); }
        .wl-card-img-wrap { position: relative; overflow: hidden; }
        .wl-card-img { width: 100%; height: 185px; object-fit: cover; display: block; transition: transform 0.4s; }
        .wl-card:hover .wl-card-img { transform: scale(1.04); }
        .wl-card-body { padding: 16px 18px 18px; }
        .wl-card-place { font-size: 11px; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase; color: #a8d96b; margin-bottom: 5px; }
        .wl-card-title { font-family: 'Playfair Display', serif; font-size: 17px; font-weight: 700; color: #fff; margin-bottom: 6px; line-height: 1.3; }
        .wl-card-meta { font-size: 12px; color: rgba(240,237,232,0.45); margin-bottom: 16px; }
        .wl-card-actions { display: flex; gap: 8px; }
        .wl-btn-view { flex: 1; background: rgba(168,217,107,0.12); color: #a8d96b; border: 1px solid rgba(168,217,107,0.3); border-radius: 100px; padding: 9px 0; font-family: 'DM Sans', sans-serif; font-size: 13px; font-weight: 600; cursor: pointer; text-align: center; text-decoration: none; transition: background 0.2s; display: block; }
        .wl-btn-view:hover { background: rgba(168,217,107,0.22); }
        .wl-btn-remove { background: rgba(248,113,113,0.1); color: #f87171; border: 1px solid rgba(248,113,113,0.25); border-radius: 100px; padding: 9px 16px; font-family: 'DM Sans', sans-serif; font-size: 13px; font-weight: 600; cursor: pointer; transition: background 0.2s; }
        .wl-btn-remove:hover { background: rgba(248,113,113,0.2); }
        .wl-empty { text-align: center; padding: 72px 24px; }
        .wl-empty-icon { font-size: 52px; margin-bottom: 16px; display: block; }
        .wl-empty h3 { font-family: 'Playfair Display', serif; font-size: 22px; color: #fff; margin: 0 0 8px; }
        .wl-empty p { font-size: 14px; color: rgba(240,237,232,0.45); margin: 0 0 20px; }
        .wl-empty-btn { background: #a8d96b; color: #1a2010; border: none; border-radius: 100px; padding: 12px 28px; font-family: 'DM Sans', sans-serif; font-size: 14px; font-weight: 700; cursor: pointer; text-decoration: none; display: inline-block; transition: background 0.2s; }
        .wl-empty-btn:hover { background: #c1e88d; }
        .wl-skeleton { background: linear-gradient(90deg, #131918 25%, #1a2218 50%, #131918 75%); background-size: 200% 100%; animation: shimmer 1.4s infinite; border-radius: 20px; height: 300px; }
        @keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
      `}</style>

      <div className="wl-wrap">
        <div className="wl-head">
          <div className="wl-head-tag"> Saved Tours</div>
          <h1>My Wishlist</h1>
          <p>Tours you've saved — book them whenever you're ready.</p>
        </div>

        {msg && <div className="wl-toast">{msg}</div>}

        {loading ? (
          <div className="wl-grid">
            {[1,2,3].map(i => <div key={i} className="wl-skeleton"/>)}
          </div>
        ) : items.length === 0 ? (
          <div className="wl-empty">
            <span className="wl-empty-icon">🗺️</span>
            <h3>Nothing saved yet</h3>
            <p>Browse tours and tap "Add to Wishlist" to save them here.</p>
            <Link to="/tours" className="wl-empty-btn">Browse Tours</Link>
          </div>
        ) : (
          <div className="wl-grid">
            {items.map(t => (
              <div className="wl-card" key={t.id}>
                <div className="wl-card-img-wrap">
                  <img className="wl-card-img" src={t.image_url || `https://picsum.photos/seed/wish${t.id}/800/500`} alt={t.title}/>
                </div>
                <div className="wl-card-body">
                  <div className="wl-card-place"> {t.destination}</div>
                  <div className="wl-card-title">{t.title}</div>
                  <div className="wl-card-meta">{t.category} • {t.duration_days} days • ${Number(t.price_usd||0).toFixed(0)}</div>
                  <div className="wl-card-actions">
                    <Link className="wl-btn-view" to={`/tours/${t.tour_id || t.id}`}>View Tour</Link>
                   <button className="wl-btn-remove" onClick={() => remove(t.wishlist_id)}>✕</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
