import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { transform } from 'lightningcss';

// Enforces the BEMIT-lite class-naming convention (see CLAUDE.md "CSS rules")
// across every surface where classes are authored: stylesheet selectors, Astro
// markup (class / class:list), and the classList/className calls in client JS.
// Build-gated like the other scripts/check-*.mjs guards. The pure collectors are
// exported for scripts/check-bemit.test.mjs; the file walk only runs as a CLI.
//
// Grammar:
//   c-block, c-block__element, c-block--modifier, c-block__element--modifier
//   o-* objects (same shape as components)
//   u-* utilities (flat)
//   is-* / has-* JS-toggled states (flat)
// Each segment is lowercase kebab-case. Bare state classes (active, expanded…)
// and unprefixed names are rejected by construction.
const SEGMENT = '[a-z0-9]+(?:-[a-z0-9]+)*';
export const BEMIT = new RegExp(
  '^(?:' +
    `(?:c|o)-${SEGMENT}(?:__${SEGMENT})?(?:--${SEGMENT})?` +
    `|u-${SEGMENT}` +
    `|(?:is|has)-${SEGMENT}` +
    ')$',
);

// Classes that are intentionally exempt — third-party widgets and the like.
// Keep this short and documented; every entry is a deviation from the convention.
const ALLOWLIST = new Set([
  // (none yet — add third-party class names here with a comment)
]);

export function isValidClass(token) {
  return BEMIT.test(token) || ALLOWLIST.has(token);
}

// Push every invalid token from a whitespace-separated class string ("c-btn x").
function collectClassString(value, out) {
  for (const token of value.split(/\s+/)) {
    if (token && !isValidClass(token)) out.push(token);
  }
}

// Marks where a ${...} interpolation sat, so a static chunk that touches a
// dynamic value (`c-notification--${type}`) is recognised as partial and
// skipped. A NUL keeps the token non-empty after the whitespace split and can
// never appear in a real class name.
const INTERPOLATION = String.fromCharCode(0);

// True when the string literal spanning [open, close] is an operand of a
// comparison (`filter.id === 'all'`) — a condition value, not an applied class.
function isComparisonOperand(text, open, close) {
  const operators = new Set(['=', '!', '<', '>']);
  let before = open - 1;
  while (before > 0 && text[before] === ' ') before--;
  let after = close + 1;
  while (after < text.length && text[after] === ' ') after++;
  return operators.has(text[before]) || operators.has(text[after]);
}

// Scan a JS/JSX expression for string literals, pushing invalid class tokens to
// out. Handles ' " and ` strings. Two positions are deliberately skipped because
// they are never applied class names: comparison operands (`x === 'all'`) and
// template chunks adjacent to an interpolation (the visible prefix of
// `c-notification--${type}` is incomplete). Each ${...} hole is scanned
// recursively, so a class inside a ternary (`c-x ${cond ? 'is-y' : ''}`) is
// still checked.
function collectExpression(expr, out) {
  let i = 0;
  while (i < expr.length) {
    const ch = expr[i];
    if (ch === "'" || ch === '"') {
      let j = i + 1;
      while (j < expr.length && expr[j] !== ch) j += expr[j] === '\\' ? 2 : 1;
      if (!isComparisonOperand(expr, i, j))
        collectClassString(expr.slice(i + 1, j), out);
      i = j + 1;
    } else if (ch === '`') {
      let j = i + 1;
      let flat = '';
      const holes = [];
      while (j < expr.length && expr[j] !== '`') {
        if (expr[j] === '\\') {
          flat += ' ';
          j += 2;
        } else if (expr[j] === '$' && expr[j + 1] === '{') {
          let depth = 1;
          let k = j + 2;
          for (; k < expr.length && depth > 0; k++) {
            if (expr[k] === '{') depth++;
            else if (expr[k] === '}') depth--;
          }
          holes.push(expr.slice(j + 2, k - 1));
          flat += INTERPOLATION;
          j = k;
        } else {
          flat += expr[j];
          j++;
        }
      }
      for (const token of flat.split(/\s+/)) {
        if (token && !token.includes(INTERPOLATION))
          collectClassString(token, out);
      }
      for (const hole of holes) collectExpression(hole, out);
      i = j + 1;
    } else {
      i++;
    }
  }
}

// Return the expression inside the brace that starts at openIndex, matching
// nested braces and skipping over ' " ` strings (so a brace inside a string
// doesn't end the scan early).
function readBraced(text, openIndex) {
  let depth = 0;
  for (let i = openIndex; i < text.length; i++) {
    const ch = text[i];
    if (ch === "'" || ch === '"' || ch === '`') {
      i++;
      while (i < text.length && text[i] !== ch) i += text[i] === '\\' ? 2 : 1;
    } else if (ch === '{') {
      depth++;
    } else if (ch === '}' && --depth === 0) {
      return text.slice(openIndex + 1, i);
    }
  }
  return '';
}

// Walk one parsed selector, pushing invalid class names. The visitor isn't
// called for the selector lists nested inside :is()/:not()/:where()/:has(), so
// recurse into any component that carries its own `selectors`.
function collectSelectorClasses(selector, out) {
  for (const part of selector) {
    if (part.type === 'class') {
      if (!isValidClass(part.name)) out.push(part.name);
    } else if (Array.isArray(part.selectors)) {
      for (const inner of part.selectors) collectSelectorClasses(inner, out);
    }
  }
}

// CSS: parse selectors with lightningcss (robust — descends into nesting and
// @media, and ignores urls, strings, comments and at-rule preludes, so there are
// no false positives from `url(...w3.org...)`). Throws on unparseable CSS.
export function badClassesInCss(code, filename = 'input.css') {
  const out = [];
  transform({
    filename,
    code: Buffer.isBuffer(code) ? code : Buffer.from(code),
    visitor: {
      Selector(selector) {
        collectSelectorClasses(selector, out);
        return selector;
      },
    },
  });
  return out;
}

// Markup: static class="…"/'…' attributes plus class / class:list={…}
// expressions. Run on .astro for both the template and any inline <script>.
export function badClassesInMarkup(text) {
  const out = [];
  for (const m of text.matchAll(/\bclass\s*=\s*"([^"]*)"/g))
    collectClassString(m[1], out);
  for (const m of text.matchAll(/\bclass\s*=\s*'([^']*)'/g))
    collectClassString(m[1], out);
  for (const m of text.matchAll(/\bclass(?::list)?\s*=\s*\{/g))
    collectExpression(readBraced(text, m.index + m[0].length - 1), out);
  return out;
}

// Client JS: classList.add/remove/toggle/replace/contains(), .className = …,
// and setAttribute('class', …).
export function badClassesInScript(text) {
  const out = [];
  for (const m of text.matchAll(
    /\.classList\.(?:add|remove|toggle|replace|contains)\(([^)]*)\)/g,
  ))
    collectExpression(m[1], out);
  for (const m of text.matchAll(/\.className\s*=\s*(`[^`]*`|'[^']*'|"[^"]*")/g))
    collectExpression(m[1], out);
  for (const m of text.matchAll(
    /setAttribute\(\s*['"]class['"]\s*,\s*(`[^`]*`|'[^']*'|"[^"]*")/g,
  ))
    collectExpression(m[1], out);
  return out;
}

function walk(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(fullPath) : [fullPath];
  });
}

// Walk the source tree and return a sorted, de-duplicated list of messages.
export function collectViolations() {
  const errors = new Set();
  const toSource = (file) =>
    path.relative(process.cwd(), file).replaceAll(path.sep, '/');

  for (const file of walk('src/styles')) {
    if (!file.endsWith('.css')) continue;
    try {
      for (const name of badClassesInCss(fs.readFileSync(file), file))
        errors.add(`${toSource(file)}: non-BEMIT class ".${name}"`);
    } catch (error) {
      errors.add(`${toSource(file)}: failed to parse CSS (${error.message})`);
    }
  }
  for (const file of walk('src')) {
    if (file.endsWith('.astro')) {
      const text = fs.readFileSync(file, 'utf8');
      for (const token of [
        ...badClassesInMarkup(text),
        ...badClassesInScript(text), // inline <script> + frontmatter
      ])
        errors.add(`${toSource(file)}: non-BEMIT class "${token}"`);
    } else if (file.endsWith('.js')) {
      const text = fs.readFileSync(file, 'utf8');
      for (const token of badClassesInScript(text))
        errors.add(`${toSource(file)}: non-BEMIT class "${token}"`);
    }
  }
  return [...errors].sort();
}

function main() {
  const issues = collectViolations();
  if (issues.length > 0) {
    console.error(
      `BEMIT check failed (${issues.length} ${issues.length === 1 ? 'issue' : 'issues'}):`,
    );
    console.error(issues.map((issue) => `  ${issue}`).join('\n'));
    console.error(
      '\nClasses must be c-block__element--modifier, o-*, u-*, or is-*/has-* ' +
        '(see CLAUDE.md "CSS rules"). Add genuine third-party exceptions to the ' +
        'ALLOWLIST in scripts/check-bemit.mjs.',
    );
    process.exit(1);
  }
  console.log('BEMIT checks passed.');
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(fs.realpathSync(process.argv[1])).href
) {
  main();
}
