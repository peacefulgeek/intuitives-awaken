import React from 'react';
import { Link } from 'react-router-dom';

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="site-footer">
      <div className="footer-inner container">
        <div className="footer-brand">
          <span className="footer-symbol">✦</span>
          <div>
            <div className="footer-title">The Bright Wound</div>
            <div className="footer-tagline">For the person who has always sensed things others don't.</div>
          </div>
        </div>

        <nav className="footer-nav" aria-label="Footer navigation">
          <div className="footer-nav-group">
            <h4>Explore</h4>
            <Link to="/articles">All Articles</Link>
            <Link to="/quiz">Sensitivity Quiz</Link>
            <Link to="/assessment">Psychic Assessment</Link>
            <Link to="/tools">The Sensitive's Toolkit</Link>
          </div>
          <div className="footer-nav-group">
            <h4>About</h4>
            <Link to="/about">About Kalesh</Link>
            <a href="https://kalesh.love" target="_blank" rel="noopener noreferrer">Kalesh.love</a>
          </div>
        </nav>

        <div className="footer-bottom">
          <p className="footer-disclaimer">
            <strong>Affiliate Disclosure:</strong> As an Amazon Associate, I earn from qualifying purchases.
            Links marked "(paid link)" are affiliate links. This doesn't affect my recommendations.
          </p>
          <p className="footer-disclaimer">
            <strong>Health Disclaimer:</strong> Content on this site is for informational purposes only.
            It is not a substitute for professional medical, psychological, or psychiatric advice.
          </p>
          <p className="footer-copy">
            &copy; {year} The Bright Wound. Written by <a href="https://kalesh.love" target="_blank" rel="noopener noreferrer">Kalesh</a>.
          </p>
        </div>
      </div>

      <style>{`
        .site-footer {
          background: var(--bg-dark);
          color: var(--text-on-dark);
          padding: 3rem 0 1.5rem;
          margin-top: 4rem;
        }
        .footer-inner {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 3rem;
        }
        .footer-brand {
          display: flex;
          align-items: flex-start;
          gap: 1rem;
          grid-column: 1 / -1;
        }
        .footer-symbol {
          font-size: 2rem;
          color: var(--accent);
          filter: drop-shadow(0 0 8px rgba(201, 168, 76, 0.4));
        }
        .footer-title {
          font-family: var(--font-heading);
          font-size: 1.5rem;
          font-weight: 600;
          color: var(--text-on-dark);
          margin-bottom: 0.25rem;
        }
        .footer-tagline {
          font-size: 0.9rem;
          color: rgba(245, 240, 250, 0.6);
          font-style: italic;
        }
        .footer-nav {
          display: flex;
          gap: 3rem;
          grid-column: 1 / -1;
        }
        .footer-nav-group {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }
        .footer-nav-group h4 {
          font-family: var(--font-ui);
          font-size: 0.7rem;
          font-weight: 600;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: var(--accent);
          margin-bottom: 0.5rem;
        }
        .footer-nav-group a {
          font-size: 0.9rem;
          color: rgba(245, 240, 250, 0.7);
          text-decoration: none;
          transition: color var(--transition-fast);
        }
        .footer-nav-group a:hover {
          color: var(--text-on-dark);
        }
        .footer-bottom {
          grid-column: 1 / -1;
          border-top: 1px solid rgba(245, 240, 250, 0.1);
          padding-top: 1.5rem;
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }
        .footer-disclaimer {
          font-size: 0.78rem;
          color: rgba(245, 240, 250, 0.45);
          line-height: 1.5;
        }
        .footer-disclaimer strong {
          color: rgba(245, 240, 250, 0.65);
        }
        .footer-copy {
          font-size: 0.8rem;
          color: rgba(245, 240, 250, 0.45);
        }
        .footer-copy a {
          color: var(--accent);
          text-decoration: none;
        }
        .footer-copy a:hover {
          text-decoration: underline;
        }
        @media (max-width: 768px) {
          .footer-inner { grid-template-columns: 1fr; gap: 2rem; }
          .footer-nav { flex-direction: column; gap: 1.5rem; }
        }
      `}</style>
    </footer>
  );
}
