/**
 * Flat-file JSON data layer for cron scripts (ESM).
 * Mirrors server/db.ts but as .mjs for use by Node cron runners.
 * No pg, no DATABASE_URL, no sqlite. Pure JSON files.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.resolve(__dirname, '../data/articles');
const INDEX_FILE = path.resolve(__dirname, '../data/articles-index.json');

function readIndex() {
  if (!fs.existsSync(INDEX_FILE)) return [];
  return JSON.parse(fs.readFileSync(INDEX_FILE, 'utf8'));
}

function writeIndex(index) {
  fs.writeFileSync(INDEX_FILE, JSON.stringify(index, null, 2));
}

function articlePath(slug) {
  return path.join(DATA_DIR, `${slug}.json`);
}

function readArticle(slug) {
  const p = articlePath(slug);
  if (!fs.existsSync(p)) return null;
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

function writeArticle(article) {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(articlePath(article.slug), JSON.stringify(article, null, 2));
}

export function getNextQueued() {
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

export function countPublished() {
  return readIndex().filter(a => a.status === 'published').length;
}

export function countQueued() {
  return readIndex().filter(a => a.status === 'queued').length;
}

export function storeArticle(article) {
  const index = readIndex();
  const existing = index.findIndex(a => a.slug === article.slug);
  const id = existing >= 0 ? (readArticle(article.slug)?.id || Date.now()) : Date.now();
  const full = { id, ...article };
  writeArticle(full);
  const entry = {
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

export function publishArticle(slug) {
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

export function updateArticleBody(slug, body, wordCount, asins) {
  const article = readArticle(slug);
  if (!article) return;
  article.body = body; article.word_count = wordCount;
  article.asins_used = asins; article.updated_at = new Date().toISOString();
  writeArticle(article);
  const index = readIndex();
  const i = index.findIndex(a => a.slug === slug);
  if (i >= 0) { index[i].word_count = wordCount; writeIndex(index); }
}

export function getArticlesForMonthlyRefresh(limit = 5) {
  const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  return readIndex()
    .filter(a => a.status === 'published')
    .map(a => readArticle(a.slug))
    .filter(a => a && (!a.last_refreshed_30d || a.last_refreshed_30d < cutoff))
    .slice(0, limit);
}

export function getArticlesForQuarterlyRefresh(limit = 3) {
  const cutoff = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();
  return readIndex()
    .filter(a => a.status === 'published')
    .map(a => readArticle(a.slug))
    .filter(a => a && (!a.last_refreshed_90d || a.last_refreshed_90d < cutoff))
    .slice(0, limit);
}

export function markRefreshed30d(slug) {
  const a = readArticle(slug); if (!a) return;
  a.last_refreshed_30d = new Date().toISOString(); writeArticle(a);
}

export function markRefreshed90d(slug) {
  const a = readArticle(slug); if (!a) return;
  a.last_refreshed_90d = new Date().toISOString(); writeArticle(a);
}

export function getArticlesWithAsins(asins) {
  return readIndex()
    .filter(a => a.status === 'published')
    .map(a => readArticle(a.slug))
    .filter(a => a?.asins_used?.some(asin => asins.includes(asin)));
}

/** Legacy no-op query stub — kept so old imports don't crash */
export function query() { return { rows: [], rowCount: 0 }; }
