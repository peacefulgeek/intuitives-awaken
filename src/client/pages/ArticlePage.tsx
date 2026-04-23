import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';

const BUNNY = 'https://intuitives-awaken.b-cdn.net';
const FALLBACK_IMAGE = `${BUNNY}/images/articles/default-hero.webp`;

interface Article {
  id: number;
  slug: string;
  title: string;
  meta_description: string;
  category: string;
  body: string;
  image_url: string;
  image_alt: string;
  reading_time: number;
  author: string;
  published_at: string;
  word_count: number;
  tags: string[];
}

function formatDate(dateStr?: string): string {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric'
  });
}

export default function ArticlePage() {
  const { slug } = useParams<{ slug: string }>();
  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    setNotFound(false);
    fetch(`/api/articles/${slug}`)
      .then(r => {
        if (r.status === 404) { setNotFound(true); setLoading(false); return null; }
        return r.json();
      })
      .then(data => {
        if (data) {
          setArticle(data.article);
          setLoading(false);
        }
      })
      .catch(() => { setNotFound(true); setLoading(false); });
  }, [slug]);

  if (loading) {
    return (
      <div className="article-page">
        <div className="container content-width">
          <div className="article-skeleton">
            <div className="skel skel-hero" />
            <div className="skel skel-title" />
            <div className="skel skel-text" />
            <div className="skel skel-text short" />
            <div className="skel skel-text" />
          </div>
        </div>
      </div>
    );
  }

  if (notFound || !article) {
    return (
      <div className="article-page">
        <div className="container content-width" style={{ padding: '4rem 0', textAlign: 'center' }}>
          <h1>Article Not Found</h1>
          <p>This article doesn't exist or has been removed.</p>
          <Link to="/articles" className="btn btn-primary" style={{ marginTop: '1.5rem', display: 'inline-flex' }}>
            Browse All Articles
          </Link>
        </div>
      </div>
    );
  }

  const imgSrc = article.image_url || FALLBACK_IMAGE;

  return (
    <article className="article-page">
      {/* Hero */}
      <div className="article-hero">
        <img
          src={imgSrc}
          alt={article.image_alt || article.title}
          className="article-hero-img"
          width="1200"
          height="600"
          onError={(e) => {
            const t = e.target as HTMLImageElement;
            if (t.src !== FALLBACK_IMAGE) t.src = FALLBACK_IMAGE;
          }}
        />
        <div className="article-hero-overlay" />
        <div className="article-hero-content container">
          {article.category && (
            <Link to={`/articles?category=${article.category}`} className="article-category-badge">
              {article.category.replace(/-/g, ' ')}
            </Link>
          )}
          <h1 className="article-title">{article.title}</h1>
          <div className="article-meta">
            <span className="article-author">By {article.author}</span>
            {article.published_at && (
              <time dateTime={article.published_at}>{formatDate(article.published_at)}</time>
            )}
            {article.reading_time && (
              <span>{article.reading_time} min read</span>
            )}
            {article.word_count && (
              <span>{article.word_count.toLocaleString()} words</span>
            )}
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="article-body-wrap container">
        <div
          className="article-body content-width"
          dangerouslySetInnerHTML={{ __html: article.body }}
        />

        {/* Tags */}
        {article.tags && article.tags.length > 0 && (
          <div className="article-tags content-width">
            {article.tags.map(tag => (
              <span key={tag} className="article-tag">{tag.replace(/-/g, ' ')}</span>
            ))}
          </div>
        )}

        {/* Back link */}
        <div className="article-back content-width">
          <Link to="/articles" className="text-link">← Back to all articles</Link>
        </div>
      </div>

      <style>{`
        .article-page { padding-bottom: 4rem; }
        .article-hero {
          position: relative;
          height: 60vh;
          min-height: 400px;
          max-height: 600px;
          overflow: hidden;
          display: flex;
          align-items: flex-end;
        }
        .article-hero-img {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .article-hero-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(
            to top,
            rgba(26, 15, 46, 0.95) 0%,
            rgba(26, 15, 46, 0.5) 50%,
            rgba(26, 15, 46, 0.1) 100%
          );
        }
        .article-hero-content {
          position: relative;
          z-index: 1;
          padding-bottom: 2.5rem;
          max-width: 800px;
        }
        .article-category-badge {
          display: inline-block;
          background: var(--accent);
          color: #1A0F2E;
          font-family: var(--font-ui);
          font-size: 0.7rem;
          font-weight: 700;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          padding: 0.3rem 0.75rem;
          border-radius: var(--radius-full);
          text-decoration: none;
          margin-bottom: 1rem;
        }
        .article-title {
          font-family: var(--font-heading);
          font-size: clamp(1.75rem, 4vw, 3rem);
          color: #FFFFFF;
          line-height: 1.15;
          margin-bottom: 1rem;
          text-shadow: 0 2px 10px rgba(0,0,0,0.3);
        }
        .article-meta {
          display: flex;
          flex-wrap: wrap;
          gap: 1rem;
          font-family: var(--font-ui);
          font-size: 0.8rem;
          color: rgba(245, 240, 250, 0.7);
        }
        .article-author { color: var(--accent); font-weight: 600; }
        .article-body-wrap { padding-top: 3rem; }
        .article-body {
          font-size: var(--body-font-size-desktop);
          line-height: var(--line-height-body);
          color: var(--text-primary);
        }
        .article-body h2 {
          font-family: var(--font-heading);
          font-size: 1.75rem;
          margin: 2.5rem 0 1rem;
          color: var(--text-primary);
        }
        .article-body h3 {
          font-family: var(--font-heading);
          font-size: 1.35rem;
          margin: 2rem 0 0.75rem;
          color: var(--text-secondary);
        }
        .article-body p { margin-bottom: 1.25rem; }
        .article-body a {
          color: var(--accent-blue);
          text-decoration: underline;
          text-underline-offset: 3px;
        }
        .article-body a[rel*="sponsored"] {
          color: var(--accent);
          font-weight: 500;
        }
        .article-body ul, .article-body ol {
          margin-bottom: 1.25rem;
          padding-left: 1.5rem;
        }
        .article-body li { margin-bottom: 0.5rem; }
        .article-body blockquote {
          border-left: 3px solid var(--accent);
          padding: 1rem 1.5rem;
          margin: 2rem 0;
          background: var(--bg-secondary);
          border-radius: 0 var(--radius-md) var(--radius-md) 0;
          font-style: italic;
          font-size: 1.1em;
          color: var(--text-secondary);
        }
        .article-body .auto-affiliates {
          background: var(--bg-secondary);
          border: 1px solid var(--border);
          border-radius: var(--radius-lg);
          padding: 2rem;
          margin: 3rem 0;
        }
        .article-body .auto-affiliates h3 {
          color: var(--accent);
          margin-top: 0;
          margin-bottom: 1rem;
          font-size: 1.25rem;
        }
        .article-body .auto-affiliates ul {
          list-style: none;
          padding: 0;
        }
        .article-body .auto-affiliates li {
          padding: 0.5rem 0;
          border-bottom: 1px solid var(--border-light);
        }
        .article-body .auto-affiliates li:last-child { border-bottom: none; }
        .article-body .affiliate-disclosure {
          font-size: 0.78rem;
          color: var(--text-muted);
          margin-top: 1rem;
          font-style: italic;
        }
        .article-body .mantra {
          text-align: center;
          font-style: italic;
          color: var(--accent);
          font-family: var(--font-heading);
          font-size: 1.1rem;
          margin: 2rem 0;
          opacity: 0.85;
        }
        .article-tags {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
          margin-top: 2.5rem;
          padding-top: 2rem;
          border-top: 1px solid var(--border-light);
        }
        .article-tag {
          font-family: var(--font-ui);
          font-size: 0.75rem;
          padding: 0.25rem 0.75rem;
          background: var(--bg-secondary);
          border-radius: var(--radius-full);
          color: var(--text-muted);
          text-transform: capitalize;
        }
        .article-back {
          margin-top: 2rem;
          padding-top: 1.5rem;
          border-top: 1px solid var(--border-light);
        }
        .text-link {
          font-family: var(--font-ui);
          font-size: 0.9rem;
          font-weight: 600;
          color: var(--accent-blue);
          text-decoration: none;
        }
        .text-link:hover { text-decoration: underline; }

        /* Skeleton */
        .article-skeleton { padding: 2rem 0; }
        .skel {
          background: linear-gradient(90deg, var(--bg-secondary) 25%, var(--bg-card) 50%, var(--bg-secondary) 75%);
          background-size: 200% 100%;
          animation: shimmer 1.5s infinite;
          border-radius: var(--radius-md);
          margin-bottom: 1rem;
        }
        .skel-hero { height: 400px; border-radius: var(--radius-lg); }
        .skel-title { height: 48px; width: 80%; }
        .skel-text { height: 20px; }
        .skel-text.short { width: 60%; }

        @media (max-width: 768px) {
          .article-hero { height: 50vh; }
          .article-body { font-size: var(--body-font-size-mobile); }
        }
      `}</style>
    </article>
  );
}
