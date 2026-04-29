/**
 * Monthly Refresh Cron — 1st of month 03:00 UTC
 * Refreshes articles older than 30 days with updated content.
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

export async function runMonthlyRefresh() {
  if (process.env.AUTO_GEN_ENABLED !== 'true') return;
  const db = getDb();
  try {
    const { rows } = await db.query(
      `SELECT id, slug, title, body, category FROM articles
       WHERE status = 'published'
         AND (last_refreshed_30d IS NULL OR last_refreshed_30d < NOW() - INTERVAL '30 days')
       ORDER BY published_at ASC LIMIT 3`
    );
    console.log(`[refresh-monthly] Found ${rows.length} articles to refresh`);

    for (const article of rows) {
      console.log(`[refresh-monthly] Refreshing: ${article.slug}`);
      try {
        const response = await client.chat.completions.create({
          model: MODEL,
          messages: [
            { role: 'system', content: 'You are Kalesh. Rewrite and improve this article. Keep the same topic and structure but freshen the content, update any dated references, and improve the voice. Direct address, contractions, no em-dashes, no banned words. Output clean HTML.' },
            { role: 'user', content: `Title: ${article.title}\n\nCurrent content:\n${article.body.slice(0, 3000)}\n\nRewrite this article with fresh perspective while keeping the core message.` },
          ],
          temperature: 0.72,
        });
        let newBody = response.choices[0].message.content || '';
        newBody = fixEmDashes(newBody);
        const gate = runQualityGate(newBody);
        if (gate.passed) {
          await db.query(
            `UPDATE articles SET body = $1, word_count = $2, last_refreshed_30d = NOW(), updated_at = NOW() WHERE id = $3`,
            [newBody, gate.wordCount, article.id]
          );
          console.log(`[refresh-monthly] Refreshed: ${article.slug}`);
        } else {
          console.warn(`[refresh-monthly] Gate failed for ${article.slug}: ${gate.failures.join(', ')}`);
        }
      } catch (err) {
        console.error(`[refresh-monthly] Error refreshing ${article.slug}:`, err.message);
      }
    }
  } catch (err) {
    console.error('[refresh-monthly] Error:', err);
  } finally {
    await db.end();
  }
}

if (process.argv[1] === new URL(import.meta.url).pathname) {
  runMonthlyRefresh().catch(console.error);
}
