import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import ArticleCard from '../components/ArticleCard';

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
  { key: '', label: 'All Articles' },
  { key: 'psychic-development', label: 'Psychic Development' },
  { key: 'intuition', label: 'Intuition' },
  { key: 'empath', label: 'Empath' },
  { key: 'grounding', label: 'Grounding' },
  { key: 'nervous-system', label: 'Nervous System' },
  { key: 'science', label: 'The Science' },
  { key: 'product-spotlight', label: "The Sensitive's Toolkit" },
];

export default function ArticlesListPage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchParams, setSearchParams] = useSearchParams();
  const activeCategory = searchParams.get('category') || '';

  useEffect(() => {
    setLoading(true);
    const url = activeCategory
      ? `/api/articles/category/${activeCategory}`
      : '/api/articles';
    fetch(url)
      .then(r => r.json())
      .then(data => {
        setArticles(data.articles || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [activeCategory]);

  return (
    <div className="articles-list-page">
      <div className="page-header">
        <div className="container">
          <h1>Articles</h1>
          <p>Grounded writing on psychic development, intuitive awakening, and empathic sensitivity.</p>
        </div>
      </div>

      <div className="container">
        <div className="category-filter">
          {CATEGORIES.map(cat => (
            <button
              key={cat.key}
              className={`filter-btn ${activeCategory === cat.key ? 'active' : ''}`}
              onClick={() => setSearchParams(cat.key ? { category: cat.key } : {})}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="loading-state">
            <div className="loading-grid">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="skeleton-card" />
              ))}
            </div>
          </div>
        ) : articles.length === 0 ? (
          <div className="empty-state">
            <p>No articles found. Check back soon.</p>
          </div>
        ) : (
          <div className="articles-grid">
            {articles.map((article, i) => (
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
                featured={i === 0 && !activeCategory}
              />
            ))}
          </div>
        )}
      </div>

      <style>{`
        .articles-list-page { padding-bottom: 4rem; }
        .page-header {
          background: linear-gradient(135deg, var(--bg-dark) 0%, var(--bg-dark-secondary) 100%);
          padding: 4rem 0;
          margin-bottom: 3rem;
        }
        .page-header h1 {
          font-family: var(--font-heading);
          font-size: 3rem;
          color: var(--text-on-dark);
          margin-bottom: 0.75rem;
        }
        .page-header p {
          color: rgba(245, 240, 250, 0.7);
          font-size: 1.1rem;
          max-width: 560px;
        }
        .category-filter {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
          margin-bottom: 2.5rem;
        }
        .filter-btn {
          font-family: var(--font-ui);
          font-size: 0.8rem;
          font-weight: 600;
          padding: 0.4rem 1rem;
          border-radius: var(--radius-full);
          border: 1px solid var(--border);
          background: var(--bg-card);
          color: var(--text-secondary);
          cursor: pointer;
          transition: all var(--transition-fast);
          min-height: var(--tap-target-min);
        }
        .filter-btn:hover {
          border-color: var(--accent);
          color: var(--text-primary);
        }
        .filter-btn.active {
          background: var(--accent);
          border-color: var(--accent);
          color: #1A0F2E;
        }
        .articles-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1.5rem;
        }
        .loading-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1.5rem;
        }
        .skeleton-card {
          height: 360px;
          border-radius: var(--radius-lg);
          background: linear-gradient(90deg, var(--bg-secondary) 25%, var(--bg-card) 50%, var(--bg-secondary) 75%);
          background-size: 200% 100%;
          animation: shimmer 1.5s infinite;
        }
        .empty-state {
          text-align: center;
          padding: 4rem;
          color: var(--text-muted);
        }
        @media (max-width: 1024px) {
          .articles-grid, .loading-grid { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 640px) {
          .articles-grid, .loading-grid { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  );
}
