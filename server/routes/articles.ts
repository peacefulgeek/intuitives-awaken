import express from 'express';
import { getDb } from '../db.js';

export const articlesRouter = express.Router();

// GET /api/articles — list all published articles
articlesRouter.get('/', async (_req, res) => {
  try {
    const db = getDb();
    const { rows } = await db.query(`
      SELECT id, slug, title, meta_description, category, tags,
             image_url, image_alt, reading_time, author, published_at, word_count
      FROM articles
      WHERE published = true
      ORDER BY published_at DESC
    `);
    res.json({ articles: rows });
  } catch (err) {
    console.error('[articles] list error', err);
    res.status(500).json({ error: 'Failed to load articles' });
  }
});

// GET /api/articles/category/:category — MUST be before /:slug
articlesRouter.get('/category/:category', async (req, res) => {
  try {
    const db = getDb();
    const { rows } = await db.query(`
      SELECT id, slug, title, meta_description, category, tags,
             image_url, image_alt, reading_time, author, published_at, word_count
      FROM articles
      WHERE category = $1 AND published = true
      ORDER BY published_at DESC
    `, [req.params.category]);
    res.json({ articles: rows });
  } catch (err) {
    console.error('[articles] category error', err);
    res.status(500).json({ error: 'Failed to load articles' });
  }
});

// GET /api/articles/:slug — single article
articlesRouter.get('/:slug', async (req, res) => {
  try {
    const db = getDb();
    const { rows } = await db.query(
      `SELECT * FROM articles WHERE slug = $1 AND published = true`,
      [req.params.slug]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Not found' });
    res.json({ article: rows[0] });
  } catch (err) {
    console.error('[articles] get error', err);
    res.status(500).json({ error: 'Failed to load article' });
  }
});


