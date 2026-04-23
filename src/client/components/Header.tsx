import React, { useState, useEffect } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';

const BUNNY = 'https://intuitives-awaken.b-cdn.net';

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
  }, [location]);

  return (
    <header className={`site-header ${scrolled ? 'scrolled' : ''}`}>
      <div className="header-inner container">
        <Link to="/" className="site-logo" aria-label="The Bright Wound - Home">
          <span className="logo-symbol">✦</span>
          <span className="logo-text">
            <span className="logo-title">The Bright Wound</span>
            <span className="logo-sub">Psychic Development &amp; Intuitive Awakening</span>
          </span>
        </Link>

        <nav className={`site-nav ${menuOpen ? 'open' : ''}`} aria-label="Main navigation">
          <NavLink to="/" end className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>Home</NavLink>
          <NavLink to="/articles" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>Articles</NavLink>
          <NavLink to="/quiz" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>Quiz</NavLink>
          <NavLink to="/assessment" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>Assessment</NavLink>
          <NavLink to="/tools" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>Toolkit</NavLink>
          <NavLink to="/about" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>About</NavLink>
        </nav>

        <button
          className={`menu-toggle ${menuOpen ? 'open' : ''}`}
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={menuOpen}
        >
          <span></span>
          <span></span>
          <span></span>
        </button>
      </div>

      <style>{`
        .site-header {
          position: sticky;
          top: 0;
          z-index: 100;
          background: rgba(245, 240, 250, 0.92);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border-bottom: 1px solid transparent;
          transition: all var(--transition-base);
          padding: 0.75rem 0;
        }
        .site-header.scrolled {
          border-bottom-color: var(--border);
          box-shadow: var(--shadow-sm);
          padding: 0.5rem 0;
        }
        .header-inner {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1rem;
        }
        .site-logo {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          text-decoration: none;
          color: var(--text-primary);
          flex-shrink: 0;
        }
        .logo-symbol {
          font-size: 1.75rem;
          color: var(--accent);
          line-height: 1;
          filter: drop-shadow(0 0 8px rgba(201, 168, 76, 0.4));
        }
        .logo-text {
          display: flex;
          flex-direction: column;
        }
        .logo-title {
          font-family: var(--font-heading);
          font-size: 1.25rem;
          font-weight: 600;
          line-height: 1.1;
          color: var(--text-primary);
        }
        .logo-sub {
          font-family: var(--font-ui);
          font-size: 0.65rem;
          color: var(--text-muted);
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }
        .site-nav {
          display: flex;
          align-items: center;
          gap: 0.25rem;
        }
        .nav-link {
          font-family: var(--font-ui);
          font-size: 0.875rem;
          font-weight: 500;
          color: var(--text-secondary);
          text-decoration: none;
          padding: 0.4rem 0.75rem;
          border-radius: var(--radius-full);
          transition: all var(--transition-fast);
          letter-spacing: 0.02em;
        }
        .nav-link:hover {
          color: var(--text-primary);
          background: var(--bg-secondary);
        }
        .nav-link.active {
          color: var(--accent);
          background: var(--accent-soft);
        }
        .menu-toggle {
          display: none;
          flex-direction: column;
          gap: 5px;
          background: none;
          border: none;
          cursor: pointer;
          padding: 8px;
          border-radius: var(--radius-sm);
          min-width: var(--tap-target-min);
          min-height: var(--tap-target-min);
          align-items: center;
          justify-content: center;
        }
        .menu-toggle span {
          display: block;
          width: 22px;
          height: 2px;
          background: var(--text-primary);
          border-radius: 2px;
          transition: all var(--transition-fast);
          transform-origin: center;
        }
        .menu-toggle.open span:nth-child(1) { transform: translateY(7px) rotate(45deg); }
        .menu-toggle.open span:nth-child(2) { opacity: 0; }
        .menu-toggle.open span:nth-child(3) { transform: translateY(-7px) rotate(-45deg); }

        @media (max-width: 768px) {
          .menu-toggle { display: flex; }
          .site-nav {
            display: none;
            position: absolute;
            top: 100%;
            left: 0;
            right: 0;
            background: var(--bg-primary);
            border-bottom: 1px solid var(--border);
            flex-direction: column;
            padding: 1rem;
            gap: 0.25rem;
            box-shadow: var(--shadow-md);
          }
          .site-nav.open { display: flex; }
          .nav-link {
            width: 100%;
            padding: 0.75rem 1rem;
            font-size: 1rem;
          }
          .logo-sub { display: none; }
        }
      `}</style>
    </header>
  );
}
