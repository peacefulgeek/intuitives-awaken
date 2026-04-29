/**
 * ASIN Health Check Cron — Sundays 05:00 UTC
 * Verifies Amazon product links are still live.
 * Uses fetch to check Amazon product pages.
 */
import pg from 'pg';
import { ASIN_POOL, AMAZON_TAG } from '../data/asin-pool.mjs';

const { Pool } = pg;

function getDb() {
  return new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL?.includes('sslmode=require') ? { rejectUnauthorized: false } : false,
  });
}

async function checkAsin(asin) {
  const url = `https://www.amazon.com/dp/${asin}?tag=${AMAZON_TAG}`;
  try {
    const res = await fetch(url, {
      method: 'HEAD',
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; IntuitivesAwaken/1.0)' },
      signal: AbortSignal.timeout(8000),
    });
    return { asin, url, status: res.status, ok: res.status === 200 || res.status === 301 || res.status === 302 };
  } catch (err) {
    return { asin, url, status: 0, ok: false, error: err.message };
  }
}

export async function runAsinHealthCheck() {
  if (process.env.AUTO_GEN_ENABLED !== 'true') return;
  const db = getDb();
  try {
    const uniqueAsins = [...new Set(ASIN_POOL)];
    console.log(`[asin-health] Checking ${uniqueAsins.length} ASINs...`);

    const results = [];
    for (const asin of uniqueAsins) {
      const result = await checkAsin(asin);
      results.push(result);
      if (!result.ok) {
        console.warn(`[asin-health] FAILED: ${asin} (HTTP ${result.status})`);
      }
    }

    const failed = results.filter(r => !r.ok);
    const passed = results.filter(r => r.ok);
    console.log(`[asin-health] Results: ${passed.length} OK, ${failed.length} failed`);

    if (failed.length > 0) {
      console.warn('[asin-health] Failed ASINs:', failed.map(r => r.asin).join(', '));
    }

    // Log to DB if health_checks table exists
    try {
      await db.query(
        `INSERT INTO asin_health_log (checked_at, total, passed, failed, failed_asins)
         VALUES (NOW(), $1, $2, $3, $4)`,
        [uniqueAsins.length, passed.length, failed.length, JSON.stringify(failed.map(r => r.asin))]
      );
    } catch {
      // Table might not exist yet — that's fine
    }
  } catch (err) {
    console.error('[asin-health] Error:', err);
  } finally {
    await db.end();
  }
}

if (process.argv[1] === new URL(import.meta.url).pathname) {
  runAsinHealthCheck().catch(console.error);
}
