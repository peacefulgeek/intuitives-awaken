/**
 * The Paul Voice Gate -- Full Spec Implementation
 *
 * Per ADDENDUMSCOPENOCLAUDE.md Section 6:
 * 1. Banned words (regex, case-insensitive)
 * 2. Banned phrases (string match, case-insensitive)
 * 3. Em-dashes: auto-replace with ' - ' before checking
 * 4. Word count: 1,200 floor, 2,500 ceiling
 * 5. Amazon affiliate links: exactly 3 or 4
 */

export const BANNED_WORDS = [
  'utilize', 'delve', 'tapestry', 'landscape', 'paradigm', 'synergy', 'leverage',
  'unlock', 'empower', 'pivotal', 'embark', 'underscore', 'paramount', 'seamlessly',
  'robust', 'beacon', 'foster', 'elevate', 'curate', 'curated', 'bespoke', 'resonate',
  'harness', 'intricate', 'plethora', 'myriad', 'groundbreaking', 'innovative',
  'cutting-edge', 'state-of-the-art', 'game-changer', 'ever-evolving', 'rapidly-evolving',
  'stakeholders', 'navigate', 'ecosystem', 'framework', 'comprehensive', 'transformative',
  'holistic', 'nuanced', 'multifaceted', 'profound', 'furthermore'
];

export const BANNED_PHRASES = [
  "it's important to note that",
  "it's worth noting that",
  "in conclusion",
  "in summary",
  "a holistic approach",
  "in the realm of",
  "dive deep into",
  "at the end of the day",
  "in today's fast-paced world",
  "plays a crucial role"
];

export function fixEmDashes(html) {
  if (!html) return '';
  return html
    .replace(/\s*[\u2014\u2013]\s*/g, ' - ')
    .replace(/\s*--\s*/g, ' - ');
}

export function runQualityGate(html) {
  if (!html) return { passed: false, failures: ['Empty content'] };

  const failures = [];
  const text = html.replace(/<[^>]+>/g, ' ');
  const wordCount = text.split(/\s+/).filter(w => w.length > 0).length;

  if (wordCount < 1200) {
    failures.push(`Word count too low: ${wordCount} (minimum 1,200)`);
  }
  if (wordCount > 2500) {
    failures.push(`Word count too high: ${wordCount} (maximum 2,500)`);
  }

  if (/[\u2014\u2013]/.test(html) || html.includes('--')) {
    failures.push('Contains em-dashes, en-dashes, or double hyphens');
  }

  const amazonLinks = (html.match(/href="https:\/\/www\.amazon\.com/g) || []).length;
  if (amazonLinks < 3 || amazonLinks > 4) {
    failures.push(`Invalid number of Amazon links: ${amazonLinks} (must be exactly 3 or 4)`);
  }

  const lowerText = text.toLowerCase();
  const foundBanned = BANNED_WORDS.filter(word => {
    const escaped = word.replace(/-/g, '[-]');
    const regex = new RegExp(`\\b${escaped}\\b`, 'i');
    return regex.test(lowerText);
  });
  if (foundBanned.length > 0) {
    failures.push(`Contains banned words: ${foundBanned.join(', ')}`);
  }

  const lowerHtml = html.toLowerCase();
  const foundPhrases = BANNED_PHRASES.filter(phrase => lowerHtml.includes(phrase.toLowerCase()));
  if (foundPhrases.length > 0) {
    failures.push(`Contains banned phrases: ${foundPhrases.join(' | ')}`);
  }

  return {
    passed: failures.length === 0,
    wordCount,
    amazonLinks,
    failures
  };
}
