/**
 * Product Spotlight Cron — Saturdays 08:00 UTC
 * Uses DeepSeek V4-Pro + Paul Voice Gate + assignHeroImage.
 * Inserts directly as status='published'.
 */
import pg from 'pg';
import OpenAI from 'openai';
import { runQualityGate, fixEmDashes } from '../lib/article-quality-gate.mjs';
import { assignHeroImage } from '../lib/bunny-image-library.mjs';
import { ASIN_POOL, AMAZON_TAG } from '../data/asin-pool.mjs';

const { Pool } = pg;
const MAX_ATTEMPTS = 4;

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

export async function runProductSpotlight() {
  if (process.env.AUTO_GEN_ENABLED !== 'true') return;
  const db = getDb();
  try {
    const uniqueAsins = [...new Set(ASIN_POOL)];
    const asin = uniqueAsins[Math.floor(Math.random() * uniqueAsins.length)];
    const title = 'Product Spotlight: Our Pick for Psychic Development This Week';
    let body = '';
    let gateResult = null;

    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
      console.log(`[product-spotlight] Generating (attempt ${attempt}/${MAX_ATTEMPTS})`);
      try {
        const response = await client.chat.completions.create({
          model: MODEL,
          messages: [
            { role: 'system', content: 'You are Kalesh, a grounded teacher of psychic development. Write honest, direct product reviews. Use "you" throughout. Use contractions. Include 2-3 of these markers: "Right?!", "Know what I mean?", "Does that land?". No em-dashes. No banned words. Output clean HTML only.' },
            { role: 'user', content: `Write a 1,400-1,800 word product spotlight for psychic development. Feature: https://www.amazon.com/dp/${asin}?tag=${AMAZON_TAG} (paid link). Also mention 2-3 related products: ${uniqueAsins.slice(0, 5).map(a => `https://www.amazon.com/dp/${a}?tag=${AMAZON_TAG}`).join(', ')}. Format all links as: <a href="URL" target="_blank" rel="nofollow sponsored">Product Name (paid link)</a>. End with a link to /assessment.` },
          ],
          temperature: 0.72,
        });
        body = response.choices[0].message.content || '';
        body = fixEmDashes(body);
        gateResult = runQualityGate(body);
        if (gateResult.passed) break;
        console.warn(`[product-spotlight] Gate FAILED (attempt ${attempt}): ${gateResult.failures.join(', ')}`);
        body = '';
      } catch (err) {
        console.error(`[product-spotlight] Error (attempt ${attempt}):`, err.message);
      }
    }

    if (!gateResult?.passed || !body) { console.error('[product-spotlight] All attempts failed.'); return; }

    const slug = `product-spotlight-${Date.now()}`;
    const imageUrl = await assignHeroImage(slug);
    const metaDesc = 'Kalesh reviews the best tools for psychic development and intuitive sensitivity this week.';

    await db.query(
      `INSERT INTO articles (slug, title, meta_description, og_title, og_description, category, tags, body, image_url, image_alt, reading_time, author, status, published_at, queued_at, updated_at, word_count, asins_used)
       VALUES ($1,$2,$3,$4,$5,'psychic-development',ARRAY['product','review','tools'],$6,$7,$8,$9,'Kalesh','published',NOW(),NOW(),NOW(),$10,ARRAY[$11])
       ON CONFLICT (slug) DO NOTHING`,
      [slug, title, metaDesc, title, metaDesc, body, imageUrl, `${title} -- intuitivesawaken.com`,
       Math.round(gateResult.wordCount / 200), gateResult.wordCount, asin]
    );
    console.log(`[product-spotlight] Published: ${slug}`);
  } catch (err) {
    console.error('[product-spotlight] Error:', err);
  } finally {
    await db.end();
  }
}

if (process.argv[1] === new URL(import.meta.url).pathname) {
  runProductSpotlight().catch(console.error);
}
