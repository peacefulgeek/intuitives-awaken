/**
 * The Paul Voice Gate
 * 
 * Enforces Kalesh's specific voice guidelines:
 * - No em-dashes (— or --)
 * - Word count >= 1200
 * - Exactly 3-5 Amazon affiliate links
 * - Zero banned words (the AI tells)
 */

export const BANNED_WORDS = [
  'utilize', 'delve', 'tapestry', 'paradigm', 'synergy', 'leverage', 'empower',
  'pivotal', 'embark', 'paramount', 'seamlessly', 'robust', 'beacon', 'foster',
  'elevate', 'curate', 'bespoke', 'resonate', 'harness', 'intricate', 'plethora',
  'myriad', 'groundbreaking', 'innovative', 'cutting-edge', 'state-of-the-art',
  'game-changer', 'ever-evolving', 'stakeholders', 'navigate', 'ecosystem',
  'framework', 'comprehensive', 'transformative', 'holistic', 'nuanced',
  'multifaceted', 'profound', 'furthermore'
];

export function fixEmDashes(html) {
  if (!html) return '';
  return html.replace(/\s*—\s*/g, ', ').replace(/\s*--\s*/g, ', ');
}

export function runQualityGate(html) {
  if (!html) return { passed: false, failures: ['Empty content'] };

  const failures = [];
  const text = html.replace(/<[^>]+>/g, ' '); // Strip HTML for word counting
  const wordCount = text.split(/\s+/).filter(w => w.length > 0).length;

  if (wordCount < 1200) {
    failures.push(`Word count too low: ${wordCount} (minimum 1200)`);
  }

  if (html.includes('—') || html.includes('--')) {
    failures.push('Contains em-dashes (—) or double hyphens (--)');
  }

  const amazonLinks = (html.match(/href="https:\/\/www\.amazon\.com/g) || []).length;
  if (amazonLinks < 3 || amazonLinks > 5) {
    failures.push(`Invalid number of Amazon links: ${amazonLinks} (must be 3-5)`);
  }

  const lowerText = text.toLowerCase();
  const foundBanned = BANNED_WORDS.filter(word => {
    const regex = new RegExp(`\\b${word}\\b`, 'i');
    return regex.test(lowerText);
  });

  if (foundBanned.length > 0) {
    failures.push(`Contains banned words: ${foundBanned.join(', ')}`);
  }

  return {
    passed: failures.length === 0,
    wordCount,
    amazonLinks,
    failures
  };
}
