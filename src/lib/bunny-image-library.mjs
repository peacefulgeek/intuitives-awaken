/**
 * Bunny CDN Image Library System
 * 
 * The site has 40 pre-generated WebP images at /library/lib-01.webp through lib-40.webp.
 * When an article is published, we randomly pick one, download it, and re-upload it
 * to /images/{slug}.webp — giving Google a unique, indexable URL per article.
 * 
 * Credentials are hardcoded per spec (Section 4 of ADDENDUMSCOPENOCLAUDE.md).
 */

// ─── HARDCODED CREDENTIALS (per spec) ────────────────────────────────────────
const BUNNY_STORAGE_ZONE = 'intuitives-awaken';
const BUNNY_API_KEY = '1eb8ae9c-45fd-4203-ad710a9a76d5-13d8-47a8';
const BUNNY_PULL_ZONE = 'https://intuitives-awaken.b-cdn.net';
const BUNNY_HOSTNAME = 'ny.storage.bunnycdn.com';
const LIBRARY_SIZE = 40;

/**
 * Assign a hero image to an article by:
 * 1. Randomly selecting a library image (lib-01 to lib-40)
 * 2. Downloading it from the CDN
 * 3. Re-uploading it to /images/{slug}.webp
 * 4. Returning the unique CDN URL
 * 
 * Falls back to a direct library URL if the copy fails.
 */
export async function assignHeroImage(slug) {
  const num = String(Math.floor(Math.random() * LIBRARY_SIZE) + 1).padStart(2, '0');
  const sourceFile = `lib-${num}.webp`;
  const destFile = `${slug}.webp`;

  try {
    // Download the library image
    const sourceUrl = `${BUNNY_PULL_ZONE}/library/${sourceFile}`;
    const downloadRes = await fetch(sourceUrl);
    if (!downloadRes.ok) throw new Error(`Download failed: HTTP ${downloadRes.status}`);
    const imageBuffer = await downloadRes.arrayBuffer();

    // Upload to /images/{slug}.webp
    const uploadUrl = `https://${BUNNY_HOSTNAME}/${BUNNY_STORAGE_ZONE}/images/${destFile}`;
    const uploadRes = await fetch(uploadUrl, {
      method: 'PUT',
      headers: {
        'AccessKey': BUNNY_API_KEY,
        'Content-Type': 'image/webp',
      },
      body: imageBuffer,
    });

    if (!uploadRes.ok) throw new Error(`Upload failed: HTTP ${uploadRes.status}`);

    const cdnUrl = `${BUNNY_PULL_ZONE}/images/${destFile}`;
    console.log(`[bunny] Assigned hero image: ${sourceFile} → ${cdnUrl}`);
    return cdnUrl;
  } catch (err) {
    // Fallback: link directly to the library image
    console.warn(`[bunny] assignHeroImage failed for "${slug}", using fallback: ${err.message}`);
    return `${BUNNY_PULL_ZONE}/library/${sourceFile}`;
  }
}

/**
 * Get the CDN URL for a library image by number (1-40).
 */
export function getLibraryImageUrl(num) {
  const padded = String(num).padStart(2, '0');
  return `${BUNNY_PULL_ZONE}/library/lib-${padded}.webp`;
}

/**
 * Get a random library image URL (without copying).
 */
export function getRandomLibraryImageUrl() {
  const num = Math.floor(Math.random() * LIBRARY_SIZE) + 1;
  return getLibraryImageUrl(num);
}
