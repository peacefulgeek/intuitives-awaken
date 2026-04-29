/**
 * DeepSeek V4-Pro generation engine.
 * Uses the OpenAI client with DeepSeek's OpenAI-compatible API.
 * Model: deepseek-v4-pro (always — never ask, never change)
 */
import OpenAI from 'openai';

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: process.env.OPENAI_BASE_URL || 'https://api.deepseek.com',
});

const MODEL = process.env.OPENAI_MODEL || 'deepseek-v4-pro';

/**
 * Generate article body HTML for a given topic.
 * Returns raw text — caller is responsible for quality gate.
 */
export async function generateArticleBody(topic, category, amazonTag = 'spankyspinola-20', asinPool = []) {
  // Pick 3-4 ASINs from the pool
  const shuffled = [...asinPool].sort(() => Math.random() - 0.5);
  const pickedAsins = shuffled.slice(0, 3 + Math.floor(Math.random() * 2)); // 3 or 4

  const asinLinks = pickedAsins.map(asin =>
    `<a href="https://www.amazon.com/dp/${asin}?tag=${amazonTag}" target="_blank" rel="nofollow sponsored">See on Amazon (paid link)</a>`
  );

  const systemPrompt = `You are Kalesh, a grounded, direct teacher of psychic development and intuitive sensitivity. You write for people who feel things deeply and have been told their whole lives that something is wrong with them. Nothing is wrong with them. Their nervous system is calibrated for a wider range than most.

VOICE RULES (non-negotiable):
- Direct address: "you" throughout
- Contractions everywhere: don't, can't, it's, you're, they're
- Compassionate but never saccharine — you're honest, not fluffy
- Include 2-3 conversational markers exactly as written: "Right?!", "Know what I mean?", "Does that land?", "How does that make you feel?"
- No academic distance. Write like you're talking to someone across a table.

BANNED WORDS (if any appear, the article is rejected — do not use them):
utilize, delve, tapestry, landscape, paradigm, synergy, leverage, unlock, empower, pivotal, embark, underscore, paramount, seamlessly, robust, beacon, foster, elevate, curate, curated, bespoke, resonate, harness, intricate, plethora, myriad, groundbreaking, innovative, cutting-edge, state-of-the-art, game-changer, ever-evolving, rapidly-evolving, stakeholders, navigate, ecosystem, framework, comprehensive, transformative, holistic, nuanced, multifaceted, profound, furthermore

BANNED PHRASES (reject if any appear):
"it's important to note that", "it's worth noting that", "in conclusion", "in summary", "a holistic approach", "in the realm of", "dive deep into", "at the end of the day", "in today's fast-paced world", "plays a crucial role"

FORMATTING:
- Output clean HTML only (h2, h3, p, ul, li, blockquote, strong, em)
- No markdown, no code fences
- Use em-dashes NEVER — replace with hyphen-space: " - "
- Word count: 1,400-2,000 words
- Include exactly ${pickedAsins.length} Amazon affiliate links, placed naturally in the text where a product genuinely helps:
${asinLinks.map((l, i) => `  ${i + 1}. ${l}`).join('\n')}
- End with a short section (no heading) that links to /assessment or /quiz with anchor text like "Take the Psychic Sensitivity Assessment" or "Try the quiz"
- Include one blockquote that captures the core insight of the piece`;

  const userPrompt = `Write a complete article for the topic: "${topic}"

Category: ${category}

This is for intuitivesawaken.com — a site for people who have always sensed things others don't. The site's tagline is "The Bright Wound" — sensitivity as both gift and cost.

Write the full article body as HTML. Do not include <html>, <head>, <body>, or <title> tags. Start directly with the first <p> or <h2>.`;

  const response = await client.chat.completions.create({
    model: MODEL,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    temperature: 0.72,
  });

  return response.choices[0].message.content || '';
}

/**
 * Generate a meta description for an article.
 */
export async function generateMetaDescription(title, body) {
  const response = await client.chat.completions.create({
    model: MODEL,
    messages: [
      {
        role: 'system',
        content: 'Write a compelling meta description (150-160 characters) for a psychic development article. Direct, honest, no fluff. No em-dashes.',
      },
      {
        role: 'user',
        content: `Title: ${title}\n\nFirst 200 words of article:\n${body.slice(0, 800)}`,
      },
    ],
    temperature: 0.5,
    max_tokens: 80,
  });
  return (response.choices[0].message.content || '').trim().replace(/^"|"$/g, '');
}
