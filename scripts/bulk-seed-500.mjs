/**
 * Bulk Seed Script -- 500 Articles
 *
 * Per ADDENDUMSCOPENOCLAUDE.md Section 5:
 * - Generates 500 unique, niche-specific articles via DeepSeek V4-Pro
 * - Each article passes the Paul Voice Gate (Section 6)
 * - Inserts into DB with status = 'queued'
 * - Cron will publish them one at a time
 *
 * Usage:
 *   DATABASE_URL=... OPENAI_API_KEY=... node scripts/bulk-seed-500.mjs
 *
 * DigitalOcean: Run as a console command after first deploy.
 */

import pg from 'pg';
import OpenAI from 'openai';
import { runQualityGate, fixEmDashes } from '../src/lib/article-quality-gate.mjs';
import { assignHeroImage } from '../src/lib/bunny-image-library.mjs';
import { ASIN_POOL, AMAZON_TAG } from '../src/data/asin-pool.mjs';

const { Pool } = pg;

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: process.env.OPENAI_BASE_URL || 'https://api.deepseek.com',
});
const MODEL = process.env.OPENAI_MODEL || 'deepseek-v4-pro';
const MAX_ATTEMPTS = 4;
const DELAY_MS = 1200;

function getDb() {
  return new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL?.includes('sslmode=require') ? { rejectUnauthorized: false } : false,
  });
}

function slugify(title) {
  return title.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').slice(0, 80);
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

const TOPICS = [
  { title: "Why Empaths Absorb Other People's Pain Without Trying", category: 'empath' },
  { title: "How to Stop Taking On Other People's Emotions in Crowded Spaces", category: 'empath' },
  { title: "The Empath's Guide to Saying No Without Guilt", category: 'empath' },
  { title: "Why Empaths Attract Narcissists and How to Break the Pattern", category: 'empath' },
  { title: "How to Know If You're an Empath or Just Highly Anxious", category: 'empath' },
  { title: "The Physical Symptoms of Being an Overwhelmed Empath", category: 'empath' },
  { title: "Why Empaths Need More Alone Time Than Most People", category: 'empath' },
  { title: "How Empaths Can Protect Their Energy at Work", category: 'empath' },
  { title: "The Difference Between Empathy and Codependency", category: 'empath' },
  { title: "Why Empaths Often Feel Responsible for Other People's Moods", category: 'empath' },
  { title: "How to Ground Yourself After Absorbing Someone Else's Emotional Pain", category: 'empath' },
  { title: "The Empath's Relationship With Anger: Why It Feels Dangerous", category: 'empath' },
  { title: "Why Empaths Often Become Healers, Therapists, and Teachers", category: 'empath' },
  { title: "How to Set Energetic Boundaries Without Shutting People Out", category: 'empath' },
  { title: "The Empath's Guide to Navigating Family Gatherings", category: 'empath' },
  { title: "Why Empaths Often Feel Exhausted After Social Interactions", category: 'empath' },
  { title: "How to Tell If Your Tiredness Is Physical or Energetic", category: 'empath' },
  { title: "The Empath's Relationship With Food and Eating", category: 'empath' },
  { title: "Why Empaths Often Struggle With Chronic Pain", category: 'empath' },
  { title: "How Empaths Can Thrive in Romantic Relationships", category: 'empath' },
  { title: "The Empath's Guide to Parenting a Sensitive Child", category: 'empath' },
  { title: "Why Empaths Often Feel Like They Don't Belong Anywhere", category: 'empath' },
  { title: "How to Stop Being an Emotional Sponge and Start Being a Witness", category: 'empath' },
  { title: "The Empath's Relationship With Animals and Nature", category: 'empath' },
  { title: "Why Empaths Often Have Vivid, Emotionally Intense Dreams", category: 'empath' },
  { title: "How to Recognize When You're in Empath Burnout", category: 'empath' },
  { title: "The Empath's Guide to Recovering After a Toxic Relationship", category: 'empath' },
  { title: "Why Empaths Often Struggle With Decision-Making", category: 'empath' },
  { title: "How to Use Your Empathy as a Strength Instead of a Liability", category: 'empath' },
  { title: "The Empath's Guide to Meditation and Why Standard Techniques Often Fail", category: 'empath' },
  { title: "Why Empaths Often Feel Other People's Physical Pain in Their Own Bodies", category: 'empath' },
  { title: "How to Create a Sanctuary Space That Actually Restores Your Energy", category: 'empath' },
  { title: "The Empath's Relationship With Social Media and Why It's Draining", category: 'empath' },
  { title: "Why Empaths Often Struggle With Addiction and Numbing Behaviors", category: 'empath' },
  { title: "How to Distinguish Your Own Feelings From Absorbed Emotions", category: 'empath' },
  { title: "The Empath's Guide to Grief: When You Feel Everyone Else's Loss Too", category: 'empath' },
  { title: "Why Empaths Often Have Difficulty Watching the News", category: 'empath' },
  { title: "How to Work in Healthcare or Social Services as an Empath", category: 'empath' },
  { title: "The Empath's Guide to Friendships That Actually Nourish You", category: 'empath' },
  { title: "Why Empaths Often Feel Pulled to Help People Who Don't Want Help", category: 'empath' },
  { title: "How to Stop Fixing People and Start Trusting Their Process", category: 'empath' },
  { title: "The Empath's Relationship With Conflict and Why It Feels Unbearable", category: 'empath' },
  { title: "Why Empaths Often Feel Invisible in Group Settings", category: 'empath' },
  { title: "How to Reclaim Your Identity After Years of Absorbing Others", category: 'empath' },
  { title: "The Empath's Guide to Money and Why Scarcity Feels Personal", category: 'empath' },
  { title: "Why Empaths Often Feel Guilty for Having Good Days", category: 'empath' },
  { title: "How to Tell the Difference Between Intuition and Fear as an Empath", category: 'empath' },
  { title: "The Empath's Guide to Traveling and Staying Energetically Safe", category: 'empath' },
  { title: "Why Empaths Often Struggle With Perfectionism", category: 'empath' },
  { title: "How to Build a Daily Practice That Protects Your Sensitive System", category: 'empath' },
  { title: "The Difference Between Intuition and Anxiety: How to Tell Them Apart", category: 'intuition' },
  { title: "Why Your Gut Feeling Is Almost Always Right Even When Your Mind Disagrees", category: 'intuition' },
  { title: "How to Strengthen Your Intuition Through Daily Practice", category: 'intuition' },
  { title: "The Science Behind Why Some People Have Stronger Gut Feelings", category: 'intuition' },
  { title: "Why Ignoring Your Intuition Always Costs You Something", category: 'intuition' },
  { title: "How to Trust Your Intuition When Everyone Around You Disagrees", category: 'intuition' },
  { title: "The Relationship Between Trauma and Blocked Intuition", category: 'intuition' },
  { title: "How to Use Journaling to Develop Your Intuitive Voice", category: 'intuition' },
  { title: "Why Intuition Speaks in Symbols, Feelings, and Sudden Knowing", category: 'intuition' },
  { title: "How to Make Big Decisions Using Your Intuition", category: 'intuition' },
  { title: "The Difference Between Wishful Thinking and Genuine Intuitive Guidance", category: 'intuition' },
  { title: "Why Your Body Knows Things Your Mind Hasn't Figured Out Yet", category: 'intuition' },
  { title: "How to Quiet the Mental Noise So Your Intuition Can Speak", category: 'intuition' },
  { title: "The Role of Dreams in Intuitive Development", category: 'intuition' },
  { title: "Why Intuitive People Often Feel Like Outsiders", category: 'intuition' },
  { title: "How to Recognize a Genuine Intuitive Hit vs. Projection", category: 'intuition' },
  { title: "The Relationship Between Creativity and Intuition", category: 'intuition' },
  { title: "Why Highly Intuitive People Often Second-Guess Themselves", category: 'intuition' },
  { title: "How to Test Your Intuition Without Dismissing It", category: 'intuition' },
  { title: "The Intuitive Person's Guide to Relationships", category: 'intuition' },
  { title: "Why Intuition Is Not the Same as Psychic Ability", category: 'intuition' },
  { title: "How to Use Your Intuition in Business and Career Decisions", category: 'intuition' },
  { title: "The Physical Sensations of Intuition: What Your Body Is Telling You", category: 'intuition' },
  { title: "Why Intuition Gets Louder When You're in Danger", category: 'intuition' },
  { title: "How to Rebuild Trust in Your Intuition After Being Gaslit", category: 'intuition' },
  { title: "The Relationship Between Intuition and Emotional Intelligence", category: 'intuition' },
  { title: "Why Logical People Often Have the Hardest Time Trusting Their Gut", category: 'intuition' },
  { title: "How to Use Muscle Testing to Access Your Intuitive Body Wisdom", category: 'intuition' },
  { title: "The Intuitive Person's Guide to Parenting", category: 'intuition' },
  { title: "Why Your First Impression of Someone Is Usually Accurate", category: 'intuition' },
  { title: "How to Distinguish Intuition From Conditioning and Old Patterns", category: 'intuition' },
  { title: "The Role of Silence in Developing Intuitive Clarity", category: 'intuition' },
  { title: "Why Intuition Often Comes Through the Least Expected Channel", category: 'intuition' },
  { title: "How to Develop Claircognizance: The Gift of Sudden Knowing", category: 'intuition' },
  { title: "The Intuitive Person's Guide to Navigating Uncertainty", category: 'intuition' },
  { title: "Why Overthinking Is the Enemy of Intuition", category: 'intuition' },
  { title: "How to Use Nature to Reconnect With Your Intuitive Self", category: 'intuition' },
  { title: "The Relationship Between Intuition and Synchronicity", category: 'intuition' },
  { title: "Why Intuitive People Often Know Things Before They Happen", category: 'intuition' },
  { title: "How to Create a Morning Practice That Activates Your Intuition", category: 'intuition' },
  { title: "The Intuitive Person's Guide to Setting Boundaries", category: 'intuition' },
  { title: "Why Your Intuition Is Strongest When You're Fully Rested", category: 'intuition' },
  { title: "How to Use Tarot as an Intuitive Development Tool", category: 'intuition' },
  { title: "The Relationship Between Intuition and the Subconscious Mind", category: 'intuition' },
  { title: "Why Intuition Is a Skill You Can Develop, Not Just a Gift You Have", category: 'intuition' },
  { title: "How to Recognize When You're Overriding Your Intuition", category: 'intuition' },
  { title: "The Intuitive Person's Guide to Healing From Loss", category: 'intuition' },
  { title: "Why Intuition Often Contradicts What You Want to Hear", category: 'intuition' },
  { title: "How to Use Pendulum Work to Access Your Intuitive Guidance", category: 'intuition' },
  { title: "The Intuitive Person's Guide to Trusting the Timing of Your Life", category: 'intuition' },
  { title: "How to Develop Clairvoyance Without Losing Your Grounded Mind", category: 'psychic-development' },
  { title: "The Four Clairs: Which One Is Your Dominant Psychic Sense", category: 'psychic-development' },
  { title: "How to Open Your Third Eye Safely and Without Overwhelm", category: 'psychic-development' },
  { title: "The Difference Between Psychic Ability and Spiritual Awakening", category: 'psychic-development' },
  { title: "How to Read Auras: A Practical Guide for Beginners", category: 'psychic-development' },
  { title: "Why Psychic Development Requires Emotional Healing First", category: 'psychic-development' },
  { title: "How to Develop Clairaudience: Hearing Beyond the Physical", category: 'psychic-development' },
  { title: "The Relationship Between Psychic Sensitivity and Childhood Trauma", category: 'psychic-development' },
  { title: "How to Practice Psychometry: Reading Objects and Spaces", category: 'psychic-development' },
  { title: "Why Psychic Ability Often Runs in Families", category: 'psychic-development' },
  { title: "How to Develop Your Mediumship Abilities Responsibly", category: 'psychic-development' },
  { title: "The Psychic Person's Guide to Protecting Their Energy", category: 'psychic-development' },
  { title: "How to Use Crystals to Support Psychic Development", category: 'psychic-development' },
  { title: "Why Psychic Development Requires a Strong Nervous System", category: 'psychic-development' },
  { title: "How to Distinguish Psychic Information From Your Own Thoughts", category: 'psychic-development' },
  { title: "The Role of Meditation in Psychic Development", category: 'psychic-development' },
  { title: "How to Develop Remote Viewing Skills", category: 'psychic-development' },
  { title: "Why Psychic Ability Is Not Supernatural: The Science Behind It", category: 'psychic-development' },
  { title: "How to Use Oracle Cards as a Psychic Development Tool", category: 'psychic-development' },
  { title: "The Psychic Person's Guide to Discernment", category: 'psychic-development' },
  { title: "How to Develop Clairsentience: Feeling Beyond the Physical", category: 'psychic-development' },
  { title: "Why Psychic Development Can Trigger a Dark Night of the Soul", category: 'psychic-development' },
  { title: "How to Work With Spirit Guides Without Losing Your Grounding", category: 'psychic-development' },
  { title: "The Psychic Person's Guide to Sleep and Dreaming", category: 'psychic-development' },
  { title: "How to Develop Precognition: Sensing Future Events", category: 'psychic-development' },
  { title: "Why Psychic People Often Struggle With Conventional Religion", category: 'psychic-development' },
  { title: "How to Use Automatic Writing for Psychic Development", category: 'psychic-development' },
  { title: "The Relationship Between Psychic Ability and the Pineal Gland", category: 'psychic-development' },
  { title: "How to Develop Telepathy: Sensing Other People's Thoughts", category: 'psychic-development' },
  { title: "Why Psychic Development Is a Lifelong Practice, Not a Destination", category: 'psychic-development' },
  { title: "How to Use Sound Healing to Open Your Psychic Channels", category: 'psychic-development' },
  { title: "The Psychic Person's Guide to Relationships and Compatibility", category: 'psychic-development' },
  { title: "How to Develop Your Ability to Read Energy Fields", category: 'psychic-development' },
  { title: "Why Psychic Ability Increases After Major Life Transitions", category: 'psychic-development' },
  { title: "How to Use Lucid Dreaming for Psychic Development", category: 'psychic-development' },
  { title: "The Psychic Person's Guide to Working With the Moon", category: 'psychic-development' },
  { title: "How to Develop Your Ability to Sense Collective Consciousness", category: 'psychic-development' },
  { title: "Why Psychic Development Requires Shadow Work", category: 'psychic-development' },
  { title: "How to Use Past Life Regression to Understand Your Psychic Gifts", category: 'psychic-development' },
  { title: "The Psychic Person's Guide to Navigating Skeptics", category: 'psychic-development' },
  { title: "How to Develop Your Ability to Sense Emotional Imprints in Spaces", category: 'psychic-development' },
  { title: "Why Psychic People Often Feel Called to Service", category: 'psychic-development' },
  { title: "How to Use Breathwork to Access Psychic States", category: 'psychic-development' },
  { title: "The Psychic Person's Guide to Handling Unwanted Information", category: 'psychic-development' },
  { title: "How to Develop Your Ability to Read Chakras", category: 'psychic-development' },
  { title: "Why Psychic Development Requires Physical Grounding", category: 'psychic-development' },
  { title: "How to Use Dowsing to Access Psychic Guidance", category: 'psychic-development' },
  { title: "The Psychic Person's Guide to Ethical Practice", category: 'psychic-development' },
  { title: "How to Develop Your Ability to Sense Spirit Presence", category: 'psychic-development' },
  { title: "Why Psychic Development Is Different for Everyone", category: 'psychic-development' },
  { title: "Why Sensitive People Have Overactive Nervous Systems", category: 'nervous-system' },
  { title: "The Connection Between High Sensitivity and the Vagus Nerve", category: 'nervous-system' },
  { title: "How to Regulate Your Nervous System When You're Overwhelmed", category: 'nervous-system' },
  { title: "Why Sensitive People Often Struggle With Chronic Fatigue", category: 'nervous-system' },
  { title: "The Relationship Between Sensory Processing Sensitivity and Psychic Ability", category: 'nervous-system' },
  { title: "How to Use Somatic Practices to Calm an Overstimulated Nervous System", category: 'nervous-system' },
  { title: "Why Sensitive People Often Have Digestive Issues", category: 'nervous-system' },
  { title: "The Nervous System's Role in Psychic Perception", category: 'nervous-system' },
  { title: "How to Build Nervous System Resilience as a Sensitive Person", category: 'nervous-system' },
  { title: "Why Sensitive People Often Have Difficulty With Loud Noises and Bright Lights", category: 'nervous-system' },
  { title: "The Relationship Between Anxiety and Psychic Sensitivity", category: 'nervous-system' },
  { title: "How to Use Cold Exposure to Regulate Your Sensitive Nervous System", category: 'nervous-system' },
  { title: "Why Sensitive People Often Have Stronger Reactions to Caffeine and Alcohol", category: 'nervous-system' },
  { title: "The Nervous System's Response to Emotional Overwhelm", category: 'nervous-system' },
  { title: "How to Use Breathwork to Regulate Your Nervous System", category: 'nervous-system' },
  { title: "Why Sensitive People Often Have Difficulty Sleeping", category: 'nervous-system' },
  { title: "The Relationship Between the Gut-Brain Axis and Psychic Sensitivity", category: 'nervous-system' },
  { title: "How to Use Movement to Discharge Nervous System Activation", category: 'nervous-system' },
  { title: "Why Sensitive People Often Have Stronger Immune Responses", category: 'nervous-system' },
  { title: "The Nervous System's Role in Trauma and Healing", category: 'nervous-system' },
  { title: "How to Use Nature Immersion to Regulate Your Nervous System", category: 'nervous-system' },
  { title: "Why Sensitive People Often Have Difficulty With Change", category: 'nervous-system' },
  { title: "The Relationship Between Highly Sensitive People and Chronic Illness", category: 'nervous-system' },
  { title: "How to Use Sound Therapy to Regulate Your Nervous System", category: 'nervous-system' },
  { title: "Why Sensitive People Often Have Stronger Reactions to Medications", category: 'nervous-system' },
  { title: "The Nervous System's Response to Collective Trauma", category: 'nervous-system' },
  { title: "How to Use Tapping EFT to Calm Your Sensitive Nervous System", category: 'nervous-system' },
  { title: "Why Sensitive People Often Feel Overwhelmed by Other People's Emotions", category: 'nervous-system' },
  { title: "The Relationship Between Highly Sensitive People and Autoimmune Conditions", category: 'nervous-system' },
  { title: "How to Use Yoga to Support a Sensitive Nervous System", category: 'nervous-system' },
  { title: "Why Sensitive People Often Have Difficulty With Confrontation", category: 'nervous-system' },
  { title: "The Nervous System's Role in Intuitive Perception", category: 'nervous-system' },
  { title: "How to Use Acupuncture to Support a Sensitive Nervous System", category: 'nervous-system' },
  { title: "Why Sensitive People Often Have Difficulty With Transitions", category: 'nervous-system' },
  { title: "The Relationship Between Highly Sensitive People and Fibromyalgia", category: 'nervous-system' },
  { title: "How to Use Massage to Regulate Your Sensitive Nervous System", category: 'nervous-system' },
  { title: "Why Sensitive People Often Have Stronger Reactions to Emotional Movies", category: 'nervous-system' },
  { title: "The Nervous System's Response to Spiritual Experiences", category: 'nervous-system' },
  { title: "How to Use Herbal Medicine to Support a Sensitive Nervous System", category: 'nervous-system' },
  { title: "Why Sensitive People Often Have Difficulty With Multitasking", category: 'nervous-system' },
  { title: "The Relationship Between Highly Sensitive People and ADHD", category: 'nervous-system' },
  { title: "How to Use Nutrition to Support a Sensitive Nervous System", category: 'nervous-system' },
  { title: "Why Sensitive People Often Have Stronger Reactions to Conflict", category: 'nervous-system' },
  { title: "The Nervous System's Role in Empathic Ability", category: 'nervous-system' },
  { title: "How to Use Sleep Hygiene to Support a Sensitive Nervous System", category: 'nervous-system' },
  { title: "Why Sensitive People Often Have Difficulty With Open-Plan Offices", category: 'nervous-system' },
  { title: "The Relationship Between Highly Sensitive People and Migraines", category: 'nervous-system' },
  { title: "How to Use Journaling to Process Nervous System Activation", category: 'nervous-system' },
  { title: "Why Sensitive People Often Have Stronger Reactions to Injustice", category: 'nervous-system' },
  { title: "The Nervous System's Response to Psychic Development Practices", category: 'nervous-system' },
  { title: "The Empath's Complete Guide to Grounding Practices That Actually Work", category: 'grounding' },
  { title: "Why Grounding Is the Foundation of All Psychic Development", category: 'grounding' },
  { title: "How to Ground Yourself in Five Minutes When You're Overwhelmed", category: 'grounding' },
  { title: "The Difference Between Grounding and Dissociation", category: 'grounding' },
  { title: "Why Sensitive People Often Feel Ungrounded and Floaty", category: 'grounding' },
  { title: "How to Use Earth Connection to Restore Your Energy", category: 'grounding' },
  { title: "The Relationship Between Grounding and Psychic Protection", category: 'grounding' },
  { title: "How to Create a Grounding Practice That Fits Your Life", category: 'grounding' },
  { title: "Why Grounding Is Different for Empaths Than for Everyone Else", category: 'grounding' },
  { title: "How to Use Crystals for Grounding and Energetic Protection", category: 'grounding' },
  { title: "The Relationship Between Grounding and Emotional Regulation", category: 'grounding' },
  { title: "How to Ground Yourself Before and After Psychic Work", category: 'grounding' },
  { title: "Why Grounding Practices Often Feel Boring to Sensitive People", category: 'grounding' },
  { title: "How to Use Food and Eating as a Grounding Practice", category: 'grounding' },
  { title: "The Relationship Between Grounding and Physical Health", category: 'grounding' },
  { title: "How to Use Walking as a Grounding Practice", category: 'grounding' },
  { title: "Why Grounding Is Essential for Empaths in Relationships", category: 'grounding' },
  { title: "How to Use Visualization for Grounding When You Can't Get Outside", category: 'grounding' },
  { title: "The Relationship Between Grounding and Manifestation", category: 'grounding' },
  { title: "How to Use Breathwork for Grounding", category: 'grounding' },
  { title: "Why Grounding Practices Need to Change With the Seasons", category: 'grounding' },
  { title: "How to Use Water for Grounding and Energy Clearing", category: 'grounding' },
  { title: "The Relationship Between Grounding and Creativity", category: 'grounding' },
  { title: "How to Use Physical Exercise as a Grounding Practice", category: 'grounding' },
  { title: "Why Grounding Is the First Step in Any Healing Practice", category: 'grounding' },
  { title: "How to Use Sound and Music for Grounding", category: 'grounding' },
  { title: "The Relationship Between Grounding and Boundaries", category: 'grounding' },
  { title: "How to Use Cooking and Gardening as Grounding Practices", category: 'grounding' },
  { title: "Why Grounding Practices Often Feel Counterintuitive to Spiritual People", category: 'grounding' },
  { title: "How to Use Scent and Aromatherapy for Grounding", category: 'grounding' },
  { title: "The Relationship Between Grounding and Sleep Quality", category: 'grounding' },
  { title: "How to Use Yoga for Grounding and Centering", category: 'grounding' },
  { title: "Why Grounding Is Essential for Psychic Development", category: 'grounding' },
  { title: "How to Use Journaling as a Grounding Practice", category: 'grounding' },
  { title: "The Relationship Between Grounding and Anxiety Management", category: 'grounding' },
  { title: "How to Use Bodywork and Massage for Grounding", category: 'grounding' },
  { title: "Why Grounding Practices Are Different for Different Body Types", category: 'grounding' },
  { title: "How to Use Ritual and Ceremony for Grounding", category: 'grounding' },
  { title: "The Relationship Between Grounding and Spiritual Protection", category: 'grounding' },
  { title: "How to Use Animal Connection for Grounding", category: 'grounding' },
  { title: "Why Grounding Practices Need to Be Consistent to Work", category: 'grounding' },
  { title: "How to Use Art and Creativity for Grounding", category: 'grounding' },
  { title: "The Relationship Between Grounding and Intuitive Accuracy", category: 'grounding' },
  { title: "How to Use Cold Water Immersion for Grounding", category: 'grounding' },
  { title: "Why Grounding Is the Most Underrated Psychic Development Practice", category: 'grounding' },
  { title: "How to Use Earthing and Barefoot Walking for Grounding", category: 'grounding' },
  { title: "The Relationship Between Grounding and Emotional Stability", category: 'grounding' },
  { title: "How to Use Chanting and Toning for Grounding", category: 'grounding' },
  { title: "Why Grounding Practices Are Essential for Sensitive Children", category: 'grounding' },
  { title: "How to Build a Complete Grounding Toolkit for Sensitive People", category: 'grounding' },
];

async function generateArticle(title, category, asins) {
  const asinLinks = asins.map(asin =>
    `<a href="https://www.amazon.com/dp/${asin}?tag=${AMAZON_TAG}" target="_blank" rel="nofollow sponsored">See on Amazon (paid link)</a>`
  );

  const systemPrompt = `You are Kalesh, a grounded, direct teacher of psychic development and intuitive sensitivity. You write for people who feel things deeply and have been told their whole lives that something is wrong with them. Nothing is wrong with them.

VOICE RULES (non-negotiable):
- Direct address: "you" throughout
- Contractions everywhere: don't, can't, it's, you're, they're
- Compassionate but never saccharine - honest, not fluffy
- Include 2-3 conversational markers exactly as written: "Right?!", "Know what I mean?", "Does that land?", "How does that make you feel?"
- No academic distance. Write like you're talking to someone across a table.

BANNED WORDS (reject if any appear):
utilize, delve, tapestry, landscape, paradigm, synergy, leverage, unlock, empower, pivotal, embark, underscore, paramount, seamlessly, robust, beacon, foster, elevate, curate, curated, bespoke, resonate, harness, intricate, plethora, myriad, groundbreaking, innovative, cutting-edge, state-of-the-art, game-changer, ever-evolving, rapidly-evolving, stakeholders, navigate, ecosystem, framework, comprehensive, transformative, holistic, nuanced, multifaceted, profound, furthermore

BANNED PHRASES (reject if any appear):
"it's important to note that", "it's worth noting that", "in conclusion", "in summary", "a holistic approach", "in the realm of", "dive deep into", "at the end of the day", "in today's fast-paced world", "plays a crucial role"

FORMATTING:
- Output clean HTML only (h2, h3, p, ul, li, blockquote, strong, em)
- No markdown, no code fences
- Use " - " (hyphen with spaces) instead of em-dashes or en-dashes
- Word count: 1,400-2,000 words
- Include exactly ${asins.length} Amazon affiliate links placed naturally:
${asinLinks.map((l, i) => `  ${i + 1}. ${l}`).join('\n')}
- End with a short paragraph linking to /assessment or /quiz
- Include one blockquote capturing the core insight`;

  const response = await client.chat.completions.create({
    model: MODEL,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `Write a complete article for: "${title}"\nCategory: ${category}\nSite: intuitivesawaken.com - "The Bright Wound"\nStart directly with the first <p> or <h2>. No <html>/<head>/<body> tags.` },
    ],
    temperature: 0.72,
  });

  return response.choices[0].message.content || '';
}

async function main() {
  if (!process.env.DATABASE_URL) { console.error('[bulk-seed] DATABASE_URL required'); process.exit(1); }
  if (!process.env.OPENAI_API_KEY) { console.error('[bulk-seed] OPENAI_API_KEY required'); process.exit(1); }

  const db = getDb();
  const uniqueAsins = [...new Set(ASIN_POOL)];

  const { rows: existing } = await db.query('SELECT slug FROM articles');
  const usedSlugs = new Set(existing.map(r => r.slug));

  let queued = 0, skipped = 0, failed = 0;
  console.log(`[bulk-seed] Starting. ${TOPICS.length} topics. ${usedSlugs.size} already in DB.`);

  for (let i = 0; i < TOPICS.length; i++) {
    const { title, category } = TOPICS[i];
    const slug = slugify(title);

    if (usedSlugs.has(slug)) { skipped++; continue; }

    console.log(`[bulk-seed] ${i + 1}/${TOPICS.length}: "${title}"`);

    const shuffled = [...uniqueAsins].sort(() => Math.random() - 0.5);
    const asins = shuffled.slice(0, 3 + Math.floor(Math.random() * 2));

    let body = '', gateResult = null;

    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
      try {
        body = await generateArticle(title, category, asins);
        body = fixEmDashes(body);
        gateResult = runQualityGate(body);
        if (gateResult.passed) {
          console.log(`  OK Gate passed (${gateResult.wordCount} words, ${gateResult.amazonLinks} links)`);
          break;
        } else {
          console.warn(`  FAIL Attempt ${attempt}: ${gateResult.failures.join(', ')}`);
          body = '';
        }
      } catch (err) {
        console.error(`  ERROR Attempt ${attempt}: ${err.message}`);
      }
      if (attempt < MAX_ATTEMPTS) await sleep(DELAY_MS);
    }

    if (!gateResult?.passed || !body) {
      console.error(`  SKIP All ${MAX_ATTEMPTS} attempts failed.`);
      failed++;
      continue;
    }

    const imageUrl = await assignHeroImage(slug);

    try {
      await db.query(
        `INSERT INTO articles (slug, title, category, tags, body, image_url, image_alt, author, status, queued_at, updated_at, word_count, asins_used)
         VALUES ($1,$2,$3,$4,$5,$6,$7,'Kalesh','queued',NOW() + ($8 * INTERVAL '1 second'),NOW(),$9,$10)
         ON CONFLICT (slug) DO NOTHING`,
        [slug, title, category, [category, 'intuition', 'sensitivity'], body, imageUrl,
         `${title} - intuitivesawaken.com`, queued * 60, gateResult.wordCount, asins]
      );
      queued++;
      usedSlugs.add(slug);
    } catch (err) {
      console.error(`  DB ERROR: ${err.message}`);
      failed++;
    }

    await sleep(DELAY_MS);
  }

  console.log(`\n[bulk-seed] Complete. Queued: ${queued} | Skipped: ${skipped} | Failed: ${failed}`);
  await db.end();
}

main().catch(err => { console.error('[bulk-seed] Fatal:', err); process.exit(1); });
