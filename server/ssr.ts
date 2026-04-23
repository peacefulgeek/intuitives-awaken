import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const isDev = process.env.NODE_ENV !== 'production';

const BUNNY_CDN = 'https://intuitives-awaken.b-cdn.net';

function buildHtmlShell(appHtml: string, headTags: string, title: string, description: string, ogImage?: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="description" content="${description}" />
  <meta property="og:title" content="${title}" />
  <meta property="og:description" content="${description}" />
  <meta property="og:type" content="website" />
  ${ogImage ? `<meta property="og:image" content="${ogImage}" />` : ''}
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${title}" />
  <meta name="twitter:description" content="${description}" />
  ${ogImage ? `<meta name="twitter:image" content="${ogImage}" />` : ''}
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;0,700;1,400;1,600&family=Source+Serif+4:ital,wght@0,400;0,600;1,400&family=Inter:wght@400;500;600&display=swap" rel="stylesheet" />
  <link rel="canonical" href="https://intuitivesawaken.com" />
  <link rel="icon" type="image/webp" href="${BUNNY_CDN}/images/favicon.webp" />
  <link rel="apple-touch-icon" href="${BUNNY_CDN}/images/apple-touch-icon.webp" />
  ${headTags}
  <title>${title}</title>
</head>
<body>
  <div id="app">${appHtml}</div>
  <script type="module" src="/assets/entry-client.js"></script>
</body>
</html>`;
}

export async function renderPage(url: string, options?: { vite?: any }): Promise<string> {
  try {
    if (isDev && options?.vite) {
      // Dev mode: use Vite's transform
      const { render } = await options.vite.ssrLoadModule('/src/client/entry-server.tsx');
      const { html, head } = await render(url);
      return buildHtmlShell(html, head || '', 'The Bright Wound', 'For the person who has always sensed things others don\'t.');
    } else {
      // Production: load from dist
      const distDir = path.resolve(__dirname, '../dist');
      const serverEntry = path.join(distDir, 'server.js');
      
      if (!fs.existsSync(serverEntry)) {
        // Fallback: serve shell for client-side hydration
        return buildHtmlShell('', '', 'The Bright Wound', 'For the person who has always sensed things others don\'t.');
      }

      const { render } = await import(serverEntry);
      const { html, head } = await render(url);
      return buildHtmlShell(html, head || '', 'The Bright Wound', 'For the person who has always sensed things others don\'t.');
    }
  } catch (err) {
    console.error('[ssr] render error', err);
    // Graceful fallback
    return buildHtmlShell('', '', 'The Bright Wound', 'For the person who has always sensed things others don\'t.');
  }
}
