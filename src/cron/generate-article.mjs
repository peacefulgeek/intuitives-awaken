import { generateArticle } from '../lib/anthropic-generate.mjs';
import { runQualityGate } from '../lib/article-quality-gate.mjs';
import { verifyAsin, buildAmazonUrl } from '../lib/amazon-verify.mjs';
import { query } from '../lib/db.mjs';
import fs from 'fs/promises';
import path from 'path';

const MAX_ATTEMPTS = 3;
const CACHE_PATH = path.resolve('src/data/verified-asins.json');

// Rotating topic pool for daily generation
const TOPIC_POOL = [
  'How to Know If Your Intuition Is Speaking or Your Anxiety Is Talking',
  'The Difference Between Psychic Sensitivity and Hypervigilance',
  'Grounding Practices for Empaths Who Feel Overwhelmed in Crowds',
  'How to Develop Clairvoyance Without Losing Your Critical Mind',
  'The Science Behind Why Some People Feel Others\' Emotions',
  'Energy Boundaries vs. Emotional Boundaries: What Empaths Actually Need',
  'How to Trust a Gut Feeling When Your Mind Says Otherwise',
  'The Relationship Between Childhood Sensitivity and Adult Psychic Ability',
  'Practical Exercises for Strengthening Your Clairsentience',
  'Why Meditation Alone Isn\'t Enough for Psychic Development',
  'How to Discern Your Own Emotions From Others\' Energies',
  'The Role of the Nervous System in Psychic Perception',
  'Dream Interpretation as a Psychic Development Practice',
  'How to Use Your Body as an Intuitive Instrument',
  'Psychic Protection: What Actually Works vs. What\'s Superstition'
];

const OPENER_TYPES = ['gut-punch', 'question', 'micro-story', 'counterintuitive'];
const CONCLUSION_TYPES = ['cta', 'reflection', 'question', 'challenge', 'benediction'];

export async function generateAndStore() {
  // Pick a topic not recently used
  const { rows: recent } = await query(
    'SELECT title FROM articles ORDER BY published_at DESC LIMIT 30'
  );
  const recentTitles = new Set(recent.map(r => r.title.toLowerCase()));
  const available = TOPIC_POOL.filter(t => !recentTitles.has(t.toLowerCase()));
  const topic = available.length > 0
    ? available[Math.floor(Math.random() * available.length)]
    : TOPIC_POOL[Math.floor(Math.random() * TOPIC_POOL.length)];

  const openerType = OPENER_TYPES[Math.floor(Math.random() * OPENER_TYPES.length)];
  const conclusionType = CONCLUSION_TYPES[Math.floor(Math.random() * CONCLUSION_TYPES.length)];

  console.log(`[generate-article] Topic: "${topic}" | opener: ${openerType} | conclusion: ${conclusionType}`);

  let article = null;
  let gate = null;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    article = await generateArticle({ topic, openerType, conclusionType });
    gate = runQualityGate(article.body);

    if (gate.passed) break;
    console.warn(`[generate-article] Attempt ${attempt} failed gate:`, gate.failures.join(' | '));
  }

  if (!gate || !gate.passed) {
    console.error(`[generate-article] All ${MAX_ATTEMPTS} attempts failed — not storing`);
    return null;
  }

  // Verify ASINs
  const cache = JSON.parse(await fs.readFile(CACHE_PATH, 'utf8'));
  for (const asin of gate.asins) {
    if (!cache.asins[asin]) {
      const result = await verifyAsin(asin);
      if (result.valid) {
        cache.asins[asin] = {
          title: result.title,
          category: article.category,
          tags: article.tags,
          verifiedAt: new Date().toISOString(),
          lastChecked: new Date().toISOString(),
          status: 'valid',
          usedInArticles: [article.slug]
        };
      }
    }
  }
  cache.lastUpdated = new Date().toISOString();
  await fs.writeFile(CACHE_PATH, JSON.stringify(cache, null, 2));

  // Store in DB
  const slug = article.slug + '-' + Date.now();
  await query(`
    INSERT INTO articles (slug, title, body, category, tags, author, word_count, asins_used, published_at, opener_type, conclusion_type)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), $9, $10)
    ON CONFLICT (slug) DO NOTHING
  `, [slug, article.title, article.body, article.category, article.tags, article.author,
      gate.wordCount, gate.asins, article.openerType, article.conclusionType]);

  console.log(`[generate-article] Stored: ${slug} (${gate.wordCount} words)`);
  return slug;
}
