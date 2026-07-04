import fs from 'node:fs';
import path from 'node:path';

// Guards the hand-maintained duplication between the two dark-theme blocks in
// src/styles/settings.css:
//   1. @media (prefers-color-scheme: dark) { :root:not([data-color-scheme='light']) { … } }
//      — the no-JS fallback that honours the OS setting.
//   2. [data-color-scheme='dark'] { … }
//      — what the pre-paint script toggles once JS runs.
// Both must declare the same custom properties with the same values, or the
// two ways of entering dark mode diverge (e.g. a token updated in one path but
// not the other). check:critical only compares critical-home.css against the
// full stylesheet; it never compares these two blocks to each other, which is
// the gap this guard closes. Run via `npm run check:theme` or the build gate.

const settingsFile = path.resolve('src/styles/settings.css');

function stripComments(css) {
  return css.replace(/\/\*[\s\S]*?\*\//g, ' ');
}

// Capture the brace-balanced body that immediately follows `header` (the first
// occurrence). `header` is matched literally. Returns the inner text or null.
function blockBody(css, header) {
  const at = css.indexOf(header);
  if (at === -1) return null;
  const open = css.indexOf('{', at + header.length - 1);
  if (open === -1) return null;
  let depth = 0;
  for (let i = open; i < css.length; i++) {
    if (css[i] === '{') depth++;
    else if (css[i] === '}') {
      depth--;
      if (depth === 0) return css.slice(open + 1, i);
    }
  }
  return null;
}

// Pull top-level `--token: value;` pairs from a block body (paren-aware so the
// commas in rgba()/gradients don't end a declaration early). Nested rule blocks
// are skipped.
function customProperties(body) {
  const props = new Map();
  let depth = 0;
  let buf = '';
  let paren = 0;
  for (const ch of body) {
    if (ch === '(') paren++;
    else if (ch === ')') paren--;
    if (ch === '{' && paren === 0) {
      depth++;
      buf = '';
      continue;
    }
    if (ch === '}' && paren === 0) {
      depth--;
      buf = '';
      continue;
    }
    if (ch === ';' && paren === 0 && depth === 0) {
      const m = buf.match(/^\s*(--[\w-]+)\s*:\s*([\s\S]+)$/);
      if (m) props.set(m[1], m[2].replace(/\s+/g, ' ').trim());
      buf = '';
      continue;
    }
    buf += ch;
  }
  return props;
}

const errors = [];

if (!fs.existsSync(settingsFile)) {
  console.error(`Missing ${path.relative(process.cwd(), settingsFile)}`);
  process.exit(1);
}

const css = stripComments(fs.readFileSync(settingsFile, 'utf8'));

const mediaOuter = blockBody(css, '@media (prefers-color-scheme: dark)');
const mediaBody =
  mediaOuter && blockBody(mediaOuter, ":root:not([data-color-scheme='light'])");
const attrBody = blockBody(css, "[data-color-scheme='dark'] {");

if (!mediaBody) {
  errors.push(
    "Could not find the @media (prefers-color-scheme: dark) :root:not([data-color-scheme='light']) block in settings.css.",
  );
}
if (!attrBody) {
  errors.push(
    "Could not find the [data-color-scheme='dark'] token block in settings.css.",
  );
}

if (mediaBody && attrBody) {
  const media = customProperties(mediaBody);
  const attr = customProperties(attrBody);

  for (const [token, value] of attr) {
    if (!media.has(token)) {
      errors.push(
        `Token "${token}" is in [data-color-scheme='dark'] but missing from the @media fallback.`,
      );
    } else if (media.get(token) !== value) {
      errors.push(
        `Token "${token}" differs: [data-color-scheme] has "${value}", @media has "${media.get(token)}".`,
      );
    }
  }
  for (const token of media.keys()) {
    if (!attr.has(token)) {
      errors.push(
        `Token "${token}" is in the @media fallback but missing from [data-color-scheme='dark'].`,
      );
    }
  }
}

if (errors.length > 0) {
  console.error(
    `Dark-theme blocks are out of sync in settings.css (${errors.length} issue(s)):`,
  );
  console.error(errors.map((e) => `  - ${e}`).join('\n'));
  console.error(
    '\nKeep the @media (prefers-color-scheme: dark) fallback and the ' +
      "[data-color-scheme='dark'] block byte-identical, then re-run " +
      '`npm run check:theme`.',
  );
  process.exit(1);
}

console.log('Dark-theme blocks are in sync.');
