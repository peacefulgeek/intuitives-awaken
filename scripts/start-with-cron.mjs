import cron from 'node-cron';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

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

// ─── Cron schedules (all UTC) ─────────────────────────────────
// Only run if AUTO_GEN_ENABLED=true
const AUTO_GEN = process.env.AUTO_GEN_ENABLED === 'true';

if (AUTO_GEN) {
  console.log('[cron-host] AUTO_GEN_ENABLED — scheduling all crons');

  // Cron #1 — New article Mon-Fri 06:00 UTC
  cron.schedule('0 6 * * 1-5', async () => {
    console.log('[cron-1] Generating daily article');
    try {
      const { generateAndStore } = await import('../src/cron/generate-article.mjs');
      await generateAndStore();
    } catch (err) {
      console.error('[cron-1] Error:', err.message);
    }
  });

  // Cron #2 — Product spotlight Saturdays 08:00 UTC
  cron.schedule('0 8 * * 6', async () => {
    console.log('[cron-2] Generating product spotlight');
    try {
      const { runProductSpotlight } = await import('../src/cron/product-spotlight.mjs');
      await runProductSpotlight();
    } catch (err) {
      console.error('[cron-2] Error:', err.message);
    }
  });

  // Cron #3 — Monthly refresh 1st of month 03:00 UTC
  cron.schedule('0 3 1 * *', async () => {
    console.log('[cron-3] Running monthly refresh');
    try {
      const { refreshMonthly } = await import('../src/cron/refresh-monthly.mjs');
      await refreshMonthly();
    } catch (err) {
      console.error('[cron-3] Error:', err.message);
    }
  });

  // Cron #4 — Quarterly refresh Jan/Apr/Jul/Oct 1st 04:00 UTC
  cron.schedule('0 4 1 1,4,7,10 *', async () => {
    console.log('[cron-4] Running quarterly refresh');
    try {
      const { refreshQuarterly } = await import('../src/cron/refresh-quarterly.mjs');
      await refreshQuarterly();
    } catch (err) {
      console.error('[cron-4] Error:', err.message);
    }
  });

  // Cron #5 — ASIN health check Sundays 05:00 UTC
  cron.schedule('0 5 * * 0', async () => {
    console.log('[cron-5] Running ASIN health check');
    try {
      const { runAsinHealthCheck } = await import('../src/cron/asin-health-check.mjs');
      await runAsinHealthCheck();
    } catch (err) {
      console.error('[cron-5] Error:', err.message);
    }
  });

} else {
  console.log('[cron-host] AUTO_GEN_ENABLED is not true — crons disabled');
}

console.log('[cron-host] All crons registered, server starting...');
