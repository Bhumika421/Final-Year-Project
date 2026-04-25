import { useEffect, useMemo, useState } from 'react';
import { api } from '../api/client';
import { Link, useLocation, useSearchParams } from 'react-router-dom';

const API_BASE = 'http://localhost/safe-journey-planner/backend-php/public';

function usd(n) {
  return '$' + Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function getImageUrl(image_url, id) {
  if (!image_url) return `https://picsum.photos/seed/tour${id}/800/500`;
  if (image_url.startsWith('http')) return image_url;
  return API_BASE + image_url;
}

export default function Tours() {
  const loc = useLocation();
  const [searchParams] = useSearchParams();
  const prefill = { q: loc.state?.prefill?.q || searchParams.get('q') || '' };

  const [items, setItems] = useState([]);
  const [allForOptions, setAllForOptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    q: prefill.q || '',
    destination: '',
    category: '',
    minPrice: '',
    maxPrice: '',
    sort: 'relevance'
  });

  function set(k, v) { setFilters(prev => ({ ...prev, [k]: v })); }

  async function loadOptions() {
    try {
      const res = await api.get('/api/tours');
      setAllForOptions(res.data.items || []);
    } catch { setAllForOptions([]); }
  }

  async function load() {
    setLoading(true);
    try {
      const params = {};
      if (filters.q) params.q = filters.q;
      if (filters.destination) params.destination = filters.destination;
      if (filters.category) params.category = filters.category;
      if (filters.minPrice) params.minPrice = filters.minPrice;
      if (filters.maxPrice) params.maxPrice = filters.maxPrice;
      const res = await api.get('/api/tours', { params });
      setItems(res.data.items || []);
    } catch { setItems([]); }
    finally { setLoading(false); }
  }

  useEffect(() => { loadOptions(); }, []);
  useEffect(() => { load(); }, []);

  const destinations = useMemo(() => {
    const s = new Set((allForOptions).map(t => t.destination).filter(Boolean));
    return Array.from(s).sort((a, b) => a.localeCompare(b));
  }, [allForOptions]);

  const categories = useMemo(() => {
    const s = new Set((allForOptions).map(t => t.category).filter(Boolean));
    return Array.from(s).sort((a, b) => a.localeCompare(b));
  }, [allForOptions]);

  const sorted = useMemo(() => {
    const list = [...items];
    if (filters.sort === 'price_asc') list.sort((a, b) => (a.price_usd || 0) - (b.price_usd || 0));
    if (filters.sort === 'price_desc') list.sort((a, b) => (b.price_usd || 0) - (a.price_usd || 0));
    if (filters.sort === 'rating_desc') list.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    return list;
  }, [items, filters.sort]);

  function clear() {
    setFilters({ q: '', destination: '', category: '', minPrice: '', maxPrice: '', sort: 'relevance' });
    setTimeout(() => load(), 0);
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=DM+Sans:wght@300;400;500;600&display=swap');
        .tr-wrap { max-width: 1200px; margin: 0 auto; padding: 40px 24px 60px; font-family: 'DM Sans', sans-serif; }
        .tr-head { margin-bottom: 32px; }
        .tr-tag { font-size: 11px; font-weight: 600; letter-spacing: 0.12em; text-transform: uppercase; color: #a8d96b; margin-bottom: 8px; }
        .tr-title { font-family: 'Playfair Display', serif; font-size: clamp(28px, 4vw, 42px); font-weight: 700; color: #fff; margin: 0 0 8px; }
        .tr-sub { font-size: 14px; color: rgba(240,237,232,0.45); margin: 0; }
        .tr-filter-box { background: #131918; border: 1px solid rgba(255,255,255,0.07); border-radius: 20px; padding: 24px; margin-bottom: 32px; }
        .tr-filter-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 14px; margin-bottom: 16px; }
        .tr-label { font-size: 11px; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase; color: rgba(240,237,232,0.4); margin-bottom: 6px; }
        .tr-input { width: 100%; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.08); border-radius: 10px; padding: 10px 12px; color: #f0ede8; font-family: 'DM Sans', sans-serif; font-size: 13px; outline: none; transition: border-color 0.2s; box-sizing: border-box; }
        .tr-input:focus { border-color: rgba(168,217,107,0.4); }
        .tr-input option { background: #131918; }
        .tr-btn-row { display: flex; gap: 10px; justify-content: flex-end; }
        .tr-btn { background: #a8d96b; color: #1a2010; border: none; border-radius: 100px; padding: 10px 24px; font-family: 'DM Sans', sans-serif; font-size: 13px; font-weight: 700; cursor: pointer; transition: background 0.2s; }
        .tr-btn:hover { background: #c1e88d; }
        .tr-btn-ghost { background: transparent; color: rgba(240,237,232,0.6); border: 1px solid rgba(255,255,255,0.12); border-radius: 100px; padding: 10px 24px; font-family: 'DM Sans', sans-serif; font-size: 13px; font-weight: 500; cursor: pointer; transition: all 0.2s; }
        .tr-btn-ghost:hover { color: #fff; border-color: rgba(255,255,255,0.25); }
        .tr-count { font-size: 13px; color: rgba(240,237,232,0.4); margin-bottom: 20px; }
        .tr-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 20px; }
        .tr-card { background: #131918; border: 1px solid rgba(255,255,255,0.07); border-radius: 18px; overflow: hidden; transition: transform 0.2s, border-color 0.2s; }
        .tr-card:hover { transform: translateY(-4px); border-color: rgba(168,217,107,0.2); }
        .tr-card-img { width: 100%; height: 200px; object-fit: cover; display: block; }
        .tr-card-body { padding: 18px; }
        .tr-card-title { font-family: 'Playfair Display', serif; font-size: 17px; font-weight: 700; color: #fff; margin: 0 0 8px; line-height: 1.3; }
        .tr-card-meta { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 14px; }
        .tr-pill { font-size: 11px; font-weight: 600; background: rgba(255,255,255,0.06); color: rgba(240,237,232,0.6); border-radius: 100px; padding: 3px 10px; }
        .tr-pill-green { background: rgba(168,217,107,0.12); color: #a8d96b; }
        .tr-card-bottom { display: flex; align-items: center; justify-content: space-between; }
        .tr-price { font-family: 'DM Sans', sans-serif; font-size: 18px; font-weight: 500; color: #a8d96b; letter-spacing: -0.02em; }
        .tr-price-sub { font-size: 11px; color: rgba(240,237,232,0.4); font-family: 'DM Sans', sans-serif; margin-top: 2px; }
        .tr-view-btn { background: rgba(168,217,107,0.12); color: #a8d96b; border: 1px solid rgba(168,217,107,0.25); border-radius: 100px; padding: 8px 18px; font-family: 'DM Sans', sans-serif; font-size: 13px; font-weight: 600; text-decoration: none; transition: background 0.2s; }
        .tr-view-btn:hover { background: rgba(168,217,107,0.22); }
        .tr-skeleton { background: linear-gradient(90deg, #131918 25%, #1a2218 50%, #131918 75%); background-size: 200% 100%; animation: shimmer 1.4s infinite; border-radius: 18px; height: 320px; }
        @keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
        .tr-empty { background: #131918; border: 1px solid rgba(255,255,255,0.07); border-radius: 20px; padding: 48px 32px; text-align: center; }
        .tr-empty h3 { font-family: 'Playfair Display', serif; font-size: 22px; color: #fff; margin: 0 0 8px; }
        .tr-empty p { font-size: 14px; color: rgba(240,237,232,0.4); margin: 0 0 24px; }
        @media (max-width: 600px) { .tr-grid { grid-template-columns: 1fr; } .tr-filter-grid { grid-template-columns: 1fr 1fr; } }
      `}</style>

      <div className="tr-wrap">
        <div className="tr-head">
          <div className="tr-tag">Explore Nepal</div>
          <h1 className="tr-title">Browse Tours</h1>
          <p className="tr-sub">Only verified & approved packages are listed here.</p>
        </div>

        {/* Filter Box */}
        <div className="tr-filter-box">
          <div className="tr-filter-grid">
            <div>
              <div className="tr-label">Search</div>
              <input className="tr-input" placeholder="Title, destination..." value={filters.q} onChange={e => set('q', e.target.value)} onKeyDown={e => { if (e.key === 'Enter') load(); }} />
            </div>
            <div>
              <div className="tr-label">Destination</div>
              <select className="tr-input" value={filters.destination} onChange={e => set('destination', e.target.value)}>
                <option value="">All Destinations</option>
                {destinations.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <div className="tr-label">Category</div>
              <select className="tr-input" value={filters.category} onChange={e => set('category', e.target.value)}>
                <option value="">All Categories</option>
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <div className="tr-label">Sort By</div>
              <select className="tr-input" value={filters.sort} onChange={e => set('sort', e.target.value)}>
                <option value="relevance">Relevance</option>
                <option value="price_asc">Price: Low → High</option>
                <option value="price_desc">Price: High → Low</option>
                <option value="rating_desc">Rating: High → Low</option>
              </select>
            </div>
            <div>
              <div className="tr-label">Min Price ($)</div>
              <input className="tr-input" value={filters.minPrice} onChange={e => set('minPrice', e.target.value)} placeholder="0" />
            </div>
            <div>
              <div className="tr-label">Max Price ($)</div>
              <input className="tr-input" value={filters.maxPrice} onChange={e => set('maxPrice', e.target.value)} placeholder="9999" />
            </div>
          </div>
          <div className="tr-btn-row">
            <button className="tr-btn-ghost" onClick={clear}>Clear</button>
            <button className="tr-btn" onClick={load}>Search Tours</button>
          </div>
        </div>

        {/* Results */}
        {loading ? (
          <div className="tr-grid">
            {Array.from({ length: 8 }).map((_, i) => <div key={i} className="tr-skeleton" />)}
          </div>
        ) : sorted.length === 0 ? (
          <div className="tr-empty">
            <h3>No tours found</h3>
            <p>Try changing your filters or clearing the search.</p>
            <button className="tr-btn" onClick={clear}>Clear Filters</button>
          </div>
        ) : (
          <>
            <div className="tr-count">{sorted.length} tour{sorted.length !== 1 ? 's' : ''} found</div>
            <div className="tr-grid">
              {sorted.map(t => (
                <div key={t.id} className="tr-card">
                  <img
                    className="tr-card-img"
                    src={getImageUrl(t.image_url, t.id)}
                    alt={t.title}
                    onError={e => { e.target.src = `https://picsum.photos/seed/tour${t.id}/800/500`; }}
                  />
                  <div className="tr-card-body">
                    <div className="tr-card-title">{t.title}</div>
                    <div className="tr-card-meta">
                      {t.destination && <span className="tr-pill">{t.destination}</span>}
                      {t.category && <span className="tr-pill">{t.category}</span>}
                      {t.duration_days && <span className="tr-pill">{t.duration_days} days</span>}
                      {t.rating && <span className="tr-pill tr-pill-green">★ {Number(t.rating).toFixed(1)}</span>}
                    </div>
                    <div className="tr-card-bottom">
                      <div>
                        <div className="tr-price">{usd(t.price_usd)}</div>
                        <div className="tr-price-sub">per person</div>
                      </div>
                      <Link className="tr-view-btn" to={`/tours/${t.id}`}>View →</Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </>
  );
}