/**
 * Cron Host + Server Launcher
 * 
 * Phase 1 (published < 60): Article generation runs 5x/day
 *   07:00, 10:00, 13:00, 16:00, 19:00 UTC
 * Phase 2 (published >= 60): Article generation runs 1x/weekday
 *   08:00 UTC Mon-Fri
 * 
 * Other crons:
 * - Product spotlight: Saturdays 08:00 UTC
 * - Monthly refresh: 1st of month 03:00 UTC
 * - Quarterly refresh: Jan/Apr/Jul/Oct 1st 04:00 UTC
 * - ASIN health check: Sundays 05:00 UTC
 */
import cron from 'node-cron';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import pg from 'pg';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = resolve(__dirname, '..');

// ─── Start web server as child process ────────────────────────
const server = spawn('node', ['dist/index.js'], {
  cwd: projectRoot,
  stdio: 'inherit',
  env: { ...process.env }
});

server.on('exit', (code, signal) => {
  console.error(`[cron-host] Server exited code=${code} signal=${signal}`);
  process.exit(code ?? 1);
});

process.on('SIGTERM', () => {
  console.log('[cron-host] SIGTERM received, shutting down');
  server.kill('SIGTERM');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('[cron-host] SIGINT received, shutting down');
  server.kill('SIGINT');
  process.exit(0);
});

// ─── Phase detection ─────────────────────────────────────────
async function getPublishedCount() {
  if (!process.env.DATABASE_URL) return 0;
  const { Pool } = pg;
  const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
  try {
    const { rows } = await pool.query("SELECT COUNT(*) FROM articles WHERE status = 'published'");
    return parseInt(rows[0].count, 10);
  } catch { return 0; } finally { await pool.end(); }
}

// ─── Cron schedules (all UTC) ─────────────────────────────────
const AUTO_GEN = process.env.AUTO_GEN_ENABLED === 'true';

if (AUTO_GEN) {
  console.log('[cron-host] AUTO_GEN_ENABLED — scheduling all crons');

  // Phase 1: 5x/day — 07, 10, 13, 16, 19 UTC (runs when published < 60)
  cron.schedule('0 7,10,13,16,19 * * *', async () => {
    const count = await getPublishedCount();
    if (count >= 60) {
      console.log(`[cron-1] Phase 2 active (${count} published) — skipping midday runs`);
      return;
    }
    console.log(`[cron-1] Phase 1 (${count} published) — generating article`);
    try {
      const { runGenerateArticle } = await import('../src/cron/generate-article.mjs');
      await runGenerateArticle();
    } catch (err) { console.error('[cron-1] Error:', err.message); }
  });

  // Phase 2: 1x/weekday — 08:00 UTC Mon-Fri (runs when published >= 60)
  cron.schedule('0 8 * * 1-5', async () => {
    const count = await getPublishedCount();
    if (count < 60) {
      console.log(`[cron-2] Phase 1 active (${count} published) — 08:00 run handled by 5x/day cron`);
      return;
    }
    console.log(`[cron-2] Phase 2 (${count} published) — generating article`);
    try {
      const { runGenerateArticle } = await import('../src/cron/generate-article.mjs');
      await runGenerateArticle();
    } catch (err) { console.error('[cron-2] Error:', err.message); }
  });

  // Product spotlight — Saturdays 08:00 UTC
  cron.schedule('0 8 * * 6', async () => {
    console.log('[cron-3] Generating product spotlight');
    try {
      const { runProductSpotlight } = await import('../src/cron/product-spotlight.mjs');
      await runProductSpotlight();
    } catch (err) { console.error('[cron-3] Error:', err.message); }
  });

  // Monthly refresh — 1st of month 03:00 UTC
  cron.schedule('0 3 1 * *', async () => {
    console.log('[cron-4] Running monthly refresh');
    try {
      const { runMonthlyRefresh } = await import('../src/cron/refresh-monthly.mjs');
      await runMonthlyRefresh();
    } catch (err) { console.error('[cron-4] Error:', err.message); }
  });

  // Quarterly refresh — Jan/Apr/Jul/Oct 1st 04:00 UTC
  cron.schedule('0 4 1 1,4,7,10 *', async () => {
    console.log('[cron-5] Running quarterly refresh');
    try {
      const { runQuarterlyRefresh } = await import('../src/cron/refresh-quarterly.mjs');
      await runQuarterlyRefresh();
    } catch (err) { console.error('[cron-5] Error:', err.message); }
  });

  // ASIN health check — Sundays 05:00 UTC
  cron.schedule('0 5 * * 0', async () => {
    console.log('[cron-6] Running ASIN health check');
    try {
      const { runAsinHealthCheck } = await import('../src/cron/asin-health-check.mjs');
      await runAsinHealthCheck();
    } catch (err) { console.error('[cron-6] Error:', err.message); }
  });

} else {
  console.log('[cron-host] AUTO_GEN_ENABLED is not true — crons disabled');
}

console.log('[cron-host] All crons registered, server starting...');
