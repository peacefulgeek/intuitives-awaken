import fs from 'fs/promises';
import path from 'path';

const failures = [];

function luminance(hex) {
  const r = parseInt(hex.slice(1,3), 16) / 255;
  const g = parseInt(hex.slice(3,5), 16) / 255;
  const b = parseInt(hex.slice(5,7), 16) / 255;
  const toLinear = c => c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
}

function contrastRatio(fg, bg) {
  const l1 = luminance(fg), l2 = luminance(bg);
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
}

// 1. Contrast check from design tokens
try {
  const css = await fs.readFile('src/client/styles/tokens.css', 'utf8');
  const text = css.match(/--text-primary:\s*(#[0-9a-fA-F]{6})/)?.[1];
  const bg = css.match(/--bg-primary:\s*(#[0-9a-fA-F]{6})/)?.[1];
  if (text && bg) {
    const ratio = contrastRatio(text, bg);
    if (ratio < 4.5) failures.push(`contrast-fail: ${text} on ${bg} = ${ratio.toFixed(2)} (need 4.5)`);
    else console.log(`[visual-qa] Contrast ${ratio.toFixed(2)} OK`);
  } else {
    failures.push('tokens.css missing --text-primary or --bg-primary');
  }
} catch (e) {
  failures.push(`tokens.css not readable: ${e.message}`);
}

// 2. Check dist exists
try {
  await fs.access('dist/client');
  console.log('[visual-qa] dist/client exists OK');
} catch {
  failures.push('dist/client directory missing');
}

// 3. No Google Fonts in source
async function walk(dir, results = []) {
  try {
    for (const ent of await fs.readdir(dir, { withFileTypes: true })) {
      const full = path.join(dir, ent.name);
      if (ent.isDirectory()) await walk(full, results);
      else results.push(full);
    }
  } catch {}
  return results;
}

const srcFiles = await walk('src');
for (const f of srcFiles) {
  if (!/\.(ts|tsx|js|mjs|jsx|css|html)$/.test(f)) continue;
  const txt = await fs.readFile(f, 'utf8');
  if (/fonts\.googleapis\.com|fonts\.gstatic\.com/.test(txt)) {
    failures.push(`google-fonts-leak: ${f}`);
  }
  if (/cloudfront\.net/.test(txt)) {
    failures.push(`cloudfront-leak: ${f}`);
  }
}

// 4. No Manus artifacts
for (const f of srcFiles) {
  if (!/\.(ts|tsx|js|mjs|jsx)$/.test(f)) continue;
  const txt = await fs.readFile(f, 'utf8');
  if (/forge\.manus\.im|vite-plugin-manus|manus-runtime/.test(txt)) {
    failures.push(`manus-artifact: ${f}`);
  }
}

// 5. No API keys in code
for (const f of srcFiles) {
  if (!/\.(ts|tsx|js|mjs|jsx)$/.test(f)) continue;
  const txt = await fs.readFile(f, 'utf8');
  if (/sk-ant-api[0-9a-zA-Z_-]{20,}/.test(txt)) {
    failures.push(`api-key-in-code: ${f}`);
  }
  if (/ghp_[0-9a-zA-Z]{30,}/.test(txt)) {
    failures.push(`github-pat-in-code: ${f}`);
  }
}

// 6. Required files present
const required = [
  'src/lib/article-quality-gate.mjs',
  'src/lib/amazon-verify.mjs',
  'src/data/verified-asins.json',
  'src/cron/generate-article.mjs',
  'src/cron/product-spotlight.mjs',
  'src/cron/refresh-monthly.mjs',
  'src/cron/refresh-quarterly.mjs',
  'src/cron/asin-health-check.mjs',
  '.do/app.yaml',
  'scripts/start-with-cron.mjs'
];
for (const f of required) {
  try {
    await fs.access(f);
    console.log(`[visual-qa] ${f} OK`);
  } catch {
    failures.push(`missing-required-file: ${f}`);
  }
}

// 7. Cron schedules present
const cronFile = await fs.readFile('scripts/start-with-cron.mjs', 'utf8');
const cronChecks = [
  { pattern: "'0 6 * * 1-5'", name: 'cron-1 article-gen Mon-Fri 06:00' },
  { pattern: "'0 8 * * 6'", name: 'cron-2 spotlight Sat 08:00' },
  { pattern: "'0 3 1 * *'", name: 'cron-3 monthly 1st 03:00' },
  { pattern: "'0 4 1 1,4,7,10 *'", name: 'cron-4 quarterly 04:00' },
  { pattern: "'0 5 * * 0'", name: 'cron-5 asin-health Sun 05:00' }
];
for (const { pattern, name } of cronChecks) {
  if (cronFile.includes(pattern)) console.log(`[visual-qa] ${name} OK`);
  else failures.push(`missing-cron-schedule: ${name}`);
}

// 8. Amazon tag
const amazonFile = await fs.readFile('src/lib/amazon-verify.mjs', 'utf8');
if (amazonFile.includes('spankyspinola-20')) console.log('[visual-qa] Amazon tag OK');
else failures.push('amazon-tag-missing: spankyspinola-20 not found in amazon-verify.mjs');

// Report
if (failures.length > 0) {
  console.error('[visual-qa] FAILED:');
  failures.forEach(f => console.error('  - ' + f));
  process.exit(1);
}
console.log('[visual-qa] All checks passed');
