import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../api/client';

const BACKEND = 'http://localhost/safe-journey-planner/backend-php/public';

const DESTINATION_INFO = {
  chitwan:          { label: 'Chitwan',          subtitle: 'Jungle & Wildlife',     desc: 'Experience the wild side of Nepal. Chitwan National Park offers thrilling jungle safaris, rhino spotting, and rich Tharu culture.',                                    hero: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1800&q=80', color: '#22c55e', tours: 24, bestTime: 'Oct - Mar' },
  kathmandu:        { label: 'Kathmandu',        subtitle: 'Heritage & Culture',    desc: 'The ancient capital of Nepal. Explore UNESCO World Heritage Sites, stunning Durbar Squares, and vibrant street culture.',                                               hero: 'https://images.unsplash.com/photo-1605640840605-14ac1855827b?w=1800&q=80', color: '#f59e0b', tours: 56, bestTime: 'Sep - Nov' },
  lumbini:          { label: 'Lumbini',          subtitle: 'Sacred Birthplace',     desc: 'The birthplace of Lord Buddha. A UNESCO World Heritage Site filled with monasteries, peace gardens, and spiritual tranquility.',                                        hero: 'https://images.unsplash.com/photo-1609137144813-7d9921338f24?w=1800&q=80', color: '#a78bfa', tours: 12, bestTime: 'Nov - Feb' },
  pokhara:          { label: 'Pokhara',          subtitle: 'Lakes & Mountains',     desc: "Nepal's adventure capital. Stunning Phewa Lake, paragliding over the Himalayas, and gateway to the Annapurna Circuit.",                                                 hero: 'https://images.unsplash.com/photo-1571366343168-631c5bcca7a4?w=1800&q=80', color: '#38bdf8', tours: 38, bestTime: 'Oct - Apr' },
  'everest region': { label: 'Everest Region',   subtitle: 'Roof of the World',     desc: 'Home to the world\'s highest peak. Trek through Sherpa villages, Buddhist monasteries, and breathtaking Himalayan landscapes on the way to Everest Base Camp.',         hero: 'https://images.unsplash.com/photo-1486911278844-a81c5267e227?w=1800&q=80', color: '#60a5fa', tours: 18, bestTime: 'Mar - May, Sep - Nov' },
  'annapurna region': { label: 'Annapurna Region', subtitle: 'Himalayan Trekking', desc: 'One of the world\'s greatest trekking destinations. The Annapurna Circuit offers stunning mountain scenery, diverse landscapes, and rich cultural experiences.',        hero: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1800&q=80', color: '#34d399', tours: 22, bestTime: 'Oct - Nov, Mar - Apr' },
  mustang:          { label: 'Mustang',          subtitle: 'Desert Kingdom',        desc: 'The forbidden kingdom of Nepal. Mustang offers a unique landscape of ancient caves, monasteries, and dramatic desert terrain unlike anywhere else in Nepal.',            hero: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=1800&q=80', color: '#fb923c', tours: 9,  bestTime: 'May - Oct' },
  nagarkot:         { label: 'Nagarkot',         subtitle: 'Himalayan Sunrise',     desc: 'The best spot for Himalayan panoramas. Wake up to breathtaking sunrises over the Himalayas including Everest on clear days.',                                           hero: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1800&q=80', color: '#f472b6', tours: 14, bestTime: 'Oct - Dec' },
  bandipur:         { label: 'Bandipur',         subtitle: 'Hilltop Village',       desc: 'A perfectly preserved hilltop village. Bandipur offers stunning mountain views, traditional Newari architecture, and a peaceful escape from city life.',                 hero: 'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?w=1800&q=80', color: '#fbbf24', tours: 11, bestTime: 'Sep - Nov' },
};

const CATEGORIES = ['All', 'Adventure', 'Cultural', 'Wildlife', 'Trekking', 'Pilgrimage', 'Family', 'Luxury', 'General'];

export default function Destination() {
  const { place } = useParams();
  const nav = useNavigate();

  const info = DESTINATION_INFO[place?.toLowerCase()] || {
    label: place ? place.charAt(0).toUpperCase() + place.slice(1) : 'Destination',
    subtitle: 'Explore Tours',
    desc: 'Discover amazing tour packages for this destination.',
    hero: 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=1800&q=80',
  };

  const [tours, setTours] = useState([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('All');
  const [sort, setSort] = useState('popular');

  useEffect(() => {
    setLoading(true);
    api.get(`/api/tours?q=${encodeURIComponent(info.label)}&limit=50`)
      .then(res => setTours(res.data.items || []))
      .catch(() => setTours([]))
      .finally(() => setLoading(false));
  }, [place]);

  const filtered = tours
    .filter(t => category === 'All' || t.category === category)
    .sort((a, b) => {
      if (sort === 'price_low')  return Number(a.price_usd) - Number(b.price_usd);
      if (sort === 'price_high') return Number(b.price_usd) - Number(a.price_usd);
      if (sort === 'duration')   return Number(a.duration_days) - Number(b.duration_days);
      return Number(b.rating || 0) - Number(a.rating || 0);
    });

  function getImg(t) {
    if (!t.image_url) return null;
    return t.image_url.startsWith('http') ? t.image_url : BACKEND + t.image_url;
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=DM+Sans:wght@300;400;500;600&display=swap');

        .dest-wrap { min-height: 100vh; background: #0a0e0d; color: #f0ede8; font-family: 'DM Sans', sans-serif; }

        /* HERO */
        .dest-hero { position: relative; height: 420px; display: flex; align-items: flex-end; overflow: hidden; }
        .dest-hero-bg { position: absolute; inset: 0; background-size: cover; background-position: center; filter: brightness(0.5); transition: transform 0.6s ease; }
        .dest-hero:hover .dest-hero-bg { transform: scale(1.03); }
        .dest-hero-overlay { position: absolute; inset: 0; background: linear-gradient(to top, rgba(10,14,13,0.95) 0%, rgba(10,14,13,0.3) 60%, transparent 100%); }
        .dest-hero-content { position: relative; z-index: 2; max-width: 1200px; margin: 0 auto; padding: 0 24px 44px; width: 100%; }
        .dest-back { display: inline-flex; align-items: center; gap: 7px; color: rgba(240,237,232,0.6); font-size: 13px; font-weight: 500; cursor: pointer; background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.12); border-radius: 100px; padding: 6px 14px; margin-bottom: 20px; transition: all 0.2s; text-decoration: none; }
        .dest-back:hover { background: rgba(255,255,255,0.14); color: #fff; }
        .dest-hero-tag { font-size: 11px; font-weight: 600; letter-spacing: 0.14em; text-transform: uppercase; color: #a8d96b; margin-bottom: 10px; }
        .dest-hero-title { font-family: 'Playfair Display', serif; font-size: clamp(36px, 6vw, 62px); font-weight: 900; color: #fff; margin: 0 0 10px; line-height: 1.05; }
        .dest-hero-desc { font-size: 15px; color: rgba(240,237,232,0.65); max-width: 560px; line-height: 1.65; }

        /* CONTROLS */
        .dest-controls { background: #0d1210; border-bottom: 1px solid rgba(255,255,255,0.06); position: sticky; top: 0; z-index: 100; }
        .dest-controls-inner { max-width: 1200px; margin: 0 auto; padding: 14px 24px; display: flex; align-items: center; justify-content: space-between; gap: 16px; flex-wrap: wrap; }
        .dest-cats { display: flex; gap: 8px; overflow-x: auto; scrollbar-width: none; flex-wrap: nowrap; }
        .dest-cats::-webkit-scrollbar { display: none; }
        .dest-cat { background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); color: rgba(240,237,232,0.5); font-size: 12px; font-weight: 500; padding: 6px 14px; border-radius: 100px; cursor: pointer; white-space: nowrap; transition: all 0.18s; font-family: 'DM Sans', sans-serif; }
        .dest-cat:hover { background: rgba(168,217,107,0.08); color: #a8d96b; border-color: rgba(168,217,107,0.2); }
        .dest-cat.active { background: rgba(168,217,107,0.14); border-color: rgba(168,217,107,0.4); color: #a8d96b; font-weight: 600; }
        .dest-sort { display: flex; align-items: center; gap: 8px; }
        .dest-sort-label { font-size: 12px; color: rgba(240,237,232,0.4); white-space: nowrap; }
        .dest-sort-select { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); color: #f0ede8; font-family: 'DM Sans', sans-serif; font-size: 13px; padding: 7px 12px; border-radius: 10px; outline: none; cursor: pointer; }
        .dest-sort-select option { background: #0d1210; }

        /* CONTENT */
        .dest-content { max-width: 1200px; margin: 0 auto; padding: 32px 24px 60px; }
        .dest-result-count { font-size: 13px; color: rgba(240,237,232,0.4); margin-bottom: 24px; }
        .dest-result-count span { color: #a8d96b; font-weight: 600; }

        /* GRID */
        .dest-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 20px; }

        /* TOUR CARD */
        .dest-card { background: #131918; border: 1px solid rgba(255,255,255,0.07); border-radius: 18px; overflow: hidden; cursor: pointer; transition: transform 0.25s, border-color 0.25s, box-shadow 0.25s; }
        .dest-card:hover { transform: translateY(-5px); border-color: rgba(168,217,107,0.25); box-shadow: 0 20px 48px rgba(0,0,0,0.4); }
        .dest-card-img-wrap { position: relative; overflow: hidden; }
        .dest-card-img { width: 100%; height: 200px; object-fit: cover; display: block; transition: transform 0.4s; }
        .dest-card:hover .dest-card-img { transform: scale(1.05); }
        .dest-card-img-ph { width: 100%; height: 200px; background: rgba(168,217,107,0.04); display: flex; align-items: center; justify-content: center; }
        .dest-card-badge { position: absolute; top: 12px; left: 12px; background: rgba(168,217,107,0.9); color: #1a2010; font-size: 10px; font-weight: 700; padding: 3px 10px; border-radius: 100px; text-transform: uppercase; letter-spacing: 0.06em; }
        .dest-card-rating { position: absolute; top: 12px; right: 12px; background: rgba(0,0,0,0.6); color: #fbbf24; font-size: 12px; font-weight: 700; padding: 4px 10px; border-radius: 100px; backdrop-filter: blur(8px); display: flex; align-items: center; gap: 4px; }
        .dest-card-body { padding: 16px 18px 20px; }
        .dest-card-cat { font-size: 10px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; color: #a8d96b; margin-bottom: 6px; }
        .dest-card-title { font-family: 'Playfair Display', serif; font-size: 17px; font-weight: 700; color: #fff; margin: 0 0 6px; line-height: 1.3; }
        .dest-card-dest { font-size: 12px; color: rgba(240,237,232,0.4); margin-bottom: 14px; display: flex; align-items: center; gap: 5px; }
        .dest-card-divider { height: 1px; background: rgba(255,255,255,0.06); margin-bottom: 14px; }
        .dest-card-footer { display: flex; align-items: center; justify-content: space-between; }
        .dest-card-meta { display: flex; flex-direction: column; gap: 2px; }
        .dest-card-days { font-size: 12px; color: rgba(240,237,232,0.4); }
        .dest-card-price { font-family: 'Playfair Display', serif; font-size: 20px; font-weight: 700; color: #a8d96b; }
        .dest-card-price-sub { font-size: 11px; color: rgba(240,237,232,0.3); }
        .dest-card-btn { background: #a8d96b; color: #1a2010; border: none; border-radius: 100px; padding: 9px 20px; font-family: 'DM Sans', sans-serif; font-size: 13px; font-weight: 700; cursor: pointer; transition: background 0.2s, transform 0.15s; white-space: nowrap; }
        .dest-card-btn:hover { background: #c1e88d; transform: scale(1.04); }

        /* EMPTY */
        .dest-empty { text-align: center; padding: 80px 20px; }
        .dest-empty-icon { color: rgba(168,217,107,0.2); display: flex; justify-content: center; margin-bottom: 16px; }
        .dest-empty-title { font-family: 'Playfair Display', serif; font-size: 22px; color: #fff; margin-bottom: 8px; }
        .dest-empty-desc { font-size: 14px; color: rgba(240,237,232,0.4); margin-bottom: 24px; }
        .dest-empty-btn { background: #a8d96b; color: #1a2010; border: none; border-radius: 100px; padding: 12px 28px; font-family: 'DM Sans', sans-serif; font-size: 14px; font-weight: 700; cursor: pointer; }

        /* SKELETON */
        .dest-skeleton { background: #131918; border: 1px solid rgba(255,255,255,0.07); border-radius: 18px; overflow: hidden; }
        @keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
        .dest-skel-img { height: 200px; background: linear-gradient(90deg, #1a2118 25%, #222e20 50%, #1a2118 75%); background-size: 200% 100%; animation: shimmer 1.4s infinite; }
        .dest-skel-body { padding: 16px 18px; display: flex; flex-direction: column; gap: 10px; }
        .dest-skel-line { height: 10px; border-radius: 4px; background: linear-gradient(90deg, #1a2118 25%, #222e20 50%, #1a2118 75%); background-size: 200% 100%; animation: shimmer 1.4s infinite; }

        @media (max-width: 768px) {
          .dest-hero { height: 320px; }
          .dest-grid { grid-template-columns: 1fr; }
          .dest-controls-inner { flex-direction: column; align-items: flex-start; }
        }
      `}</style>

      <div className="dest-wrap">

        {/* HERO */}
        <div className="dest-hero">
          <div className="dest-hero-bg" style={{ backgroundImage: `url('${info.hero}')` }} />
          <div className="dest-hero-overlay" />
          <div className="dest-hero-content">
            <button className="dest-back" onClick={() => nav(-1)}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
              Back
            </button>
            <div className="dest-hero-tag">{info.subtitle}</div>
            <h1 className="dest-hero-title">{info.label}</h1>
            <p className="dest-hero-desc">{info.desc}</p>
          </div>
        </div>

        {/* STICKY CONTROLS */}
        <div className="dest-controls">
          <div className="dest-controls-inner">
            <div className="dest-cats">
              {CATEGORIES.map(c => (
                <button key={c} className={`dest-cat ${category === c ? 'active' : ''}`} onClick={() => setCategory(c)}>
                  {c}
                </button>
              ))}
            </div>
            <div className="dest-sort">
              <span className="dest-sort-label">Sort by:</span>
              <select className="dest-sort-select" value={sort} onChange={e => setSort(e.target.value)}>
                <option value="popular">Popular</option>
                <option value="price_low">Price: Low to High</option>
                <option value="price_high">Price: High to Low</option>
                <option value="duration">Duration</option>
              </select>
            </div>
          </div>
        </div>

        {/* CONTENT */}
        <div className="dest-content">
          {!loading && (
            <div className="dest-result-count">
              Showing <span>{filtered.length}</span> tour{filtered.length !== 1 ? 's' : ''} in {info.label}
              {category !== 'All' && <span> · {category}</span>}
            </div>
          )}

          <div className="dest-grid">

            {/* Loading skeletons */}
            {loading && [1,2,3,4,5,6].map(i => (
              <div key={i} className="dest-skeleton">
                <div className="dest-skel-img" />
                <div className="dest-skel-body">
                  <div className="dest-skel-line" style={{width:'40%'}} />
                  <div className="dest-skel-line" style={{width:'75%', height:'14px'}} />
                  <div className="dest-skel-line" style={{width:'55%'}} />
                  <div className="dest-skel-line" style={{width:'35%', marginTop:'8px'}} />
                </div>
              </div>
            ))}

            {/* Tour cards */}
            {!loading && filtered.map(t => {
              const imgSrc = getImg(t);
              return (
                <div key={t.id} className="dest-card" onClick={() => nav(`/tours/${t.id}`)}>
                  <div className="dest-card-img-wrap">
                    {imgSrc ? (
                      <img className="dest-card-img" src={imgSrc} alt={t.title}
                        onError={e => { e.target.style.display='none'; e.target.nextSibling?.style && (e.target.nextSibling.style.display='flex'); }} />
                    ) : null}
                    <div className="dest-card-img-ph" style={{display: imgSrc ? 'none' : 'flex'}}>
                      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="rgba(168,217,107,0.2)" strokeWidth="1.5">
                        <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
                      </svg>
                    </div>
                    <span className="dest-card-badge">{t.category}</span>
                    {t.rating && (
                      <span className="dest-card-rating">
                        ★ {Number(t.rating).toFixed(1)}
                      </span>
                    )}
                  </div>
                  <div className="dest-card-body">
                    <div className="dest-card-cat">{t.category}</div>
                    <div className="dest-card-title">{t.title}</div>
                    <div className="dest-card-dest">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/>
                      </svg>
                      {t.destination}
                    </div>
                    <div className="dest-card-divider" />
                    <div className="dest-card-footer">
                      <div className="dest-card-meta">
                        <div className="dest-card-days">{t.duration_days} days</div>
                        <div className="dest-card-price">
                          NPR {new Intl.NumberFormat('en-NP').format(Math.round(Number(t.price_usd) * 133))}
                        </div>
                        <div className="dest-card-price-sub">per person</div>
                      </div>
                      <button className="dest-card-btn">Book Now</button>
                    </div>
                  </div>
                </div>
              );
            })}

          </div>

          {/* Empty state */}
          {!loading && filtered.length === 0 && (
            <div className="dest-empty">
              <div className="dest-empty-icon">
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                  <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/>
                  <line x1="8" y1="2" x2="8" y2="18"/>
                  <line x1="16" y1="6" x2="16" y2="22"/>
                </svg>
              </div>
              <div className="dest-empty-title">No tours found</div>
              <div className="dest-empty-desc">
                {category !== 'All'
                  ? `No ${category} tours in ${info.label} yet. Try a different category!`
                  : `No tours available in ${info.label} yet. Check back soon!`}
              </div>
              <button className="dest-empty-btn" onClick={() => { setCategory('All'); nav('/tours'); }}>
                Browse All Tours
              </button>
            </div>
          )}

        </div>
      </div>
    </>
  );
}