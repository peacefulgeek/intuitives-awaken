/**
 * Flat-file JSON data layer for intuitives-awaken.
 * No database. No DATABASE_URL. Articles live in src/data/articles/*.json
 * Index lives in src/data/articles-index.json
 */
import fs from 'fs';
import path from 'path';

// Resolve data directory — works in both dev (src/) and prod (dist/ with copied data)
const DATA_DIR = path.resolve(process.cwd(), 'src/data/articles');
const INDEX_FILE = path.resolve(process.cwd(), 'src/data/articles-index.json');

export interface ArticleIndex {
  slug: string;
  title: string;
  meta_description: string;
  category: string;
  tags: string[];
  image_url: string;
  image_alt: string;
  reading_time: number;
  author: string;
  status: 'queued' | 'published' | 'archived';
  published_at: string | null;
  queued_at: string | null;
  word_count: number;
}

export interface Article extends ArticleIndex {
  id: number;
  og_title?: string;
  og_description?: string;
  body: string;
  asins_used?: string[];
  last_refreshed_30d?: string | null;
  last_refreshed_90d?: string | null;
  opener_type?: string;
  conclusion_type?: string;
  updated_at?: string;
}

function readIndex(): ArticleIndex[] {
  if (!fs.existsSync(INDEX_FILE)) return [];
  return JSON.parse(fs.readFileSync(INDEX_FILE, 'utf8'));
}

function writeIndex(index: ArticleIndex[]): void {
  fs.writeFileSync(INDEX_FILE, JSON.stringify(index, null, 2));
}

function articlePath(slug: string): string {
  return path.join(DATA_DIR, `${slug}.json`);
}

function readArticle(slug: string): Article | null {
  const p = articlePath(slug);
  if (!fs.existsSync(p)) return null;
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

function writeArticle(article: Article): void {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(articlePath(article.slug), JSON.stringify(article, null, 2));
}

export async function initDb(): Promise<void> {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(INDEX_FILE)) fs.writeFileSync(INDEX_FILE, '[]');
  console.log('[db] Flat-file JSON data layer ready');
}

export function getPublishedIndex(): ArticleIndex[] {
  return readIndex()
    .filter(a => a.status === 'published')
    .sort((a, b) => {
      const da = a.published_at ? new Date(a.published_at).getTime() : 0;
      const db = b.published_at ? new Date(b.published_at).getTime() : 0;
      return db - da;
    });
}

export function getPublishedByCategory(category: string): ArticleIndex[] {
  return getPublishedIndex().filter(a => a.category === category);
}

export function getArticleBySlug(slug: string): Article | null {
  const article = readArticle(slug);
  if (!article || article.status !== 'published') return null;
  return article;
}

export function getPublishedSlugs(): string[] {
  return readIndex().filter(a => a.status === 'published').map(a => a.slug);
}

export function getPublishedPaginated(page: number, limit: number): { articles: ArticleIndex[]; total: number } {
  const all = getPublishedIndex();
  return { articles: all.slice((page - 1) * limit, page * limit), total: all.length };
}

export function getNextQueued(): Article | null {
  const queued = readIndex()
    .filter(a => a.status === 'queued')
    .sort((a, b) => {
      const da = a.queued_at ? new Date(a.queued_at).getTime() : 0;
      const db = b.queued_at ? new Date(b.queued_at).getTime() : 0;
      return da - db;
    });
  if (!queued.length) return null;
  return readArticle(queued[0].slug);
}

export function countPublished(): number {
  return readIndex().filter(a => a.status === 'published').length;
}

export function countQueued(): number {
  return readIndex().filter(a => a.status === 'queued').length;
}

export function storeArticle(article: Omit<Article, 'id'>): void {
  const index = readIndex();
  const existing = index.findIndex(a => a.slug === article.slug);
  const id = existing >= 0 ? (readArticle(article.slug) as any)?.id || Date.now() : Date.now();
  const full: Article = { id, ...article } as Article;
  writeArticle(full);
  const entry: ArticleIndex = {
    slug: full.slug, title: full.title,
    meta_description: full.meta_description || '',
    category: full.category || '', tags: full.tags || [],
    image_url: full.image_url || '', image_alt: full.image_alt || '',
    reading_time: full.reading_time || 8, author: full.author || 'Kalesh',
    status: full.status || 'queued',
    published_at: full.published_at || null,
    queued_at: full.queued_at || new Date().toISOString(),
    word_count: full.word_count || 0,
  };
  if (existing >= 0) index[existing] = entry; else index.push(entry);
  writeIndex(index);
}

export function publishArticle(slug: string): boolean {
  const article = readArticle(slug);
  if (!article) return false;
  article.status = 'published';
  article.published_at = new Date().toISOString();
  writeArticle(article);
  const index = readIndex();
  const i = index.findIndex(a => a.slug === slug);
  if (i >= 0) { index[i].status = 'published'; index[i].published_at = article.published_at; writeIndex(index); }
  return true;
}

export function updateArticleBody(slug: string, body: string, wordCount: number, asins: string[]): void {
  const article = readArticle(slug);
  if (!article) return;
  article.body = body; article.word_count = wordCount;
  article.asins_used = asins; article.updated_at = new Date().toISOString();
  writeArticle(article);
  const index = readIndex();
  const i = index.findIndex(a => a.slug === slug);
  if (i >= 0) { index[i].word_count = wordCount; writeIndex(index); }
}

export function getArticlesForMonthlyRefresh(limit = 5): Article[] {
  const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  return readIndex()
    .filter(a => a.status === 'published')
    .map(a => readArticle(a.slug)!)
    .filter(a => a && (!a.last_refreshed_30d || a.last_refreshed_30d < cutoff))
    .slice(0, limit);
}

export function getArticlesForQuarterlyRefresh(limit = 3): Article[] {
  const cutoff = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();
  return readIndex()
    .filter(a => a.status === 'published')
    .map(a => readArticle(a.slug)!)
    .filter(a => a && (!a.last_refreshed_90d || a.last_refreshed_90d < cutoff))
    .slice(0, limit);
}

export function markRefreshed30d(slug: string): void {
  const a = readArticle(slug); if (!a) return;
  a.last_refreshed_30d = new Date().toISOString(); writeArticle(a);
}

export function markRefreshed90d(slug: string): void {
  const a = readArticle(slug); if (!a) return;
  a.last_refreshed_90d = new Date().toISOString(); writeArticle(a);
}

export function getArticlesWithAsins(asins: string[]): Article[] {
  return readIndex()
    .filter(a => a.status === 'published')
    .map(a => readArticle(a.slug)!)
    .filter(a => a?.asins_used?.some(asin => asins.includes(asin)));
}

/** No-op — kept for legacy compatibility */
export function getDb(): null { return null; }
