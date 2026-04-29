import express from 'express';
import { getDb } from '../db.js';

export const sitemapRouter = express.Router();

const DOMAIN = 'https://intuitivesawaken.com';

sitemapRouter.get('/', async (_req, res) => {
  try {
    const db = getDb();
    const { rows } = await db.query(`
      SELECT slug, published_at, updated_at
      FROM articles
      WHERE status = 'published'
      ORDER BY published_at DESC
    `);

    const staticPages = [
      { url: '/', priority: '1.0', changefreq: 'weekly' },
      { url: '/about', priority: '0.8', changefreq: 'monthly' },
      { url: '/tools', priority: '0.8', changefreq: 'monthly' },
      { url: '/quiz', priority: '0.9', changefreq: 'monthly' },
      { url: '/assessment', priority: '0.9', changefreq: 'monthly' },
    ];

    const urls = [
      ...staticPages.map(p => `
  <url>
    <loc>${DOMAIN}${p.url}</loc>
    <changefreq>${p.changefreq}</changefreq>
    <priority>${p.priority}</priority>
  </url>`),
      ...rows.map(a => `
  <url>
    <loc>${DOMAIN}/articles/${a.slug}</loc>
    <lastmod>${new Date(a.updated_at || a.published_at).toISOString().split('T')[0]}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>`)
    ].join('');

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`;

    res.set('Content-Type', 'application/xml').send(xml);
  } catch (err) {
    console.error('[sitemap] error', err);
    res.status(500).send('Sitemap error');
  }
});
