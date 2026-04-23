import { build } from 'esbuild';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = resolve(__dirname, '..');

console.log('[build-server] Building server bundle...');

await build({
  entryPoints: [resolve(projectRoot, 'server/index.ts')],
  bundle: true,
  platform: 'node',
  target: 'node20',
  format: 'esm',
  outfile: resolve(projectRoot, 'dist/index.js'),
  external: [
    // Node built-ins
    'node:*',
    // Packages that should not be bundled
    'vite',
    '@vitejs/plugin-react',
    // Native modules
    'pg-native',
    'fsevents'
  ],
  define: {
    'process.env.NODE_ENV': '"production"'
  },
  banner: {
    js: `import { createRequire } from 'module'; const require = createRequire(import.meta.url);`
  },
  logLevel: 'info'
});

// Also build SSR entry for React
await build({
  entryPoints: [resolve(projectRoot, 'src/client/entry-server.tsx')],
  bundle: true,
  platform: 'node',
  target: 'node20',
  format: 'esm',
  outfile: resolve(projectRoot, 'dist/server.js'),
  external: ['node:*', 'vite', 'pg-native', 'fsevents'],
  define: {
    'process.env.NODE_ENV': '"production"'
  },
  logLevel: 'info'
});

console.log('[build-server] Done.');
