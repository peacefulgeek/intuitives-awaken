import { countAmazonLinks, extractAsinsFromText } from './amazon-verify.mjs';

const AI_FLAGGED_WORDS = [
  'delve','tapestry','paradigm','synergy','leverage','unlock','empower',
  'utilize','pivotal','embark','underscore','paramount','seamlessly',
  'robust','beacon','foster','elevate','curate','curated','bespoke',
  'resonate','harness','intricate','plethora','myriad','comprehensive',
  'transformative','groundbreaking','innovative','cutting-edge','revolutionary',
  'state-of-the-art','ever-evolving','game-changing','next-level','world-class',
  'unparalleled','unprecedented','remarkable','extraordinary','exceptional',
  'profound','holistic','nuanced','multifaceted','stakeholders',
  'ecosystem','landscape','realm','sphere','domain',
  'arguably','notably','crucially','importantly','essentially',
  'fundamentally','inherently','intrinsically','substantively',
  'streamline','optimize','facilitate','amplify','catalyze',
  'propel','spearhead','orchestrate','navigate','traverse',
  'furthermore','moreover','additionally','consequently','subsequently',
  'thereby','thusly','wherein','whereby'
];

const AI_FLAGGED_PHRASES = [
  "it's important to note that","it's worth noting that","it's worth mentioning",
  "it's crucial to","it is essential to","in conclusion,","in summary,","to summarize,",
  "a holistic approach","unlock your potential","unlock the power",
  "in the realm of","in the world of","dive deep into","dive into","delve into",
  "at the end of the day","in today's fast-paced world","in today's digital age",
  "in today's modern world","in this digital age","when it comes to",
  "navigate the complexities","a testament to","speaks volumes",
  "the power of","the beauty of","the art of","the journey of","the key lies in",
  "plays a crucial role","plays a vital role","plays a significant role","plays a pivotal role",
  "a wide array of","a wide range of","a plethora of","a myriad of",
  "stands as a","serves as a","acts as a","has emerged as",
  "continues to evolve","has revolutionized","cannot be overstated",
  "it goes without saying","needless to say","last but not least","first and foremost"
];

export function countWords(text) {
  const stripped = text.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  return stripped ? stripped.split(/\s+/).length : 0;
}

export function hasEmDash(text) {
  return text.includes('\u2014');
}

export function findFlaggedWords(text) {
  const stripped = text.replace(/<[^>]+>/g, ' ').toLowerCase();
  const found = [];
  for (const w of AI_FLAGGED_WORDS) {
    const pat = w.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
    if (new RegExp(`\\b${pat}\\b`, 'i').test(stripped)) found.push(w);
  }
  return found;
}

export function findFlaggedPhrases(text) {
  const stripped = text.replace(/<[^>]+>/g, ' ').toLowerCase().replace(/\s+/g, ' ');
  return AI_FLAGGED_PHRASES.filter(p => stripped.includes(p));
}

export function voiceSignals(text) {
  const stripped = text.replace(/<[^>]+>/g, ' ');
  const lower = stripped.toLowerCase();
  const contractions = (lower.match(/\b\w+'(s|re|ve|d|ll|m|t)\b/g) || []).length;
  const directAddress = (lower.match(/\byou('re|r|rself|)?\b/g) || []).length;
  const firstPerson = (lower.match(/\b(i|i'm|i've|i'd|i'll|my|me|mine)\b/g) || []).length;
  const sentences = stripped.split(/(?<=[.!?])\s+/).filter(s => s.trim().length > 0);
  const lengths = sentences.map(s => s.split(/\s+/).length);
  const avg = lengths.reduce((a, b) => a + b, 0) / (lengths.length || 1);
  const variance = lengths.reduce((sum, len) => sum + Math.pow(len - avg, 2), 0) / (lengths.length || 1);
  const stdDev = Math.sqrt(variance);
  const shortSentences = lengths.filter(l => l <= 6).length;
  const longSentences = lengths.filter(l => l >= 25).length;
  const markers = [
    /\bhere's the thing\b/i, /\blook,\s/i, /\bhonestly,?\s/i, /\btruth is\b/i,
    /\bthe truth\b/i, /\bi'll tell you\b/i, /\bthink about it\b/i, /\bthat said\b/i,
    /\bbut here's\b/i, /\bso yeah\b/i, /\bkind of\b/i, /\bsort of\b/i, /\byou know\b/i
  ];
  const markerCount = markers.filter(r => r.test(stripped)).length;
  return {
    contractions, directAddress, firstPerson,
    sentenceCount: sentences.length,
    avgSentenceLength: +avg.toFixed(1),
    sentenceStdDev: +stdDev.toFixed(1),
    shortSentences, longSentences,
    conversationalMarkers: markerCount
  };
}

export function runQualityGate(articleBody) {
  const failures = [];
  const warnings = [];

  const words = countWords(articleBody);
  if (words < 1200) failures.push(`word-count-too-low:${words}`);
  if (words > 2500) failures.push(`word-count-too-high:${words}`);

  const amzCount = countAmazonLinks(articleBody);
  if (amzCount < 3) failures.push(`amazon-links-too-few:${amzCount}`);
  if (amzCount > 4) failures.push(`amazon-links-too-many:${amzCount}`);

  if (hasEmDash(articleBody)) failures.push('contains-em-dash');

  const bw = findFlaggedWords(articleBody);
  if (bw.length > 0) failures.push(`ai-flagged-words:${bw.join(',')}`);

  const bp = findFlaggedPhrases(articleBody);
  if (bp.length > 0) failures.push(`ai-flagged-phrases:${bp.join('|')}`);

  const voice = voiceSignals(articleBody);
  const per1k = (n) => (n / (words || 1)) * 1000;

  if (per1k(voice.contractions) < 4) {
    failures.push(`contractions-too-few:${voice.contractions}(${per1k(voice.contractions).toFixed(1)}/1k)`);
  }
  if (voice.directAddress === 0 && voice.firstPerson === 0) {
    failures.push('no-direct-address-or-first-person');
  }
  if (voice.sentenceStdDev < 4) {
    failures.push(`sentence-variance-too-low:${voice.sentenceStdDev}`);
  }
  if (voice.shortSentences < 2) {
    failures.push(`too-few-short-sentences:${voice.shortSentences}`);
  }
  if (voice.conversationalMarkers < 2) {
    warnings.push(`conversational-markers-low:${voice.conversationalMarkers}`);
  }

  return {
    passed: failures.length === 0,
    failures,
    warnings,
    wordCount: words,
    amazonLinks: amzCount,
    asins: extractAsinsFromText(articleBody),
    voice
  };
}
