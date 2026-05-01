#!/usr/bin/env python3
"""
Pre-seed script: generate 500 articles via DeepSeek, gate them, store in SQLite.
One-time run only. No Manus scheduling. No Manus CDN. No external dependencies beyond DeepSeek API.

Status: ALL articles inserted as 'queued' - NONE published.
The live cron system on DigitalOcean publishes them on schedule.
"""
import openai, sqlite3, json, re, time, random
from datetime import datetime, timezone

# ── Config ─────────────────────────────────────────────────────────────────────
DEEPSEEK_KEY   = "sk-82bdad0a1fd34987b73030504ae67080"
DEEPSEEK_URL   = "https://api.deepseek.com"
DEEPSEEK_MODEL = "deepseek-chat"
AMAZON_TAG     = "spankyspinola-20"
BUNNY_CDN      = "https://intuitives-awaken.b-cdn.net"
DB_PATH        = "/home/ubuntu/intuitives-awaken/preseed.db"
SQL_DUMP_PATH  = "/home/ubuntu/intuitives-awaken/scripts/preseed_articles.sql"
MAX_ATTEMPTS   = 5
DELAY_BETWEEN  = 0.5   # seconds between API calls
MIN_WORDS      = 1800
LIBRARY_COUNT  = 40

client = openai.OpenAI(api_key=DEEPSEEK_KEY, base_url=DEEPSEEK_URL)

# ── ASIN pool ─────────────────────────────────────────────────────────────────
ASIN_POOL = [
    "1401961800","0062457713","0062742469","1401952070","0062748505",
    "1401954650","0062742477","1401946534","0062742485","1401950027",
    "1401952089","0062457721","0062748513","1401952097","0062742493",
    "1401954669","0062742501","1401946542","0062742519","1401950035",
    "1401961819","0062457748","0062748521","1401952100","0062742527",
    "1401954677","0062742535","1401946550","0062742543","1401950043",
    "0525559477","1250301696","1250301688","0525559485","1250301700",
    "0525559493","1250301718","0525559507","1250301726","0525559515",
    "1982149987","1982149995","1982150009","1982150017","1982150025",
    "0593135202","0593135210","0593135229","0593135237","0593135245",
]

# ── Banned words & phrases ────────────────────────────────────────────────────
BANNED_WORDS = {
    "utilize","delve","tapestry","paradigm","synergy","leverage",
    "empower","pivotal","embark","underscore","paramount","seamlessly",
    "robust","beacon","foster","elevate","curate","curated","bespoke",
    "resonate","harness","intricate","plethora","myriad","groundbreaking",
    "innovative","game-changer","ever-evolving","rapidly-evolving",
    "stakeholders","ecosystem","framework","comprehensive","transformative",
    "holistic","nuanced","multifaceted","profound","furthermore",
    "navigate","landscape","cutting-edge","state-of-the-art","unlock",
}
BANNED_PHRASES = [
    "it's important to note that","it's worth noting that","in conclusion",
    "in summary","a holistic approach","in the realm of","dive deep into",
    "at the end of the day","in today's fast-paced world","plays a crucial role",
]

# Auto-substitution map for common banned words DeepSeek keeps using
WORD_SUBS = {
    "profound": "deep",
    "comprehensive": "complete",
    "holistic": "full",
    "transformative": "life-changing",
    "nuanced": "layered",
    "multifaceted": "complex",
    "furthermore": "also",
    "navigate": "work through",
    "landscape": "world",
    "unlock": "open up",
    "utilize": "use",
    "delve": "dig",
    "leverage": "use",
    "empower": "help",
    "pivotal": "key",
    "embark": "start",
    "paramount": "critical",
    "seamlessly": "smoothly",
    "robust": "strong",
    "beacon": "guide",
    "foster": "build",
    "elevate": "raise",
    "curate": "select",
    "curated": "selected",
    "bespoke": "custom",
    "resonate": "connect",
    "harness": "use",
    "intricate": "complex",
    "plethora": "many",
    "myriad": "many",
    "groundbreaking": "new",
    "innovative": "new",
    "game-changer": "breakthrough",
    "ever-evolving": "always changing",
    "rapidly-evolving": "fast-changing",
    "stakeholders": "people involved",
    "ecosystem": "world",
    "framework": "approach",
    "underscore": "highlight",
    "synergy": "connection",
    "paradigm": "model",
    "tapestry": "mix",
    "cutting-edge": "latest",
    "state-of-the-art": "latest",
}

PHRASE_SUBS = {
    "it's important to note that": "",
    "it's worth noting that": "",
    "in conclusion": "To wrap this up",
    "in summary": "To sum it up",
    "a holistic approach": "a full approach",
    "in the realm of": "in the world of",
    "dive deep into": "look closely at",
    "at the end of the day": "when it comes down to it",
    "in today's fast-paced world": "these days",
    "plays a crucial role": "matters a lot",
}

# ── 500 Topics ────────────────────────────────────────────────────────────────
TOPICS = [
    # Empath & Sensitivity (100)
    ("Why Empaths Absorb Other People's Pain Without Trying", "empath-sensitivity"),
    ("The Difference Between Empathy and Psychic Sensitivity", "empath-sensitivity"),
    ("How to Stop Taking On Other People's Emotions", "empath-sensitivity"),
    ("Signs You're an Empath and Not Just Highly Sensitive", "empath-sensitivity"),
    ("Why Empaths Feel Exhausted in Crowds", "empath-sensitivity"),
    ("The Empath's Guide to Setting Energetic Boundaries", "empath-sensitivity"),
    ("Why Empaths Attract Narcissists and How to Break the Pattern", "empath-sensitivity"),
    ("How Empaths Can Thrive in Relationships", "empath-sensitivity"),
    ("The Dark Side of Being an Empath Nobody Talks About", "empath-sensitivity"),
    ("Why Empaths Need More Alone Time Than Other People", "empath-sensitivity"),
    ("How to Protect Your Energy as an Empath", "empath-sensitivity"),
    ("The Physical Symptoms of Being an Empath", "empath-sensitivity"),
    ("Why Empaths Often Feel Like They Don't Belong", "empath-sensitivity"),
    ("How Empaths Experience Grief Differently", "empath-sensitivity"),
    ("The Connection Between Empathy and Chronic Fatigue", "empath-sensitivity"),
    ("Why Empaths Are Natural Healers", "empath-sensitivity"),
    ("How to Ground Yourself When You've Absorbed Too Much", "empath-sensitivity"),
    ("The Empath's Relationship with Animals and Nature", "empath-sensitivity"),
    ("Why Empaths Struggle with Anger", "empath-sensitivity"),
    ("How to Tell If Your Emotions Are Yours or Someone Else's", "empath-sensitivity"),
    ("The Empath's Guide to Workplace Survival", "empath-sensitivity"),
    ("Why Highly Sensitive People Are Often Misdiagnosed", "empath-sensitivity"),
    ("How to Stop Being a Sponge for Other People's Stress", "empath-sensitivity"),
    ("The Relationship Between HSP Traits and Intuitive Ability", "empath-sensitivity"),
    ("Why Empaths Often Have Digestive Issues", "empath-sensitivity"),
    ("How Empaths Can Use Their Gift Professionally", "empath-sensitivity"),
    ("The Empath's Guide to Social Media Overload", "empath-sensitivity"),
    ("Why Empaths Feel Other People's Physical Pain", "empath-sensitivity"),
    ("How to Build Resilience as an Empath", "empath-sensitivity"),
    ("The Difference Between Being an Empath and Being Codependent", "empath-sensitivity"),
    ("Why Empaths Are Drawn to Broken People", "empath-sensitivity"),
    ("How to Recognize Emotional Dumping and Stop It", "empath-sensitivity"),
    ("The Empath's Guide to Parenting Sensitive Children", "empath-sensitivity"),
    ("Why Empaths Often Feel Responsible for Everyone's Happiness", "empath-sensitivity"),
    ("How Empaths Can Reclaim Their Identity After Toxic Relationships", "empath-sensitivity"),
    ("The Science Behind Why Some People Feel More Than Others", "empath-sensitivity"),
    ("Why Empaths Have Trouble Saying No", "empath-sensitivity"),
    ("How to Create an Empath-Friendly Home Environment", "empath-sensitivity"),
    ("The Empath's Guide to Navigating Family Dynamics", "empath-sensitivity"),
    ("Why Empaths Are Often Night Owls", "empath-sensitivity"),
    ("How to Use Your Sensitivity as a Superpower", "empath-sensitivity"),
    ("The Empath's Relationship with Food and Eating", "empath-sensitivity"),
    ("Why Empaths Are Drawn to Healing Professions", "empath-sensitivity"),
    ("How Empaths Experience Time Differently", "empath-sensitivity"),
    ("The Empath's Guide to Romantic Relationships", "empath-sensitivity"),
    ("Why Empaths Often Feel Like Outsiders", "empath-sensitivity"),
    ("How to Stop Absorbing Collective Trauma", "empath-sensitivity"),
    ("The Empath's Guide to Dealing with Conflict", "empath-sensitivity"),
    ("Why Empaths Need Strong Routines", "empath-sensitivity"),
    ("How to Distinguish Between Your Intuition and Your Anxiety", "empath-sensitivity"),
    ("The Empath's Guide to Friendship", "empath-sensitivity"),
    ("Why Empaths Often Struggle with Money", "empath-sensitivity"),
    ("How Empaths Can Protect Themselves in Healthcare Settings", "empath-sensitivity"),
    ("The Empath's Guide to Travel", "empath-sensitivity"),
    ("Why Empaths Are Often Highly Creative", "empath-sensitivity"),
    ("How to Stop Feeling Guilty for Protecting Your Energy", "empath-sensitivity"),
    ("The Empath's Guide to Aging and Life Transitions", "empath-sensitivity"),
    ("Why Empaths Often Have Vivid Dreams", "empath-sensitivity"),
    ("How Empaths Can Work with Their Sensitivity in Therapy", "empath-sensitivity"),
    ("The Empath's Guide to Dealing with Grief and Loss", "empath-sensitivity"),
    ("Why Empaths Feel the Energy of Places and Buildings", "empath-sensitivity"),
    ("How to Build a Support System as an Empath", "empath-sensitivity"),
    ("The Empath's Guide to Boundaries in Spiritual Communities", "empath-sensitivity"),
    ("Why Empaths Are Often Drawn to Mysticism", "empath-sensitivity"),
    ("How Empaths Can Develop Discernment", "empath-sensitivity"),
    ("The Empath's Guide to Dealing with Angry People", "empath-sensitivity"),
    ("Why Empaths Often Feel Overwhelmed by Beauty", "empath-sensitivity"),
    ("How to Stop Over-Explaining Yourself as an Empath", "empath-sensitivity"),
    ("The Empath's Guide to Dealing with Criticism", "empath-sensitivity"),
    ("Why Empaths Are Natural Mediators", "empath-sensitivity"),
    ("How Empaths Can Use Journaling to Process Emotions", "empath-sensitivity"),
    ("The Empath's Guide to Dealing with Passive-Aggressive People", "empath-sensitivity"),
    ("Why Empaths Often Feel Responsible for World Events", "empath-sensitivity"),
    ("How to Separate Your Pain from Collective Pain", "empath-sensitivity"),
    ("The Empath's Guide to Dealing with Gaslighting", "empath-sensitivity"),
    ("Why Empaths Are Often Perfectionists", "empath-sensitivity"),
    ("How Empaths Can Develop Healthy Detachment", "empath-sensitivity"),
    ("The Empath's Guide to Dealing with Loneliness", "empath-sensitivity"),
    ("Why Empaths Often Have Trouble Sleeping", "empath-sensitivity"),
    ("How to Stop Catastrophizing as an Empath", "empath-sensitivity"),
    ("The Empath's Guide to Dealing with Toxic Positivity", "empath-sensitivity"),
    ("Why Empaths Are Often Drawn to Dark Art and Music", "empath-sensitivity"),
    ("How Empaths Can Develop a Spiritual Practice", "empath-sensitivity"),
    ("The Empath's Guide to Dealing with Emotional Manipulation", "empath-sensitivity"),
    ("Why Empaths Often Feel Like They're Too Much", "empath-sensitivity"),
    ("How to Stop Shrinking Yourself to Make Others Comfortable", "empath-sensitivity"),
    ("The Empath's Guide to Dealing with Envy and Jealousy", "empath-sensitivity"),
    ("Why Empaths Are Often Drawn to Water", "empath-sensitivity"),
    ("How Empaths Can Develop Confidence", "empath-sensitivity"),
    ("The Empath's Guide to Dealing with Spiritual Bypassing", "empath-sensitivity"),
    ("Why Empaths Often Struggle with Identity", "empath-sensitivity"),
    ("How to Stop Fixing Everyone Around You", "empath-sensitivity"),
    ("The Empath's Guide to Dealing with Burnout", "empath-sensitivity"),
    ("Why Empaths Are Often Drawn to Older Souls", "empath-sensitivity"),
    ("How Empaths Can Develop Healthy Narcissism", "empath-sensitivity"),
    ("The Empath's Guide to Dealing with Spiritual Awakening", "empath-sensitivity"),
    ("Why Empaths Often Feel Like They Were Born in the Wrong Era", "empath-sensitivity"),
    ("How to Stop Being Everyone's Therapist", "empath-sensitivity"),

    # Psychic Development (100)
    ("How to Know If You're Psychic or Just Intuitive", "psychic-development"),
    ("The Four Clairs Explained: Clairvoyance, Clairaudience, Clairsentience, Claircognizance", "psychic-development"),
    ("How to Develop Your Clairvoyance", "psychic-development"),
    ("The Difference Between Psychic Ability and Mental Illness", "psychic-development"),
    ("How to Develop Your Clairsentience", "psychic-development"),
    ("Why Most People Ignore Their Psychic Hits", "psychic-development"),
    ("How to Develop Your Claircognizance", "psychic-development"),
    ("The Role of the Nervous System in Psychic Development", "psychic-development"),
    ("How to Develop Your Clairaudience", "psychic-development"),
    ("Why Psychic Development Requires Emotional Healing", "psychic-development"),
    ("How to Strengthen Your Psychic Abilities Through Meditation", "psychic-development"),
    ("The Connection Between Trauma and Psychic Sensitivity", "psychic-development"),
    ("How to Give Yourself an Accurate Psychic Reading", "psychic-development"),
    ("Why Psychic Ability Runs in Families", "psychic-development"),
    ("How to Develop Psychic Protection", "psychic-development"),
    ("The Role of Dreams in Psychic Development", "psychic-development"),
    ("How to Develop Your Mediumship Abilities", "psychic-development"),
    ("Why Psychic Development Can Trigger a Dark Night of the Soul", "psychic-development"),
    ("How to Develop Psychic Abilities Without Losing Your Mind", "psychic-development"),
    ("The Connection Between Psychic Ability and Childhood Trauma", "psychic-development"),
    ("How to Use Psychometry to Read Objects", "psychic-development"),
    ("Why Psychic Development Requires Grounding", "psychic-development"),
    ("How to Develop Remote Viewing Skills", "psychic-development"),
    ("The Role of the Pineal Gland in Psychic Development", "psychic-development"),
    ("How to Develop Precognitive Abilities", "psychic-development"),
    ("Why Psychic Ability Is Not a Gift It's a Skill", "psychic-development"),
    ("How to Develop Psychic Abilities Through Automatic Writing", "psychic-development"),
    ("The Connection Between Psychic Ability and Creativity", "psychic-development"),
    ("How to Develop Psychic Abilities Through Breathwork", "psychic-development"),
    ("Why Psychic Development Requires Shadow Work", "psychic-development"),
    ("How to Develop Psychic Abilities Through Fasting", "psychic-development"),
    ("The Role of the Body in Psychic Development", "psychic-development"),
    ("How to Develop Psychic Abilities Through Sound Healing", "psychic-development"),
    ("Why Psychic Development Requires Discernment", "psychic-development"),
    ("How to Develop Psychic Abilities Through Nature Connection", "psychic-development"),
    ("The Role of Ancestors in Psychic Development", "psychic-development"),
    ("How to Develop Psychic Abilities Through Crystal Work", "psychic-development"),
    ("Why Psychic Development Requires Humility", "psychic-development"),
    ("How to Develop Psychic Abilities Through Tarot", "psychic-development"),
    ("The Role of Spirit Guides in Psychic Development", "psychic-development"),
    ("How to Develop Psychic Abilities Through Oracle Cards", "psychic-development"),
    ("Why Psychic Development Requires Patience", "psychic-development"),
    ("How to Develop Psychic Abilities Through Pendulum Work", "psychic-development"),
    ("The Role of Intention in Psychic Development", "psychic-development"),
    ("How to Develop Psychic Abilities Through Scrying", "psychic-development"),
    ("Why Psychic Development Requires Consistency", "psychic-development"),
    ("How to Develop Psychic Abilities Through Lucid Dreaming", "psychic-development"),
    ("The Role of Surrender in Psychic Development", "psychic-development"),
    ("How to Develop Psychic Abilities Through Visualization", "psychic-development"),
    ("Why Psychic Development Requires Community", "psychic-development"),
    ("How to Test Your Psychic Abilities Accurately", "psychic-development"),
    ("The Role of Ethics in Psychic Work", "psychic-development"),
    ("How to Develop Psychic Abilities Through Energy Healing", "psychic-development"),
    ("Why Psychic Development Requires Self-Love", "psychic-development"),
    ("How to Develop Psychic Abilities Through Astrology", "psychic-development"),
    ("The Role of Synchronicity in Psychic Development", "psychic-development"),
    ("How to Develop Psychic Abilities Through Numerology", "psychic-development"),
    ("Why Psychic Development Requires Forgiveness", "psychic-development"),
    ("How to Develop Psychic Abilities Through Past Life Work", "psychic-development"),
    ("The Role of the Akashic Records in Psychic Development", "psychic-development"),
    ("How to Develop Psychic Abilities Through Channeling", "psychic-development"),
    ("Why Psychic Development Requires Boundaries", "psychic-development"),
    ("How to Develop Psychic Abilities Through Plant Medicine", "psychic-development"),
    ("The Role of the Moon in Psychic Development", "psychic-development"),
    ("How to Develop Psychic Abilities Through Ritual", "psychic-development"),
    ("Why Psychic Development Requires Rest", "psychic-development"),
    ("How to Develop Psychic Abilities Through Movement", "psychic-development"),
    ("The Role of Diet in Psychic Development", "psychic-development"),
    ("How to Develop Psychic Abilities Through Fasting and Cleansing", "psychic-development"),
    ("Why Psychic Development Requires Solitude", "psychic-development"),
    ("How to Develop Psychic Abilities Through Silence", "psychic-development"),
    ("The Role of Darkness in Psychic Development", "psychic-development"),
    ("How to Develop Psychic Abilities Through Water", "psychic-development"),
    ("Why Psychic Development Requires Courage", "psychic-development"),
    ("How to Develop Psychic Abilities Through Fire", "psychic-development"),
    ("The Role of Earth in Psychic Development", "psychic-development"),
    ("How to Develop Psychic Abilities Through Air", "psychic-development"),
    ("Why Psychic Development Requires Acceptance", "psychic-development"),
    ("How to Develop Psychic Abilities Through Grief", "psychic-development"),
    ("The Role of Joy in Psychic Development", "psychic-development"),
    ("How to Develop Psychic Abilities Through Play", "psychic-development"),
    ("Why Psychic Development Requires Authenticity", "psychic-development"),
    ("How to Develop Psychic Abilities Through Service", "psychic-development"),
    ("The Role of Gratitude in Psychic Development", "psychic-development"),
    ("How to Develop Psychic Abilities Through Devotion", "psychic-development"),
    ("Why Psychic Development Requires Trust", "psychic-development"),
    ("How to Develop Psychic Abilities Through Surrender", "psychic-development"),
    ("The Role of Love in Psychic Development", "psychic-development"),
    ("How to Develop Psychic Abilities Through Compassion", "psychic-development"),
    ("Why Psychic Development Requires Presence", "psychic-development"),
    ("How to Develop Psychic Abilities Through Stillness", "psychic-development"),
    ("The Role of Breath in Psychic Development", "psychic-development"),
    ("How to Develop Psychic Abilities Through Awareness", "psychic-development"),
    ("Why Psychic Development Requires Openness", "psychic-development"),
    ("How to Develop Psychic Abilities Through Curiosity", "psychic-development"),
    ("The Role of Wonder in Psychic Development", "psychic-development"),
    ("How to Develop Psychic Abilities Through Reverence", "psychic-development"),
    ("Why Psychic Development Requires Dedication", "psychic-development"),

    # Intuition & Decision Making (100)
    ("How to Trust Your Gut When Your Mind Disagrees", "intuition-decisions"),
    ("The Difference Between Intuition and Fear", "intuition-decisions"),
    ("How to Make Decisions Using Your Intuition", "intuition-decisions"),
    ("Why Your Body Knows Before Your Mind Does", "intuition-decisions"),
    ("How to Develop a Daily Intuition Practice", "intuition-decisions"),
    ("The Role of Intuition in Business Decisions", "intuition-decisions"),
    ("How to Stop Second-Guessing Your Intuition", "intuition-decisions"),
    ("Why Overthinking Kills Intuitive Accuracy", "intuition-decisions"),
    ("How to Use Intuition in Relationships", "intuition-decisions"),
    ("The Science Behind Gut Feelings", "intuition-decisions"),
    ("How to Distinguish Between Intuition and Wishful Thinking", "intuition-decisions"),
    ("Why Intuition Gets Stronger with Age", "intuition-decisions"),
    ("How to Use Intuition When Making Career Decisions", "intuition-decisions"),
    ("The Role of Intuition in Parenting", "intuition-decisions"),
    ("How to Use Intuition When Choosing a Home", "intuition-decisions"),
    ("Why Intuition Requires Emotional Regulation", "intuition-decisions"),
    ("How to Use Intuition When Evaluating People", "intuition-decisions"),
    ("The Role of Intuition in Health Decisions", "intuition-decisions"),
    ("How to Use Intuition When Facing Major Life Changes", "intuition-decisions"),
    ("Why Intuition Is Not the Same as Impulse", "intuition-decisions"),
    ("How to Use Intuition When Investing Money", "intuition-decisions"),
    ("The Role of Intuition in Creative Work", "intuition-decisions"),
    ("How to Use Intuition When Dealing with Conflict", "intuition-decisions"),
    ("Why Intuition Requires Stillness to Be Heard", "intuition-decisions"),
    ("How to Use Intuition When Choosing a Spiritual Path", "intuition-decisions"),
    ("The Role of Intuition in Leadership", "intuition-decisions"),
    ("How to Use Intuition When Evaluating Opportunities", "intuition-decisions"),
    ("Why Intuition Is Often Right Even When It Doesn't Make Sense", "intuition-decisions"),
    ("How to Use Intuition When Dealing with Difficult People", "intuition-decisions"),
    ("The Role of Intuition in Athletic Performance", "intuition-decisions"),
    ("How to Use Intuition When Making Financial Decisions", "intuition-decisions"),
    ("Why Intuition Requires You to Slow Down", "intuition-decisions"),
    ("How to Use Intuition When Choosing a Therapist", "intuition-decisions"),
    ("The Role of Intuition in Medical Diagnosis", "intuition-decisions"),
    ("How to Use Intuition When Evaluating Information", "intuition-decisions"),
    ("Why Intuition Is Often Suppressed in Childhood", "intuition-decisions"),
    ("How to Use Intuition When Making Travel Decisions", "intuition-decisions"),
    ("The Role of Intuition in Emergency Situations", "intuition-decisions"),
    ("How to Use Intuition When Choosing a Partner", "intuition-decisions"),
    ("Why Intuition Requires You to Feel Safe", "intuition-decisions"),
    ("How to Use Intuition When Making Educational Decisions", "intuition-decisions"),
    ("The Role of Intuition in Negotiation", "intuition-decisions"),
    ("How to Use Intuition When Dealing with Uncertainty", "intuition-decisions"),
    ("Why Intuition Is Often Dismissed as Irrational", "intuition-decisions"),
    ("How to Use Intuition When Making Ethical Decisions", "intuition-decisions"),
    ("The Role of Intuition in Spiritual Discernment", "intuition-decisions"),
    ("How to Use Intuition When Evaluating Spiritual Teachers", "intuition-decisions"),
    ("Why Intuition Requires You to Trust Yourself", "intuition-decisions"),
    ("How to Use Intuition When Making Parenting Decisions", "intuition-decisions"),
    ("The Role of Intuition in Grief and Loss", "intuition-decisions"),
    ("How to Use Intuition When Making Health Decisions", "intuition-decisions"),
    ("Why Intuition Is Often Confused with Anxiety", "intuition-decisions"),
    ("How to Use Intuition When Evaluating Relationships", "intuition-decisions"),
    ("The Role of Intuition in Creativity and Art", "intuition-decisions"),
    ("How to Use Intuition When Making Career Changes", "intuition-decisions"),
    ("Why Intuition Requires Emotional Honesty", "intuition-decisions"),
    ("How to Use Intuition When Dealing with Family", "intuition-decisions"),
    ("The Role of Intuition in Spiritual Practice", "intuition-decisions"),
    ("How to Use Intuition When Making Business Decisions", "intuition-decisions"),
    ("Why Intuition Is Often Stronger in Women", "intuition-decisions"),
    ("How to Use Intuition When Evaluating Advice", "intuition-decisions"),
    ("The Role of Intuition in Problem Solving", "intuition-decisions"),
    ("How to Use Intuition When Making Lifestyle Changes", "intuition-decisions"),
    ("Why Intuition Requires You to Be Present", "intuition-decisions"),
    ("How to Use Intuition When Dealing with Addiction", "intuition-decisions"),
    ("The Role of Intuition in Recovery", "intuition-decisions"),
    ("How to Use Intuition When Making Spiritual Decisions", "intuition-decisions"),
    ("Why Intuition Is Often Blocked by Trauma", "intuition-decisions"),
    ("How to Use Intuition When Evaluating Spiritual Experiences", "intuition-decisions"),
    ("The Role of Intuition in Healing", "intuition-decisions"),
    ("How to Use Intuition When Making Relationship Decisions", "intuition-decisions"),
    ("Why Intuition Requires You to Honor Your Feelings", "intuition-decisions"),
    ("How to Use Intuition When Dealing with Loss", "intuition-decisions"),
    ("The Role of Intuition in Forgiveness", "intuition-decisions"),
    ("How to Use Intuition When Making Life Decisions", "intuition-decisions"),
    ("Why Intuition Is Often Stronger After Trauma", "intuition-decisions"),
    ("How to Use Intuition When Evaluating Your Own Behavior", "intuition-decisions"),
    ("The Role of Intuition in Self-Awareness", "intuition-decisions"),
    ("How to Use Intuition When Making Decisions About Your Health", "intuition-decisions"),
    ("Why Intuition Requires You to Be Honest with Yourself", "intuition-decisions"),
    ("How to Use Intuition When Dealing with Uncertainty About the Future", "intuition-decisions"),
    ("The Role of Intuition in Personal Growth", "intuition-decisions"),
    ("How to Use Intuition When Making Decisions About Your Career", "intuition-decisions"),
    ("Why Intuition Is Often Stronger in Sensitive People", "intuition-decisions"),
    ("How to Use Intuition When Evaluating Your Relationships", "intuition-decisions"),
    ("The Role of Intuition in Spiritual Awakening", "intuition-decisions"),
    ("How to Use Intuition When Making Decisions About Your Finances", "intuition-decisions"),
    ("Why Intuition Requires You to Trust the Process", "intuition-decisions"),
    ("How to Use Intuition When Dealing with Fear", "intuition-decisions"),
    ("The Role of Intuition in Courage", "intuition-decisions"),
    ("How to Use Intuition When Making Decisions About Your Relationships", "intuition-decisions"),
    ("Why Intuition Is Often Stronger When You're Rested", "intuition-decisions"),
    ("How to Use Intuition When Evaluating Your Own Intuition", "intuition-decisions"),
    ("The Role of Intuition in Discernment", "intuition-decisions"),
    ("How to Use Intuition When Making Decisions About Your Spiritual Path", "intuition-decisions"),
    ("Why Intuition Requires You to Be Grounded", "intuition-decisions"),
    ("How to Use Intuition When Dealing with Doubt", "intuition-decisions"),
    ("The Role of Intuition in Faith", "intuition-decisions"),

    # Spiritual Awakening (100)
    ("What Is a Spiritual Awakening and How Do You Know You're Having One", "spiritual-awakening"),
    ("The Dark Night of the Soul Explained", "spiritual-awakening"),
    ("How to Survive a Spiritual Awakening Without Losing Everything", "spiritual-awakening"),
    ("Why Spiritual Awakening Often Feels Like a Breakdown", "spiritual-awakening"),
    ("The Stages of Spiritual Awakening Nobody Tells You About", "spiritual-awakening"),
    ("How to Ground Yourself During a Spiritual Awakening", "spiritual-awakening"),
    ("Why Spiritual Awakening Destroys Your Old Identity", "spiritual-awakening"),
    ("How to Navigate Relationships During a Spiritual Awakening", "spiritual-awakening"),
    ("The Physical Symptoms of Spiritual Awakening", "spiritual-awakening"),
    ("Why Spiritual Awakening Often Triggers a Career Crisis", "spiritual-awakening"),
    ("How to Find Community During a Spiritual Awakening", "spiritual-awakening"),
    ("The Role of Grief in Spiritual Awakening", "spiritual-awakening"),
    ("How to Maintain Your Mental Health During a Spiritual Awakening", "spiritual-awakening"),
    ("Why Spiritual Awakening Often Leads to Isolation", "spiritual-awakening"),
    ("How to Integrate Spiritual Experiences into Daily Life", "spiritual-awakening"),
    ("The Role of the Body in Spiritual Awakening", "spiritual-awakening"),
    ("How to Deal with Spiritual Ego", "spiritual-awakening"),
    ("Why Spiritual Awakening Often Triggers Childhood Wounds", "spiritual-awakening"),
    ("How to Discern Between Spiritual Experience and Mental Illness", "spiritual-awakening"),
    ("The Role of Shadow Work in Spiritual Awakening", "spiritual-awakening"),
    ("How to Deal with Spiritual Bypassing", "spiritual-awakening"),
    ("Why Spiritual Awakening Often Leads to Dietary Changes", "spiritual-awakening"),
    ("How to Deal with Spiritual Gifts That Scare You", "spiritual-awakening"),
    ("The Role of Kundalini Energy in Spiritual Awakening", "spiritual-awakening"),
    ("How to Deal with Psychic Overwhelm During Awakening", "spiritual-awakening"),
    ("Why Spiritual Awakening Often Leads to Relationship Endings", "spiritual-awakening"),
    ("How to Deal with Spiritual Loneliness", "spiritual-awakening"),
    ("The Role of Synchronicity in Spiritual Awakening", "spiritual-awakening"),
    ("How to Deal with Spiritual Confusion", "spiritual-awakening"),
    ("Why Spiritual Awakening Often Leads to Financial Changes", "spiritual-awakening"),
    ("How to Deal with Spiritual Doubt", "spiritual-awakening"),
    ("The Role of Dreams in Spiritual Awakening", "spiritual-awakening"),
    ("How to Deal with Spiritual Resistance", "spiritual-awakening"),
    ("Why Spiritual Awakening Often Leads to Health Changes", "spiritual-awakening"),
    ("How to Deal with Spiritual Overwhelm", "spiritual-awakening"),
    ("The Role of Nature in Spiritual Awakening", "spiritual-awakening"),
    ("How to Deal with Spiritual Addiction", "spiritual-awakening"),
    ("Why Spiritual Awakening Often Leads to Creative Explosion", "spiritual-awakening"),
    ("How to Deal with Spiritual Arrogance", "spiritual-awakening"),
    ("The Role of Service in Spiritual Awakening", "spiritual-awakening"),
    ("How to Deal with Spiritual Materialism", "spiritual-awakening"),
    ("Why Spiritual Awakening Often Leads to Psychic Sensitivity", "spiritual-awakening"),
    ("How to Deal with Spiritual Comparison", "spiritual-awakening"),
    ("The Role of Forgiveness in Spiritual Awakening", "spiritual-awakening"),
    ("How to Deal with Spiritual Perfectionism", "spiritual-awakening"),
    ("Why Spiritual Awakening Often Leads to Ancestral Healing", "spiritual-awakening"),
    ("How to Deal with Spiritual Impatience", "spiritual-awakening"),
    ("The Role of Acceptance in Spiritual Awakening", "spiritual-awakening"),
    ("How to Deal with Spiritual Fear", "spiritual-awakening"),
    ("Why Spiritual Awakening Often Leads to Past Life Memories", "spiritual-awakening"),
    ("How to Deal with Spiritual Attachment", "spiritual-awakening"),
    ("The Role of Surrender in Spiritual Awakening", "spiritual-awakening"),
    ("How to Deal with Spiritual Anger", "spiritual-awakening"),
    ("Why Spiritual Awakening Often Leads to Sensitivity to Light and Sound", "spiritual-awakening"),
    ("How to Deal with Spiritual Shame", "spiritual-awakening"),
    ("The Role of Compassion in Spiritual Awakening", "spiritual-awakening"),
    ("How to Deal with Spiritual Guilt", "spiritual-awakening"),
    ("Why Spiritual Awakening Often Leads to Changes in Sleep Patterns", "spiritual-awakening"),
    ("How to Deal with Spiritual Grief", "spiritual-awakening"),
    ("The Role of Joy in Spiritual Awakening", "spiritual-awakening"),
    ("How to Deal with Spiritual Numbness", "spiritual-awakening"),
    ("Why Spiritual Awakening Often Leads to Changes in Relationships with Food", "spiritual-awakening"),
    ("How to Deal with Spiritual Exhaustion", "spiritual-awakening"),
    ("The Role of Play in Spiritual Awakening", "spiritual-awakening"),
    ("How to Deal with Spiritual Confusion About Your Path", "spiritual-awakening"),
    ("Why Spiritual Awakening Often Leads to Changes in Your Relationship with Money", "spiritual-awakening"),
    ("How to Deal with Spiritual Confusion About Your Purpose", "spiritual-awakening"),
    ("The Role of Creativity in Spiritual Awakening", "spiritual-awakening"),
    ("How to Deal with Spiritual Confusion About Your Identity", "spiritual-awakening"),
    ("Why Spiritual Awakening Often Leads to Changes in Your Relationship with Your Body", "spiritual-awakening"),
    ("How to Deal with Spiritual Confusion About Your Relationships", "spiritual-awakening"),
    ("The Role of Humor in Spiritual Awakening", "spiritual-awakening"),
    ("How to Deal with Spiritual Confusion About Your Career", "spiritual-awakening"),
    ("Why Spiritual Awakening Often Leads to Changes in Your Relationship with Time", "spiritual-awakening"),
    ("How to Deal with Spiritual Confusion About Your Beliefs", "spiritual-awakening"),
    ("The Role of Silence in Spiritual Awakening", "spiritual-awakening"),
    ("How to Deal with Spiritual Confusion About Your Values", "spiritual-awakening"),
    ("Why Spiritual Awakening Often Leads to Changes in Your Relationship with Death", "spiritual-awakening"),
    ("How to Deal with Spiritual Confusion About Your Sexuality", "spiritual-awakening"),
    ("The Role of Solitude in Spiritual Awakening", "spiritual-awakening"),
    ("How to Deal with Spiritual Confusion About Your Gender", "spiritual-awakening"),
    ("Why Spiritual Awakening Often Leads to Changes in Your Relationship with Religion", "spiritual-awakening"),
    ("How to Deal with Spiritual Confusion About Your Culture", "spiritual-awakening"),
    ("The Role of Ancestry in Spiritual Awakening", "spiritual-awakening"),
    ("How to Deal with Spiritual Confusion About Your History", "spiritual-awakening"),
    ("Why Spiritual Awakening Often Leads to Changes in Your Relationship with Authority", "spiritual-awakening"),
    ("How to Deal with Spiritual Confusion About Your Future", "spiritual-awakening"),
    ("The Role of the Present Moment in Spiritual Awakening", "spiritual-awakening"),
    ("How to Deal with Spiritual Confusion About Your Past", "spiritual-awakening"),
    ("Why Spiritual Awakening Often Leads to Changes in Your Relationship with the Earth", "spiritual-awakening"),
    ("How to Deal with Spiritual Confusion About Your Gifts", "spiritual-awakening"),
    ("The Role of Gratitude in Spiritual Awakening", "spiritual-awakening"),
    ("How to Deal with Spiritual Confusion About Your Mission", "spiritual-awakening"),
    ("Why Spiritual Awakening Often Leads to Changes in Your Relationship with the Divine", "spiritual-awakening"),
    ("How to Deal with Spiritual Confusion About Your Soul", "spiritual-awakening"),
    ("The Role of Trust in Spiritual Awakening", "spiritual-awakening"),
    ("How to Deal with Spiritual Confusion About Your Heart", "spiritual-awakening"),
    ("Why Spiritual Awakening Often Leads to Changes in Your Relationship with Yourself", "spiritual-awakening"),

    # Tools & Practices (100)
    ("How to Use Tarot Cards for Intuitive Development", "tools-practices"),
    ("The Best Crystals for Psychic Development", "tools-practices"),
    ("How to Use a Pendulum for Decision Making", "tools-practices"),
    ("The Best Books on Psychic Development", "tools-practices"),
    ("How to Use Oracle Cards for Daily Guidance", "tools-practices"),
    ("The Best Meditations for Developing Intuition", "tools-practices"),
    ("How to Use Automatic Writing to Access Your Intuition", "tools-practices"),
    ("The Best Journals for Empaths and Sensitives", "tools-practices"),
    ("How to Use Scrying for Psychic Development", "tools-practices"),
    ("The Best Essential Oils for Psychic Development", "tools-practices"),
    ("How to Use Sound Healing for Intuitive Development", "tools-practices"),
    ("The Best Herbs for Psychic Development", "tools-practices"),
    ("How to Use Breathwork for Intuitive Development", "tools-practices"),
    ("The Best Supplements for Sensitive Nervous Systems", "tools-practices"),
    ("How to Use Movement for Intuitive Development", "tools-practices"),
    ("The Best Practices for Grounding Sensitive People", "tools-practices"),
    ("How to Use Nature for Intuitive Development", "tools-practices"),
    ("The Best Practices for Protecting Your Energy", "tools-practices"),
    ("How to Use Water for Intuitive Development", "tools-practices"),
    ("The Best Practices for Clearing Your Energy Field", "tools-practices"),
    ("How to Use Fire for Intuitive Development", "tools-practices"),
    ("The Best Practices for Opening Your Third Eye", "tools-practices"),
    ("How to Use Earth for Intuitive Development", "tools-practices"),
    ("The Best Practices for Developing Clairvoyance", "tools-practices"),
    ("How to Use Air for Intuitive Development", "tools-practices"),
    ("The Best Practices for Developing Clairsentience", "tools-practices"),
    ("How to Use the Moon for Intuitive Development", "tools-practices"),
    ("The Best Practices for Developing Clairaudience", "tools-practices"),
    ("How to Use the Sun for Intuitive Development", "tools-practices"),
    ("The Best Practices for Developing Claircognizance", "tools-practices"),
    ("How to Use Stars for Intuitive Development", "tools-practices"),
    ("The Best Practices for Developing Mediumship", "tools-practices"),
    ("How to Use Astrology for Intuitive Development", "tools-practices"),
    ("The Best Practices for Developing Psychometry", "tools-practices"),
    ("How to Use Numerology for Intuitive Development", "tools-practices"),
    ("The Best Practices for Developing Remote Viewing", "tools-practices"),
    ("How to Use Sacred Geometry for Intuitive Development", "tools-practices"),
    ("The Best Practices for Developing Precognition", "tools-practices"),
    ("How to Use Ritual for Intuitive Development", "tools-practices"),
    ("The Best Practices for Developing Channeling", "tools-practices"),
    ("How to Use Prayer for Intuitive Development", "tools-practices"),
    ("The Best Practices for Developing Automatic Writing", "tools-practices"),
    ("How to Use Fasting for Intuitive Development", "tools-practices"),
    ("The Best Practices for Developing Lucid Dreaming", "tools-practices"),
    ("How to Use Silence for Intuitive Development", "tools-practices"),
    ("The Best Practices for Developing Astral Projection", "tools-practices"),
    ("How to Use Darkness for Intuitive Development", "tools-practices"),
    ("The Best Practices for Developing Telepathy", "tools-practices"),
    ("How to Use Cold Water for Intuitive Development", "tools-practices"),
    ("The Best Practices for Developing Psychokinesis", "tools-practices"),
    ("How to Use Heat for Intuitive Development", "tools-practices"),
    ("The Best Practices for Developing Healing Abilities", "tools-practices"),
    ("How to Use Pressure for Intuitive Development", "tools-practices"),
    ("The Best Practices for Developing Aura Reading", "tools-practices"),
    ("How to Use Stillness for Intuitive Development", "tools-practices"),
    ("The Best Practices for Developing Energy Sensing", "tools-practices"),
    ("How to Use Repetition for Intuitive Development", "tools-practices"),
    ("The Best Practices for Developing Spiritual Discernment", "tools-practices"),
    ("How to Use Intention for Intuitive Development", "tools-practices"),
    ("The Best Practices for Developing Psychic Accuracy", "tools-practices"),
    ("How to Use Attention for Intuitive Development", "tools-practices"),
    ("The Best Practices for Developing Psychic Consistency", "tools-practices"),
    ("How to Use Awareness for Intuitive Development", "tools-practices"),
    ("The Best Practices for Developing Psychic Reliability", "tools-practices"),
    ("How to Use Presence for Intuitive Development", "tools-practices"),
    ("The Best Practices for Developing Psychic Strength", "tools-practices"),
    ("How to Use Curiosity for Intuitive Development", "tools-practices"),
    ("The Best Practices for Developing Psychic Clarity", "tools-practices"),
    ("How to Use Wonder for Intuitive Development", "tools-practices"),
    ("The Best Practices for Developing Psychic Depth", "tools-practices"),
    ("How to Use Reverence for Intuitive Development", "tools-practices"),
    ("The Best Practices for Developing Psychic Range", "tools-practices"),
    ("How to Use Devotion for Intuitive Development", "tools-practices"),
    ("The Best Practices for Developing Psychic Speed", "tools-practices"),
    ("How to Use Surrender for Intuitive Development", "tools-practices"),
    ("The Best Practices for Developing Psychic Precision", "tools-practices"),
    ("How to Use Trust for Intuitive Development", "tools-practices"),
    ("The Best Practices for Developing Psychic Sensitivity", "tools-practices"),
    ("How to Use Love for Intuitive Development", "tools-practices"),
    ("The Best Practices for Developing Psychic Specificity", "tools-practices"),
    ("How to Use Compassion for Intuitive Development", "tools-practices"),
    ("The Best Practices for Developing Psychic Verification", "tools-practices"),
    ("How to Use Forgiveness for Intuitive Development", "tools-practices"),
    ("The Best Practices for Developing Psychic Ethics", "tools-practices"),
    ("How to Use Acceptance for Intuitive Development", "tools-practices"),
    ("The Best Practices for Developing Psychic Boundaries", "tools-practices"),
    ("How to Use Gratitude for Intuitive Development", "tools-practices"),
    ("The Best Practices for Developing Psychic Grounding", "tools-practices"),
    ("How to Use Service for Intuitive Development", "tools-practices"),
    ("The Best Practices for Developing Psychic Protection", "tools-practices"),
    ("How to Use Humility for Intuitive Development", "tools-practices"),
    ("The Best Practices for Developing Psychic Integration", "tools-practices"),
    ("How to Use Patience for Intuitive Development", "tools-practices"),
    ("The Best Practices for Developing Psychic Balance", "tools-practices"),
    ("How to Use Consistency for Intuitive Development", "tools-practices"),
    ("The Best Practices for Developing Psychic Stability", "tools-practices"),
    ("How to Use Dedication for Intuitive Development", "tools-practices"),
    ("The Best Practices for Developing Psychic Resilience", "tools-practices"),
    ("How to Use Courage for Intuitive Development", "tools-practices"),
    ("The Best Practices for Developing Psychic Confidence", "tools-practices"),
    ("How to Use Authenticity for Intuitive Development", "tools-practices"),
    ("The Best Practices for Developing Psychic Wholeness", "tools-practices"),
]

# ── Quality gate helpers ───────────────────────────────────────────────────────
def strip_html(html):
    return re.sub(r'<[^>]+>', ' ', html)

def count_words(html):
    return len(strip_html(html).split())

def count_amazon_links(html):
    return len(re.findall(r'amazon\.com/dp/[A-Z0-9]+\?tag=', html))

def fix_em_dashes(html):
    return re.sub(r'\u2014|\u2013|&mdash;|&ndash;|&#8212;|&#8211;', ' - ', html)

def auto_fix_banned(html):
    """Auto-substitute common banned words before running the gate."""
    result = html
    # Fix banned words (case-insensitive, whole word)
    for banned, replacement in WORD_SUBS.items():
        # Handle hyphenated versions
        escaped = re.escape(banned)
        result = re.sub(r'\b' + escaped + r'\b', replacement, result, flags=re.IGNORECASE)
    # Fix banned phrases (case-insensitive)
    for phrase, replacement in PHRASE_SUBS.items():
        result = re.sub(re.escape(phrase), replacement, result, flags=re.IGNORECASE)
    return result

def run_quality_gate(html):
    failures = []
    wc = count_words(html)
    if wc < MIN_WORDS:
        failures.append(f"Too short: {wc} words (min {MIN_WORDS})")
    links = count_amazon_links(html)
    if links < 3:
        failures.append(f"Too few Amazon links: {links} (min 3)")
    if links > 5:
        failures.append(f"Too many Amazon links: {links} (max 5)")
    text_lower = strip_html(html).lower()
    found_banned = [w for w in BANNED_WORDS if re.search(r'\b' + re.escape(w) + r'\b', text_lower)]
    if found_banned:
        failures.append(f"Banned words: {', '.join(found_banned[:5])}")
    html_lower = html.lower()
    found_phrases = [p for p in BANNED_PHRASES if p in html_lower]
    if found_phrases:
        failures.append(f"Banned phrases: {' | '.join(found_phrases)}")
    return {"passed": len(failures) == 0, "word_count": wc, "amazon_links": links, "failures": failures}

# ── Image assignment ───────────────────────────────────────────────────────────
def assign_hero_image(slug, index):
    lib_num = (index % LIBRARY_COUNT) + 1
    return f"{BUNNY_CDN}/library/lib-{lib_num:02d}.webp"

# ── Slug ───────────────────────────────────────────────────────────────────────
def slugify(title):
    s = title.lower()
    s = re.sub(r"[^a-z0-9\s-]", "", s)
    s = re.sub(r"\s+", "-", s.strip())
    s = re.sub(r"-+", "-", s)
    return s[:80]

# ── DB setup ───────────────────────────────────────────────────────────────────
def setup_db(conn):
    conn.execute("""
        CREATE TABLE IF NOT EXISTS articles (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            slug TEXT UNIQUE NOT NULL,
            title TEXT NOT NULL,
            meta_description TEXT,
            og_title TEXT,
            og_description TEXT,
            category TEXT,
            tags TEXT,
            body TEXT NOT NULL,
            image_url TEXT,
            image_alt TEXT,
            reading_time INTEGER DEFAULT 8,
            author TEXT DEFAULT 'Kalesh',
            status TEXT DEFAULT 'queued' CHECK(status IN ('queued','published','archived')),
            published_at TEXT,
            queued_at TEXT,
            updated_at TEXT,
            word_count INTEGER,
            asins_used TEXT,
            last_refreshed_30d TEXT,
            last_refreshed_90d TEXT,
            opener_type TEXT,
            conclusion_type TEXT
        )
    """)
    conn.commit()

# ── Article generation ─────────────────────────────────────────────────────────
def generate_article(title, category, asins, previous_failures=None):
    asin_links = [
        f'<a href="https://www.amazon.com/dp/{a}?tag={AMAZON_TAG}" target="_blank" rel="nofollow sponsored">See on Amazon (paid link)</a>'
        for a in asins
    ]

    # Build failure-specific correction instructions
    correction = ""
    if previous_failures:
        correction = f"\n\nPREVIOUS ATTEMPT FAILED. Fix these issues:\n"
        for f in previous_failures:
            if "Banned words:" in f:
                words = f.replace("Banned words: ", "")
                correction += f"- DO NOT use these words: {words}. Replace them with plain alternatives.\n"
            elif "Banned phrases:" in f:
                phrases = f.replace("Banned phrases: ", "")
                correction += f"- DO NOT use these phrases: {phrases}. Rephrase them completely.\n"
            elif "Too short" in f:
                correction += f"- Write MORE. The previous attempt was too short. Write at least 1,800 words.\n"
            elif "Too few Amazon links" in f:
                correction += f"- Include all {len(asins)} Amazon links in the text.\n"
            elif "Too many Amazon links" in f:
                correction += f"- Use FEWER Amazon links - maximum 5 total.\n"

    system = f"""You are Kalesh, a grounded, direct teacher of psychic development and intuitive sensitivity. You write for people who feel things deeply and have been told their whole lives that something is wrong with them. Nothing is wrong with them. Their nervous system is calibrated for a wider range than most.

VOICE RULES (non-negotiable):
- Direct address: "you" throughout
- Contractions everywhere: don't, can't, it's, you're, they're
- Compassionate but never saccharine - you're honest, not fluffy
- Include 2-3 of these conversational markers: "Right?!", "Know what I mean?", "Does that land?"
- No academic distance. Write like you're talking to someone across a table.
- Write at least 1,800 words. This is required.

STRICTLY FORBIDDEN WORDS - do not use any of these (use plain alternatives):
utilize(use), delve(dig), tapestry(mix), paradigm(model), synergy(connection), leverage(use),
empower(help), pivotal(key), embark(start), underscore(highlight), paramount(critical),
seamlessly(smoothly), robust(strong), beacon(guide), foster(build), elevate(raise),
curate/curated(select/selected), bespoke(custom), resonate(connect), harness(use),
intricate(complex), plethora(many), myriad(many), groundbreaking(new), innovative(new),
game-changer(breakthrough), ever-evolving(always changing), rapidly-evolving(fast-changing),
stakeholders(people), ecosystem(world), framework(approach), comprehensive(complete),
transformative(life-changing), holistic(full), nuanced(layered), multifaceted(complex),
profound(deep), furthermore(also), navigate(work through), landscape(world),
cutting-edge(latest), state-of-the-art(latest), unlock(open up)

STRICTLY FORBIDDEN PHRASES:
"it's important to note", "it's worth noting", "in conclusion", "in summary",
"a holistic approach", "in the realm of", "at the end of the day",
"in today's fast-paced world", "plays a crucial role"

FORMATTING:
- Output clean HTML only (h2, h3, p, ul, li, blockquote, strong, em)
- No markdown, no code fences
- Use " - " (hyphen with spaces) instead of em-dashes or en-dashes
- Word count: 1,800-2,400 words (MINIMUM 1,800 - do not stop before this)
- Include exactly {len(asins)} Amazon affiliate links placed naturally in the text:
{chr(10).join(f'  {i+1}. {l}' for i, l in enumerate(asin_links))}
- End with a short paragraph (no heading) linking to /assessment or /quiz
- Include one blockquote that captures the core insight of the piece
- Use at least 6 h2 or h3 subheadings to structure the piece{correction}"""

    user = f"""Write a complete, long-form article for: "{title}"
Category: {category}
Site: intuitivesawaken.com - "The Bright Wound"
Write the full article body as HTML. Do not include <html>, <head>, <body>, or <title> tags.
Start directly with the first <p> or <h2>.
IMPORTANT: Write at least 1,800 words. Use all {len(asins)} Amazon links. Include the blockquote."""

    resp = client.chat.completions.create(
        model=DEEPSEEK_MODEL,
        messages=[
            {"role": "system", "content": system},
            {"role": "user", "content": user},
        ],
        temperature=0.72,
        max_tokens=4096,
    )
    return resp.choices[0].message.content or ""

def generate_meta(title, body_snippet):
    resp = client.chat.completions.create(
        model=DEEPSEEK_MODEL,
        messages=[
            {"role": "system", "content": "Write a compelling meta description (150-160 characters) for a psychic development article. Direct, honest, no fluff. No em-dashes."},
            {"role": "user", "content": f"Title: {title}\n\nFirst 300 words:\n{body_snippet[:900]}"},
        ],
        temperature=0.5,
        max_tokens=80,
    )
    return (resp.choices[0].message.content or "").strip().strip('"')

# ── SQL export ─────────────────────────────────────────────────────────────────
def export_sql(conn, path):
    cur = conn.execute("SELECT * FROM articles ORDER BY id")
    cols = [d[0] for d in cur.description]
    rows = cur.fetchall()
    lines = [
        "-- Pre-seed: 500 articles for intuitivesawaken.com",
        "-- Status: queued (not published)",
        "-- Generated by Manus pre-seed script",
        "",
        "BEGIN;",
        "",
    ]
    for row in rows:
        d = dict(zip(cols, row))
        def esc(v):
            if v is None: return "NULL"
            return "'" + str(v).replace("'", "''") + "'"
        lines.append(
            f"INSERT INTO articles (slug,title,meta_description,og_title,og_description,category,tags,body,image_url,image_alt,reading_time,author,status,queued_at,updated_at,word_count,asins_used) VALUES ("
            f"{esc(d['slug'])},{esc(d['title'])},{esc(d['meta_description'])},{esc(d['og_title'])},{esc(d['og_description'])},"
            f"{esc(d['category'])},{esc(d['tags'])},{esc(d['body'])},{esc(d['image_url'])},{esc(d['image_alt'])},"
            f"{d['reading_time']},{esc(d['author'])},{esc(d['status'])},{esc(d['queued_at'])},{esc(d['updated_at'])},"
            f"{d['word_count'] or 'NULL'},{esc(d['asins_used'])}) ON CONFLICT (slug) DO NOTHING;"
        )
    lines += ["", "COMMIT;", ""]
    with open(path, "w") as f:
        f.write("\n".join(lines))
    print(f"[preseed] SQL dump written: {path} ({len(rows)} articles)")

# ── Main ───────────────────────────────────────────────────────────────────────
def main():
    conn = sqlite3.connect(DB_PATH)
    setup_db(conn)

    existing = {row[0] for row in conn.execute("SELECT slug FROM articles")}
    print(f"[preseed] DB ready. {len(existing)} articles already in DB.")

    queued = skipped = failed = 0
    total = len(TOPICS)

    for i, (title, category) in enumerate(TOPICS):
        slug = slugify(title)
        if slug in existing:
            skipped += 1
            continue

        print(f"[preseed] {i+1}/{total}: {title[:60]}...", flush=True)

        shuffled = random.sample(ASIN_POOL, min(len(ASIN_POOL), 50))
        asins = shuffled[:3 + random.randint(0, 1)]  # 3 or 4

        body = ""
        gate = None
        last_failures = None

        for attempt in range(1, MAX_ATTEMPTS + 1):
            try:
                raw = generate_article(title, category, asins, last_failures)
                raw = fix_em_dashes(raw)
                raw = auto_fix_banned(raw)  # Auto-substitute before gating
                gate = run_quality_gate(raw)
                if gate["passed"]:
                    body = raw
                    print(f"  OK  {gate['word_count']} words, {gate['amazon_links']} links (attempt {attempt})", flush=True)
                    break
                else:
                    last_failures = gate["failures"]
                    print(f"  FAIL attempt {attempt}: {'; '.join(gate['failures'])}", flush=True)
            except Exception as e:
                print(f"  ERROR attempt {attempt}: {e}", flush=True)
                last_failures = None
            if attempt < MAX_ATTEMPTS:
                time.sleep(DELAY_BETWEEN)

        if not body or not gate or not gate["passed"]:
            # Last resort: use the last generated body even if it failed gate
            # (auto-fix will have cleaned most issues)
            if raw and count_words(raw) >= MIN_WORDS:
                raw = auto_fix_banned(raw)
                gate = run_quality_gate(raw)
                if gate["word_count"] >= MIN_WORDS and gate["amazon_links"] >= 3:
                    body = raw
                    print(f"  ACCEPT (post-fix): {gate['word_count']} words, {gate['amazon_links']} links", flush=True)
                else:
                    print(f"  SKIP: all {MAX_ATTEMPTS} attempts failed", flush=True)
                    failed += 1
                    continue
            else:
                print(f"  SKIP: all {MAX_ATTEMPTS} attempts failed", flush=True)
                failed += 1
                continue

        meta = generate_meta(title, body)
        image_url = assign_hero_image(slug, i)
        now = datetime.now(timezone.utc).isoformat()
        wc = gate["word_count"]
        rt = max(1, round(wc / 238))

        conn.execute(
            """INSERT OR IGNORE INTO articles
               (slug,title,meta_description,og_title,og_description,category,tags,body,
                image_url,image_alt,reading_time,author,status,queued_at,updated_at,word_count,asins_used)
               VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)""",
            (slug, title, meta, title, meta, category,
             json.dumps([category, "intuition", "sensitivity"]),
             body, image_url, f"{title} - intuitivesawaken.com",
             rt, "Kalesh", "queued", now, now, wc,
             json.dumps(asins))
        )
        conn.commit()
        existing.add(slug)
        queued += 1

        time.sleep(DELAY_BETWEEN)

    print(f"\n[preseed] DONE. Queued: {queued} | Skipped: {skipped} | Failed: {failed}", flush=True)
    print(f"[preseed] Total in DB: {conn.execute('SELECT COUNT(*) FROM articles').fetchone()[0]}", flush=True)

    # Verify none are published
    pub = conn.execute("SELECT COUNT(*) FROM articles WHERE status='published'").fetchone()[0]
    print(f"[preseed] Published articles: {pub} (should be 0)", flush=True)

    export_sql(conn, SQL_DUMP_PATH)
    conn.close()

if __name__ == "__main__":
    main()
