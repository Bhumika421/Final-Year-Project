import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchLoyaltyStatus, LOYALTY_LEVELS, getLoyaltyLevel, getNextLevel } from '../utils/loyalty';
import { getToken } from '../api/client';

const FAQ_ITEMS = [
  {
    q: 'How do I progress in the rewards program?',
    a: 'Each paid booking counts toward your progress. Reach 5 paid bookings to unlock Adventurer (Level 2) with 15% off. Hit 10 paid bookings to reach Elite Traveler (Level 3) with 20% off and our top perks. Your progress is tracked automatically.',
  },
  {
    q: 'Which bookings contribute to my progress?',
    a: 'Only paid bookings count toward your tier progress. Pending and confirmed bookings are not counted until payment is completed. If a booking is cancelled or refunded, it is removed from your count to keep the system fair for everyone.',
  },
  {
    q: 'Where can I use my discount?',
    a: 'Your discount applies automatically on every verified tour package on our platform. There are no participating-only restrictions. The discount shows clearly at checkout before you pay.',
  },
  {
    q: 'Is the rewards program free to join?',
    a: 'Yes, completely free. Every customer is automatically enrolled at Level 1 (Explorer) the moment they make their first booking. No membership fees, no hidden costs, no expiration on your tier.',
  },
  {
    q: 'How are rewards applied?',
    a: 'Your tier-based discount is automatically calculated and shown at checkout. You do not need to enter any code or activate anything. Just book the tour you want and the discount is built into the final price.',
  },
  {
    q: 'Why is my level lower than before?',
    a: 'Your tier reflects your real booking history. If you cancelled a booking or received a refund recently, that booking is no longer counted toward your progress. As you book new tours, your level rises again.',
  },
  {
    q: 'Can I combine the discount with other offers?',
    a: 'The loyalty discount applies automatically to the tour base price. Some seasonal promotions and group discounts may stack depending on the tour, and this is shown clearly at checkout before you pay.',
  },
  {
    q: 'Where can I see my current level?',
    a: 'Your current level is shown on the home page rewards section, on your bookings page, and at checkout when you book a new tour. Sign in to track your progress in real time.',
  },
   {
    q: 'How many bookings do I need for each level?',
    a: 'You start at Explorer (Level 1) automatically with your first booking. Complete 5 paid bookings to reach Adventurer (Level 2) with 15% off. Complete 10 paid bookings to reach Elite Traveler (Level 3) with 20% off and all premium perks.',
  },
  {
    q: 'What discounts do I get at each level?',
    a: 'Explorer (Level 1) gets 10% off all tours. Adventurer (Level 2) gets 15% off plus free airport pickup and priority booking access. Elite Traveler (Level 3) gets 20% off, 24/7 priority support, and a dedicated travel concierge. All discounts are applied automatically before taxes and fees.',
  },
  {
    q: 'When does my level expire?',
    a: 'Your level never expires as long as your paid bookings remain active and uncancelled. If a booking is cancelled or refunded, it is removed from your count, which may affect your tier. Simply book again to restore your progress.',
  },
  {
    q: 'How do I redeem my rewards?',
    a: 'There is nothing to redeem manually. Your discount is applied automatically at checkout based on your current level. Just sign in, choose your tour, and the savings are built into the final price before you pay.',
  },
];


export default function Rewards() {
  const [loyalty, setLoyalty] = useState(null);
  const [loyaltyLoading, setLoyaltyLoading] = useState(true);
  const [openFaq, setOpenFaq] = useState(-1);

  useEffect(() => {
    async function loadLoyalty() {
      if (!getToken()) {
        setLoyaltyLoading(false);
        return;
      }
      const data = await fetchLoyaltyStatus();
      setLoyalty(data);
      setLoyaltyLoading(false);
    }
    loadLoyalty();
  }, []);

  const isLoggedIn = !!getToken();
  const completedBookings = loyalty?.completed_bookings ?? 0;
  const currentLevelData = getLoyaltyLevel(completedBookings);
  const nextLevelData = getNextLevel(completedBookings);
  const bookingsToNext = nextLevelData ? Math.max(0, nextLevelData.minBookings - completedBookings) : 0;

  const userLevel = isLoggedIn ? currentLevelData.level : 1;
  const dotsTotal = nextLevelData ? nextLevelData.minBookings : currentLevelData.minBookings;
  const dotsFilled = Math.min(completedBookings, dotsTotal);

  let userName = '';
  try {
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    userName = user?.full_name?.split(' ')[0] || user?.name?.split(' ')[0] || '';
  } catch {}

  // Helper to render Level pill (active green / locked grey)
  const LevelPill = ({ level }) => {
    const isUnlocked = userLevel >= level;
    const isCurrent = userLevel === level;
    return (
      <span className={`rw-lvl-pill ${isCurrent ? 'current' : isUnlocked ? 'unlocked' : 'locked'}`}>
        {!isUnlocked && (
          <svg width="10" height="10" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.7">
            <rect x="3" y="7" width="10" height="8" rx="1.5"/>
            <path d="M5 7V5a3 3 0 016 0v2"/>
          </svg>
        )}
        Level {level}
      </span>
    );
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=DM+Sans:wght@300;400;500;600;700&display=swap');

        .rw-page { font-family: 'DM Sans', sans-serif; background: #1a1f1d; color: #f0ede8; min-height: 100vh; }

        /* HERO */
        .rw-hero { position: relative; min-height: 88vh; display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center; padding: 80px 24px; overflow: hidden; }
        .rw-hero-bg { position: absolute; inset: 0; background-image: linear-gradient(135deg, rgba(15,30,20,0.78) 0%, rgba(20,35,25,0.65) 50%, rgba(15,25,20,0.85) 100%), url('https://images.unsplash.com/photo-1605640840605-14ac1855827b?w=1800&q=85'); background-size: cover; background-position: center; background-repeat: no-repeat; transform: scale(1.05); animation: slowZoom 25s ease-in-out infinite alternate; }
        @keyframes slowZoom { from { transform: scale(1.05); } to { transform: scale(1.12); } }
        .rw-hero-bg::after { content: ''; position: absolute; inset: 0; background: linear-gradient(180deg, transparent 0%, transparent 65%, #1a1f1d 100%); }
        .rw-hero-glow { position: absolute; inset: 0; background-image: radial-gradient(ellipse 50% 40% at 30% 30%, rgba(168,217,107,0.18) 0%, transparent 60%); pointer-events: none; z-index: 1; }

        .rw-hero-inner { position: relative; z-index: 2; max-width: 820px; }
        .rw-hero-tag { display: inline-block; background: rgba(168,217,107,0.2); border: 1px solid rgba(168,217,107,0.45); color: #d4f0a8; font-size: 12px; font-weight: 600; letter-spacing: 0.14em; text-transform: uppercase; padding: 8px 20px; border-radius: 100px; margin-bottom: 32px; backdrop-filter: blur(10px); }
        .rw-hero-greeting { font-size: 17px; color: rgba(245,241,232,0.85); margin-bottom: 14px; font-weight: 500; text-shadow: 0 2px 12px rgba(0,0,0,0.5); }
        .rw-hero-title { font-family: 'Playfair Display', serif; font-size: clamp(42px, 7.5vw, 80px); font-weight: 900; line-height: 1.05; color: #fff; margin-bottom: 22px; letter-spacing: -0.02em; text-shadow: 0 4px 30px rgba(0,0,0,0.5); }
        .rw-hero-title span { color: #c1e88d; font-style: italic; }
        .rw-hero-sub { font-size: 17px; color: rgba(245,241,232,0.85); line-height: 1.7; max-width: 600px; margin: 0 auto 40px; text-shadow: 0 2px 12px rgba(0,0,0,0.4); }

        .rw-hero-status-card { background: rgba(255,255,255,0.06); backdrop-filter: blur(20px); border: 1px solid rgba(255,255,255,0.15); border-radius: 24px; padding: 32px 36px; max-width: 560px; margin: 0 auto; box-shadow: 0 16px 48px rgba(0,0,0,0.35); }
        .rw-hero-status-title { font-family: 'Playfair Display', serif; font-size: clamp(22px, 3vw, 30px); font-weight: 700; color: #fff; margin-bottom: 12px; line-height: 1.25; }
        .rw-hero-status-sub { font-size: 14px; color: rgba(245,241,232,0.75); line-height: 1.6; margin-bottom: 24px; }
        .rw-hero-status-sub strong { color: #c1e88d; font-weight: 700; }

        .rw-dots-row { display: flex; justify-content: center; gap: 10px; margin-bottom: 22px; flex-wrap: wrap; }
        .rw-dot { width: 38px; height: 38px; border-radius: 50%; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .rw-dot-empty { border: 2px dashed rgba(255,255,255,0.3); background: rgba(255,255,255,0.04); }
        .rw-dot-filled { background: #a8d96b; border: 2px solid #c1e88d; box-shadow: 0 4px 16px rgba(168,217,107,0.4); color: #0f1410; }

        .rw-hero-status-link { display: inline-block; color: #c1e88d; font-size: 13px; font-weight: 600; text-decoration: none; padding: 8px 16px; border-radius: 100px; border: 1px solid rgba(168,217,107,0.4); background: rgba(168,217,107,0.1); transition: background 0.2s; }
        .rw-hero-status-link:hover { background: rgba(168,217,107,0.2); }

        .rw-hero-guest-card { background: rgba(255,255,255,0.06); backdrop-filter: blur(20px); border: 1px solid rgba(255,255,255,0.15); border-radius: 24px; padding: 28px 32px; max-width: 480px; margin: 0 auto; box-shadow: 0 16px 48px rgba(0,0,0,0.35); }
        .rw-hero-guest-title { font-family: 'Playfair Display', serif; font-size: 22px; font-weight: 700; color: #fff; margin-bottom: 10px; }
        .rw-hero-guest-sub { font-size: 14px; color: rgba(245,241,232,0.75); line-height: 1.6; margin-bottom: 20px; }

        .rw-cta-btn { display: inline-flex; align-items: center; gap: 8px; background: #a8d96b; color: #1a2010; border: none; border-radius: 100px; padding: 14px 32px; font-family: 'DM Sans', sans-serif; font-size: 14px; font-weight: 700; cursor: pointer; text-decoration: none; transition: background 0.2s, transform 0.15s, box-shadow 0.2s; box-shadow: 0 8px 24px rgba(168,217,107,0.3); }
        .rw-cta-btn:hover { background: #c1e88d; transform: translateY(-2px); }

        /* SECTIONS */
        .rw-wrap-a { background: #1a1f1d; }
        .rw-wrap-b { background: linear-gradient(180deg, #1f2622 0%, #232a26 100%); }

        .rw-section { max-width: 1200px; margin: 0 auto; padding: 88px 24px; }
        .rw-section-head { text-align: center; margin-bottom: 60px; }
        .rw-section-tag { font-size: 11px; font-weight: 600; letter-spacing: 0.16em; text-transform: uppercase; color: #c1e88d; margin-bottom: 14px; display: inline-flex; align-items: center; gap: 8px; }
        .rw-section-tag::before, .rw-section-tag::after { content: ''; width: 24px; height: 1px; background: rgba(193,232,141,0.3); }
        .rw-section-title { font-family: 'Playfair Display', serif; font-size: clamp(30px, 4.5vw, 46px); font-weight: 700; color: #f5f1e8; line-height: 1.15; margin-bottom: 16px; letter-spacing: -0.01em; }
        .rw-section-sub { font-size: 16px; color: rgba(245,241,232,0.6); line-height: 1.7; max-width: 600px; margin: 0 auto; }

        /* HOW IT WORKS */
        .rw-steps { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; }
        .rw-step { background: linear-gradient(145deg, #2d3530 0%, #262c28 100%); border: 1px solid rgba(255,255,255,0.08); border-radius: 22px; padding: 36px 30px; text-align: center; transition: transform 0.28s, border-color 0.28s, box-shadow 0.28s; position: relative; overflow: hidden; }
        .rw-step:hover { transform: translateY(-6px); border-color: rgba(168,217,107,0.4); box-shadow: 0 18px 44px rgba(0,0,0,0.35); }
        .rw-step-num { font-family: 'Playfair Display', serif; font-size: 60px; font-weight: 900; background: linear-gradient(135deg, rgba(168,217,107,0.5) 0%, rgba(168,217,107,0.15) 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; line-height: 1; margin-bottom: 16px; }
        .rw-step-title { font-family: 'Playfair Display', serif; font-size: 22px; font-weight: 700; color: #f5f1e8; margin-bottom: 12px; }
        .rw-step-desc { font-size: 13px; color: rgba(245,241,232,0.6); line-height: 1.7; }

        /* TIERS — Booking.com EXACT layout: left big card + right 3 stacked cards */
        .rw-tiers-wrap { background: linear-gradient(180deg, #1a2520 0%, #1d2924 100%); border-top: 1px solid rgba(168,217,107,0.08); border-bottom: 1px solid rgba(168,217,107,0.08); padding: 80px 24px; }
        .rw-tiers-inner { max-width: 1200px; margin: 0 auto; }
        .rw-tiers-head { margin-bottom: 36px; max-width: 900px; }
        .rw-tiers-head-title { font-family: 'Playfair Display', serif; font-size: clamp(30px, 4.5vw, 44px); font-weight: 700; color: #f5f1e8; line-height: 1.15; margin-bottom: 14px; letter-spacing: -0.01em; }
        .rw-tiers-head-sub { font-size: 15px; color: rgba(245,241,232,0.65); line-height: 1.7; }
        .rw-tiers-head-sub strong { color: #f5f1e8; font-weight: 600; }

        /* Layout: left big card 50%, right column 50% with 3 cards */
        .rw-perks-layout { display: grid; grid-template-columns: 1fr 1fr; gap: 18px; }
        .rw-perks-right { display: grid; grid-template-rows: 1fr 1fr 1fr; gap: 18px; }

        /* Big left card — Discounts on tours with sub-grid */
        .rw-big-card { background: linear-gradient(145deg, #2c3430 0%, #252c28 100%); border: 1px solid rgba(255,255,255,0.08); border-radius: 16px; padding: 28px; display: flex; flex-direction: column; }
        .rw-big-card-head { display: flex; gap: 16px; align-items: flex-start; margin-bottom: 22px; padding-bottom: 22px; border-bottom: 1px solid rgba(255,255,255,0.08); }
        .rw-big-card-icon { width: 56px; height: 56px; border-radius: 14px; background: linear-gradient(135deg, rgba(168,217,107,0.2) 0%, rgba(168,217,107,0.08) 100%); border: 1px solid rgba(168,217,107,0.3); display: flex; align-items: center; justify-content: center; color: #c1e88d; flex-shrink: 0; }
        .rw-big-card-text { flex: 1; }
        .rw-big-card-title { font-size: 17px; font-weight: 700; color: #f5f1e8; margin-bottom: 6px; }
        .rw-big-card-desc { font-size: 13px; color: rgba(245,241,232,0.6); line-height: 1.55; }
        .rw-big-card-desc strong { color: #f5f1e8; font-weight: 600; }

        /* Sub-grid inside big card: 2 rows x 3 cols */
        .rw-sub-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; flex: 1; }
        .rw-sub-card { background: rgba(255,255,255,0.025); border: 1px solid rgba(255,255,255,0.06); border-radius: 10px; padding: 14px 14px 12px; transition: border-color 0.25s; position: relative; min-height: 130px; display: flex; flex-direction: column; }
        .rw-sub-card.current { border-color: rgba(168,217,107,0.6); background: rgba(168,217,107,0.06); box-shadow: 0 0 0 1px rgba(168,217,107,0.4); }
        .rw-sub-card.locked { opacity: 0.5; }
        .rw-sub-card-pill-row { margin-bottom: 10px; }
        .rw-sub-card-value { font-size: 13px; font-weight: 700; color: #f5f1e8; line-height: 1.3; margin-bottom: 4px; }
        .rw-sub-card.current .rw-sub-card-value { color: #c1e88d; }
        .rw-sub-card-desc { font-size: 11px; color: rgba(245,241,232,0.5); line-height: 1.45; }

        /* Right side cards */
        .rw-side-card { background: linear-gradient(145deg, #2c3430 0%, #252c28 100%); border: 1px solid rgba(255,255,255,0.08); border-radius: 16px; padding: 22px 24px; display: flex; gap: 16px; align-items: flex-start; transition: border-color 0.25s, transform 0.25s; }
        .rw-side-card.unlocked { border-color: rgba(168,217,107,0.25); }
        .rw-side-card.unlocked:hover { border-color: rgba(168,217,107,0.5); transform: translateY(-2px); }
        .rw-side-card.locked { opacity: 0.55; }
        .rw-side-card-icon { width: 56px; height: 56px; border-radius: 14px; background: rgba(168,217,107,0.1); border: 1px solid rgba(168,217,107,0.22); display: flex; align-items: center; justify-content: center; color: #c1e88d; flex-shrink: 0; }
        .rw-side-card.locked .rw-side-card-icon { background: rgba(255,255,255,0.04); border-color: rgba(255,255,255,0.08); color: rgba(245,241,232,0.4); }
        .rw-side-card-body { flex: 1; min-width: 0; }
        .rw-side-card-pill-row { margin-bottom: 8px; }
        .rw-side-card-title { font-size: 15px; font-weight: 700; color: #f5f1e8; margin-bottom: 5px; line-height: 1.3; }
        .rw-side-card.locked .rw-side-card-title { color: rgba(245,241,232,0.65); }
        .rw-side-card-desc { font-size: 12px; color: rgba(245,241,232,0.58); line-height: 1.55; }

        /* Level pills */
        .rw-lvl-pill { display: inline-flex; align-items: center; gap: 5px; font-size: 10px; font-weight: 700; letter-spacing: 0.06em; padding: 4px 10px; border-radius: 100px; }
        .rw-lvl-pill.current { background: #a8d96b; color: #0f1410; box-shadow: 0 2px 8px rgba(168,217,107,0.4); }
        .rw-lvl-pill.unlocked { background: rgba(168,217,107,0.15); color: #c1e88d; border: 1px solid rgba(168,217,107,0.3); }
        .rw-lvl-pill.locked { background: rgba(255,255,255,0.04); color: rgba(245,241,232,0.5); border: 1px solid rgba(255,255,255,0.08); }

        /* FAQ */
        .rw-faq-list { max-width: 820px; margin: 0 auto; background: linear-gradient(145deg, #2c3430 0%, #252c28 100%); border: 1px solid rgba(255,255,255,0.08); border-radius: 20px; overflow: hidden; }
        .rw-faq-item { border-bottom: 1px solid rgba(255,255,255,0.06); transition: background 0.2s; }
        .rw-faq-item:last-child { border-bottom: none; }
        .rw-faq-item.open { background: rgba(168,217,107,0.04); }
        .rw-faq-q { display: flex; justify-content: space-between; align-items: center; padding: 22px 28px; cursor: pointer; font-size: 15px; font-weight: 600; color: #f5f1e8; user-select: none; transition: color 0.2s; }
        .rw-faq-q:hover { color: #c1e88d; }
        .rw-faq-item.open .rw-faq-q { color: #c1e88d; padding-bottom: 14px; }
        .rw-faq-chevron { width: 20px; height: 20px; flex-shrink: 0; margin-left: 16px; transition: transform 0.3s; color: rgba(245,241,232,0.5); }
        .rw-faq-item.open .rw-faq-chevron { transform: rotate(180deg); color: #c1e88d; }
        .rw-faq-a-wrap { max-height: 0; overflow: hidden; transition: max-height 0.4s ease; }
        .rw-faq-item.open .rw-faq-a-wrap { max-height: 500px; }
        .rw-faq-a { padding: 0 28px 24px; font-size: 14px; color: rgba(245,241,232,0.7); line-height: 1.75; }

        /* HIGHLIGHTS */
        .rw-highlights-section { background: linear-gradient(180deg, #1a1f1d 0%, #1d2520 100%); padding: 90px 24px 100px; border-top: 1px solid rgba(168,217,107,0.08); }
        .rw-highlights-inner { max-width: 1200px; margin: 0 auto; }
        .rw-highlights-head { margin-bottom: 50px; max-width: 780px; }
        .rw-highlights-title { font-family: 'Playfair Display', serif; font-size: clamp(28px, 4.5vw, 44px); font-weight: 700; color: #f5f1e8; line-height: 1.15; margin-bottom: 16px; letter-spacing: -0.01em; }
        .rw-highlights-sub { font-size: 16px; color: rgba(245,241,232,0.65); line-height: 1.7; }
        .rw-highlights-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 32px; }
        .rw-highlight-item { padding-left: 22px; border-left: 3px solid #a8d96b; transition: border-color 0.25s, transform 0.25s; }
        .rw-highlight-item:hover { border-left-color: #c1e88d; transform: translateX(4px); }
        .rw-highlight-title { font-family: 'Playfair Display', serif; font-size: 22px; font-weight: 700; color: #c1e88d; margin-bottom: 12px; line-height: 1.2; }
        .rw-highlight-desc { font-size: 14px; color: rgba(245,241,232,0.7); line-height: 1.7; }
        .rw-highlights-cta { margin-top: 48px; padding-top: 40px; border-top: 1px solid rgba(255,255,255,0.08); display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 20px; }
        .rw-highlights-cta-text { font-size: 15px; color: rgba(245,241,232,0.75); }
        .rw-highlights-cta-text strong { color: #f5f1e8; }

        /* RESPONSIVE */
        @media (max-width: 900px) {
          .rw-perks-layout { grid-template-columns: 1fr; }
          .rw-sub-grid { grid-template-columns: repeat(2, 1fr); }
          .rw-steps { grid-template-columns: 1fr; }
          .rw-highlights-grid { grid-template-columns: 1fr; gap: 24px; }
        }
        @media (max-width: 640px) {
          .rw-section { padding: 60px 20px; }
          .rw-tiers-wrap { padding: 60px 20px; }
          .rw-sub-grid { grid-template-columns: 1fr; }
          .rw-hero { padding: 60px 20px; min-height: 80vh; }
          .rw-hero-status-card, .rw-hero-guest-card { padding: 24px 22px; }
          .rw-dot { width: 32px; height: 32px; }
          .rw-faq-q { padding: 18px 22px; font-size: 14px; }
          .rw-faq-a { padding: 0 22px 20px; }
          .rw-highlights-section { padding: 60px 20px 70px; }
          .rw-highlights-cta { flex-direction: column; align-items: flex-start; }
        }
      `}</style>

      <div className="rw-page">

        {/* HERO */}
        <section className="rw-hero">
          <div className="rw-hero-bg" />
          <div className="rw-hero-glow" />
          <div className="rw-hero-inner">
            <div className="rw-hero-tag">Travel Rewards Program</div>

            {!loyaltyLoading && isLoggedIn && userName && (
              <div className="rw-hero-greeting">Welcome back, {userName}</div>
            )}

            <h1 className="rw-hero-title">
              Travel more,<br /><span>save more</span>
            </h1>
            <p className="rw-hero-sub">
              Every booking takes you closer to bigger discounts and exclusive perks.
              Free to join, automatic to use, lifetime to keep.
            </p>

            {!loyaltyLoading && isLoggedIn && (
              <div className="rw-hero-status-card">
                <h2 className="rw-hero-status-title">
                  {userName ? `${userName}, you're at Level ${currentLevelData.level}!` : `You're at Level ${currentLevelData.level}!`}
                </h2>
                {nextLevelData ? (
                  <>
                    <p className="rw-hero-status-sub">
                      Complete <strong>{bookingsToNext} more booking{bookingsToNext !== 1 ? 's' : ''}</strong> to unlock{' '}
                      <strong>{nextLevelData.name} ({Math.round(nextLevelData.discount * 100)}% off)</strong>.
                      Every paid booking counts.
                    </p>
                    <div className="rw-dots-row">
                      {Array.from({ length: dotsTotal }).map((_, i) => {
                        const filled = i < dotsFilled;
                        return (
                          <div key={i} className={`rw-dot ${filled ? 'rw-dot-filled' : 'rw-dot-empty'}`}>
                            {filled && (
                              <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M3 8l4 4 6-8"/>
                              </svg>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </>
                ) : (
                  <p className="rw-hero-status-sub">
                    You've reached the <strong>top tier</strong>! Enjoy <strong>{Math.round(currentLevelData.discount * 100)}% off</strong> on every tour.
                  </p>
                )}
                <Link to="/bookings" className="rw-hero-status-link">View my bookings</Link>
              </div>
            )}

            {!loyaltyLoading && !isLoggedIn && (
              <div className="rw-hero-guest-card">
                <h2 className="rw-hero-guest-title">Get rewarded for travelling</h2>
                <p className="rw-hero-guest-sub">
                  Sign in to start earning automatic discounts up to <strong style={{color:'#c1e88d'}}>20% off</strong>{' '}
                  on every verified tour package across Nepal.
                </p>
                <Link to="/login" className="rw-cta-btn">Sign in to start earning</Link>
              </div>
            )}
          </div>
        </section>

        {/* HOW IT WORKS */}
        <div className="rw-wrap-a">
          <section className="rw-section">
            <div className="rw-section-head">
              <div className="rw-section-tag">How it works</div>
              <h2 className="rw-section-title">Three simple steps to bigger savings</h2>
              <p className="rw-section-sub">No points to track, no codes to remember. Just book and save.</p>
            </div>
            <div className="rw-steps">
              <div className="rw-step">
                <div className="rw-step-num">01</div>
                <div className="rw-step-title">Book any tour</div>
                <div className="rw-step-desc">Choose from verified tour packages across Nepal. Every paid booking counts toward your level.</div>
              </div>
              <div className="rw-step">
                <div className="rw-step-num">02</div>
                <div className="rw-step-title">Level up automatically</div>
                <div className="rw-step-desc">Reach 5 paid bookings to unlock Adventurer. Hit 10 for Elite Traveler. We track everything for you.</div>
              </div>
              <div className="rw-step">
                <div className="rw-step-num">03</div>
                <div className="rw-step-title">Save on every trip</div>
                <div className="rw-step-desc">Your discount applies automatically at checkout. Bigger level means bigger savings, every single time.</div>
              </div>
            </div>
          </section>
        </div>

        {/* TIERS — Booking.com EXACT layout */}
        <div className="rw-tiers-wrap">
          <div className="rw-tiers-inner">
            <div className="rw-tiers-head">
              <h2 className="rw-tiers-head-title">Book your next trip for less</h2>
              <p className="rw-tiers-head-sub">
                Enjoy <strong>free lifetime access</strong> to {currentLevelData.name} Level {currentLevelData.level} discounts
                on <strong>all verified tour packages</strong> across Nepal. Discounts are applied to the price before taxes and fees.
              </p>
            </div>

            {/* Layout: left big card + right 3 stacked cards */}
            <div className="rw-perks-layout">

              {/* LEFT BIG CARD — Tour discounts with 2x3 sub-grid */}
              <div className="rw-big-card">
                <div className="rw-big-card-head">
                  <div className="rw-big-card-icon">
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="19" y1="5" x2="5" y2="19"/><circle cx="6.5" cy="6.5" r="2.5"/><circle cx="17.5" cy="17.5" r="2.5"/>
                    </svg>
                  </div>
                  <div className="rw-big-card-text">
                    <div className="rw-big-card-title">Tour discounts</div>
                    <div className="rw-big-card-desc">
                      Enjoy automatic savings on <strong>every verified tour package</strong> across Nepal,
                      with bigger discounts as you level up.
                    </div>
                  </div>
                </div>

                {/* Sub-grid 3 columns: Level 1, 2, 3 */}
                <div className="rw-sub-grid">
                  {/* Row 1: Discounts on tour packages */}
                  <div className={`rw-sub-card ${userLevel === 1 ? 'current' : userLevel >= 1 ? '' : 'locked'}`}>
                    <div className="rw-sub-card-pill-row"><LevelPill level={1} /></div>
                    <div className="rw-sub-card-value">10% off all tours</div>
                    <div className="rw-sub-card-desc">Applied to the price before taxes & fees</div>
                  </div>
                  <div className={`rw-sub-card ${userLevel === 2 ? 'current' : userLevel >= 2 ? '' : 'locked'}`}>
                    <div className="rw-sub-card-pill-row"><LevelPill level={2} /></div>
                    <div className="rw-sub-card-value">15% off all tours</div>
                    <div className="rw-sub-card-desc">Applied to the price before taxes & fees</div>
                  </div>
                  <div className={`rw-sub-card ${userLevel === 3 ? 'current' : userLevel >= 3 ? '' : 'locked'}`}>
                    <div className="rw-sub-card-pill-row"><LevelPill level={3} /></div>
                    <div className="rw-sub-card-value">20% off all tours</div>
                    <div className="rw-sub-card-desc">Applied to the price before taxes & fees</div>
                  </div>

                  {/* Row 2: Customer support tier */}
                  <div className={`rw-sub-card ${userLevel === 1 ? 'current' : userLevel >= 1 ? '' : 'locked'}`}>
                    <div className="rw-sub-card-pill-row"><LevelPill level={1} /></div>
                    <div className="rw-sub-card-value">Email support</div>
                    <div className="rw-sub-card-desc">Standard customer support for all bookings</div>
                  </div>
                  <div className={`rw-sub-card ${userLevel === 2 ? 'current' : userLevel >= 2 ? '' : 'locked'}`}>
                    <div className="rw-sub-card-pill-row"><LevelPill level={2} /></div>
                    <div className="rw-sub-card-value">Priority email</div>
                    <div className="rw-sub-card-desc">Faster response times for your queries</div>
                  </div>
                  <div className={`rw-sub-card ${userLevel === 3 ? 'current' : userLevel >= 3 ? '' : 'locked'}`}>
                    <div className="rw-sub-card-pill-row"><LevelPill level={3} /></div>
                    <div className="rw-sub-card-value">24/7 priority</div>
                    <div className="rw-sub-card-desc">Direct line to a live travel agent anytime</div>
                  </div>
                </div>
              </div>

              {/* RIGHT COLUMN — 3 stacked cards */}
              <div className="rw-perks-right">

                {/* Card 1: Free airport pickup (Level 2) */}
                <div className={`rw-side-card ${userLevel >= 2 ? 'unlocked' : 'locked'}`}>
                  <div className="rw-side-card-icon">
                    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M14 16H9m10 0h1.5a.5.5 0 00.5-.5V12l-3-4h-3"/>
                      <circle cx="6.5" cy="16.5" r="2.5"/><circle cx="16.5" cy="16.5" r="2.5"/>
                      <path d="M3 16V6a1 1 0 011-1h10v11"/>
                    </svg>
                  </div>
                  <div className="rw-side-card-body">
                    <div className="rw-side-card-pill-row"><LevelPill level={2} /></div>
                    <div className="rw-side-card-title">Free airport pickup</div>
                    <div className="rw-side-card-desc">Complimentary pickup from Tribhuvan International, available at Level 2 and above</div>
                  </div>
                </div>

                {/* Card 2: Priority booking (Level 2) */}
                <div className={`rw-side-card ${userLevel >= 2 ? 'unlocked' : 'locked'}`}>
                  <div className="rw-side-card-icon">
                    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                    </svg>
                  </div>
                  <div className="rw-side-card-body">
                    <div className="rw-side-card-pill-row"><LevelPill level={2} /></div>
                    <div className="rw-side-card-title">Priority booking access</div>
                    <div className="rw-side-card-desc">Get early access to popular tours during peak seasons before general release</div>
                  </div>
                </div>

                {/* Card 3: Dedicated concierge (Level 3) */}
                <div className={`rw-side-card ${userLevel >= 3 ? 'unlocked' : 'locked'}`}>
                  <div className="rw-side-card-icon">
                    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>
                      <circle cx="12" cy="7" r="4"/>
                    </svg>
                  </div>
                  <div className="rw-side-card-body">
                    <div className="rw-side-card-pill-row"><LevelPill level={3} /></div>
                    <div className="rw-side-card-title">Dedicated travel concierge</div>
                    <div className="rw-side-card-desc">Personal travel concierge to handle every detail of your trip and customize your itinerary</div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>

        {/* FAQ */}
        <div className="rw-wrap-b">
          <section className="rw-section">
            <div className="rw-section-head">
              <div className="rw-section-tag">Common questions</div>
              <h2 className="rw-section-title">Frequently asked</h2>
              <p className="rw-section-sub">Everything you need to know about our travel rewards program.</p>
            </div>
            <div className="rw-faq-list">
              {FAQ_ITEMS.map((item, idx) => (
                <div key={idx} className={`rw-faq-item ${openFaq === idx ? 'open' : ''}`}>
                  <div className="rw-faq-q" onClick={() => setOpenFaq(openFaq === idx ? -1 : idx)}>
                    <span>{item.q}</span>
                    <svg className="rw-faq-chevron" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M5 8l5 5 5-5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <div className="rw-faq-a-wrap">
                    <div className="rw-faq-a">{item.a}</div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* HIGHLIGHTS */}
        <section className="rw-highlights-section">
          <div className="rw-highlights-inner">
            <div className="rw-highlights-head">
              <h2 className="rw-highlights-title">Travel is better with rewards</h2>
              <p className="rw-highlights-sub">
                Enjoy a lifetime of discounts and exclusive perks on verified tour packages
                across Nepal with our travel rewards program.
              </p>
            </div>

            <div className="rw-highlights-grid">
              <div className="rw-highlight-item">
                <h3 className="rw-highlight-title">Easy to find</h3>
                <p className="rw-highlight-desc">
                  Once signed in, look for your discount applied automatically on every
                  verified tour package.
                </p>
              </div>
              <div className="rw-highlight-item">
                <h3 className="rw-highlight-title">Easy to keep</h3>
                <p className="rw-highlight-desc">
                  After unlocking each level, the rewards are yours to enjoy as long as
                  your bookings stay active.
                </p>
              </div>
              <div className="rw-highlight-item">
                <h3 className="rw-highlight-title">Easy to grow</h3>
                <p className="rw-highlight-desc">
                  The more you book, the more you save. Every paid booking counts toward
                  your progress to the next tier.
                </p>
              </div>
            </div>

            <div className="rw-highlights-cta">
              <div className="rw-highlights-cta-text">
                {isLoggedIn
                  ? <>You're a <strong>{currentLevelData.name}</strong> saving <strong>{Math.round(currentLevelData.discount * 100)}% off</strong> on every tour.</>
                  : <>Join <strong>free</strong> in seconds. Your first booking starts your journey.</>}
              </div>
              <Link to="/tours" className="rw-cta-btn">Browse tours</Link>
            </div>
          </div>
        </section>

      </div>
    </>
  );
}