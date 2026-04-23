import React from 'react';
import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <div className="notfound-page">
      <div className="container">
        <span className="notfound-symbol">✦</span>
        <h1>404</h1>
        <p>This page doesn't exist. Or it does, and you just can't see it yet.</p>
        <div className="notfound-actions">
          <Link to="/" className="btn btn-primary">Go Home</Link>
          <Link to="/articles" className="btn btn-outline">Browse Articles</Link>
        </div>
      </div>
      <style>{`
        .notfound-page {
          min-height: 60vh;
          display: flex;
          align-items: center;
          text-align: center;
        }
        .notfound-page .container {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1rem;
        }
        .notfound-symbol {
          font-size: 4rem;
          color: var(--accent);
          filter: drop-shadow(0 0 20px rgba(201, 168, 76, 0.4));
        }
        .notfound-page h1 {
          font-family: var(--font-heading);
          font-size: 6rem;
          color: var(--text-primary);
          line-height: 1;
          margin: 0;
        }
        .notfound-page p {
          font-size: 1.1rem;
          color: var(--text-secondary);
          max-width: 400px;
        }
        .notfound-actions {
          display: flex;
          gap: 1rem;
          margin-top: 1rem;
          flex-wrap: wrap;
          justify-content: center;
        }
        .btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 0.75rem 1.75rem;
          border-radius: var(--radius-full);
          font-family: var(--font-ui);
          font-size: 0.9rem;
          font-weight: 600;
          text-decoration: none;
          transition: all var(--transition-base);
          border: 2px solid transparent;
          min-height: var(--tap-target-min);
        }
        .btn-primary { background: var(--accent); color: #1A0F2E; border-color: var(--accent); }
        .btn-primary:hover { background: var(--accent-hover); color: #1A0F2E; }
        .btn-outline { background: transparent; color: var(--text-primary); border-color: var(--border); }
        .btn-outline:hover { background: var(--bg-secondary); border-color: var(--accent); }
      `}</style>
    </div>
  );
}
