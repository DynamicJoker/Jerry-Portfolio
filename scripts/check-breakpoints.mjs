import fs from 'node:fs';
import path from 'node:path';

// Guards the breakpoint set. Media queries cannot read custom properties, so
// every switch point in the stylesheets is a hand-written literal — and nothing
// stopped a new component from inventing a seventh one. The --breakpoint-*
// tokens in settings.css :root are the sanctioned list; this fails the build on
// any width media query in src/styles that isn't one of them.
//
// The `.01rem` twins are accepted: the house convention pairs `max-width: Nrem`
// with `min-width: N.01rem` so a viewport at exactly a breakpoint (iPad portrait
// at 48rem) resolves to the smaller side everywhere.
//
// Height queries are NOT checked. The two in hero.css (`max-height: 40rem`,
// `43.75rem`) fit the hero to short viewports; they are not layout tiers and
// forcing them onto the width scale would be meaningless.
//
// Run via `npm run check:breakpoints` or the build gate.

const stylesDir = path.resolve('src/styles');
const settingsFile = path.join(stylesDir, 'settings.css');

function stripComments(css) {
  return css.replace(/\/\*[\s\S]*?\*\//g, ' ');
}

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const full = path.join(dir, e.name);
    return e.isDirectory() ? walk(full) : full.endsWith('.css') ? [full] : [];
  });
}

const errors = [];

if (!fs.existsSync(settingsFile)) {
  console.error(`Missing ${path.relative(process.cwd(), settingsFile)}`);
  process.exit(1);
}

// --- sanctioned set, read from the tokens -------------------------------
const settings = stripComments(fs.readFileSync(settingsFile, 'utf8'));
const sanctioned = new Map(); // rem value -> token name
for (const m of settings.matchAll(
  /(--breakpoint-[\w-]+)\s*:\s*([0-9.]+)rem\s*;/g,
)) {
  sanctioned.set(Number(m[2]), m[1]);
}

if (sanctioned.size === 0) {
  console.error(
    'No --breakpoint-* tokens found in settings.css :root — the gate has ' +
      'nothing to check against. Declare the breakpoint scale before running.',
  );
  process.exit(1);
}

const allowed = new Set();
for (const rem of sanctioned.keys()) {
  allowed.add(rem); // 48
  allowed.add(Number((rem + 0.01).toFixed(2))); // 48.01
}

// --- scan every stylesheet ----------------------------------------------
// Match width features only, inside @media preludes. Line numbers come from
// counting newlines in the ORIGINAL text, so comment stripping can't shift them.
for (const file of walk(stylesDir).sort()) {
  const raw = fs.readFileSync(file, 'utf8');
  const rel = path.relative(process.cwd(), file);

  for (const m of raw.matchAll(/@media[^{]*/g)) {
    const prelude = stripComments(m[0]);
    const line = raw.slice(0, m.index).split('\n').length;

    for (const f of prelude.matchAll(
      /\((min|max)-width:\s*([0-9.]+)(rem|px|em)\)/g,
    )) {
      const [, dir, num, unit] = f;
      if (unit !== 'rem') {
        errors.push(
          `${rel}:${line}  (${dir}-width: ${num}${unit}) — breakpoints must be ` +
            `declared in rem so they track the user's root font size.`,
        );
        continue;
      }
      const value = Number(num);
      if (allowed.has(value)) continue;

      const nearest = [...sanctioned.entries()].sort(
        (a, b) => Math.abs(a[0] - value) - Math.abs(b[0] - value),
      )[0];
      errors.push(
        `${rel}:${line}  (${dir}-width: ${num}rem) is not a sanctioned ` +
          `breakpoint. Nearest is ${nearest[0]}rem (${nearest[1]}). Either use ` +
          `that (or its ${(nearest[0] + 0.01).toFixed(2)}rem step twin), or add ` +
          `the new value to the --breakpoint-* scale in settings.css first.`,
      );
    }
  }
}

const scale = [...sanctioned.entries()]
  .sort((a, b) => a[0] - b[0])
  .map(([rem, token]) => `${rem}rem (${token})`)
  .join(', ');

if (errors.length > 0) {
  console.error(`Unsanctioned breakpoints (${errors.length}):`);
  console.error(errors.map((e) => `  - ${e}`).join('\n'));
  console.error(`\nSanctioned scale: ${scale}`);
  process.exit(1);
}

console.log(`Breakpoints in sync. Scale: ${scale}`);
