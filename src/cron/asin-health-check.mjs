import { verifyAsinBatch } from '../lib/amazon-verify.mjs';
import { query } from '../lib/db.mjs';
import fs from 'fs/promises';
import path from 'path';

const CACHE_PATH = path.resolve('src/data/verified-asins.json');

export async function runAsinHealthCheck() {
  console.log('[asin-health-check] Starting weekly sweep');
  const cache = JSON.parse(await fs.readFile(CACHE_PATH, 'utf8'));
  const asins = Object.keys(cache.asins);
  if (asins.length === 0) {
    console.log('[asin-health-check] Empty catalog - nothing to check');
    return { checked: 0, invalidated: 0 };
  }

  console.log(`[asin-health-check] Checking ${asins.length} ASINs`);
  const results = await verifyAsinBatch(asins, {
    delayMs: 2500,
    onProgress: (done, total) => {
      if (done % 25 === 0) console.log(`[asin-health-check] ${done}/${total}`);
    }
  });

  const now = new Date().toISOString();
  let invalidated = 0;
  const deadAsins = [];

  for (const r of results) {
    const existing = cache.asins[r.asin];
    if (r.valid) {
      existing.lastChecked = now;
      existing.status = 'valid';
      if (r.title) existing.title = r.title;
    } else {
      deadAsins.push(r.asin);
      delete cache.asins[r.asin];
      cache.failed[r.asin] = {
        reason: r.reason,
        lastAttempted: now,
        attempts: (cache.failed[r.asin]?.attempts || 0) + 1
      };
      invalidated++;
      console.warn(`[asin-health-check] INVALIDATED ${r.asin}: ${r.reason}`);
    }
  }

  cache.lastUpdated = now;
  await fs.writeFile(CACHE_PATH, JSON.stringify(cache, null, 2));
  console.log(`[asin-health-check] Invalidated ${invalidated} ASINs`);

  if (deadAsins.length > 0) {
    await swapDeadAsinsAcrossArticles(deadAsins, cache);
  }

  return { checked: asins.length, invalidated };
}

async function swapDeadAsinsAcrossArticles(deadAsins, cache) {
  const { matchProducts } = await import('../lib/match-products.mjs');
  const { buildAmazonUrl, countAmazonLinks, extractAsinsFromText } = await import('../lib/amazon-verify.mjs');

  const { rows: articles } = await query(`
    SELECT id, slug, body, category, tags, asins_used FROM articles
    WHERE asins_used && $1::text[]
  `, [deadAsins]);

  console.log(`[asin-health-check] Swapping dead ASINs in ${articles.length} articles`);

  const catalog = Object.entries(cache.asins).map(([asin, entry]) => ({
    asin, name: entry.title, category: entry.category || '', tags: entry.tags || []
  }));

  for (const article of articles) {
    let body = article.body;

    for (const dead of deadAsins) {
      const re = new RegExp(
        `<a[^>]*href="[^"]*\\/dp\\/${dead}[^"]*"[^>]*>.*?</a>\\s*(?:\\(paid link\\))?`,
        'gi'
      );
      body = body.replace(re, '');
    }

    const needed = Math.max(0, 3 - countAmazonLinks(body));
    if (needed > 0) {
      const picks = matchProducts({
        articleTitle: article.slug,
        articleTags: article.tags || [],
        articleCategory: article.category,
        catalog,
        minLinks: 3,
        maxLinks: 4
      });
      const existing = new Set(extractAsinsFromText(body));
      const toAdd = picks.filter(p => !existing.has(p.asin)).slice(0, needed);
      body += '\n' + toAdd.map(p =>
        `<p>A helpful option here is <a href="${buildAmazonUrl(p.asin)}" target="_blank" rel="nofollow sponsored noopener">${p.name}</a> (paid link).</p>`
      ).join('\n');
    }

    await query(
      'UPDATE articles SET body = $1, asins_used = $2, updated_at = NOW() WHERE id = $3',
      [body, extractAsinsFromText(body), article.id]
    );
    await new Promise(r => setTimeout(r, 200));
  }
}
