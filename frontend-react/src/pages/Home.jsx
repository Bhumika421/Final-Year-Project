import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { fetchLoyaltyStatus, getLoyaltyLevel, getNextLevel } from '../utils/loyalty';
import { getToken, api } from '../api/client';

const USD_TO_NPR = 133;
const BACKEND = 'http://localhost/safe-journey-planner/backend-php/public';

function toNPR(usd) {
  const num = Number(usd.replace('$', ''));
  return 'NPR ' + new Intl.NumberFormat('en-NP').format(num * USD_TO_NPR);
}

const REWARD_CARDS = [
  { title: '10% off all tours',       desc: 'Automatic discount on every verified tour package',       level: 1 },
  { title: 'Email support',           desc: 'Standard customer support for all your bookings',         level: 1 },
  { title: '15% off all tours',       desc: 'Complete 5 bookings to unlock Level 2',                    level: 2 },
  { title: 'Free airport pickup',     desc: 'Complimentary pickup service at Level 2',                  level: 2 },
  { title: 'Priority booking',        desc: 'Get early access to popular tours at Level 2',             level: 2 },
  { title: '20% off all tours',       desc: 'Complete 10 bookings to unlock Level 3',                   level: 3 },
  { title: 'Dedicated concierge',     desc: 'Personal travel concierge for Elite members',              level: 3 },
  { title: 'Free itinerary custom',   desc: 'Fully customize your tour itinerary at Level 3',           level: 3 },
];

export default function Home() {
  const nav = useNavigate();
  const [q, setQ] = useState('');
  const carouselRef = useRef(null);

  const [featuredTours, setFeaturedTours] = useState([]);
  const [toursLoading, setToursLoading] = useState(true);

  // Loyalty state
  const [loyalty, setLoyalty] = useState(null);
  const [loyaltyLoading, setLoyaltyLoading] = useState(true);

  
  useEffect(() => {
    api.get('/api/tours?limit=6')
      .then(res => setFeaturedTours(res.data.items || []))
      .catch(() => {})
      .finally(() => setToursLoading(false));
  }, []);

  useEffect(() => {
    async function loadLoyalty() {
      if (!getToken()) { setLoyaltyLoading(false); return; }
      const data = await fetchLoyaltyStatus();
      setLoyalty(data);
      setLoyaltyLoading(false);
    }
    loadLoyalty();
  }, []);

  // Fallback hardcoded tours — shown if DB empty
  const featured = useMemo(() => [
    { title: 'Kathmandu Heritage Tour',  place: 'Kathmandu Valley',        tag: 'Durbar Squares - Temples - Culture', seed: 'kathmandu', days: '3 Days', price: '$120' },
    { title: 'Pokhara Lakeside Escape',  place: 'Pokhara',                 tag: 'Phewa Lake - Sunrise - Relax',       seed: 'pokhara',   days: '4 Days', price: '$180' },
    { title: 'Chitwan Jungle Safari',    place: 'Chitwan National Park',   tag: 'Wildlife - Safari - Tharu Culture',  seed: 'chitwan',   days: '3 Days', price: '$210' },
    { title: 'Everest View Journey',     place: 'Everest Region',          tag: 'Mountains - Trek - Views',           seed: 'everest',   days: '7 Days', price: '$450' },
    { title: 'Annapurna Base Camp',      place: 'Annapurna Region',        tag: 'Trek - Glacier - Sunrise',           seed: 'annapurna', days: '10 Days', price: '$580' },
    { title: 'Lumbini Pilgrimage',       place: 'Lumbini',                 tag: 'Buddhism - Peace - Heritage',        seed: 'lumbini',   days: '2 Days', price: '$90' },
  ], []);

  const destinations = useMemo(() => [
    { name: 'Chitwan',    subtitle: 'Jungle & Wildlife',     tours: 24, seed: 'chitwan-jungle',   q: 'Chitwan'   },
    { name: 'Kathmandu',  subtitle: 'Heritage & Culture',    tours: 56, seed: 'kathmandu-temple', q: 'Kathmandu' },
    { name: 'Lumbini',    subtitle: 'Sacred Birthplace',     tours: 12, seed: 'lumbini-peace',    q: 'Lumbini'   },
    { name: 'Pokhara',    subtitle: 'Lakes & Mountains',     tours: 38, seed: 'pokhara-lake',     q: 'Pokhara'   },
    { name: 'Bhaktapur',  subtitle: 'Medieval Architecture', tours: 18, seed: 'bhaktapur-city',   q: 'Bhaktapur' },
    { name: 'Nagarkot',   subtitle: 'Himalayan Sunrise',     tours: 14, seed: 'nagarkot-hills',   q: 'Nagarkot'  },
    { name: 'Bandipur',   subtitle: 'Hilltop Village',       tours: 9,  seed: 'bandipur-village', q: 'Bandipur'  },
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

  const completedBookings = loyalty?.completed_bookings ?? 0;
  const currentLevelData = getLoyaltyLevel(completedBookings);
  const nextLevelData = getNextLevel(completedBookings);
  const isLoggedIn = !!getToken();
  const progressPct = nextLevelData ? Math.min(100, (completedBookings / nextLevelData.minBookings) * 100) : 100;
  const bookingsToNext = nextLevelData ? Math.max(0, nextLevelData.minBookings - completedBookings) : 0;

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
        .hp-card-skeleton { background: #131918; border: 1px solid rgba(255,255,255,0.07); border-radius: 20px; overflow: hidden; flex: 0 0 280px; }
        @keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
        .hp-skel-img { height: 190px; background: linear-gradient(90deg, #1a2118 25%, #222e20 50%, #1a2118 75%); background-size: 200% 100%; animation: shimmer 1.4s infinite; }
        .hp-skel-body { padding: 16px 18px; display: flex; flex-direction: column; gap: 10px; }
        .hp-skel-line { height: 10px; border-radius: 4px; background: linear-gradient(90deg, #1a2118 25%, #222e20 50%, #1a2118 75%); background-size: 200% 100%; animation: shimmer 1.4s infinite; }
        .hp-dest-section { background: #0c1210; border-top: 1px solid rgba(255,255,255,0.05); }
        .hp-dest-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
        .hp-dest-card { position: relative; border-radius: 18px; overflow: hidden; cursor: pointer; transition: transform 0.28s, box-shadow 0.28s; }
        .hp-dest-card:hover { transform: translateY(-5px); box-shadow: 0 20px 48px rgba(0,0,0,0.55); }
        .hp-dest-card:hover .hp-dest-img { transform: scale(1.07); }
        .hp-dest-card:first-child { grid-row: span 2; }
        .hp-dest-img { width: 100%; height: 100%; object-fit: cover; display: block; transition: transform 0.45s ease; min-height: 200px; }
        .hp-dest-card:first-child .hp-dest-img { min-height: 432px; }
        .hp-dest-overlay { position: absolute; inset: 0; background: linear-gradient(to top, rgba(5,10,8,0.88) 0%, rgba(5,10,8,0.25) 55%, transparent 100%); }
        .hp-dest-info { position: absolute; bottom: 0; left: 0; right: 0; padding: 20px 22px; }
        .hp-dest-name { font-family: 'Playfair Display', serif; font-size: 22px; font-weight: 700; color: #fff; line-height: 1.2; margin-bottom: 4px; }
        .hp-dest-card:first-child .hp-dest-name { font-size: 30px; }
        .hp-dest-subtitle { font-size: 12px; color: rgba(240,237,232,0.6); margin-bottom: 8px; }
        .hp-dest-pill { display: inline-flex; align-items: center; gap: 5px; background: rgba(168,217,107,0.18); border: 1px solid rgba(168,217,107,0.35); color: #a8d96b; font-size: 11px; font-weight: 700; padding: 4px 10px; border-radius: 100px; }
        .hp-loyalty-section { background: #0a0e0d; border-top: 1px solid rgba(255,255,255,0.06); }
        .hp-loyalty-inner { max-width: 1200px; margin: 0 auto; padding: 56px 24px 64px; }
        .hp-loyalty-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 28px; flex-wrap: wrap; gap: 12px; }
        .hp-loyalty-tag { font-size: 11px; font-weight: 600; letter-spacing: 0.14em; text-transform: uppercase; color: #a8d96b; margin-bottom: 8px; }
        .hp-loyalty-title { font-family: 'Playfair Display', serif; font-size: clamp(24px, 4vw, 36px); font-weight: 700; color: #fff; line-height: 1.15; }
        .hp-loyalty-link { display: inline-flex; align-items: center; gap: 6px; color: #a8d96b; font-size: 14px; font-weight: 500; text-decoration: none; border: 1px solid rgba(168,217,107,0.3); border-radius: 100px; padding: 8px 18px; transition: background 0.2s, border-color 0.2s; white-space: nowrap; cursor: pointer; background: transparent; font-family: 'DM Sans', sans-serif; }
        .hp-loyalty-link:hover { background: rgba(168,217,107,0.1); border-color: rgba(168,217,107,0.6); }
        .hp-loyalty-level-bar { display: flex; align-items: center; gap: 16px; background: linear-gradient(135deg, #1a3a0e 0%, #0f2209 100%); border: 1px solid rgba(168,217,107,0.3); border-radius: 16px; padding: 20px 24px; margin-bottom: 20px; flex-wrap: wrap; }
        .hp-loyalty-level-badge { display: inline-flex; align-items: center; gap: 6px; background: rgba(168,217,107,0.2); border: 1px solid rgba(168,217,107,0.45); color: #a8d96b; font-size: 12px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; padding: 5px 12px; border-radius: 100px; white-space: nowrap; }
        .hp-loyalty-level-info { flex: 1; min-width: 200px; }
        .hp-loyalty-level-name { font-family: 'Playfair Display', serif; font-size: 18px; font-weight: 700; color: #fff; margin-bottom: 4px; }
        .hp-loyalty-level-desc { font-size: 13px; color: rgba(168,217,107,0.75); }
        .hp-loyalty-progress { flex: 2; min-width: 200px; }
        .hp-loyalty-prog-labels { display: flex; justify-content: space-between; font-size: 12px; color: rgba(240,237,232,0.55); margin-bottom: 8px; }
        .hp-loyalty-prog-bar { height: 6px; background: rgba(255,255,255,0.1); border-radius: 100px; overflow: hidden; }
        .hp-loyalty-prog-fill { height: 100%; background: linear-gradient(90deg, #a8d96b, #c1e88d); border-radius: 100px; transition: width 0.6s ease; }
        .hp-loyalty-prog-hint { font-size: 12px; color: rgba(240,237,232,0.4); margin-top: 6px; }
        .hp-loyalty-guest-bar { background: linear-gradient(135deg, #1a3a0e 0%, #0f2209 100%); border: 1px solid rgba(168,217,107,0.3); border-radius: 16px; padding: 24px; margin-bottom: 20px; text-align: center; }
        .hp-loyalty-guest-title { font-family: 'Playfair Display', serif; font-size: 20px; font-weight: 700; color: #fff; margin-bottom: 6px; }
        .hp-loyalty-guest-desc { font-size: 13px; color: rgba(240,237,232,0.65); margin-bottom: 14px; }
        .hp-loyalty-guest-btn { display: inline-block; background: #a8d96b; color: #1a2010; border: none; border-radius: 100px; padding: 10px 22px; font-family: 'DM Sans', sans-serif; font-size: 13px; font-weight: 700; cursor: pointer; text-decoration: none; transition: background 0.2s; }
        .hp-loyalty-guest-btn:hover { background: #c1e88d; }
        .hp-rewards-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; }
        .hp-rew-card { background: #131918; border: 1px solid rgba(255,255,255,0.08); border-radius: 16px; padding: 20px 18px; display: flex; flex-direction: column; gap: 8px; position: relative; transition: transform 0.22s, box-shadow 0.22s, border-color 0.22s; }
        .hp-rew-card.unlocked { border-color: rgba(168,217,107,0.25); }
        .hp-rew-card.unlocked:hover { transform: translateY(-4px); box-shadow: 0 16px 40px rgba(0,0,0,0.4); border-color: rgba(168,217,107,0.5); }
        .hp-rew-card.locked { background: #0e1210; border-color: rgba(255,255,255,0.06); }
        .hp-rew-lock { position: absolute; top: 14px; right: 14px; }
        .hp-rew-lock svg { color: rgba(240,237,232,0.25); }
        .hp-rew-title { font-size: 14px; font-weight: 600; color: #fff; line-height: 1.3; margin-top: 4px; }
        .hp-rew-card.locked .hp-rew-title { color: rgba(240,237,232,0.35); }
        .hp-rew-desc { font-size: 12px; color: rgba(240,237,232,0.5); line-height: 1.5; }
        .hp-rew-card.locked .hp-rew-desc { color: rgba(240,237,232,0.28); }
        .hp-rew-lvl { display: inline-flex; align-items: center; font-size: 10px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; padding: 3px 9px; border-radius: 100px; margin-top: auto; width: fit-content; }
        .hp-rew-card.unlocked .hp-rew-lvl { background: rgba(168,217,107,0.14); color: #a8d96b; }
        .hp-rew-card.locked .hp-rew-lvl { background: rgba(255,255,255,0.05); color: rgba(240,237,232,0.28); border: 1px solid rgba(255,255,255,0.08); }
        @media (max-width: 1024px) { .hp-rewards-grid { grid-template-columns: repeat(3, 1fr); } }
        @media (max-width: 768px) { .hp-dest-grid { grid-template-columns: repeat(2, 1fr); } .hp-dest-card:first-child { grid-row: span 1; } .hp-dest-card:first-child .hp-dest-img { min-height: 200px; } .hp-dest-card:first-child .hp-dest-name { font-size: 22px; } .hp-rewards-grid { grid-template-columns: repeat(2, 1fr); } }
        @media (max-width: 640px) { .hp-stats { flex-direction: column; } .hp-stat { border-right: none; border-bottom: 1px solid rgba(255,255,255,0.06); } .hp-stat:last-child { border-bottom: none; } .hp-carousel-btn { display: none; } .hp-dest-grid { grid-template-columns: 1fr 1fr; gap: 10px; } .hp-rewards-grid { grid-template-columns: repeat(2, 1fr); gap: 10px; } }
      `}</style>

      {/* HERO */}
      <section className="hp-hero">
        <div className="hp-hero-bg" />
        <div className="hp-hero-inner">
          <div className="hp-eyebrow"><span></span> Nepal's Most Trusted Tour Platform</div>
          <h1 className="hp-title">Discover<br /><span>Nepal's</span> Magic</h1>
          <p className="hp-subtitle">Explore verified tours from trusted agencies. From Himalayan peaks to jungle safaris - your next adventure starts here.</p>
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

      {/* FEATURED TOURS */}
      <section className="hp-section">
        <div className="hp-section-head">
          <div>
            <div className="hp-section-tag">Popular picks</div>
            <h2 className="hp-section-title">Featured Trips</h2>
          </div>
          <Link className="hp-view-all" to="/tours">View all tours</Link>
        </div>
        <div className="hp-carousel-wrap">
          <button className="hp-carousel-btn prev" onClick={() => scroll(-1)}>‹</button>
          <div className="hp-carousel" ref={carouselRef}>

            {toursLoading && [1,2,3,4].map(i => (
              <div key={i} className="hp-card-skeleton">
                <div className="hp-skel-img" />
                <div className="hp-skel-body">
                  <div className="hp-skel-line" style={{width:'50%'}} />
                  <div className="hp-skel-line" style={{width:'80%', height:'14px'}} />
                  <div className="hp-skel-line" style={{width:'65%'}} />
                  <div className="hp-skel-line" style={{width:'40%', marginTop:'8px'}} />
                </div>
              </div>
            ))}

            {!toursLoading && featuredTours.length > 0 && featuredTours.map((t) => {
              const imgSrc = t.image_url
                ? (t.image_url.startsWith('http') ? t.image_url : BACKEND + t.image_url)
                : null;
              return (
                <div key={t.id} className="hp-card" onClick={() => nav(`/tours/${t.id}`)}>
                  <div className="hp-card-img-wrap">
                    {imgSrc ? (
                      <img
                        className="hp-card-img"
                        src={imgSrc}
                        alt={t.title}
                        onError={e => { e.target.style.display = 'none'; }}
                      />
                    ) : (
                      <div style={{height:'190px', background:'rgba(168,217,107,0.04)', display:'flex', alignItems:'center', justifyContent:'center'}}>
                        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="rgba(168,217,107,0.2)" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                      </div>
                    )}
                    <span className="hp-card-badge">Trusted</span>
                  </div>
                  <div className="hp-card-body">
                    <div className="hp-card-place">{t.destination}</div>
                    <div className="hp-card-title">{t.title}</div>
                    <div className="hp-card-tag">{t.category}</div>
                    <div className="hp-card-footer">
                      <div>
                        <div className="hp-card-days">{t.duration_days} Days</div>
                        <div className="hp-card-price">
                          from NPR {new Intl.NumberFormat('en-NP').format(Math.round(Number(t.price_usd) * 133))}
                        </div>
                      </div>
                      <span className="hp-card-btn">Explore</span>
                    </div>
                  </div>
                </div>
              );
            })}

           
            {!toursLoading && featuredTours.length === 0 && featured.map((t) => (
              <div key={t.title} className="hp-card" onClick={() => nav(`/tours?q=${encodeURIComponent(t.place)}`)}>
                <div className="hp-card-img-wrap">
                  <img className="hp-card-img" src={`https://picsum.photos/seed/${t.seed}/900/600`} alt={t.title} />
                  <span className="hp-card-badge">Trusted</span>
                </div>
                <div className="hp-card-body">
                  <div className="hp-card-place">{t.place}</div>
                  <div className="hp-card-title">{t.title}</div>
                  <div className="hp-card-tag">{t.tag}</div>
                  <div className="hp-card-footer">
                    <div>
                      <div className="hp-card-days">{t.days}</div>
                      <div className="hp-card-price">from {toNPR(t.price)}</div>
                    </div>
                    <span className="hp-card-btn">Explore</span>
                  </div>
                </div>
              </div>
            ))}

          </div>
          <button className="hp-carousel-btn next" onClick={() => scroll(1)}>›</button>
        </div>
      </section>

      {/* TOP DESTINATIONS */}
      <section className="hp-dest-section">
        <div className="hp-section">
          <div className="hp-section-head">
            <div>
              <div className="hp-section-tag">Explore by place</div>
              <h2 className="hp-section-title">Top Destinations</h2>
            </div>
            <Link className="hp-view-all" to="/tours">Browse all</Link>
          </div>
          <div className="hp-dest-grid">
            {destinations.map((d) => (
              <div key={d.name} className="hp-dest-card" onClick={() => nav(`/tours?q=${encodeURIComponent(d.q)}`)}>
                <img className="hp-dest-img" src={`https://picsum.photos/seed/${d.seed}/800/600`} alt={d.name} />
                <div className="hp-dest-overlay" />
                <div className="hp-dest-info">
                  <div className="hp-dest-name">{d.name}</div>
                  <div className="hp-dest-subtitle">{d.subtitle}</div>
                  <div className="hp-dest-pill">{d.tours} tours</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* LOYALTY REWARDS */}
      <section className="hp-loyalty-section">
        <div className="hp-loyalty-inner">
          <div className="hp-loyalty-head">
            <div>
              <div className="hp-loyalty-tag">Your rewards</div>
              <h2 className="hp-loyalty-title">Travel more, earn more</h2>
            </div>
            <Link className="hp-loyalty-link" to="/rewards">Learn more about your rewards</Link>
          </div>

          {loyaltyLoading && isLoggedIn ? (
            <div className="hp-loyalty-level-bar">
              <div className="hp-loyalty-level-info">
                <div className="hp-loyalty-level-desc">Loading your rewards...</div>
              </div>
            </div>
          ) : !isLoggedIn ? (
            <div className="hp-loyalty-guest-bar">
              <div className="hp-loyalty-guest-title">Start earning rewards today</div>
              <div className="hp-loyalty-guest-desc">Sign in to track your progress and unlock discounts up to 20% off all tours</div>
              <Link to="/login" className="hp-loyalty-guest-btn">Sign in to get started</Link>
            </div>
          ) : (
            <div className="hp-loyalty-level-bar">
              <div className="hp-loyalty-level-badge">
                <svg width="11" height="11" viewBox="0 0 16 16" fill="currentColor"><path d="M8 1l2 4.5 5 .5-3.5 3.5 1 5L8 12l-4.5 2.5 1-5L1 6l5-.5z"/></svg>
                {currentLevelData.name}
              </div>
              <div className="hp-loyalty-level-info">
                <div className="hp-loyalty-level-name">Level {currentLevelData.level} - Active</div>
                <div className="hp-loyalty-level-desc">
                  {nextLevelData
                    ? `You're saving ${Math.round(currentLevelData.discount * 100)}% on every tour. Book more to unlock bigger rewards.`
                    : `You've reached the top tier! Enjoy ${Math.round(currentLevelData.discount * 100)}% off on all tours.`}
                </div>
              </div>
              {nextLevelData && (
                <div className="hp-loyalty-progress">
                  <div className="hp-loyalty-prog-labels">
                    <span>{completedBookings} booking{completedBookings !== 1 ? 's' : ''} done</span>
                    <span>{nextLevelData.minBookings} needed for Level {nextLevelData.level}</span>
                  </div>
                  <div className="hp-loyalty-prog-bar">
                    <div className="hp-loyalty-prog-fill" style={{ width: `${progressPct}%` }} />
                  </div>
                  <div className="hp-loyalty-prog-hint">
                    {bookingsToNext} more booking{bookingsToNext !== 1 ? 's' : ''} to reach {nextLevelData.name}
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="hp-rewards-grid">
            {REWARD_CARDS.map((c) => {
              const unlocked = isLoggedIn && currentLevelData.level >= c.level;
              return (
                <div key={c.title} className={`hp-rew-card ${unlocked ? 'unlocked' : 'locked'}`}>
                  {!unlocked && (
                    <span className="hp-rew-lock">
                      <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <rect x="3" y="7" width="10" height="8" rx="1.5"/>
                        <path d="M5 7V5a3 3 0 016 0v2"/>
                      </svg>
                    </span>
                  )}
                  <div className="hp-rew-title">{c.title}</div>
                  <div className="hp-rew-desc">{c.desc}</div>
                  <div className="hp-rew-lvl">Level {c.level}</div>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </>
  );
}