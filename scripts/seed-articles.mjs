/**
 * Seed 30 articles into the Postgres database with the correct schema.
 * Run: DATABASE_URL=<url> node scripts/seed-articles.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const cdnUrlsPath = path.join(__dirname, '../src/data/image-cdn-urls.json');
const cdnUrls = JSON.parse(fs.readFileSync(cdnUrlsPath, 'utf-8'));

const BUNNY = 'https://intuitives-awaken.b-cdn.net';
const AMAZON_TAG = 'intuitivesawak-20';

// Category mapping
const CATEGORY_MAP = {
  'intuition-vs-anxiety': 'intuition',
  'psychic-sensitivity-hypervigilance': 'psychic-development',
  'empath-grounding': 'empath',
  'clairvoyance-development': 'psychic-development',
  'nervous-system-psychic': 'nervous-system',
  'energy-boundaries': 'empath',
  'dream-interpretation': 'dream-work',
  'gut-feeling-trust': 'intuition',
  'childhood-sensitivity': 'empath',
  'clairsentience-exercises': 'psychic-development',
  'meditation-not-enough': 'grounding',
  'psychic-protection': 'psychic-development',
  'chakra-system-intuition': 'psychic-development',
  'tarot-intuition': 'intuition',
  'shadow-work': 'psychic-development',
  'crystals-intuition': 'psychic-development',
  'aura-reading': 'psychic-development',
  'synchronicity-signs': 'intuition',
  'sound-healing': 'nervous-system',
  'past-lives-regression': 'psychic-development',
  'spiritual-awakening-stages': 'psychic-development',
  'hsp-traits': 'empath',
  'intuition-journaling': 'intuition',
  'nature-healing': 'grounding',
  'collective-consciousness': 'science',
  'psychometry': 'psychic-development',
  'remote-viewing': 'psychic-development',
  'pendulum-dowsing': 'psychic-development',
  'lucid-dreaming': 'dream-work',
  'energy-healing': 'psychic-development',
  'moon-cycles-intuition': 'intuition',
  'oracle-cards': 'psychic-development',
  'spirit-guides': 'psychic-development',
};

// Amazon affiliate product links for the niche
const AFFILIATE_PRODUCTS = {
  'intuition': `<div class="affiliate-block">
    <h3>Recommended Reading</h3>
    <ul>
      <li><a href="https://www.amazon.com/dp/0062515675?tag=${AMAZON_TAG}" rel="nofollow sponsored" target="_blank">The Gift of Fear — Gavin de Becker</a> — The definitive guide to trusting your instincts for safety and clarity.</li>
      <li><a href="https://www.amazon.com/dp/0385720254?tag=${AMAZON_TAG}" rel="nofollow sponsored" target="_blank">Blink — Malcolm Gladwell</a> — The science behind snap judgments and the unconscious mind.</li>
    </ul>
  </div>`,
  'empath': `<div class="affiliate-block">
    <h3>Tools for Empaths</h3>
    <ul>
      <li><a href="https://www.amazon.com/dp/1401945937?tag=${AMAZON_TAG}" rel="nofollow sponsored" target="_blank">The Empath's Survival Guide — Judith Orloff</a> — Practical strategies for highly sensitive people.</li>
      <li><a href="https://www.amazon.com/dp/B07QXZQJWM?tag=${AMAZON_TAG}" rel="nofollow sponsored" target="_blank">Himalayan Salt Lamp</a> — Grounding and air purification for sensitive spaces.</li>
    </ul>
  </div>`,
  'psychic-development': `<div class="affiliate-block">
    <h3>Develop Your Gifts</h3>
    <ul>
      <li><a href="https://www.amazon.com/dp/0062899422?tag=${AMAZON_TAG}" rel="nofollow sponsored" target="_blank">Psychic Intelligence — Terry and Linda Jamison</a> — Practical exercises for developing psychic ability.</li>
      <li><a href="https://www.amazon.com/dp/1401957056?tag=${AMAZON_TAG}" rel="nofollow sponsored" target="_blank">You Are Psychic — Pete A. Sanders Jr.</a> — Scientific approach to developing natural psychic abilities.</li>
    </ul>
  </div>`,
  'grounding': `<div class="affiliate-block">
    <h3>Grounding Tools</h3>
    <ul>
      <li><a href="https://www.amazon.com/dp/B07YNLG4FV?tag=${AMAZON_TAG}" rel="nofollow sponsored" target="_blank">Earthing Mat</a> — Ground yourself to the Earth's natural electrical charge indoors.</li>
      <li><a href="https://www.amazon.com/dp/B000WOPVKM?tag=${AMAZON_TAG}" rel="nofollow sponsored" target="_blank">Earthing — Clinton Ober</a> — The science behind grounding and its health benefits.</li>
    </ul>
  </div>`,
  'nervous-system': `<div class="affiliate-block">
    <h3>Nervous System Support</h3>
    <ul>
      <li><a href="https://www.amazon.com/dp/0393707377?tag=${AMAZON_TAG}" rel="nofollow sponsored" target="_blank">The Body Keeps the Score — Bessel van der Kolk</a> — How trauma shapes the body and mind.</li>
      <li><a href="https://www.amazon.com/dp/B07KZPXMGB?tag=${AMAZON_TAG}" rel="nofollow sponsored" target="_blank">Magnesium Glycinate Supplement</a> — Calms the nervous system and supports deep sleep.</li>
    </ul>
  </div>`,
  'dream-work': `<div class="affiliate-block">
    <h3>Dream Work Resources</h3>
    <ul>
      <li><a href="https://www.amazon.com/dp/1572243090?tag=${AMAZON_TAG}" rel="nofollow sponsored" target="_blank">The Dream Book — Betty Bethards</a> — Comprehensive dream symbol dictionary.</li>
      <li><a href="https://www.amazon.com/dp/B07GQXKJFM?tag=${AMAZON_TAG}" rel="nofollow sponsored" target="_blank">Dream Journal with Prompts</a> — Structured journaling for lucid dreaming practice.</li>
    </ul>
  </div>`,
  'science': `<div class="affiliate-block">
    <h3>Science of Consciousness</h3>
    <ul>
      <li><a href="https://www.amazon.com/dp/0465030912?tag=${AMAZON_TAG}" rel="nofollow sponsored" target="_blank">The Conscious Mind — David Chalmers</a> — The hard problem of consciousness explored.</li>
      <li><a href="https://www.amazon.com/dp/0525559027?tag=${AMAZON_TAG}" rel="nofollow sponsored" target="_blank">Entangled Minds — Dean Radin</a> — Scientific evidence for psychic phenomena.</li>
    </ul>
  </div>`,
};

function getAffiliateBlock(category) {
  return AFFILIATE_PRODUCTS[category] || AFFILIATE_PRODUCTS['psychic-development'];
}

function generateArticleContent(title, slug, category) {
  const heroImg = cdnUrls[slug] || `${BUNNY}/images/articles/default-hero.webp`;
  const affiliateBlock = getAffiliateBlock(category);
  
  const articles = {
    'intuition-vs-anxiety': {
      meta: 'Learn to distinguish between genuine intuitive signals and anxiety-driven fear responses. A practical guide for sensitives.',
      body: `<p class="article-lead">There is a moment — you've had it — where something in you knows. Not thinks. Not fears. <em>Knows.</em> And then, almost immediately, the second voice arrives: "But what if you're just anxious?"</p>

<p>This is the central confusion for most intuitives, and it is not a small one. Getting it wrong costs you. Trusting anxiety as intuition leads to avoidance and paralysis. Dismissing intuition as anxiety leads to ignored warnings and missed turns.</p>

<h2>The Physical Signature</h2>

<p>Anxiety lives in the chest, the throat, the upper body. It is a constriction — a tightening that wants to pull you backward, away from the thing. It loops. It asks the same question repeatedly without arriving at an answer. It generates scenarios. It catastrophizes.</p>

<p>Intuition, when you learn to feel it cleanly, tends to arrive lower — in the gut, the solar plexus. It does not loop. It states. It may be uncomfortable, even frightening in its implications, but it has a quality of stillness at its center. It does not need you to keep thinking about it. It has already told you what it needed to tell you.</p>

<blockquote>"Anxiety is a question that cannot stop asking itself. Intuition is an answer that doesn't need to be asked."</blockquote>

<h2>The Time Signature</h2>

<p>Anxiety is future-oriented. It is always about what might happen, what could go wrong, what you might lose. It lives in projection.</p>

<p>Intuition is present-tense. It is about what <em>is</em>, not what might be. When you receive a genuine intuitive hit, there is often a quality of "of course" to it — as if part of you already knew, and the hit is simply the conscious mind catching up.</p>

<h2>The Repetition Test</h2>

<p>Ask yourself: has this feeling changed its content over time, or has it stayed consistent? Anxiety morphs. It finds new things to worry about. It escalates, then deflates, then escalates again around a different object.</p>

<p>Intuition tends to be consistent. If you have been getting the same quiet signal about a person or situation for months, that is worth paying attention to. The signal that doesn't change is usually the signal that is real.</p>

<h2>A Practice: The Three-Breath Pause</h2>

<p>When you receive a strong feeling and cannot tell its origin, try this: take three slow, complete breaths. On the exhale of the third breath, ask the question once — "Is this mine to act on?" — and then stop thinking. Notice what remains in your body after the thinking stops.</p>

<p>Anxiety will immediately start generating more content. Intuition will either deepen into a quiet certainty or dissolve, having been heard.</p>

${affiliateBlock}

<h2>The Deeper Work</h2>

<p>The reason this distinction is hard for most sensitives is that anxiety and intuition share the same channel. You are wired to receive subtle information. That same wiring picks up your own fear-based projections with equal fidelity.</p>

<p>The long-term solution is not to become better at distinguishing the signals — it is to do the work that reduces the anxiety noise floor. Nervous system regulation, trauma processing, and genuine self-knowledge all serve this. As the anxiety quiets, the intuition becomes clearer. Not because it was ever louder, but because you can finally hear it.</p>`
    },
    'empath-grounding': {
      meta: 'Practical grounding techniques specifically designed for deep empaths who absorb others\' emotions and energy.',
      body: `<p class="article-lead">Grounding is not a metaphor. For empaths, it is a biological necessity — a way of returning your nervous system to its own frequency after it has been broadcasting on someone else's.</p>

<p>The problem with most grounding advice is that it was written for people who are mildly stressed, not for people whose nervous systems are genuinely porous. If you absorb other people's emotional states involuntarily, you need something more specific than "take a walk in nature."</p>

<h2>Why Empaths Need Different Grounding</h2>

<p>Standard grounding techniques work by bringing attention to the present moment and the physical body. For most people, this is sufficient. For empaths, the challenge is that the present moment often contains other people's energy that has already been absorbed. You can be fully present in your body and still be feeling someone else's grief or anxiety.</p>

<p>Effective grounding for empaths must include a clearing component — not just a return to the present, but a return to <em>yourself</em> within the present.</p>

<h2>The Five-Minute Clearing Protocol</h2>

<p>This is a practical sequence that can be done anywhere, in five minutes or less:</p>

<ol>
  <li><strong>Physical contact with earth or floor.</strong> Remove your shoes if possible. Stand or sit with both feet flat on the ground. Feel the actual physical pressure of the surface beneath you.</li>
  <li><strong>The ownership question.</strong> Scan your body for any emotional charge. For each sensation you find, ask: "Is this mine?" Do not analyze. Simply ask and notice the first response.</li>
  <li><strong>Return to breath.</strong> Three slow breaths, extending the exhale to twice the length of the inhale. This activates the parasympathetic nervous system and signals safety to the body.</li>
  <li><strong>Boundary visualization.</strong> Imagine a membrane of golden light at the surface of your skin — not a wall, but a filter. It allows love and genuine connection through. It returns everything else to its source.</li>
  <li><strong>Name yourself.</strong> State your name, your location, and the date. This sounds simple. For deeply absorbed empaths, it is surprisingly powerful.</li>
</ol>

${affiliateBlock}

<h2>Environmental Grounding</h2>

<p>Your environment matters more than most people acknowledge. Empaths who live in cluttered, energetically dense spaces have a harder time clearing. This is not mystical — it is about reducing the number of objects and spaces that carry emotional charge.</p>

<p>Salt is one of the most effective environmental clearing tools available. Himalayan salt lamps, salt bowls in corners, or even a simple salt scrub in the shower can shift the energetic quality of a space significantly.</p>

<h2>The Long Game</h2>

<p>Grounding is not a one-time fix. It is a daily practice, the way brushing your teeth is a daily practice. The empaths who manage their sensitivity most effectively are not the ones who have found the perfect technique — they are the ones who have built consistent, non-negotiable practices into their daily rhythm.</p>

<p>Start with five minutes in the morning before you encounter anyone else. This sets your baseline. You are establishing your own frequency before the day begins to layer other frequencies on top of it.</p>`
    },
  };

  // For articles without specific content, generate quality generic content
  const specific = articles[slug];
  if (specific) {
    return { meta: specific.meta, body: specific.body };
  }
  
  // Generate topic-specific content for all other articles
  const topicContent = generateTopicContent(title, slug, category, affiliateBlock);
  return topicContent;
}

function generateTopicContent(title, slug, category, affiliateBlock) {
  const intro = `<p class="article-lead">For those of us who have always sensed more than the people around us seemed to, ${title.toLowerCase()} represents one of the most important areas of self-understanding available. This is not about developing a new skill. It is about recognizing and refining something that has always been present.</p>`;

  const body = `${intro}

<p>The journey into ${title.toLowerCase()} begins not with technique, but with permission. Permission to take your own perceptions seriously. Permission to explore what you have been told is impossible, impractical, or simply not real. The evidence of your own experience is the most reliable data you have.</p>

<h2>Understanding the Foundation</h2>

<p>Before any technique or practice can be effective, you need to understand the substrate you are working with. Your nervous system is not a passive receiver — it is an active participant in your perceptual experience. The quality of your nervous system regulation directly affects the quality of your intuitive access.</p>

<p>When the nervous system is in a chronic state of activation — which is the baseline for most sensitives who have not done specific work — the signal-to-noise ratio is poor. You receive more, but you can discern less. The first work is always to bring the nervous system into a state of regulated calm.</p>

<h2>The Practice</h2>

<p>Consistent practice matters more than perfect technique. A simple practice done daily will produce more results than an elaborate practice done occasionally. The nervous system learns through repetition, and the intuitive faculty responds to the same principle.</p>

<p>Begin with ten minutes each morning, before you check your phone or engage with anyone else. Sit quietly. Breathe slowly. Ask yourself: "What do I know today that I didn't know yesterday?" Do not force an answer. Simply create the space for one to arrive.</p>

<blockquote>"The intuitive mind is a sacred gift and the rational mind is a faithful servant. We have created a society that honors the servant and has forgotten the gift." — Albert Einstein</blockquote>

<h2>Common Obstacles</h2>

<p>The most common obstacle is not lack of ability — it is lack of trust. Sensitives who have been told repeatedly that their perceptions are wrong, excessive, or imaginary have learned to override their own knowing. This is a survival adaptation, and it made sense in context. But it is no longer serving you.</p>

<p>The second most common obstacle is the attempt to force results. Intuition does not respond well to pressure. It responds to invitation. The more you can approach your practice with genuine curiosity rather than performance anxiety, the more access you will have.</p>

${affiliateBlock}

<h2>Integration</h2>

<p>The goal is not to become someone who has occasional flashes of insight. The goal is to integrate your intuitive perception so thoroughly into your daily functioning that it becomes indistinguishable from your ordinary intelligence. This is possible. It takes time, consistent practice, and the willingness to be wrong sometimes — and to learn from that, too.</p>

<p>Your sensitivity is not a wound to be healed. It is an instrument to be tuned. The work of ${title.toLowerCase()} is the work of tuning.</p>`;

  const meta = `A practical guide to ${title.toLowerCase()} for sensitives, empaths, and intuitives. Learn the techniques that actually work.`;
  
  return { meta, body };
}

// All 30 articles
const ARTICLES = [
  { slug: 'intuition-vs-anxiety', title: 'Intuition vs Anxiety: How to Tell the Difference' },
  { slug: 'psychic-sensitivity-hypervigilance', title: 'Psychic Sensitivity or Hypervigilance?' },
  { slug: 'empath-grounding', title: 'Grounding Techniques for Deep Empaths' },
  { slug: 'clairvoyance-development', title: 'Developing Clairvoyance Safely' },
  { slug: 'nervous-system-psychic', title: 'The Nervous System and Psychic Ability' },
  { slug: 'energy-boundaries', title: 'Energy Boundaries for Intuitives' },
  { slug: 'dream-interpretation', title: 'Intuitive Dream Interpretation' },
  { slug: 'gut-feeling-trust', title: 'Learning to Trust Your Gut Feeling' },
  { slug: 'childhood-sensitivity', title: 'Understanding Childhood Sensitivity' },
  { slug: 'clairsentience-exercises', title: 'Exercises to Develop Clairsentience' },
  { slug: 'meditation-not-enough', title: 'When Meditation is Not Enough for Empaths' },
  { slug: 'psychic-protection', title: 'Practical Psychic Protection' },
  { slug: 'chakra-system-intuition', title: 'The Chakra System and Intuition' },
  { slug: 'tarot-intuition', title: 'Using Tarot to Build Intuitive Trust' },
  { slug: 'shadow-work', title: 'Shadow Work for Intuitives' },
  { slug: 'crystals-intuition', title: 'Best Crystals for Intuitive Development' },
  { slug: 'aura-reading', title: 'Beginner Guide to Aura Reading' },
  { slug: 'synchronicity-signs', title: 'Understanding Synchronicity and Signs' },
  { slug: 'sound-healing', title: 'Sound Healing for the Sensitive Nervous System' },
  { slug: 'past-lives-regression', title: 'Past Lives and Present Intuition' },
  { slug: 'spiritual-awakening-stages', title: 'Stages of Spiritual Awakening' },
  { slug: 'hsp-traits', title: 'Are You an HSP or an Empath?' },
  { slug: 'intuition-journaling', title: 'Journaling to Unlock Intuition' },
  { slug: 'nature-healing', title: 'Nature as the Ultimate Healer for Sensitives' },
  { slug: 'collective-consciousness', title: 'Tapping into Collective Consciousness' },
  { slug: 'psychometry', title: 'Psychometry: Reading Energy from Objects' },
  { slug: 'remote-viewing', title: 'Introduction to Remote Viewing' },
  { slug: 'pendulum-dowsing', title: 'Pendulum Dowsing for Beginners' },
  { slug: 'lucid-dreaming', title: 'Lucid Dreaming and Psychic Development' },
  { slug: 'energy-healing', title: 'Energy Healing Basics for Intuitives' },
  { slug: 'moon-cycles-intuition', title: 'Moon Cycles and Intuitive Rhythms' },
  { slug: 'oracle-cards', title: 'Reading Oracle Cards Intuitively' },
  { slug: 'spirit-guides', title: 'Connecting with Your Spirit Guides' },
];

async function seed() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error('ERROR: DATABASE_URL not set');
    process.exit(1);
  }
  
  const pool = new pg.Pool({ connectionString, ssl: connectionString.includes('sslmode=require') ? { rejectUnauthorized: false } : false });
  
  console.log('Creating schema...');
  await pool.query(`
    CREATE TABLE IF NOT EXISTS articles (
      id SERIAL PRIMARY KEY,
      slug VARCHAR(255) UNIQUE NOT NULL,
      title TEXT NOT NULL,
      meta_description TEXT,
      og_title TEXT,
      og_description TEXT,
      category VARCHAR(100),
      tags TEXT[],
      body TEXT NOT NULL,
      image_url TEXT,
      image_alt TEXT,
      reading_time INTEGER DEFAULT 8,
      author VARCHAR(100) DEFAULT 'Kalesh',
      published BOOLEAN DEFAULT true,
      published_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW(),
      word_count INTEGER,
      asins_used TEXT[],
      last_refreshed_30d TIMESTAMPTZ,
      last_refreshed_90d TIMESTAMPTZ,
      opener_type VARCHAR(50),
      conclusion_type VARCHAR(50)
    );
    CREATE INDEX IF NOT EXISTS idx_articles_slug ON articles(slug);
    CREATE INDEX IF NOT EXISTS idx_articles_category ON articles(category);
    CREATE INDEX IF NOT EXISTS idx_articles_published_at ON articles(published_at DESC);
    
    CREATE TABLE IF NOT EXISTS quizzes (
      id SERIAL PRIMARY KEY,
      slug VARCHAR(255) UNIQUE NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      questions JSONB NOT NULL,
      results JSONB NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);
  
  console.log('Seeding articles...');
  let count = 0;
  
  for (const article of ARTICLES.slice(0, 30)) {
    const category = CATEGORY_MAP[article.slug] || 'psychic-development';
    const imageUrl = cdnUrls[article.slug] || `${BUNNY}/images/articles/default-hero.webp`;
    const { meta, body } = generateArticleContent(article.title, article.slug, category);
    const wordCount = body.replace(/<[^>]*>/g, '').split(/\s+/).length;
    const readingTime = Math.max(5, Math.ceil(wordCount / 200));
    
    await pool.query(`
      INSERT INTO articles (slug, title, meta_description, og_title, og_description, category, tags, body, image_url, image_alt, reading_time, author, published, word_count)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      ON CONFLICT (slug) DO UPDATE SET
        title = EXCLUDED.title,
        meta_description = EXCLUDED.meta_description,
        body = EXCLUDED.body,
        image_url = EXCLUDED.image_url,
        updated_at = NOW()
    `, [
      article.slug,
      article.title,
      meta,
      article.title + ' | The Bright Wound',
      meta,
      category,
      [category, 'intuition', 'psychic-development'],
      body,
      imageUrl,
      article.title,
      readingTime,
      'Kalesh',
      true,
      wordCount
    ]);
    
    count++;
    console.log(`  [${count}/30] ${article.slug}`);
  }
  
  console.log(`\nSeeded ${count} articles successfully.`);
  await pool.end();
  process.exit(0);
}

seed().catch(e => {
  console.error(e);
  process.exit(1);
});
