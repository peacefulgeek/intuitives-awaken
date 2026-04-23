import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import ArticleCard from '../components/ArticleCard';

const BUNNY = 'https://intuitives-awaken.b-cdn.net';

interface Article {
  id: number;
  slug: string;
  title: string;
  meta_description: string;
  category: string;
  image_url: string;
  image_alt: string;
  reading_time: number;
  published_at: string;
}

const CATEGORIES = [
  { key: 'psychic-development', label: 'Psychic Development', icon: '◈' },
  { key: 'intuition', label: 'Intuition', icon: '◉' },
  { key: 'empath', label: 'Empath', icon: '◎' },
  { key: 'grounding', label: 'Grounding', icon: '◆' },
  { key: 'nervous-system', label: 'Nervous System', icon: '◇' },
  { key: 'science', label: 'The Science', icon: '◈' },
];

export default function HomePage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/articles')
      .then(r => r.json())
      .then(data => {
        setArticles(data.articles || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const featured = articles[0];
  const recent = articles.slice(1, 7);

  return (
    <div className="home-page">
      {/* ── HERO ─────────────────────────────────────────────── */}
      <section className="hero-section">
        <div className="hero-bg">
          <img
            src={`${BUNNY}/images/hero-bg.webp`}
            alt=""
            aria-hidden="true"
            className="hero-bg-img"
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
          />
          <div className="hero-overlay" />
        </div>
        <div className="hero-content container">
          <div className="hero-eyebrow">
            <span className="eyebrow-symbol">✦</span>
            <span>Psychic Development &amp; Intuitive Awakening</span>
          </div>
          <h1 className="hero-title">
            You've always sensed things<br />others don't.
          </h1>
          <p className="hero-subtitle">
            You're not too sensitive. You're under-supported. This is where that changes.
          </p>
          <div className="hero-actions">
            <Link to="/articles" className="btn btn-primary">Read the Articles</Link>
            <Link to="/assessment" className="btn btn-ghost">Take the Assessment</Link>
          </div>
          <div className="hero-quote">
            <blockquote>
              "Intuition isn't mystical. It's a perceptual bandwidth most people have been trained to ignore."
            </blockquote>
            <cite>— Kalesh</cite>
          </div>
        </div>
      </section>

      {/* ── WHAT IS THIS ─────────────────────────────────────── */}
      <section className="intro-section container">
        <div className="intro-grid">
          <div className="intro-text">
            <h2>The Bright Wound</h2>
            <p>
              There's a cost to seeing what others don't want seen. The sensitivity that makes you
              perceptive also makes you a target for dismissal, gaslighting, and the slow erosion
              of your own certainty.
            </p>
            <p>
              This site is for people who are done pretending they don't notice what they notice.
              It's practical, grounded, and written by someone who has been doing this work for years
              without the New Age performance.
            </p>
            <Link to="/about" className="text-link">About Kalesh →</Link>
          </div>
          <div className="intro-image">
            <img
              src={`${BUNNY}/images/kalesh-portrait.webp`}
              alt="Kalesh - Consciousness Teacher and Writer"
              width="400"
              height="500"
              onError={(e) => {
                const t = e.target as HTMLImageElement;
                t.src = `${BUNNY}/images/articles/default-hero.webp`;
              }}
            />
          </div>
        </div>
      </section>

      {/* ── CATEGORIES ───────────────────────────────────────── */}
      <section className="categories-section">
        <div className="container">
          <h2 className="section-title">Explore by Topic</h2>
          <div className="categories-grid">
            {CATEGORIES.map(cat => (
              <Link
                key={cat.key}
                to={`/articles?category=${cat.key}`}
                className="category-card"
              >
                <span className="cat-icon">{cat.icon}</span>
                <span className="cat-label">{cat.label}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURED ARTICLE ─────────────────────────────────── */}
      {featured && (
        <section className="featured-section container">
          <h2 className="section-title">Latest</h2>
          <ArticleCard
            slug={featured.slug}
            title={featured.title}
            metaDescription={featured.meta_description}
            imageUrl={featured.image_url}
            imageAlt={featured.image_alt}
            category={featured.category}
            readingTime={featured.reading_time}
            publishedAt={featured.published_at}
            featured={true}
          />
        </section>
      )}

      {/* ── RECENT ARTICLES ──────────────────────────────────── */}
      {recent.length > 0 && (
        <section className="recent-section container">
          <div className="section-header">
            <h2 className="section-title">Recent Articles</h2>
            <Link to="/articles" className="see-all">See all articles →</Link>
          </div>
          <div className="articles-grid">
            {recent.map(article => (
              <ArticleCard
                key={article.id}
                slug={article.slug}
                title={article.title}
                metaDescription={article.meta_description}
                imageUrl={article.image_url}
                imageAlt={article.image_alt}
                category={article.category}
                readingTime={article.reading_time}
                publishedAt={article.published_at}
              />
            ))}
          </div>
        </section>
      )}

      {/* ── QUIZ TEASER ──────────────────────────────────────── */}
      <section className="quiz-teaser-section">
        <div className="container">
          <div className="quiz-teaser-inner">
            <div className="quiz-teaser-content">
              <span className="quiz-eyebrow">✦ Free Assessment</span>
              <h2>Are You Psychically Sensitive?</h2>
              <p>
                Not everyone who feels a lot is psychically sensitive. Not everyone who's psychically
                sensitive feels a lot. This 12-question assessment helps you figure out what's
                actually happening in your nervous system.
              </p>
              <Link to="/assessment" className="btn btn-accent">Take the Free Assessment</Link>
            </div>
            <div className="quiz-teaser-visual">
              <div className="quiz-visual-orb">
                <span>✦</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── TOOLKIT TEASER ───────────────────────────────────── */}
      <section className="toolkit-teaser container">
        <div className="toolkit-inner">
          <h2>The Sensitive's Toolkit</h2>
          <p>
            Books, tools, and supplements that actually help. Curated for people who are done
            with generic wellness advice that wasn't designed for a nervous system like yours.
          </p>
          <Link to="/tools" className="btn btn-outline">Browse the Toolkit →</Link>
        </div>
      </section>

      <style>{`
        /* ── Hero ── */
        .hero-section {
          position: relative;
          min-height: 90vh;
          display: flex;
          align-items: center;
          overflow: hidden;
        }
        .hero-bg {
          position: absolute;
          inset: 0;
          z-index: 0;
        }
        .hero-bg-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          object-position: center;
        }
        .hero-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(
            135deg,
            rgba(26, 15, 46, 0.88) 0%,
            rgba(46, 26, 71, 0.75) 50%,
            rgba(91, 141, 184, 0.3) 100%
          );
        }
        .hero-content {
          position: relative;
          z-index: 1;
          padding-top: 4rem;
          padding-bottom: 4rem;
          max-width: 800px;
        }
        .hero-eyebrow {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-family: var(--font-ui);
          font-size: 0.75rem;
          font-weight: 600;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          color: var(--accent);
          margin-bottom: 1.5rem;
        }
        .eyebrow-symbol {
          font-size: 1rem;
          filter: drop-shadow(0 0 6px rgba(201, 168, 76, 0.6));
        }
        .hero-title {
          font-family: var(--font-heading);
          font-size: clamp(2.5rem, 7vw, 5rem);
          font-weight: 600;
          color: #FFFFFF;
          line-height: 1.1;
          margin-bottom: 1.5rem;
          text-shadow: 0 2px 20px rgba(0,0,0,0.3);
        }
        .hero-subtitle {
          font-size: clamp(1rem, 2.5vw, 1.25rem);
          color: rgba(245, 240, 250, 0.85);
          margin-bottom: 2rem;
          max-width: 560px;
          line-height: 1.6;
        }
        .hero-actions {
          display: flex;
          gap: 1rem;
          flex-wrap: wrap;
          margin-bottom: 3rem;
        }
        .hero-quote {
          border-left: 2px solid var(--accent);
          padding-left: 1.25rem;
          max-width: 500px;
        }
        .hero-quote blockquote {
          font-family: var(--font-heading);
          font-size: 1.1rem;
          font-style: italic;
          color: rgba(245, 240, 250, 0.8);
          margin: 0 0 0.5rem;
          background: none;
          border: none;
          padding: 0;
        }
        .hero-quote cite {
          font-family: var(--font-ui);
          font-size: 0.8rem;
          color: var(--accent);
          font-style: normal;
        }

        /* ── Buttons ── */
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
          cursor: pointer;
          border: 2px solid transparent;
          min-height: var(--tap-target-min);
          letter-spacing: 0.02em;
        }
        .btn-primary {
          background: var(--accent);
          color: #1A0F2E;
          border-color: var(--accent);
        }
        .btn-primary:hover {
          background: var(--accent-hover);
          border-color: var(--accent-hover);
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(201, 168, 76, 0.35);
          color: #1A0F2E;
        }
        .btn-ghost {
          background: transparent;
          color: rgba(245, 240, 250, 0.9);
          border-color: rgba(245, 240, 250, 0.4);
        }
        .btn-ghost:hover {
          background: rgba(245, 240, 250, 0.1);
          border-color: rgba(245, 240, 250, 0.7);
          color: #FFFFFF;
        }
        .btn-accent {
          background: var(--accent-blue);
          color: #FFFFFF;
          border-color: var(--accent-blue);
        }
        .btn-accent:hover {
          background: var(--accent-blue-hover);
          border-color: var(--accent-blue-hover);
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(91, 141, 184, 0.35);
          color: #FFFFFF;
        }
        .btn-outline {
          background: transparent;
          color: var(--text-primary);
          border-color: var(--border);
        }
        .btn-outline:hover {
          background: var(--bg-secondary);
          border-color: var(--accent);
          color: var(--text-primary);
        }
        .text-link {
          font-family: var(--font-ui);
          font-size: 0.9rem;
          font-weight: 600;
          color: var(--accent-blue);
          text-decoration: none;
          display: inline-flex;
          align-items: center;
          gap: 0.25rem;
          transition: gap var(--transition-fast);
        }
        .text-link:hover { gap: 0.5rem; }

        /* ── Intro ── */
        .intro-section {
          padding: 5rem 0;
        }
        .intro-grid {
          display: grid;
          grid-template-columns: 1fr 400px;
          gap: 4rem;
          align-items: center;
        }
        .intro-text h2 {
          font-family: var(--font-heading);
          font-size: 2.5rem;
          margin-bottom: 1.5rem;
        }
        .intro-text p {
          font-size: 1.05rem;
          color: var(--text-secondary);
          margin-bottom: 1rem;
        }
        .intro-image img {
          border-radius: var(--radius-lg);
          box-shadow: var(--shadow-lg);
          width: 100%;
          height: 500px;
          object-fit: cover;
        }

        /* ── Categories ── */
        .categories-section {
          background: var(--bg-secondary);
          padding: 4rem 0;
        }
        .section-title {
          font-family: var(--font-heading);
          font-size: 2rem;
          margin-bottom: 2rem;
          color: var(--text-primary);
        }
        .categories-grid {
          display: grid;
          grid-template-columns: repeat(6, 1fr);
          gap: 1rem;
        }
        .category-card {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.5rem;
          padding: 1.5rem 1rem;
          background: var(--bg-card);
          border-radius: var(--radius-lg);
          border: 1px solid var(--border-light);
          text-decoration: none;
          transition: all var(--transition-base);
          text-align: center;
        }
        .category-card:hover {
          border-color: var(--accent);
          transform: translateY(-3px);
          box-shadow: var(--shadow-md);
        }
        .cat-icon {
          font-size: 1.5rem;
          color: var(--accent);
        }
        .cat-label {
          font-family: var(--font-ui);
          font-size: 0.78rem;
          font-weight: 600;
          color: var(--text-secondary);
          letter-spacing: 0.02em;
        }

        /* ── Featured / Recent ── */
        .featured-section, .recent-section {
          padding: 4rem 0;
        }
        .section-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 2rem;
        }
        .section-header .section-title { margin-bottom: 0; }
        .see-all {
          font-family: var(--font-ui);
          font-size: 0.875rem;
          font-weight: 600;
          color: var(--accent-blue);
          text-decoration: none;
        }
        .see-all:hover { text-decoration: underline; }
        .articles-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1.5rem;
        }

        /* ── Quiz Teaser ── */
        .quiz-teaser-section {
          background: linear-gradient(135deg, var(--bg-dark) 0%, var(--bg-dark-secondary) 100%);
          padding: 5rem 0;
        }
        .quiz-teaser-inner {
          display: grid;
          grid-template-columns: 1fr 300px;
          gap: 4rem;
          align-items: center;
        }
        .quiz-eyebrow {
          display: block;
          font-family: var(--font-ui);
          font-size: 0.75rem;
          font-weight: 600;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          color: var(--accent);
          margin-bottom: 1rem;
        }
        .quiz-teaser-content h2 {
          font-family: var(--font-heading);
          font-size: 2.5rem;
          color: var(--text-on-dark);
          margin-bottom: 1rem;
        }
        .quiz-teaser-content p {
          color: rgba(245, 240, 250, 0.75);
          font-size: 1.05rem;
          margin-bottom: 2rem;
          line-height: 1.7;
        }
        .quiz-visual-orb {
          width: 200px;
          height: 200px;
          border-radius: 50%;
          background: radial-gradient(circle at 35% 35%, rgba(201, 168, 76, 0.3), rgba(91, 141, 184, 0.1));
          border: 1px solid rgba(201, 168, 76, 0.3);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 4rem;
          color: var(--accent);
          animation: orbPulse 4s ease-in-out infinite;
          margin: 0 auto;
          box-shadow: 0 0 60px rgba(201, 168, 76, 0.15), inset 0 0 40px rgba(91, 141, 184, 0.1);
        }
        @keyframes orbPulse {
          0%, 100% { transform: scale(1); box-shadow: 0 0 60px rgba(201, 168, 76, 0.15); }
          50% { transform: scale(1.05); box-shadow: 0 0 80px rgba(201, 168, 76, 0.25); }
        }

        /* ── Toolkit ── */
        .toolkit-teaser {
          padding: 4rem 0;
        }
        .toolkit-inner {
          background: var(--bg-secondary);
          border-radius: var(--radius-xl);
          padding: 3rem;
          border: 1px solid var(--border);
          text-align: center;
          max-width: 640px;
          margin: 0 auto;
        }
        .toolkit-inner h2 {
          font-family: var(--font-heading);
          font-size: 2rem;
          margin-bottom: 1rem;
        }
        .toolkit-inner p {
          color: var(--text-secondary);
          margin-bottom: 1.5rem;
          font-size: 1.05rem;
        }

        /* ── Responsive ── */
        @media (max-width: 1024px) {
          .categories-grid { grid-template-columns: repeat(3, 1fr); }
          .articles-grid { grid-template-columns: repeat(2, 1fr); }
          .intro-grid { grid-template-columns: 1fr; }
          .intro-image { display: none; }
        }
        @media (max-width: 768px) {
          .hero-section { min-height: 80vh; }
          .categories-grid { grid-template-columns: repeat(2, 1fr); }
          .articles-grid { grid-template-columns: 1fr; }
          .quiz-teaser-inner { grid-template-columns: 1fr; }
          .quiz-teaser-visual { display: none; }
          .hero-actions { flex-direction: column; }
          .hero-actions .btn { width: 100%; text-align: center; }
        }
      `}</style>
    </div>
  );
}
