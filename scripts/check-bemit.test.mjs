import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import {
  isValidClass,
  badClassesInCss,
  badClassesInMarkup,
  badClassesInScript,
} from './check-bemit.mjs';

// Compare the set of flagged classes (order/duplicates don't matter).
const expectBad = (actual, expected) =>
  assert.deepEqual([...new Set(actual)].sort(), [...expected].sort());

// --- Grammar ---------------------------------------------------------------

test('grammar: accepts every BEMIT shape', () => {
  for (const cls of [
    'c-hero',
    'c-hero__name',
    'c-btn--primary',
    'c-section__header--docked',
    'o-container',
    'o-layout__item',
    'u-hidden',
    'u-sr-only',
    'is-active',
    'has-children',
    'c-hero__aurora-bloom--1', // numeric modifier
    'c-testimonials-scroller__column', // multi-word block + element
    'c-btn--full-width', // multi-word modifier
  ]) {
    assert.ok(isValidClass(cls), `${cls} should be valid`);
  }
});

test('grammar: rejects malformed and unprefixed names', () => {
  for (const cls of [
    'active', // bare state
    'expanded',
    'badClass', // unprefixed camelCase
    'BadArr',
    'c-Hero', // uppercase
    'c-foo__bar__baz', // double element
    'c-foo--', // empty modifier
    'c-foo__', // empty element
    'c--foo', // missing block
    'c-', // prefix only
    'is-', // empty state
    'x-foo', // unknown prefix
    't-theme',
    'js-hook',
    'c-foo-', // trailing hyphen
    'c_foo', // underscore separator
  ]) {
    assert.ok(!isValidClass(cls), `${cls} should be invalid`);
  }
});

// --- CSS (lightningcss) ----------------------------------------------------

test('css: clean selectors pass', () => {
  expectBad(badClassesInCss('.c-a__b--c, .o-x, .u-y, .is-z, .has-q {}'), []);
});

test('css: flags an unprefixed selector', () => {
  expectBad(badClassesInCss('.badClass {}'), ['badClass']);
});

test('css: descends into nested rules', () => {
  expectBad(badClassesInCss('.c-a { & .badNest {} .c-b:hover {} }'), [
    'badNest',
  ]);
});

test('css: checks classes inside :is()/:not()', () => {
  expectBad(badClassesInCss('.c-a:not(.c-b):is(.c-c, .badTwo) {}'), ['badTwo']);
});

test('css: ignores urls, strings and comments (no false positives)', () => {
  expectBad(
    badClassesInCss(
      '/* .badComment */ .c-a { background: url(http://www.w3.org/2000/svg); content: ".badString" }',
    ),
    [],
  );
});

test('css: ignores keyframe percentages and at-rule preludes', () => {
  expectBad(
    badClassesInCss('@keyframes spin { 0% { opacity: 0 } to { opacity: 1 } }'),
    [],
  );
});

test('css: descends into @media blocks', () => {
  expectBad(badClassesInCss('@media (min-width: 10px) { .badMedia {} }'), [
    'badMedia',
  ]);
});

test('css: reports each bad selector in a list', () => {
  expectBad(badClassesInCss('.badA, .c-ok, .badB {}'), ['badA', 'badB']);
});

// --- Markup (class / class:list) -------------------------------------------

test('markup: flags a bad token in a static class', () => {
  expectBad(badClassesInMarkup('<div class="c-a badM o-b">'), ['badM']);
});

test('markup: handles single-quoted attributes', () => {
  expectBad(badClassesInMarkup("<div class='c-a badS'>"), ['badS']);
});

test('markup: checks class:list array elements', () => {
  expectBad(badClassesInMarkup("<a class:list={['c-a', 'badArr']} />"), [
    'badArr',
  ]);
});

test('markup: checks class:list object keys, skips the condition value', () => {
  expectBad(
    badClassesInMarkup(
      "<a class:list={['c-a', { 'is-x': cond, 'badKey': cond }]} />",
    ),
    ['badKey'],
  );
});

test('markup: a comparison value is not mistaken for a class', () => {
  expectBad(
    badClassesInMarkup("<a class:list={[{ 'is-x': id === 'all' }]} />"),
    [],
  );
});

test('markup: dynamic template keeps static class, skips the hole', () => {
  expectBad(badClassesInMarkup('<i class={`c-a ${x}`} />'), []);
});

test('markup: an interpolation-adjacent prefix is treated as partial', () => {
  expectBad(badClassesInMarkup('<i class={`c-notification--${type}`} />'), []);
});

test('markup: static text after a hole is still checked', () => {
  expectBad(badClassesInMarkup('<i class={`c-a ${x} badStatic`} />'), [
    'badStatic',
  ]);
});

test('markup: a class inside a template ternary is checked', () => {
  expectBad(
    badClassesInMarkup("<i class={`c-a ${cond ? 'is-y' : 'badTern'}`} />"),
    ['badTern'],
  );
});

test('markup: non-class attributes are ignored', () => {
  expectBad(
    badClassesInMarkup('<a href="badurl" aria-label="active expanded">'),
    [],
  );
});

// --- Client JS (classList / className / setAttribute) ----------------------

test('script: flags classList.add arguments', () => {
  expectBad(badClassesInScript("el.classList.add('c-a', 'badAdd')"), [
    'badAdd',
  ]);
});

test('script: a boolean toggle condition is ignored', () => {
  expectBad(badClassesInScript("el.classList.toggle('is-x', open)"), []);
});

test('script: a comparison string in a toggle is ignored', () => {
  expectBad(badClassesInScript("el.classList.toggle('is-x', a === 'b')"), []);
});

test('script: flags className string assignments', () => {
  expectBad(badClassesInScript("el.className = 'c-a badName'"), ['badName']);
});

test('script: flags className template literals', () => {
  expectBad(badClassesInScript('el.className = `c-a badTpl`'), ['badTpl']);
});

test('script: a template className with a dynamic modifier is partial', () => {
  expectBad(badClassesInScript('el.className = `c-notification--${t}`'), []);
});

test('script: flags setAttribute("class", …)', () => {
  expectBad(badClassesInScript("el.setAttribute('class', 'c-a badSet')"), [
    'badSet',
  ]);
});

test('script: covers remove/replace/contains', () => {
  expectBad(
    badClassesInScript(
      "a.classList.remove('badRem'); a.classList.replace('badOld', 'c-new'); a.classList.contains('badHas')",
    ),
    ['badRem', 'badOld', 'badHas'],
  );
});

test('script: unrelated string literals are not class-checked', () => {
  expectBad(badClassesInScript("doThing('active'); fetch('/expanded')"), []);
});

// --- End-to-end CLI (file walk + exit codes) -------------------------------

const CLI = fileURLToPath(new URL('./check-bemit.mjs', import.meta.url));

function runCliOn(tree) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'bemit-'));
  try {
    for (const [rel, content] of Object.entries(tree)) {
      const file = path.join(dir, rel);
      fs.mkdirSync(path.dirname(file), { recursive: true });
      fs.writeFileSync(file, content);
    }
    const result = spawnSync(process.execPath, [CLI], {
      cwd: dir,
      encoding: 'utf8',
    });
    return {
      status: result.status,
      output: `${result.stdout ?? ''}${result.stderr ?? ''}`,
    };
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

test('cli: a clean tree exits 0', () => {
  const result = runCliOn({
    'src/styles/x.css': '.c-a { color: red }',
    'src/components/X.astro': '<div class="c-a is-b" />',
    'src/main.js': "el.classList.add('is-c')",
  });
  assert.equal(result.status, 0);
  assert.match(result.output, /BEMIT checks passed/);
});

test('cli: a violation exits 1 and names the class', () => {
  const result = runCliOn({ 'src/styles/x.css': '.badClass {}' });
  assert.equal(result.status, 1);
  assert.match(result.output, /non-BEMIT class "\.badClass"/);
});

test('cli: malformed CSS is reported, not crashed', () => {
  const result = runCliOn({ 'src/styles/x.css': '.c-a {{{' });
  assert.equal(result.status, 1);
  assert.match(result.output, /failed to parse CSS/);
});

test('cli: a missing src tree is a no-op pass', () => {
  const result = runCliOn({ 'README.md': 'no source here' });
  assert.equal(result.status, 0);
});
