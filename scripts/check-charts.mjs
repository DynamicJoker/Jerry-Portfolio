import fs from 'node:fs';
import path from 'node:path';

// Guards the hand-written MDX charts in src/content/blog/*.mdx, which are
// content-coupled to CSS in components/article.css and can only fail at
// publish time — there is no component boundary to catch a mistake.
//
// Two failure modes, both seen in the wild:
//
//   1. SERIES COLLAPSE. The two-colour charts route through --chart-series-1 /
//      --chart-series-2. Those used to be --color-electric-blue and
//      --color-accent-teal, which a rebrand aliased to --color-primary — both
//      of them. Every two-colour chart silently became one flat fill, and
//      nothing failed: the CSS was valid, the tokens resolved, the build
//      passed. This resolves each series through its var() chain to a literal
//      colour and fails if any two land on the same value, per theme.
//
//   2. UNKNOWN CLASS. A new article that typos `c-stacked-bar__segment--acent`
//      renders an unstyled block rather than erroring. Every c-article-chart*
//      and c-stacked-bar* class used in MDX must exist in the stylesheet.
//
// Run via `npm run check:charts` or the build gate.

const stylesDir = path.resolve('src/styles');
const settingsFile = path.join(stylesDir, 'settings.css');
const articleFile = path.join(stylesDir, 'components/article.css');
const blogDir = path.resolve('src/content/blog');

const errors = [];

function read(file) {
  return fs.readFileSync(file, 'utf8');
}

function stripComments(css) {
  return css.replace(/\/\*[\s\S]*?\*\//g, ' ');
}

// Brace-balanced body following the first occurrence of `header`.
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

// `--token: value;` pairs at the top level of a block body.
function tokensIn(body) {
  const out = new Map();
  if (!body) return out;
  let depth = 0;
  let buf = '';
  for (const ch of body) {
    if (ch === '{') depth++;
    else if (ch === '}') depth--;
    if (ch === ';' && depth === 0) {
      const m = buf.match(/(--[\w-]+)\s*:\s*([\s\S]+)/);
      if (m) out.set(m[1], m[2].replace(/\s+/g, ' ').trim());
      buf = '';
    } else {
      buf += ch;
    }
  }
  return out;
}

// Follow var() references until a literal lands. Returns the literal, or a
// marker string so an unresolvable token is reported rather than silently
// treated as equal to another unresolvable one.
function resolve(token, scopes, seen = new Set()) {
  if (seen.has(token)) return `<circular:${token}>`;
  seen.add(token);
  for (const scope of scopes) {
    if (!scope.has(token)) continue;
    const value = scope.get(token);
    const m = value.match(/^var\(\s*(--[\w-]+)\s*(?:,([\s\S]*))?\)$/);
    if (m) return resolve(m[1], scopes, seen);
    return value.toLowerCase();
  }
  return `<undefined:${token}>`;
}

function checkSeriesColours() {
  const settings = stripComments(read(settingsFile));
  const article = stripComments(read(articleFile));

  const light = tokensIn(blockBody(settings, ':root'));
  const darkAttr = tokensIn(blockBody(settings, "[data-color-scheme='dark']"));
  const chartScope = tokensIn(blockBody(article, '.c-article-chart'));

  // Series tokens the charts actually paint with.
  const series = ['--chart-series-1', '--chart-series-2'];

  for (const [themeName, scopes] of [
    ['light', [chartScope, light]],
    ['dark', [chartScope, darkAttr, light]],
  ]) {
    const resolved = new Map();
    for (const token of series) {
      const value = resolve(token, scopes);
      if (value.startsWith('<')) {
        errors.push(
          `${themeName}: ${token} does not resolve to a colour (${value}). ` +
            `Chart series must resolve to a literal value.`,
        );
        continue;
      }
      if (resolved.has(value)) {
        errors.push(
          `${themeName}: ${token} and ${resolved.get(value)} both resolve to ` +
            `"${value}". The chart series would render as one flat colour. ` +
            `This is exactly the alias collapse that flattened the published ` +
            `stacked bars — give the series distinct values.`,
        );
        continue;
      }
      resolved.set(value, token);
    }
  }
}

function checkMdxClasses() {
  if (!fs.existsSync(blogDir)) return;
  const css = stripComments(read(articleFile));
  const defined = new Set(
    [...css.matchAll(/\.(c-(?:article-chart|stacked-bar)[\w-]*)/g)].map(
      (m) => m[1],
    ),
  );

  for (const file of fs
    .readdirSync(blogDir)
    .filter((f) => f.endsWith('.mdx'))) {
    const body = read(path.join(blogDir, file));
    const used = new Set(
      [...body.matchAll(/\bc-(?:article-chart|stacked-bar)[\w-]*/g)].map(
        (m) => m[0],
      ),
    );
    for (const cls of used) {
      if (!defined.has(cls)) {
        errors.push(
          `${file}: uses .${cls}, which components/article.css never defines. ` +
            `It will render unstyled — check for a typo.`,
        );
      }
    }
  }
}

checkSeriesColours();
checkMdxClasses();

if (errors.length > 0) {
  console.error(`Blog chart checks failed (${errors.length} issue(s)):`);
  console.error(errors.map((e) => `  - ${e}`).join('\n'));
  process.exit(1);
}

console.log('Blog chart checks passed.');
