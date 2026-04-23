import React from 'react';
import { Link } from 'react-router-dom';

const BUNNY = 'https://intuitives-awaken.b-cdn.net';
const FALLBACK_IMAGE = `${BUNNY}/images/articles/default-hero.webp`;

interface ArticleCardProps {
  slug: string;
  title: string;
  metaDescription?: string;
  imageUrl?: string;
  imageAlt?: string;
  category?: string;
  readingTime?: number;
  publishedAt?: string;
  featured?: boolean;
}

function formatDate(dateStr?: string): string {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric'
  });
}

function getCategoryLabel(cat?: string): string {
  const labels: Record<string, string> = {
    'psychic-development': 'Psychic Development',
    'intuition': 'Intuition',
    'empath': 'Empath',
    'clairsentience': 'Clairsentience',
    'grounding': 'Grounding',
    'nervous-system': 'Nervous System',
    'product-spotlight': "The Sensitive's Toolkit",
    'dream-work': 'Dream Work',
    'science': 'Science',
    'ethics': 'Ethics'
  };
  return labels[cat || ''] || 'Article';
}

export default function ArticleCard({
  slug, title, metaDescription, imageUrl, imageAlt, category, readingTime, publishedAt, featured
}: ArticleCardProps) {
  const imgSrc = imageUrl || FALLBACK_IMAGE;
  const imgAlt = imageAlt || title;

  return (
    <article className={`article-card ${featured ? 'featured' : ''}`}>
      <Link to={`/articles/${slug}`} className="card-image-link" tabIndex={-1} aria-hidden="true">
        <div className="card-image-wrap">
          <img
            src={imgSrc}
            alt={imgAlt}
            loading="lazy"
            width="800"
            height="450"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              if (target.src !== FALLBACK_IMAGE) target.src = FALLBACK_IMAGE;
            }}
          />
          {category && (
            <span className="card-category">{getCategoryLabel(category)}</span>
          )}
        </div>
      </Link>
      <div className="card-body">
        <Link to={`/articles/${slug}`} className="card-title-link">
          <h2 className="card-title">{title}</h2>
        </Link>
        {metaDescription && (
          <p className="card-excerpt">{metaDescription}</p>
        )}
        <div className="card-meta">
          {publishedAt && <time dateTime={publishedAt}>{formatDate(publishedAt)}</time>}
          {readingTime && <span>{readingTime} min read</span>}
        </div>
      </div>

      <style>{`
        .article-card {
          background: var(--bg-card);
          border-radius: var(--radius-lg);
          overflow: hidden;
          border: 1px solid var(--border-light);
          transition: all var(--transition-base);
          display: flex;
          flex-direction: column;
        }
        .article-card:hover {
          transform: translateY(-4px);
          box-shadow: var(--shadow-lg);
          border-color: var(--border);
        }
        .article-card.featured {
          grid-column: 1 / -1;
          display: grid;
          grid-template-columns: 1fr 1fr;
        }
        .card-image-wrap {
          position: relative;
          overflow: hidden;
          aspect-ratio: 16/9;
          background: var(--bg-secondary);
        }
        .article-card.featured .card-image-wrap {
          aspect-ratio: auto;
          height: 100%;
        }
        .card-image-wrap img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform var(--transition-slow);
        }
        .article-card:hover .card-image-wrap img {
          transform: scale(1.04);
        }
        .card-category {
          position: absolute;
          top: 0.75rem;
          left: 0.75rem;
          background: var(--accent);
          color: #1A0F2E;
          font-family: var(--font-ui);
          font-size: 0.7rem;
          font-weight: 600;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          padding: 0.25rem 0.6rem;
          border-radius: var(--radius-full);
        }
        .card-image-link { display: block; }
        .card-body {
          padding: 1.5rem;
          display: flex;
          flex-direction: column;
          flex: 1;
          gap: 0.75rem;
        }
        .article-card.featured .card-body {
          padding: 2rem;
          justify-content: center;
        }
        .card-title-link { text-decoration: none; color: inherit; }
        .card-title {
          font-family: var(--font-heading);
          font-size: 1.25rem;
          font-weight: 600;
          line-height: 1.3;
          color: var(--text-primary);
          transition: color var(--transition-fast);
          margin: 0;
        }
        .article-card.featured .card-title {
          font-size: 1.75rem;
        }
        .card-title-link:hover .card-title {
          color: var(--accent-blue);
        }
        .card-excerpt {
          font-size: 0.9rem;
          color: var(--text-secondary);
          line-height: 1.6;
          margin: 0;
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .card-meta {
          display: flex;
          align-items: center;
          gap: 1rem;
          font-family: var(--font-ui);
          font-size: 0.78rem;
          color: var(--text-muted);
          margin-top: auto;
        }
        .card-meta time, .card-meta span {
          display: flex;
          align-items: center;
          gap: 0.25rem;
        }
        @media (max-width: 768px) {
          .article-card.featured {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </article>
  );
}
