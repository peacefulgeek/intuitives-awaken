const AMAZON_TAG = process.env.AMAZON_TAG || 'spankyspinola-20';

const SOFT_404_PATTERNS = [
  /looking for something/i,
  /page not found/i,
  /no results for/i,
  /didn't find what you were looking for/i,
  /sorry, we couldn't find that page/i
];

const PRODUCT_SIGNATURES = [
  /id="productTitle"/i,
  /id="dp-container"/i,
  /class="a-size-large product-title-word-break"/i,
  /"@type"\s*:\s*"Product"/i
];

export async function verifyAsin(asin) {
  const url = `https://www.amazon.com/dp/${asin}`;
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml',
        'Accept-Language': 'en-US,en;q=0.9'
      },
      redirect: 'follow',
      signal: AbortSignal.timeout(10000)
    });

    if (res.status === 404) return { asin, valid: false, reason: 'http-404', url };
    if (res.status !== 200) return { asin, valid: false, reason: `http-${res.status}`, url };

    const html = await res.text();

    for (const p of SOFT_404_PATTERNS) {
      if (p.test(html)) return { asin, valid: false, reason: 'soft-404', url };
    }

    const hasSignature = PRODUCT_SIGNATURES.some(p => p.test(html));
    if (!hasSignature) return { asin, valid: false, reason: 'no-product-signature', url };

    const titleMatch = html.match(/<title>([^<]+)<\/title>/i);
    const title = titleMatch
      ? titleMatch[1].replace(/\s*:\s*Amazon\.com.*$/i, '').replace(/\s+/g, ' ').trim()
      : null;

    if (!title || title.length < 10) {
      return { asin, valid: false, reason: 'short-or-missing-title', url };
    }

    return { asin, valid: true, title, url };
  } catch (err) {
    return { asin, valid: false, reason: `fetch-error: ${err.message}`, url };
  }
}

export async function verifyAsinBatch(asins, { delayMs = 2500, onProgress } = {}) {
  const results = [];
  for (let i = 0; i < asins.length; i++) {
    const result = await verifyAsin(asins[i]);
    results.push(result);
    if (onProgress) onProgress(i + 1, asins.length, result);
    if (i < asins.length - 1) await new Promise(r => setTimeout(r, delayMs));
  }
  return results;
}

export function buildAmazonUrl(asin) {
  return `https://www.amazon.com/dp/${asin}?tag=${AMAZON_TAG}`;
}

const AMAZON_LINK_REGEX = /https:\/\/www\.amazon\.com\/dp\/([A-Z0-9]{10})(?:\/[^"\s?]*)?(?:\?[^"\s]*)?/g;

export function extractAsinsFromText(text) {
  const asins = new Set();
  let m;
  while ((m = AMAZON_LINK_REGEX.exec(text)) !== null) {
    asins.add(m[1]);
  }
  AMAZON_LINK_REGEX.lastIndex = 0;
  return Array.from(asins);
}

export function countAmazonLinks(text) {
  const matches = text.match(AMAZON_LINK_REGEX) || [];
  return matches.length;
}
