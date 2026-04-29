/**
 * Quarterly Refresh Cron — Jan/Apr/Jul/Oct 1st 04:00 UTC
 * Deep-rewrites articles older than 90 days.
 * Uses DeepSeek V4-Pro.
 */
import pg from 'pg';
import OpenAI from 'openai';
import { runQualityGate, fixEmDashes } from '../lib/article-quality-gate.mjs';

const { Pool } = pg;
const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: process.env.OPENAI_BASE_URL || 'https://api.deepseek.com',
});
const MODEL = process.env.OPENAI_MODEL || 'deepseek-v4-pro';

function getDb() {
  return new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL?.includes('sslmode=require') ? { rejectUnauthorized: false } : false,
  });
}

export async function runQuarterlyRefresh() {
  if (process.env.AUTO_GEN_ENABLED !== 'true') return;
  const db = getDb();
  try {
    const { rows } = await db.query(
      `SELECT id, slug, title, body, category FROM articles
       WHERE status = 'published'
         AND (last_refreshed_90d IS NULL OR last_refreshed_90d < NOW() - INTERVAL '90 days')
       ORDER BY published_at ASC LIMIT 5`
    );
    console.log(`[refresh-quarterly] Found ${rows.length} articles to deep-refresh`);

    for (const article of rows) {
      console.log(`[refresh-quarterly] Deep-refreshing: ${article.slug}`);
      try {
        const response = await client.chat.completions.create({
          model: MODEL,
          messages: [
            { role: 'system', content: 'You are Kalesh. Completely rewrite this article from scratch keeping only the core topic. Make it longer, deeper, more authoritative. Direct address, contractions, no em-dashes, no banned words. 1,800-2,200 words. Output clean HTML.' },
            { role: 'user', content: `Completely rewrite this article on the topic: "${article.title}". Make it definitive, comprehensive, and deeply useful for people developing their psychic sensitivity.` },
          ],
          temperature: 0.68,
        });
        let newBody = response.choices[0].message.content || '';
        newBody = fixEmDashes(newBody);
        const gate = runQualityGate(newBody);
        if (gate.passed) {
          await db.query(
            `UPDATE articles SET body = $1, word_count = $2, last_refreshed_90d = NOW(), updated_at = NOW() WHERE id = $3`,
            [newBody, gate.wordCount, article.id]
          );
          console.log(`[refresh-quarterly] Deep-refreshed: ${article.slug}`);
        } else {
          console.warn(`[refresh-quarterly] Gate failed for ${article.slug}: ${gate.failures.join(', ')}`);
        }
      } catch (err) {
        console.error(`[refresh-quarterly] Error for ${article.slug}:`, err.message);
      }
    }
  } catch (err) {
    console.error('[refresh-quarterly] Error:', err);
  } finally {
    await db.end();
  }
}

if (process.argv[1] === new URL(import.meta.url).pathname) {
  runQuarterlyRefresh().catch(console.error);
}
