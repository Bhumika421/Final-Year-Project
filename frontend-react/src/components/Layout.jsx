import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { getLoyaltyLevel, getBookingsCount } from '../utils/loyalty';

function getToken() {
  return localStorage.getItem('sjp_token') || null;
}

function getUser() {
  const token = getToken();
  if (!token) {
    if (localStorage.getItem('user')) {
      localStorage.removeItem('user');
    }
    return null;
  }
  try {
    return JSON.parse(localStorage.getItem('user') || 'null');
  } catch {
    return null;
  }
}

export default function Layout({ children }) {
  const nav = useNavigate();
  const loc = useLocation();
  const [user, setUser] = useState(getUser);
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [completedBookings, setCompletedBookings] = useState(0);
  const profileRef = useRef(null);

  useEffect(() => {
    const sync = () => setUser(getUser());
    window.addEventListener('storage', sync);
    window.addEventListener('auth-change', sync);
    return () => { window.removeEventListener('storage', sync); window.removeEventListener('auth-change', sync); };
  }, []);

  useEffect(() => {
    if (!getToken() || !user) {
      setCompletedBookings(0);
      return;
    }
    getBookingsCount().then(count => setCompletedBookings(count));
  }, [user]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    function handler(e) {
      if (profileRef.current && !profileRef.current.contains(e.target)) setProfileOpen(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  function logout() {
    localStorage.removeItem('sjp_token');
    localStorage.removeItem('user');
    setUser(null);
    setProfileOpen(false);
    window.dispatchEvent(new Event('auth-change'));
    nav('/');
  }

  const isHome = loc.pathname === '/';
  const close = () => setProfileOpen(false);

  //  Hide navbar & footer for these pages
  const noLayoutPages = [
    '/login',
    '/signup',
    '/forgot-password',
    '/admin-login',
    '/admin-setup',
    '/agency-signup',
    '/agency-login',
  ];
  const isAgencyPage = loc.pathname.startsWith('/agency');
  const isAdminPage  = loc.pathname.startsWith('/admin');
  const isNoLayout   = noLayoutPages.includes(loc.pathname);

  if (isAgencyPage || isAdminPage || isNoLayout) return <>{children}</>;

  const navLinks = [
    { to: '/',        label: 'Home' },
    { to: '/tours',   label: 'Tours' },
    { to: '/wishlist',      label: 'Wishlist' },
    { to: '/support', label: 'Support' },
  ];

  const ddLinks = [
    { to: '/dashboard', label: 'Dashboard' },
    { to: '/profile',   label: 'My Profile' },
    ...(user?.role === 'customer' ? [
      { to: '/bookings',      label: 'My Bookings' },
      { to: '/rewards',       label: 'Loyalty Program' },
      { to: '/notifications', label: 'Notifications' },
    ] : []),
  ];

  const loyaltyLevel = getLoyaltyLevel(completedBookings);
  const fullName = user?.full_name || user?.name || user?.email || 'User';
  const initials = fullName[0].toUpperCase();
  const navDisplayName = user?.full_name || user?.name || user?.email?.split('@')[0] || 'User';

  const isAuthenticated = !!getToken() && !!user;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=DM+Sans:wght@300;400;500;600&display=swap');
        *, *::before, *::after { box-sizing: border-box; }
        html { scroll-behavior: smooth; }
        body { font-family: 'DM Sans', sans-serif; background: #0a0e0d; color: #f0ede8; margin: 0; min-height: 100vh; }

        .nb { position: fixed; top: 0; left: 0; right: 0; z-index: 1000; transition: background 0.3s, backdrop-filter 0.3s, box-shadow 0.3s; padding: 0 32px; }
        .nb.scrolled { background: rgba(10, 38, 22, 0.95); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px); box-shadow: 0 1px 0 rgba(168,217,107,0.15); }
        .nb:not(.scrolled) { background: linear-gradient(180deg, rgba(5,20,12,0.9) 0%, transparent 100%); }
        .nb-inner { max-width: 1200px; margin: 0 auto; height: 66px; display: flex; align-items: center; }
        .nb-logo { display: flex; align-items: center; gap: 10px; text-decoration: none; flex-shrink: 0; }
        .nb-logo-text { font-family: 'Playfair Display', serif; font-size: 17px; font-weight: 700; color: #fff; line-height: 1.1; }
        .nb-logo-sub { font-family: 'DM Sans', sans-serif; font-size: 10px; font-weight: 400; color: rgba(168,217,107,0.65); letter-spacing: 0.06em; display: block; }
        .nb-spacer { flex: 1; }
        .nb-links { display: flex; align-items: center; gap: 4px; list-style: none; padding: 0; margin: 0 16px 0 0; }
        .nb-links a { text-decoration: none; color: rgba(240,237,232,0.75); font-size: 14px; font-weight: 500; padding: 6px 14px; border-radius: 100px; transition: color 0.2s, background 0.2s; }
        .nb-links a:hover, .nb-links a.active { color: #fff; background: rgba(168,217,107,0.12); }

        .nb-list-btn { display: inline-flex; align-items: center; gap: 7px; background: transparent; color: rgba(240,237,232,0.8); border: 1px solid rgba(168,217,107,0.3); border-radius: 100px; padding: 7px 16px; font-family: 'DM Sans', sans-serif; font-size: 13px; font-weight: 500; cursor: pointer; text-decoration: none; transition: all 0.2s; white-space: nowrap; margin-right: 8px; }
        .nb-list-btn:hover { color: #fff; border-color: rgba(168,217,107,0.7); background: rgba(168,217,107,0.1); }

        .nb-auth { display: flex; align-items: center; gap: 8px; }
        .nb-btn-ghost { background: transparent; color: rgba(240,237,232,0.7); border: 1px solid rgba(255,255,255,0.18); border-radius: 100px; padding: 7px 18px; font-family: 'DM Sans', sans-serif; font-size: 13px; font-weight: 500; cursor: pointer; text-decoration: none; transition: all 0.2s; display: inline-block; }
        .nb-btn-ghost:hover { color: #fff; border-color: rgba(255,255,255,0.35); background: rgba(255,255,255,0.06); }
        .nb-btn-solid { background: #a8d96b; color: #1a2010; border: none; border-radius: 100px; padding: 8px 20px; font-family: 'DM Sans', sans-serif; font-size: 13px; font-weight: 700; cursor: pointer; text-decoration: none; transition: background 0.2s, transform 0.15s; display: inline-block; }
        .nb-btn-solid:hover { background: #c1e88d; transform: scale(1.04); }

        .nb-profile { position: relative; }
        .nb-profile-trigger { display: flex; align-items: center; gap: 10px; background: rgba(255,255,255,0.04); border: 1px solid rgba(168,217,107,0.18); border-radius: 100px; padding: 5px 14px 5px 5px; cursor: pointer; transition: background 0.2s, border-color 0.2s; }
        .nb-profile-trigger:hover, .nb-profile-trigger.open { background: rgba(168,217,107,0.1); border-color: rgba(168,217,107,0.4); }
        .nb-avatar { width: 34px; height: 34px; background: linear-gradient(135deg, #a8d96b, #5fa832); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 14px; font-weight: 700; color: #0f1410; flex-shrink: 0; box-shadow: 0 0 0 2px rgba(168,217,107,0.25); }
        .nb-profile-text { display: flex; flex-direction: column; align-items: flex-start; line-height: 1.15; }
        .nb-profile-name { font-size: 13px; font-weight: 700; color: #fff; max-width: 130px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .nb-profile-level { font-size: 11px; color: #c1e88d; font-weight: 500; margin-top: 2px; }
        .nb-profile-chevron { width: 14px; height: 14px; color: rgba(245,241,232,0.5); margin-left: 2px; transition: transform 0.25s; flex-shrink: 0; }
        .nb-profile-trigger.open .nb-profile-chevron { transform: rotate(180deg); color: #c1e88d; }

        .nb-dropdown { position: absolute; top: calc(100% + 10px); right: 0; width: 230px; background: linear-gradient(145deg, #0b2016, #091510); border: 1px solid rgba(168,217,107,0.18); border-radius: 16px; box-shadow: 0 24px 60px rgba(0,0,0,0.7), 0 0 0 1px rgba(168,217,107,0.06); padding: 6px; animation: dropIn 0.18s ease; overflow: hidden; }
        @keyframes dropIn { from { opacity: 0; transform: translateY(-8px) scale(0.96); } to { opacity: 1; transform: translateY(0) scale(1); } }

        .nb-dd-header { padding: 10px 10px; margin-bottom: 4px; display: flex; align-items: center; gap: 12px; }
        .nb-dd-avatar-circle { width: 40px; height: 40px; border-radius: 50%; background: linear-gradient(135deg, #a8d96b, #5fa832); display: flex; align-items: center; justify-content: center; font-size: 16px; font-weight: 800; color: #0f1410; flex-shrink: 0; box-shadow: 0 0 0 2px rgba(168,217,107,0.3), 0 0 0 1px rgba(168,217,107,0.6); }
        .nb-dd-info { flex: 1; min-width: 0; }
        .nb-dd-name { font-size: 14px; font-weight: 700; color: #fff; line-height: 1.2; margin-bottom: 2px; word-break: break-word; }
        .nb-dd-level-text { font-size: 12px; color: #c1e88d; font-weight: 500; line-height: 1.2; }

        .nb-dd-sep-light { height: 1px; background: rgba(255,255,255,0.06); margin: 2px 0 4px; }

        .nb-dd-item { display: flex; align-items: center; gap: 10px; padding: 7px 10px; border-radius: 8px; color: rgba(240,237,232,0.75); font-size: 13px; font-weight: 500; text-decoration: none; cursor: pointer; transition: background 0.15s, color 0.15s; width: 100%; background: none; border: none; text-align: left; font-family: 'DM Sans', sans-serif; }
        .nb-dd-item:hover { background: rgba(168,217,107,0.08); color: #fff; }
        .nb-dd-item.danger:hover { background: rgba(220,60,60,0.12); color: #f87171; }
        .nb-dd-sep { height: 1px; background: rgba(255,255,255,0.06); margin: 4px 0; }
        .nb-dd-list-prop { display: flex; align-items: center; gap: 10px; padding: 7px 10px; border-radius: 8px; color: #a8d96b; font-size: 13px; font-weight: 600; text-decoration: none; cursor: pointer; transition: background 0.15s; width: 100%; }
        .nb-dd-list-prop:hover { background: rgba(168,217,107,0.1); }

        .nb-hamburger { display: none; background: none; border: none; cursor: pointer; padding: 6px; color: rgba(240,237,232,0.8); }
        .nb-mobile-menu { position: fixed; inset: 0; background: #071009; z-index: 999; padding: 80px 24px 32px; display: flex; flex-direction: column; gap: 8px; animation: slideIn 0.22s ease; overflow-y: auto; }
        @keyframes slideIn { from { opacity: 0; transform: translateX(100%); } to { opacity: 1; transform: translateX(0); } }
        .nb-mobile-link { display: block; padding: 16px 20px; border-radius: 14px; color: rgba(240,237,232,0.75); font-size: 16px; font-weight: 500; text-decoration: none; border: 1px solid rgba(168,217,107,0.08); transition: background 0.2s, color 0.2s; }
        .nb-mobile-link:hover { background: rgba(168,217,107,0.06); color: #fff; }
        .nb-mobile-link.highlight { border-color: rgba(168,217,107,0.3); color: #a8d96b; background: rgba(168,217,107,0.06); }
        .nb-mobile-close { position: absolute; top: 18px; right: 20px; background: rgba(168,217,107,0.1); border: 1px solid rgba(168,217,107,0.2); border-radius: 50%; width: 38px; height: 38px; color: #a8d96b; font-size: 18px; cursor: pointer; display: flex; align-items: center; justify-content: center; }

        .nb-mobile-user-card { background: rgba(168,217,107,0.06); border: 1px solid rgba(168,217,107,0.15); border-radius: 14px; padding: 14px 16px; margin-bottom: 8px; display: flex; align-items: center; gap: 14px; }
        .nb-mobile-user-avatar { width: 46px; height: 46px; border-radius: 50%; background: linear-gradient(135deg, #a8d96b, #5fa832); display: flex; align-items: center; justify-content: center; font-weight: 800; color: #0f1410; font-size: 18px; flex-shrink: 0; box-shadow: 0 0 0 3px rgba(168,217,107,0.25); }
        .nb-mobile-user-info { flex: 1; min-width: 0; }
        .nb-mobile-user-name { font-weight: 700; color: #fff; font-size: 15px; word-break: break-word; }
        .nb-mobile-user-level { color: #c1e88d; font-size: 13px; font-weight: 500; margin-top: 3px; }

        .page-wrap { min-height: 100vh; }
        .page-wrap.no-hero { padding-top: 66px; }

        .nb-footer { border-top: 1px solid rgba(168,217,107,0.1); background: #060e08; padding: 32px 32px 0; font-family: 'DM Sans', sans-serif; }
        .nb-footer-inner { max-width: 1200px; margin: 0 auto; display: grid; grid-template-columns: 2fr 1fr 1fr 1fr; gap: 40px; padding-bottom: 28px; }
        .nb-footer-logo { display: flex; align-items: center; gap: 10px; margin-bottom: 14px; }
        .nb-footer-desc { font-size: 13px; color: rgba(240,237,232,0.4); line-height: 1.7; margin: 0 0 20px; max-width: 260px; }
        .nb-footer-badge { display: inline-flex; align-items: center; gap: 6px; background: rgba(168,217,107,0.08); border: 1px solid rgba(168,217,107,0.2); color: #a8d96b; font-size: 11px; font-weight: 600; padding: 5px 12px; border-radius: 100px; letter-spacing: 0.06em; }
        .nb-footer-col-title { font-size: 11px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; color: #a8d96b; margin-bottom: 16px; }
        .nb-footer-link { display: block; font-size: 13px; color: rgba(240,237,232,0.5); text-decoration: none; margin-bottom: 10px; transition: color 0.2s; }
        .nb-footer-link:hover { color: #fff; }
        .nb-footer-bottom { max-width: 1200px; margin: 0 auto; padding: 20px 0 28px; border-top: 1px solid rgba(255,255,255,0.06); display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 8px; }
        .nb-footer-bottom-text { font-size: 12px; color: rgba(240,237,232,0.25); }
        .nb-footer-bottom-brand { font-size: 12px; color: rgba(168,217,107,0.5); font-weight: 600; }

        @media (max-width: 1024px) { .nb-profile-name { max-width: 100px; } }
        @media (max-width: 900px) {
          .nb-profile-text, .nb-profile-chevron { display: none; }
          .nb-profile-trigger { padding: 4px; border-radius: 50%; border-color: transparent; background: transparent; }
          .nb-profile-trigger:hover, .nb-profile-trigger.open { background: rgba(168,217,107,0.08); }
        }
        @media (max-width: 768px) {
          .nb-links, .nb-list-btn { display: none; }
          .nb-hamburger { display: flex; }
          .nb { padding: 0 20px; }
          .nb-footer-inner { grid-template-columns: 1fr 1fr; gap: 28px; }
          .nb-footer-bottom { flex-direction: column; text-align: center; }
        }
        @media (max-width: 480px) { .nb-footer-inner { grid-template-columns: 1fr; } }
      `}</style>

      {/* NAVBAR */}
      <nav className={`nb ${scrolled || !isHome ? 'scrolled' : ''}`}>
        <div className="nb-inner">
          <Link to="/" className="nb-logo">
            <div className="nb-logo-text">
              Safe Journey
              <span className="nb-logo-sub">Nepal Tours</span>
            </div>
          </Link>
          <div className="nb-spacer" />
          <ul className="nb-links">
            {navLinks.map(l => (
              <li key={l.to}>
                <Link to={l.to} className={loc.pathname === l.to ? 'active' : ''}>{l.label}</Link>
              </li>
            ))}
          </ul>
          <div className="nb-auth">
            <Link to="/agency-login" className="nb-list-btn">List your property</Link>
            {isAuthenticated ? (
              <div className="nb-profile" ref={profileRef}>
                <div className={`nb-profile-trigger ${profileOpen ? 'open' : ''}`} onClick={() => setProfileOpen(o => !o)}>
                  <div className="nb-avatar">{initials}</div>
                  <div className="nb-profile-text">
                    <div className="nb-profile-name">{navDisplayName}</div>
                    {user?.role === 'customer' && (
                      <div className="nb-profile-level">{loyaltyLevel.name} Level {loyaltyLevel.level}</div>
                    )}
                  </div>
                  <svg className="nb-profile-chevron" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 8l5 5 5-5"/>
                  </svg>
                </div>
                {profileOpen && (
                  <div className="nb-dropdown">
                    <div className="nb-dd-header">
                      <div className="nb-dd-avatar-circle">{initials}</div>
                      <div className="nb-dd-info">
                        <div className="nb-dd-name">{fullName}</div>
                        {user?.role === 'customer' && (
                          <div className="nb-dd-level-text">{loyaltyLevel.name} Level {loyaltyLevel.level}</div>
                        )}
                      </div>
                    </div>
                    <div className="nb-dd-sep-light" />
                    {ddLinks.map(l => (
                      <Link key={l.to} className="nb-dd-item" to={l.to} onClick={close}>{l.label}</Link>
                    ))}
                    <div className="nb-dd-sep" />
                    <Link className="nb-dd-list-prop" to="/agency-login" onClick={close}>List your property</Link>
                    <div className="nb-dd-sep" />
                    <button className="nb-dd-item danger" onClick={logout}>Log out</button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Link className="nb-btn-ghost" to="/login">Log in</Link>
                <Link className="nb-btn-solid" to="/signup">Sign up</Link>
              </>
            )}
            <button className="nb-hamburger" onClick={() => setMenuOpen(true)}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
              </svg>
            </button>
          </div>
        </div>
      </nav>

      {/* MOBILE MENU */}
      {menuOpen && (
        <div className="nb-mobile-menu">
          <button className="nb-mobile-close" onClick={() => setMenuOpen(false)}>✕</button>
          {isAuthenticated && (
            <div className="nb-mobile-user-card">
              <div className="nb-mobile-user-avatar">{initials}</div>
              <div className="nb-mobile-user-info">
                <div className="nb-mobile-user-name">{fullName}</div>
                {user?.role === 'customer' && (
                  <div className="nb-mobile-user-level">{loyaltyLevel.name} Level {loyaltyLevel.level}</div>
                )}
              </div>
            </div>
          )}
          {navLinks.map(l => (
            <Link key={l.to} className="nb-mobile-link" to={l.to} onClick={() => setMenuOpen(false)}>{l.label}</Link>
          ))}
          <Link className="nb-mobile-link highlight" to="/agency-login" onClick={() => setMenuOpen(false)}>List your property</Link>
          {isAuthenticated && <Link className="nb-mobile-link" to="/profile" onClick={() => setMenuOpen(false)}>My Profile</Link>}
          {isAuthenticated && <Link className="nb-mobile-link" to="/dashboard" onClick={() => setMenuOpen(false)}>Dashboard</Link>}
          {isAuthenticated && user?.role === 'customer' && <Link className="nb-mobile-link" to="/bookings" onClick={() => setMenuOpen(false)}>My Bookings</Link>}
          {isAuthenticated && user?.role === 'customer' && <Link className="nb-mobile-link" to="/wishlist" onClick={() => setMenuOpen(false)}>Wishlist</Link>}
          {isAuthenticated && user?.role === 'customer' && <Link className="nb-mobile-link" to="/rewards" onClick={() => setMenuOpen(false)}>Loyalty Program</Link>}
          {!isAuthenticated && <Link className="nb-mobile-link" to="/login" onClick={() => setMenuOpen(false)}>Log in</Link>}
          {!isAuthenticated && <Link className="nb-mobile-link" to="/signup" onClick={() => setMenuOpen(false)}>Sign up</Link>}
          {isAuthenticated && (
            <button className="nb-mobile-link"
              style={{border:'1px solid rgba(248,113,113,0.15)', color:'#f87171', cursor:'pointer', textAlign:'left', background:'rgba(248,113,113,0.05)', fontFamily:'inherit'}}
              onClick={() => { logout(); setMenuOpen(false); }}>
              Log out
            </button>
          )}
        </div>
      )}

      {/* PAGE CONTENT */}
      <div className={`page-wrap ${isHome ? '' : 'no-hero'}`}>{children}</div>

      {/* FOOTER */}
      <footer className="nb-footer">
        <div className="nb-footer-inner">
          <div>
            <div className="nb-footer-logo">
              <div style={{fontFamily:'Playfair Display,serif',fontSize:15,fontWeight:700,color:'#fff'}}>Safe Journey</div>
            </div>
            <p className="nb-footer-desc">Nepal's most trusted tour platform. Explore verified tours from trusted agencies across the Himalayas.</p>
            <div className="nb-footer-badge">Nepal Tourism Platform</div>
          </div>
          <div>
            <div className="nb-footer-col-title">Explore</div>
            <Link className="nb-footer-link" to="/tours">Browse Tours</Link>
            <Link className="nb-footer-link" to="/tours">Trekking</Link>
            <Link className="nb-footer-link" to="/tours">Pokhara</Link>
            <Link className="nb-footer-link" to="/tours">Everest Region</Link>
          </div>
          <div>
            <div className="nb-footer-col-title">Account</div>
            <Link className="nb-footer-link" to="/login">Log In</Link>
            <Link className="nb-footer-link" to="/signup">Sign Up</Link>
            <Link className="nb-footer-link" to="/bookings">My Bookings</Link>
            <Link className="nb-footer-link" to="/rewards">Loyalty Program</Link>
          </div>
          <div>
            <div className="nb-footer-col-title">For Agencies</div>
            <Link className="nb-footer-link" to="/agency-login">Agency Login</Link>
            <Link className="nb-footer-link" to="/agency-signup">List your property</Link>
            <Link className="nb-footer-link" to="/support">Support</Link>
          </div>
        </div>
        <div className="nb-footer-bottom">
          <span className="nb-footer-bottom-text">© {new Date().getFullYear()} Safe Journey Planner · Made with care in Nepal</span>
          <span className="nb-footer-bottom-brand">Safe Journey Nepal</span>
        </div>
      </footer>
    </>
  );
}