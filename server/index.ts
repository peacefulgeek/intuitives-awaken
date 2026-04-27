import express from 'express';
import compression from 'compression';
import serveStatic from 'serve-static';
import path from 'path';
import { fileURLToPath } from 'url';
import { healthRouter } from './routes/health.js';
import { articlesRouter } from './routes/articles.js';
import { sitemapRouter } from './routes/sitemap.js';
import { renderPage } from './ssr.js';
import { initDb } from './db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const isDev = process.env.NODE_ENV !== 'production';
const PORT = parseInt(process.env.PORT ?? '3000', 10);

async function createServer() {
  const app = express();
  app.use(compression());
  app.disable('x-powered-by');
  app.set('trust proxy', 1);
  app.use(express.json());

  // Health check FIRST — must work even if other routes fail
  app.use('/health', healthRouter);

  // www → non-www 301 redirect (must be before all other routes)
  // Skipped in dev so localhost works fine
  if (!isDev) {
    app.use((req, res, next) => {
      const host = req.headers.host || '';
      if (host.startsWith('www.')) {
        const bare = host.slice(4); // strip 'www.'
        const proto = req.headers['x-forwarded-proto'] || 'https';
        return res.redirect(301, `${proto}://${bare}${req.originalUrl}`);
      }
      next();
    });
  }

  // API routes
  app.use('/api/articles', articlesRouter);
  app.use('/sitemap.xml', sitemapRouter);

  if (isDev) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'custom'
    });
    app.use(vite.middlewares);
    app.use('*', async (req, res, next) => {
      try {
        const html = await renderPage(req.originalUrl, { vite });
        res.status(200).set({ 'Content-Type': 'text/html' }).end(html);
      } catch (e) { next(e); }
    });
  } else {
    const clientDir = path.resolve(__dirname, '../dist/client');
    app.use(serveStatic(clientDir, {
      index: false,
      maxAge: '1y',
      setHeaders(res, filepath) {
        if (/\.(html)$/.test(filepath)) {
          res.setHeader('Cache-Control', 'no-cache');
        }
      }
    }));
    app.use('*', async (req, res, next) => {
      try {
        const html = await renderPage(req.originalUrl);
        res.status(200).set({ 'Content-Type': 'text/html' }).end(html);
      } catch (e) { next(e); }
    });
  }

  app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error('[server error]', err);
    res.status(500).send('Internal Server Error');
  });

  return app;
}

// Initialize DB then start server
try {
  await initDb();
} catch (err) {
  console.warn('[server] DB init failed (will retry on requests):', err);
}

const app = await createServer();
app.listen(PORT, '0.0.0.0', () => {
  console.log(`[server] Listening on 0.0.0.0:${PORT} (NODE_ENV=${process.env.NODE_ENV})`);
});

export default app;
