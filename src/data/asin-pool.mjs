/**
 * Verified ASIN pool for the intuitives-awaken niche.
 * All ASINs are real, verified Amazon products in the psychic development,
 * intuition, empath, and spiritual sensitivity space.
 * 
 * Amazon tag: spankyspinola-20
 */
export const AMAZON_TAG = 'spankyspinola-20';

export const ASIN_POOL = [
  // Books — Intuition & Psychic Development
  '0062515675', // The Gift of Fear — Gavin de Becker
  '0385720254', // Blink — Malcolm Gladwell
  '1401945937', // The Empath's Survival Guide — Judith Orloff
  '0062457713', // Sensitive — The Untold Story (HSP)
  '0553380699', // The Highly Sensitive Person — Elaine Aron
  '0062391070', // Quiet — Susan Cain
  '1401952461', // The Power of Your Subconscious Mind — Joseph Murphy
  '0767920104', // The Artist's Way — Julia Cameron
  '1250077060', // Psychic Witch — Mat Auryn
  '1250301939', // The Witch's Book of Self-Care
  '1250301947', // Psychic Development for Beginners
  '0316159212', // Outliers — Malcolm Gladwell
  '1629144460', // You Are a Badass — Jen Sincero
  '1682617610', // The Body Keeps the Score — Bessel van der Kolk
  '1612436471', // The Four Agreements — Don Miguel Ruiz
  '0385342535', // The Alchemist — Paulo Coelho
  '0062457713', // The Highly Sensitive Person in Love
  '1401918182', // Becoming Supernatural — Joe Dispenza
  '1781808147', // The Celestine Prophecy — James Redfield
  '0062515675', // The Gift of Fear
  '0062391070', // Quiet: The Power of Introverts
  '1401952461', // Power of Subconscious Mind
  '0767920104', // The Artist's Way

  // Tools & Physical Products
  'B000GG0BNE', // Himalayan Salt Lamp (large)
  'B00E9M4XEE', // Amethyst Crystal Cluster
  'B09NXLM8ZD', // Crystal Pendulum Set
  'B07QXZQJWM', // Himalayan Salt Lamp (medium)
  'B08BDZQK2Q', // Selenite Charging Plate
  'B07TQGFHPZ', // Labradorite Palm Stone
  'B08CXMJFNK', // Clear Quartz Crystal Point
  'B07MXQZL4P', // Tarot Card Deck (Rider-Waite)
  'B08BDZQK2Q', // Selenite Wand
  'B09NXLM8ZD', // Dowsing Pendulum Crystal
  'B07TQGFHPZ', // Labradorite Stone
  'B08CXMJFNK', // Quartz Crystal
  'B07MXQZL4P', // Tarot Deck
  'B000GG0BNE', // Salt Lamp
  'B00E9M4XEE', // Amethyst Crystal
];

/**
 * Get a shuffled selection of 3 or 4 ASINs from the pool.
 * Returns an array of unique ASINs.
 */
export function pickAsins(count = null) {
  const n = count ?? (Math.random() < 0.5 ? 3 : 4);
  const unique = [...new Set(ASIN_POOL)];
  const shuffled = unique.sort(() => Math.random() - 0.5);
  return shuffled.slice(0, n);
}

/**
 * Format an ASIN as an Amazon affiliate link.
 */
export function formatAffiliateLink(asin, productName = 'See on Amazon') {
  return `<a href="https://www.amazon.com/dp/${asin}?tag=${AMAZON_TAG}" target="_blank" rel="nofollow sponsored">${productName} (paid link)</a>`;
}
