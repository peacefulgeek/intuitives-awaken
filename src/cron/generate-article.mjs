/**
 * Article Publisher Cron
 * 
 * Phase 1 (published < 60): Runs 5x/day — 07:00, 10:00, 13:00, 16:00, 19:00 UTC
 * Phase 2 (published >= 60): Runs 1x/weekday — 08:00 UTC Mon-Fri
 * 
 * Logic:
 * 1. Check the queue for articles with status='queued'
 * 2. If queue has articles, publish the oldest one (assign hero image, set status='published')
 * 3. If queue is empty, generate a new article with DeepSeek V4-Pro
 */

import pg from 'pg';
import { generateArticleBody, generateMetaDescription } from '../lib/deepseek-generate.mjs';
import { runQualityGate, fixEmDashes } from '../lib/article-quality-gate.mjs';
import { assignHeroImage } from '../lib/bunny-image-library.mjs';
import { pickAsins, AMAZON_TAG } from '../data/asin-pool.mjs';

const { Pool } = pg;
const MAX_ATTEMPTS = 4;

function getDb() {
  return new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL?.includes('sslmode=require') ? { rejectUnauthorized: false } : false,
  });
}

function slugify(title) {
  return title.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').slice(0, 80);
}

export async function runGenerateArticle() {
  if (process.env.AUTO_GEN_ENABLED !== 'true') {
    console.log('[generate-article] AUTO_GEN_ENABLED is not true, skipping.');
    return;
  }

  const db = getDb();
  try {
    const { rows: countRows } = await db.query(`SELECT COUNT(*) as count FROM articles WHERE status = 'published'`);
    const publishedCount = parseInt(countRows[0].count, 10);
    console.log(`[generate-article] Published count: ${publishedCount}`);

    const { rows: queueRows } = await db.query(
      `SELECT id, slug, title, body, category FROM articles WHERE status = 'queued' ORDER BY queued_at ASC LIMIT 1`
    );

    if (queueRows.length > 0) {
      const article = queueRows[0];
      console.log(`[generate-article] Publishing queued article: "${article.title}"`);
      const imageUrl = await assignHeroImage(article.slug);
      await db.query(
        `UPDATE articles SET status = 'published', published_at = NOW(), image_url = $1, updated_at = NOW() WHERE id = $2`,
        [imageUrl, article.id]
      );
      console.log(`[generate-article] Published: ${article.slug} => ${imageUrl}`);
    } else {
      console.log('[generate-article] Queue empty, generating new article...');
      await generateAndInsert(db);
    }
  } catch (err) {
    console.error('[generate-article] Error:', err);
    throw err;
  } finally {
    await db.end();
  }
}

async function generateAndInsert(db) {
  const { rows: existingSlugs } = await db.query(`SELECT slug FROM articles`);
  const usedSlugs = new Set(existingSlugs.map(r => r.slug));
  const topic = await pickUnusedTopic(usedSlugs);
  if (!topic) { console.log('[generate-article] No unused topics.'); return; }

  const asins = pickAsins();
  let body = '';
  let gateResult = null;
  let attempts = 0;

  while (attempts < MAX_ATTEMPTS) {
    attempts++;
    console.log(`[generate-article] Generating "${topic.title}" (attempt ${attempts}/${MAX_ATTEMPTS})`);
    try {
      body = await generateArticleBody(topic.title, topic.category, AMAZON_TAG, asins);
      body = fixEmDashes(body);
      gateResult = runQualityGate(body);
      if (gateResult.passed) {
        console.log(`[generate-article] Gate passed (${gateResult.wordCount} words, ${gateResult.amazonLinks} links)`);
        break;
      } else {
        console.warn(`[generate-article] Gate FAILED (attempt ${attempts}): ${gateResult.failures.join(', ')}`);
        body = '';
      }
    } catch (err) {
      console.error(`[generate-article] Generation error (attempt ${attempts}):`, err.message);
    }
  }

  if (!gateResult?.passed || !body) {
    console.error(`[generate-article] All ${MAX_ATTEMPTS} attempts failed. Skipping.`);
    return;
  }

  const slug = slugify(topic.title);
  const metaDesc = await generateMetaDescription(topic.title, body);
  const imageUrl = await assignHeroImage(slug);

  await db.query(
    `INSERT INTO articles (slug, title, meta_description, og_title, og_description, category, tags, body, image_url, image_alt, reading_time, author, status, published_at, queued_at, updated_at, word_count, asins_used)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,'published',NOW(),NOW(),NOW(),$13,$14)
     ON CONFLICT (slug) DO NOTHING`,
    [slug, topic.title, metaDesc, topic.title, metaDesc, topic.category, topic.tags, body, imageUrl,
     `${topic.title} — intuitivesawaken.com`, Math.round(gateResult.wordCount / 200), 'Kalesh',
     gateResult.wordCount, asins]
  );
  console.log(`[generate-article] Inserted: ${slug}`);
}

const TOPIC_BANK = [
  { title: 'Why Empaths Absorb Other People\'s Pain', category: 'empath', tags: ['empath', 'sensitivity', 'energy'] },
  { title: 'The Difference Between Intuition and Overthinking', category: 'intuition', tags: ['intuition', 'anxiety', 'mind'] },
  { title: 'How to Stop Taking On Other People\'s Emotions', category: 'empath', tags: ['empath', 'boundaries', 'grounding'] },
  { title: 'Signs You\'re a Natural Psychic Medium', category: 'psychic-development', tags: ['mediumship', 'psychic', 'spirit'] },
  { title: 'Why Sensitive People Get Overwhelmed in Crowds', category: 'nervous-system', tags: ['HSP', 'overwhelm', 'crowds'] },
  { title: 'The Science Behind Gut Feelings', category: 'science', tags: ['gut-feeling', 'neuroscience', 'intuition'] },
  { title: 'How to Develop Your Clairvoyant Abilities', category: 'psychic-development', tags: ['clairvoyance', 'third-eye', 'vision'] },
  { title: 'Grounding Techniques That Actually Work for Empaths', category: 'grounding', tags: ['grounding', 'empath', 'earth'] },
  { title: 'What Happens When You Ignore Your Intuition', category: 'intuition', tags: ['intuition', 'regret', 'trust'] },
  { title: 'How to Read Energy in a Room', category: 'psychic-development', tags: ['energy', 'reading', 'awareness'] },
];

async function pickUnusedTopic(usedSlugs) {
  for (const topic of TOPIC_BANK) {
    const slug = slugify(topic.title);
    if (!usedSlugs.has(slug)) return topic;
  }
  const base = TOPIC_BANK[Math.floor(Math.random() * TOPIC_BANK.length)];
  return { ...base, title: `${base.title} - A Deeper Look` };
}

if (process.argv[1] === new URL(import.meta.url).pathname) {
  runGenerateArticle().catch(console.error);
}
