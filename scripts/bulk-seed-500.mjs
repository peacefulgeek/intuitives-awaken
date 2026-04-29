/**
 * Bulk Seed Script (500 Topics)
 * Generates 500 topics across 5 categories and inserts them into the DB
 * with status = 'queued'.
 */
import pg from 'pg';

const { Pool } = pg;

function getDb() {
  return new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL?.includes('sslmode=require') ? { rejectUnauthorized: false } : false,
  });
}

function slugify(title) {
  return title.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').slice(0, 80);
}

const CATEGORIES = ['empath', 'intuition', 'psychic-development', 'nervous-system', 'grounding'];

// Base patterns to generate 500 unique topics
const PATTERNS = [
  "Why [Group] Struggle With [Issue]",
  "The Difference Between [Concept] and [Concept]",
  "How to Stop [Action] When You're [State]",
  "Signs You're a [Type] Without Knowing It",
  "The Science Behind [Phenomenon]",
  "How to Develop Your [Skill] Safely",
  "What Happens When You Ignore Your [Sense]",
  "How to Read [Element] in a Room",
  "The Relationship Between [Concept] and [Concept]",
  "Practical Exercises for [Goal]"
];

const NOUNS = [
  { group: 'Empaths', issue: 'Overwhelm', concept: 'Intuition', action: 'Absorbing Energy', state: 'Sensitive', type: 'Natural Healer', phenomenon: 'Gut Feelings', skill: 'Clairvoyance', sense: 'Inner Voice', element: 'Energy', goal: 'Grounding' },
  { group: 'Highly Sensitive People', issue: 'Crowds', concept: 'Anxiety', action: 'Overthinking', state: 'Drained', type: 'Psychic Medium', phenomenon: 'Energy Transference', skill: 'Clairsentience', sense: 'Gut Instinct', element: 'Auras', goal: 'Energy Protection' },
  { group: 'Intuitives', issue: 'Boundaries', concept: 'Hypervigilance', action: 'People Pleasing', state: 'UnGrounded', type: 'Empath', phenomenon: 'Synchronicity', skill: 'Clairaudience', sense: 'Psychic Hits', element: 'Vibrations', goal: 'Chakra Balancing' },
  { group: 'Healers', issue: 'Burnout', concept: 'Empathy', action: 'Taking on Pain', state: 'Triggered', type: 'Energy Reader', phenomenon: 'Telepathy', skill: 'Psychometry', sense: 'Spirit Guides', element: 'Emotional Imprints', goal: 'Shielding' },
  { group: 'Lightworkers', issue: 'Narcissists', concept: 'Paranoia', action: 'Fixing Others', state: 'Exhausted', type: 'Claircognizant', phenomenon: 'Precognition', skill: 'Remote Viewing', sense: 'Third Eye', element: 'Chakras', goal: 'Aura Cleansing' }
];

export async function seedQueue() {
  const db = getDb();
  try {
    const topics = [];
    
    // Generate 500 unique topics
    for (let i = 0; i < 500; i++) {
      const pattern = PATTERNS[i % PATTERNS.length];
      const nounSet = NOUNS[Math.floor(i / PATTERNS.length) % NOUNS.length];
      const category = CATEGORIES[i % CATEGORIES.length];
      
      let title = pattern
        .replace('[Group]', nounSet.group)
        .replace('[Issue]', nounSet.issue)
        .replace('[Concept]', nounSet.concept)
        .replace('[Action]', nounSet.action)
        .replace('[State]', nounSet.state)
        .replace('[Type]', nounSet.type)
        .replace('[Phenomenon]', nounSet.phenomenon)
        .replace('[Skill]', nounSet.skill)
        .replace('[Sense]', nounSet.sense)
        .replace('[Element]', nounSet.element)
        .replace('[Goal]', nounSet.goal);
        
      // Add variation to ensure uniqueness
      if (i >= PATTERNS.length * NOUNS.length) {
        title += ` (Part ${Math.floor(i / (PATTERNS.length * NOUNS.length)) + 1})`;
      }
      
      topics.push({ title, category });
    }

    console.log(`[bulk-seed] Generated ${topics.length} topics. Inserting into DB...`);
    
    let inserted = 0;
    for (const topic of topics) {
      const slug = slugify(topic.title);
      try {
        await db.query(
          `INSERT INTO articles (slug, title, category, body, status, queued_at)
           VALUES ($1, $2, $3, '', 'queued', NOW() + (INTERVAL '1 minute' * $4))
           ON CONFLICT (slug) DO NOTHING`,
          [slug, topic.title, topic.category, inserted]
        );
        inserted++;
      } catch (err) {
        // Ignore duplicates
      }
    }
    
    console.log(`[bulk-seed] Successfully queued ${inserted} articles.`);
  } catch (err) {
    console.error('[bulk-seed] Error:', err);
  } finally {
    await db.end();
  }
}

if (process.argv[1] === new URL(import.meta.url).pathname) {
  seedQueue().catch(console.error);
}
