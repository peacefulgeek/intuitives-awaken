import express from 'express';
import {
  getPublishedPaginated,
  getPublishedByCategory,
  getArticleBySlug,
} from '../db.js';

export const articlesRouter = express.Router();

// GET /api/articles — list published articles (paginated)
articlesRouter.get('/', (req, res) => {
  try {
    const limit = Math.min(parseInt(String(req.query.limit || '50'), 10), 200);
    const page = Math.max(parseInt(String(req.query.page || '1'), 10), 1);
    const { articles, total } = getPublishedPaginated(page, limit);
    res.json({ articles, total });
  } catch (err) {
    console.error('[articles] list error', err);
    res.status(500).json({ error: 'Failed to load articles' });
  }
});

// GET /api/articles/category/:category — MUST be before /:slug
articlesRouter.get('/category/:category', (req, res) => {
  try {
    const articles = getPublishedByCategory(req.params.category);
    res.json({ articles });
  } catch (err) {
    console.error('[articles] category error', err);
    res.status(500).json({ error: 'Failed to load articles' });
  }
});

// GET /api/articles/:slug — single article with full body
articlesRouter.get('/:slug', (req, res) => {
  try {
    const article = getArticleBySlug(req.params.slug);
    if (!article) return res.status(404).json({ error: 'Not found' });
    res.json({ article });
  } catch (err) {
    console.error('[articles] get error', err);
    res.status(500).json({ error: 'Failed to load article' });
  }
});
