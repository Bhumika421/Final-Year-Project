import { useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const USD_TO_NPR = 133;
function toNPR(usd) {
  const num = Number(usd.replace('$', ''));
  return 'NPR ' + new Intl.NumberFormat('en-NP').format(num * USD_TO_NPR);
}

export default function Home() {
  const nav = useNavigate();
  const [q, setQ] = useState('');
  const carouselRef = useRef(null);

  const featured = useMemo(() => [
    { title: 'Kathmandu Heritage Tour', place: 'Kathmandu Valley', tag: 'Durbar Squares • Temples • Culture', seed: 'kathmandu', days: '3 Days', price: '$120' },
    { title: 'Pokhara Lakeside Escape', place: 'Pokhara', tag: 'Phewa Lake • Sunrise • Relax', seed: 'pokhara', days: '4 Days', price: '$180' },
    { title: 'Chitwan Jungle Safari', place: 'Chitwan National Park', tag: 'Wildlife • Safari • Tharu Culture', seed: 'chitwan', days: '3 Days', price: '$210' },
    { title: 'Everest View Journey', place: 'Everest Region', tag: 'Mountains • Trek • Views', seed: 'everest', days: '7 Days', price: '$450' },
    { title: 'Annapurna Base Camp', place: 'Annapurna Region', tag: 'Trek • Glacier • Sunrise', seed: 'annapurna', days: '10 Days', price: '$580' },
    { title: 'Lumbini Pilgrimage', place: 'Lumbini', tag: 'Buddhism • Peace • Heritage', seed: 'lumbini', days: '2 Days', price: '$90' },
  ], []);

  function onSearch(e) {
    e.preventDefault();
    const query = q.trim();
    nav(query ? `/tours?q=${encodeURIComponent(query)}` : '/tours');
  }

  function scroll(dir) {
    if (carouselRef.current) {
      carouselRef.current.scrollBy({ left: dir * 320, behavior: 'smooth' });
    }
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=DM+Sans:wght@300;400;500;600&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'DM Sans', sans-serif; background: #0a0e0d; color: #f0ede8; min-height: 100vh; }

        .hp-hero { position: relative; min-height: 100vh; display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center; overflow: hidden; }
        .hp-hero-bg { position: absolute; inset: 0; background-image: linear-gradient(to bottom, rgba(10,14,13,0.35) 0%, rgba(10,14,13,0.55) 50%, rgba(10,14,13,0.95) 100%), url('https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=1800&q=80'); background-size: cover; background-position: center 30%; background-attachment: fixed; transform: scale(1.05); animation: slowZoom 20s ease-in-out infinite alternate; }
        @keyframes slowZoom { from { transform: scale(1.05); } to { transform: scale(1.12); } }
        .hp-hero-bg::after { content: ''; position: absolute; inset: 0; background: radial-gradient(ellipse 40% 30% at 20% 60%, rgba(139,195,74,0.08) 0%, transparent 60%), radial-gradient(ellipse 30% 40% at 80% 30%, rgba(255,152,0,0.06) 0%, transparent 60%); }
        .hp-hero-inner { position: relative; z-index: 2; max-width: 760px; padding: 0 24px; animation: fadeUp 0.9s ease both; }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(32px); } to { opacity: 1; transform: translateY(0); } }
        .hp-eyebrow { display: inline-flex; align-items: center; gap: 8px; background: rgba(139,195,74,0.15); border: 1px solid rgba(139,195,74,0.35); color: #a8d96b; font-size: 12px; font-weight: 600; letter-spacing: 0.12em; text-transform: uppercase; padding: 6px 16px; border-radius: 100px; margin-bottom: 28px; }
        .hp-title { font-family: 'Playfair Display', serif; font-size: clamp(42px, 8vw, 82px); font-weight: 900; line-height: 1.05; color: #fff; margin-bottom: 20px; text-shadow: 0 4px 40px rgba(0,0,0,0.5); }
        .hp-title span { color: #a8d96b; font-style: italic; }
        .hp-subtitle { font-size: 17px; color: rgba(240,237,232,0.72); line-height: 1.65; max-width: 520px; margin: 0 auto 36px; }
        .hp-search { display: flex; max-width: 540px; margin: 0 auto; background: rgba(255,255,255,0.08); backdrop-filter: blur(16px); border: 1px solid rgba(255,255,255,0.18); border-radius: 100px; padding: 6px 6px 6px 22px; animation: fadeUp 0.9s 0.2s ease both; }
        .hp-search input { flex: 1; background: transparent; border: none; outline: none; color: #fff; font-family: 'DM Sans', sans-serif; font-size: 15px; }
        .hp-search input::placeholder { color: rgba(255,255,255,0.45); }
        .hp-search-btn { background: #a8d96b; color: #1a2010; border: none; border-radius: 100px; padding: 12px 26px; font-family: 'DM Sans', sans-serif; font-size: 14px; font-weight: 600; cursor: pointer; white-space: nowrap; transition: background 0.2s, transform 0.15s; }
        .hp-search-btn:hover { background: #c1e88d; transform: scale(1.03); }
        .hp-scroll-hint { position: absolute; bottom: 36px; left: 50%; transform: translateX(-50%); z-index: 2; display: flex; flex-direction: column; align-items: center; gap: 6px; color: rgba(255,255,255,0.4); font-size: 11px; letter-spacing: 0.1em; text-transform: uppercase; animation: bounce 2s ease infinite; }
        @keyframes bounce { 0%,100% { transform: translateX(-50%) translateY(0); } 50% { transform: translateX(-50%) translateY(8px); } }
        .hp-scroll-hint svg { width: 18px; height: 18px; }

        .hp-stats { background: #111714; border-top: 1px solid rgba(255,255,255,0.06); border-bottom: 1px solid rgba(255,255,255,0.06); display: flex; justify-content: center; }
        .hp-stat { flex: 1; max-width: 260px; padding: 28px 24px; text-align: center; border-right: 1px solid rgba(255,255,255,0.06); }
        .hp-stat:last-child { border-right: none; }
        .hp-stat-num { font-family: 'Playfair Display', serif; font-size: 32px; font-weight: 700; color: #a8d96b; line-height: 1; margin-bottom: 6px; }
        .hp-stat-label { font-size: 13px; color: rgba(240,237,232,0.5); }

        .hp-section { max-width: 1200px; margin: 0 auto; padding: 72px 24px; }
        .hp-section-head { display: flex; align-items: flex-end; justify-content: space-between; margin-bottom: 32px; flex-wrap: wrap; gap: 12px; }
        .hp-section-tag { font-size: 11px; font-weight: 600; letter-spacing: 0.14em; text-transform: uppercase; color: #a8d96b; margin-bottom: 8px; }
        .hp-section-title { font-family: 'Playfair Display', serif; font-size: clamp(26px, 4vw, 38px); font-weight: 700; color: #fff; line-height: 1.15; }
        .hp-view-all { display: inline-flex; align-items: center; gap: 6px; color: #a8d96b; font-size: 14px; font-weight: 500; text-decoration: none; border: 1px solid rgba(168,217,107,0.3); border-radius: 100px; padding: 8px 18px; transition: background 0.2s, border-color 0.2s; white-space: nowrap; }
        .hp-view-all:hover { background: rgba(168,217,107,0.1); border-color: rgba(168,217,107,0.6); }

        /* CAROUSEL */
        .hp-carousel-wrap { position: relative; }
        .hp-carousel { display: flex; gap: 20px; overflow-x: auto; scroll-snap-type: x mandatory; -webkit-overflow-scrolling: touch; padding-bottom: 8px; scrollbar-width: none; }
        .hp-carousel::-webkit-scrollbar { display: none; }
        .hp-carousel-btn { position: absolute; top: 50%; transform: translateY(-50%); width: 44px; height: 44px; border-radius: 50%; background: #131918; border: 1px solid rgba(255,255,255,0.12); color: #fff; font-size: 18px; cursor: pointer; display: flex; align-items: center; justify-content: center; z-index: 10; transition: background 0.2s, border-color 0.2s; }
        .hp-carousel-btn:hover { background: #1e2e1a; border-color: rgba(168,217,107,0.4); color: #a8d96b; }
        .hp-carousel-btn.prev { left: -22px; }
        .hp-carousel-btn.next { right: -22px; }

        .hp-card { background: #131918; border: 1px solid rgba(255,255,255,0.07); border-radius: 20px; overflow: hidden; transition: transform 0.25s, border-color 0.25s, box-shadow 0.25s; cursor: pointer; flex: 0 0 280px; scroll-snap-align: start; }
        .hp-card:hover { transform: translateY(-6px); border-color: rgba(168,217,107,0.25); box-shadow: 0 24px 48px rgba(0,0,0,0.4); }
        .hp-card-img { width: 100%; height: 190px; object-fit: cover; display: block; transition: transform 0.4s; }
        .hp-card:hover .hp-card-img { transform: scale(1.04); }
        .hp-card-img-wrap { overflow: hidden; position: relative; }
        .hp-card-badge { position: absolute; top: 12px; right: 12px; background: rgba(168,217,107,0.9); color: #1a2010; font-size: 11px; font-weight: 700; padding: 4px 10px; border-radius: 100px; }
        .hp-card-body { padding: 16px 18px 18px; }
        .hp-card-place { font-size: 11px; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase; color: #a8d96b; margin-bottom: 5px; }
        .hp-card-title { font-family: 'Playfair Display', serif; font-size: 17px; font-weight: 700; color: #fff; line-height: 1.3; margin-bottom: 6px; }
        .hp-card-tag { font-size: 12px; color: rgba(240,237,232,0.5); margin-bottom: 14px; }
        .hp-card-footer { display: flex; align-items: center; justify-content: space-between; }
        .hp-card-days { font-size: 12px; color: rgba(240,237,232,0.45); }
        .hp-card-price { font-size: 15px; font-weight: 700; color: #fff; }
        .hp-card-btn { background: rgba(168,217,107,0.12); color: #a8d96b; border: 1px solid rgba(168,217,107,0.3); border-radius: 100px; padding: 7px 16px; font-family: 'DM Sans', sans-serif; font-size: 12px; font-weight: 600; cursor: pointer; transition: background 0.2s; text-decoration: none; }
        .hp-card-btn:hover { background: rgba(168,217,107,0.22); }

        .hp-features { background: #0e1310; border-top: 1px solid rgba(255,255,255,0.05); border-bottom: 1px solid rgba(255,255,255,0.05); }
        .hp-feat-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.05); border-radius: 20px; overflow: hidden; }
        .hp-feat { background: #0e1310; padding: 36px 32px; transition: background 0.2s; }
        .hp-feat:hover { background: #131918; }
        .hp-feat-icon { font-size: 32px; margin-bottom: 18px; display: block; }
        .hp-feat-title { font-family: 'Playfair Display', serif; font-size: 20px; font-weight: 700; color: #fff; margin-bottom: 10px; }
        .hp-feat-desc { font-size: 14px; color: rgba(240,237,232,0.5); line-height: 1.65; }

        @media (max-width: 640px) {
          .hp-stats { flex-direction: column; }
          .hp-stat { border-right: none; border-bottom: 1px solid rgba(255,255,255,0.06); }
          .hp-stat:last-child { border-bottom: none; }
          .hp-carousel-btn { display: none; }
        }
      `}</style>

      {/* HERO */}
      <section className="hp-hero">
        <div className="hp-hero-bg" />
        <div className="hp-hero-inner">
          <div className="hp-eyebrow"><span>🏔</span> Nepal's Most Trusted Tour Platform</div>
          <h1 className="hp-title">Discover<br /><span>Nepal's</span> Magic</h1>
          <p className="hp-subtitle">Explore verified tours from trusted agencies. From Himalayan peaks to jungle safaris — your next adventure starts here.</p>
          <form onSubmit={onSearch} className="hp-search">
            <input placeholder="Search Pokhara, Chitwan, Everest..." value={q} onChange={(e) => setQ(e.target.value)} />
            <button type="submit" className="hp-search-btn">Search Tours</button>
          </form>
        </div>
        <div className="hp-scroll-hint">
          <span>Scroll</span>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12l7 7 7-7"/></svg>
        </div>
      </section>

      {/* STATS */}
      <div className="hp-stats">
        {[{ num: '120+', label: 'Verified Tours' }, { num: '40+', label: 'Trusted Agencies' }, { num: '5,000+', label: 'Happy Travelers' }].map(s => (
          <div className="hp-stat" key={s.num}>
            <div className="hp-stat-num">{s.num}</div>
            <div className="hp-stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      {/* FEATURED TOURS — CAROUSEL */}
      <section className="hp-section">
        <div className="hp-section-head">
          <div>
            <div className="hp-section-tag">✦ Popular picks</div>
            <h2 className="hp-section-title">Featured Trips</h2>
          </div>
          <Link className="hp-view-all" to="/tours">View all tours →</Link>
        </div>

        <div className="hp-carousel-wrap">
          <button className="hp-carousel-btn prev" onClick={() => scroll(-1)}>‹</button>
          <div className="hp-carousel" ref={carouselRef}>
            {featured.map((t) => (
              <div key={t.title} className="hp-card" onClick={() => nav(`/tours?q=${encodeURIComponent(t.place)}`)}>
                <div className="hp-card-img-wrap">
                  <img className="hp-card-img" src={`https://picsum.photos/seed/${t.seed}/900/600`} alt={t.title} />
                  <span className="hp-card-badge">Trusted ✓</span>
                </div>
                <div className="hp-card-body">
                  <div className="hp-card-place">📍 {t.place}</div>
                  <div className="hp-card-title">{t.title}</div>
                  <div className="hp-card-tag">{t.tag}</div>
                  <div className="hp-card-footer">
                    <div>
                      <div className="hp-card-days">{t.days}</div>
                      <div className="hp-card-price">from {toNPR(t.price)}</div>
                    </div>
                    <span className="hp-card-btn">Explore →</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <button className="hp-carousel-btn next" onClick={() => scroll(1)}>›</button>
        </div>
      </section>

      {/* FEATURES */}
      <section className="hp-features">
        <div className="hp-section" style={{ paddingTop: 56, paddingBottom: 56 }}>
          <div className="hp-feat-grid">
            {[
              { icon: '🛡️', title: 'Verified Listings', desc: 'Every tour is reviewed by our admin team before it goes live — so you only see trustworthy packages.' },
              { icon: '🗺️', title: 'Nepal-Only Focus', desc: 'Dedicated entirely to Nepal tourism — from Kathmandu heritage to Himalayan treks and jungle safaris.' },
              { icon: '💬', title: 'Support When Needed', desc: 'Got questions? Our support team is ready to help customers and agencies at any time.' },
            ].map(f => (
              <div className="hp-feat" key={f.title}>
                <span className="hp-feat-icon">{f.icon}</span>
                <div className="hp-feat-title">{f.title}</div>
                <p className="hp-feat-desc">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
