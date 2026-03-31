import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';

function getUser() {
  try { return JSON.parse(localStorage.getItem('user') || 'null'); } catch { return null; }
}
function getToken() {
  return localStorage.getItem('sjp_token') || null;
}

export default function Layout({ children }) {
  const nav = useNavigate();
  const loc = useLocation();
  const [user, setUser] = useState(getUser);
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const profileRef = useRef(null);

  useEffect(() => {
    const sync = () => setUser(getUser());
    window.addEventListener('storage', sync);
    window.addEventListener('auth-change', sync);
    return () => { window.removeEventListener('storage', sync); window.removeEventListener('auth-change', sync); };
  }, []);

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

  // Agency ra Admin ko lagi navbar/footer hide garnu — tiniharuko आफ्नै layout xa
  const isAgencyPage = loc.pathname.startsWith('/agency');
  const isAdminPage  = loc.pathname.startsWith('/admin') && loc.pathname !== '/admin-login' && loc.pathname !== '/admin-setup';

  if (isAgencyPage || isAdminPage) {
    return <>{children}</>;
  }

  const navLinks = [
    { to: '/', label: 'Home' },
    { to: '/tours', label: 'Tours' },
    { to: '/support', label: 'Support' },
  ];

  const userLinks = user && user.role === 'customer' ? [
    { to: '/bookings', label: 'My Bookings' },
    { to: '/wishlist', label: 'Wishlist' },
    { to: '/notifications', label: 'Notifications' },
  ] : [];

  const ddLinks = [
    { to: '/dashboard', label: 'Dashboard' },
    { to: '/profile', label: 'My Profile' },
    ...(user?.role === 'customer' ? [
      { to: '/bookings', label: 'My Bookings' },
      { to: '/wishlist', label: 'Wishlist' },
      { to: '/notifications', label: 'Notifications' },
    ] : []),
  ];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=DM+Sans:wght@300;400;500;600&display=swap');
        *, *::before, *::after { box-sizing: border-box; }
        html { scroll-behavior: smooth; }
        body { font-family: 'DM Sans', sans-serif; background: #0a0e0d; color: #f0ede8; margin: 0; min-height: 100vh; }

        .nb { position: fixed; top: 0; left: 0; right: 0; z-index: 1000; transition: background 0.3s, backdrop-filter 0.3s, box-shadow 0.3s; padding: 0 32px; }
        .nb.scrolled { background: rgba(10,14,13,0.88); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px); box-shadow: 0 1px 0 rgba(255,255,255,0.07); }
        .nb-inner { max-width: 1200px; margin: 0 auto; height: 66px; display: flex; align-items: center; }
        .nb-logo { display: flex; align-items: center; gap: 10px; text-decoration: none; flex-shrink: 0; }
        .nb-logo-text { font-family: 'Playfair Display', serif; font-size: 17px; font-weight: 700; color: #fff; line-height: 1.1; }
        .nb-logo-sub { font-family: 'DM Sans', sans-serif; font-size: 10px; font-weight: 400; color: rgba(240,237,232,0.45); letter-spacing: 0.06em; display: block; }
        .nb-spacer { flex: 1; }
        .nb-links { display: flex; align-items: center; gap: 4px; list-style: none; padding: 0; margin: 0 16px 0 0; }
        .nb-links a { text-decoration: none; color: rgba(240,237,232,0.65); font-size: 14px; font-weight: 500; padding: 6px 14px; border-radius: 100px; transition: color 0.2s, background 0.2s; }
        .nb-links a:hover, .nb-links a.active { color: #fff; background: rgba(255,255,255,0.08); }
        .nb-auth { display: flex; align-items: center; gap: 8px; }
        .nb-btn-ghost { background: transparent; color: rgba(240,237,232,0.7); border: 1px solid rgba(255,255,255,0.18); border-radius: 100px; padding: 7px 18px; font-family: 'DM Sans', sans-serif; font-size: 13px; font-weight: 500; cursor: pointer; text-decoration: none; transition: all 0.2s; display: inline-block; }
        .nb-btn-ghost:hover { color: #fff; border-color: rgba(255,255,255,0.35); background: rgba(255,255,255,0.06); }
        .nb-btn-solid { background: #a8d96b; color: #1a2010; border: none; border-radius: 100px; padding: 8px 20px; font-family: 'DM Sans', sans-serif; font-size: 13px; font-weight: 700; cursor: pointer; text-decoration: none; transition: background 0.2s, transform 0.15s; display: inline-block; }
        .nb-btn-solid:hover { background: #c1e88d; transform: scale(1.04); }
        .nb-profile { position: relative; }
        .nb-avatar { width: 36px; height: 36px; background: linear-gradient(135deg, #a8d96b, #5fa832); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 14px; font-weight: 700; color: #1a2010; cursor: pointer; border: 2px solid transparent; transition: border-color 0.2s, transform 0.15s; flex-shrink: 0; }
        .nb-avatar:hover, .nb-avatar.open { border-color: rgba(168,217,107,0.6); transform: scale(1.06); }
        .nb-dropdown { position: absolute; top: calc(100% + 10px); right: 0; width: 224px; background: #131918; border: 1px solid rgba(255,255,255,0.1); border-radius: 16px; box-shadow: 0 24px 64px rgba(0,0,0,0.6); padding: 8px; animation: dropIn 0.18s ease; overflow: hidden; }
        @keyframes dropIn { from { opacity: 0; transform: translateY(-8px) scale(0.96); } to { opacity: 1; transform: translateY(0) scale(1); } }
        .nb-dd-header { padding: 12px 14px 8px; border-bottom: 1px solid rgba(255,255,255,0.07); margin-bottom: 6px; }
        .nb-dd-name { font-size: 14px; font-weight: 600; color: #fff; margin-bottom: 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .nb-dd-role { font-size: 11px; color: #a8d96b; text-transform: capitalize; font-weight: 500; }
        .nb-dd-item { display: flex; align-items: center; gap: 10px; padding: 9px 12px; border-radius: 10px; color: rgba(240,237,232,0.7); font-size: 13px; font-weight: 500; text-decoration: none; cursor: pointer; transition: background 0.15s, color 0.15s; width: 100%; background: none; border: none; text-align: left; font-family: 'DM Sans', sans-serif; }
        .nb-dd-item:hover { background: rgba(255,255,255,0.07); color: #fff; }
        .nb-dd-item.danger:hover { background: rgba(220,60,60,0.12); color: #f87171; }
        .nb-dd-sep { height: 1px; background: rgba(255,255,255,0.07); margin: 6px 0; }
        .nb-hamburger { display: none; background: none; border: none; cursor: pointer; padding: 6px; color: rgba(240,237,232,0.8); }
        .nb-mobile-menu { position: fixed; inset: 0; background: #0a0e0d; z-index: 999; padding: 80px 24px 32px; display: flex; flex-direction: column; gap: 8px; animation: slideIn 0.22s ease; }
        @keyframes slideIn { from { opacity: 0; transform: translateX(100%); } to { opacity: 1; transform: translateX(0); } }
        .nb-mobile-link { display: block; padding: 16px 20px; border-radius: 14px; color: rgba(240,237,232,0.75); font-size: 18px; font-weight: 500; text-decoration: none; border: 1px solid rgba(255,255,255,0.07); transition: background 0.2s, color 0.2s; }
        .nb-mobile-link:hover { background: rgba(255,255,255,0.06); color: #fff; }
        .nb-mobile-close { position: absolute; top: 18px; right: 20px; background: rgba(255,255,255,0.07); border: none; border-radius: 50%; width: 38px; height: 38px; color: #fff; font-size: 20px; cursor: pointer; display: flex; align-items: center; justify-content: center; }
        .page-wrap { min-height: 100vh; }
        .page-wrap.no-hero { padding-top: 66px; }
        .nb-footer { border-top: 1px solid rgba(168,217,107,0.12); background: #0a0f0c; padding: 32px 32px 0; font-family: 'DM Sans', sans-serif; }
        .nb-footer-inner { max-width: 1200px; margin: 0 auto 0; display: grid; grid-template-columns: 2fr 1fr 1fr 1fr; gap: 40px; padding-bottom: 28px; }
        .nb-footer-logo { display: flex; align-items: center; gap: 10px; margin-bottom: 14px; }
        .nb-footer-desc { font-size: 13px; color: rgba(240,237,232,0.4); line-height: 1.7; margin: 0 0 20px; max-width: 260px; }
        .nb-footer-badge { display: inline-flex; align-items: center; gap: 6px; background: rgba(168,217,107,0.08); border: 1px solid rgba(168,217,107,0.2); color: #a8d96b; font-size: 11px; font-weight: 600; padding: 5px 12px; border-radius: 100px; letter-spacing: 0.06em; }
        .nb-footer-col-title { font-size: 11px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; color: #a8d96b; margin-bottom: 16px; }
        .nb-footer-link { display: block; font-size: 13px; color: rgba(240,237,232,0.5); text-decoration: none; margin-bottom: 10px; transition: color 0.2s; }
        .nb-footer-link:hover { color: #fff; }
        .nb-footer-bottom { max-width: 1200px; margin: 0 auto; padding: 20px 0 28px; border-top: 1px solid rgba(255,255,255,0.06); display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 8px; }
        .nb-footer-bottom-text { font-size: 12px; color: rgba(240,237,232,0.25); }
        .nb-footer-bottom-brand { font-size: 12px; color: rgba(168,217,107,0.5); font-weight: 600; letter-spacing: 0.04em; }
        @media (max-width: 768px) { .nb-footer-inner { grid-template-columns: 1fr 1fr; gap: 28px; } .nb-footer-bottom { flex-direction: column; text-align: center; } }
        @media (max-width: 480px) { .nb-footer-inner { grid-template-columns: 1fr; } }
        @media (max-width: 768px) { .nb-links, .nb-auth { display: none; } .nb-hamburger { display: flex; } .nb { padding: 0 20px; } }
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
            {user && userLinks.map(l => (
              <li key={l.to}>
                <Link to={l.to} className={loc.pathname.startsWith(l.to) ? 'active' : ''}>{l.label}</Link>
              </li>
            ))}
          </ul>

          <div className="nb-auth">
            {user ? (
              <div className="nb-profile" ref={profileRef}>
                <div className={`nb-avatar ${profileOpen ? 'open' : ''}`} onClick={() => setProfileOpen(o => !o)} title={user.name || 'Profile'}>
                  {(user.name || user.full_name || user.email || 'U')[0].toUpperCase()}
                </div>
                {profileOpen && (
                  <div className="nb-dropdown">
                    <div className="nb-dd-header">
                      <div className="nb-dd-name">{user.name || user.full_name || user.email}</div>
                      <div className="nb-dd-role">{user.role || 'Customer'}</div>
                    </div>
                    {ddLinks.map(l => (
                      <Link key={l.to} className="nb-dd-item" to={l.to} onClick={close}>{l.label}</Link>
                    ))}
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
          {navLinks.map(l => (
            <Link key={l.to} className="nb-mobile-link" to={l.to} onClick={() => setMenuOpen(false)}>{l.label}</Link>
          ))}
          {user && userLinks.map(l => (
            <Link key={l.to} className="nb-mobile-link" to={l.to} onClick={() => setMenuOpen(false)}>{l.label}</Link>
          ))}
          {user && <Link className="nb-mobile-link" to="/profile" onClick={() => setMenuOpen(false)}>My Profile</Link>}
          {user && <Link className="nb-mobile-link" to="/dashboard" onClick={() => setMenuOpen(false)}>Dashboard</Link>}
          {!user && <Link className="nb-mobile-link" to="/login" onClick={() => setMenuOpen(false)}>Log in</Link>}
          {!user && <Link className="nb-mobile-link" to="/signup" onClick={() => setMenuOpen(false)}>Sign up</Link>}
          {user && (
            <button className="nb-mobile-link" style={{border:'none',color:'#f87171',cursor:'pointer',textAlign:'left',background:'rgba(248,113,113,0.07)',fontFamily:'inherit'}} onClick={() => { logout(); setMenuOpen(false); }}>
              Log out
            </button>
          )}
        </div>
      )}

      {/* PAGE CONTENT */}
      <div className={`page-wrap ${isHome ? '' : 'no-hero'}`}>
        {children}
      </div>

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
            <Link className="nb-footer-link" to="/wishlist">Wishlist</Link>
          </div>
          <div>
            <div className="nb-footer-col-title">Help</div>
            <Link className="nb-footer-link" to="/support">Support</Link>
            <Link className="nb-footer-link" to="/agency-signup">List as Agency</Link>
            <Link className="nb-footer-link" to="/notifications">Notifications</Link>
          </div>
        </div>
        <div className="nb-footer-bottom">
          <span className="nb-footer-bottom-text">© {new Date().getFullYear()} Safe Journey Planner · Made with ❤️ in Nepal</span>
          <span className="nb-footer-bottom-brand">🏔 Safe Journey Nepal</span>
        </div>
      </footer>
    </>
  );
}