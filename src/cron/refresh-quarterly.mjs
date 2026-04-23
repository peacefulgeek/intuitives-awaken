import { runQualityGate } from '../lib/article-quality-gate.mjs';
import { verifyAsin, extractAsinsFromText } from '../lib/amazon-verify.mjs';
import { query } from '../lib/db.mjs';
import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const MAX_ATTEMPTS = 3;
const BATCH_SIZE = 15;

export async function refreshQuarterly() {
  const { rows } = await query(`
    SELECT id, slug, title, body, category, tags, asins_used
    FROM articles
    WHERE last_refreshed_90d IS NULL OR last_refreshed_90d < NOW() - INTERVAL '90 days'
    ORDER BY COALESCE(last_refreshed_90d, created_at) ASC
    LIMIT $1
  `, [BATCH_SIZE]);

  console.log(`[refresh-quarterly] Processing ${rows.length} articles`);
  let refreshed = 0, kept = 0;

  for (const a of rows) {
    let refreshedBody = null;
    let gate = null;

    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
      refreshedBody = await generateQuarterlyRefresh(a);

      const asins = extractAsinsFromText(refreshedBody);
      const dead = (await Promise.all(asins.map(verifyAsin))).filter(r => !r.valid);
      if (dead.length > 0) {
        console.warn(`[refresh-quarterly] ${a.slug}: ${dead.length} dead ASINs`);
      }

      gate = runQualityGate(refreshedBody);
      if (gate.passed) break;
      console.warn(`[refresh-quarterly] ${a.slug} attempt ${attempt}:`, gate.failures.join(' | '));
    }

    if (gate && gate.passed) {
      await query(
        'UPDATE articles SET body = $1, asins_used = $2, word_count = $3, last_refreshed_90d = NOW(), updated_at = NOW() WHERE id = $4',
        [refreshedBody, gate.asins, gate.wordCount, a.id]
      );
      refreshed++;
    } else {
      await query('UPDATE articles SET last_refreshed_90d = NOW() WHERE id = $1', [a.id]);
      kept++;
      console.error(`[refresh-quarterly] ${a.slug} FAILED gate 3x - keeping original`);
    }
  }

  return { processed: rows.length, refreshed, kept };
}

async function generateQuarterlyRefresh(article) {
  const prompt = `Substantially rewrite this article for "The Bright Wound." New hook, new examples, refreshed product recommendations. Same niche (psychic development, intuition, empathic sensitivity), same voice (Kalesh - grounded, analytical, not woo), same approximate length.

Title: ${article.title}
Current body: ${article.body.substring(0, 1500)}...

HARD RULES: Zero em-dashes. No AI words (delve, tapestry, utilize, etc). Contractions throughout. Varied sentence lengths. 1,600-2,000 words. 3-4 Amazon affiliate links with (paid link). Return valid HTML.`;

  const response = await client.messages.create({
    model: 'claude-opus-4-5',
    max_tokens: 4096,
    messages: [{ role: 'user', content: prompt }]
  });
  return response.content[0].type === 'text' ? response.content[0].text : article.body;
}
