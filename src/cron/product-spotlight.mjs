import { runQualityGate } from '../lib/article-quality-gate.mjs';
import { buildAmazonUrl } from '../lib/amazon-verify.mjs';
import { query } from '../lib/db.mjs';
import { PRODUCT_CATALOG } from '../data/product-catalog.mjs';
import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const MAX_ATTEMPTS = 3;

export async function runProductSpotlight() {
  // Pick a product not recently spotlighted
  const { rows: recent } = await query(
    "SELECT title FROM articles WHERE category = 'product-spotlight' ORDER BY published_at DESC LIMIT 10"
  );
  const recentNames = new Set(recent.map(r => r.title.toLowerCase()));
  const available = PRODUCT_CATALOG.filter(p => !recentNames.has(p.name.toLowerCase()));
  const product = available.length > 0
    ? available[Math.floor(Math.random() * available.length)]
    : PRODUCT_CATALOG[Math.floor(Math.random() * PRODUCT_CATALOG.length)];

  console.log(`[product-spotlight] Spotlighting: ${product.name}`);

  const prompt = `Write a 1,600-1,800 word article for "The Bright Wound" spotlighting this product for psychically sensitive people:

Product: ${product.name}
Amazon URL: ${buildAmazonUrl(product.asin)} (paid link)

Write as Kalesh - grounded, analytical, not woo. Explain why this specific product matters for people with high sensitivity or psychic development practice. Be specific. Be honest about limitations.

Structure:
- H1 title (not just the product name - make it about the benefit)
- Opening paragraph (gut-punch or micro-story)
- 3-4 H2 sections covering: what it is, why it matters for sensitive people, how to use it, what to watch out for
- 2-3 additional related product recommendations with Amazon links (paid link)
- Practical FAQ (3 questions)
- Conclusion

HARD RULES: Zero em-dashes. No AI words (delve, tapestry, utilize, etc). Contractions throughout. Varied sentence lengths. 1,600-1,800 words. Return valid HTML.`;

  let body = null;
  let gate = null;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    const response = await client.messages.create({
      model: 'claude-opus-4-5',
      max_tokens: 3000,
      messages: [{ role: 'user', content: prompt }]
    });
    body = response.content[0].type === 'text' ? response.content[0].text : '';
    gate = runQualityGate(body);
    if (gate.passed) break;
    console.warn(`[product-spotlight] Attempt ${attempt} failed:`, gate.failures.join(' | '));
  }

  if (!gate || !gate.passed) {
    console.error('[product-spotlight] All attempts failed — not storing');
    return null;
  }

  const slug = `spotlight-${product.asin.toLowerCase()}-${Date.now()}`;
  await query(`
    INSERT INTO articles (slug, title, body, category, tags, author, word_count, asins_used, published_at)
    VALUES ($1, $2, $3, 'product-spotlight', $4, 'Kalesh', $5, $6, NOW())
    ON CONFLICT (slug) DO NOTHING
  `, [slug, `The Sensitive's Toolkit: ${product.name}`, body, product.tags, gate.wordCount, gate.asins]);

  console.log(`[product-spotlight] Stored: ${slug}`);
  return slug;
}
