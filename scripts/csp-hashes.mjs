import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

// Recomputes the SHA-256 hashes of every executable inline <script> in the
// built site, for the `script-src` directive of the CSP in vercel.json.
//
// Why this exists: the site is static, so a strict `script-src` can't use a
// per-request nonce — it must list hashes. Most inline scripts are stable, but
// the deferred-stylesheet loader embeds the content-hashed CSS filename, so its
// hash changes whenever the CSS changes. Run this after `npm run build` and
// before flipping the CSP from Report-Only to enforcing, and paste the tokens
// into the `script-src` list.
//
// Usage: npm run build && node scripts/csp-hashes.mjs

const DIST = path.resolve('dist');

// Executable inline scripts only: skip <script src> (external) and data blocks
// like application/ld+json / application/json, which browsers never execute and
// CSP script-src therefore doesn't gate.
const INLINE_SCRIPT =
  /<script(?![^>]*\bsrc=)(?![^>]*type="application\/(?:ld\+json|json)")[^>]*>([\s\S]*?)<\/script>/gi;

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(full) : [full];
  });
}

function collectHashes() {
  const hashes = new Map();
  for (const file of walk(DIST).filter((f) => f.endsWith('.html'))) {
    const html = fs.readFileSync(file, 'utf8');
    let match;
    while ((match = INLINE_SCRIPT.exec(html))) {
      const body = match[1];
      if (!body.trim()) continue;
      const hash =
        'sha256-' +
        crypto.createHash('sha256').update(body, 'utf8').digest('base64');
      if (!hashes.has(hash)) hashes.set(hash, new Set());
      hashes.get(hash).add(path.relative(DIST, file));
    }
  }
  return hashes;
}

if (!fs.existsSync(DIST)) {
  console.error('dist/ not found — run `npm run build` first.');
  process.exit(1);
}

const hashes = collectHashes();
console.log(`Found ${hashes.size} unique executable inline script(s).\n`);
console.log('script-src tokens (paste into vercel.json CSP):\n');
console.log([...hashes.keys()].map((h) => `'${h}'`).join(' '));
console.log('\nPer-hash source files:');
for (const [hash, files] of hashes) {
  console.log(`  '${hash}'\n    ${[...files].join(', ')}`);
}
