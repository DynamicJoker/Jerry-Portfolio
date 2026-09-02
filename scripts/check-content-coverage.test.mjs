import { test } from 'node:test';
import assert from 'node:assert/strict';
import { findCoverageGaps } from './check-content-coverage.mjs';

const archiveUi = {
  industryOrder: ['Cloud', 'Cybersecurity'],
  assetTypeOrder: ['Reviews', 'Press & PR'],
};
const labels = { Reviews: 'Reviews', 'Press & PR': 'Press & PR' };

// --- Clean data ------------------------------------------------------------

test('clean data produces no gaps', () => {
  const rows = [
    { industry: 'Cloud', assetType: 'Reviews' },
    { industry: 'Cybersecurity', assetType: 'Press & PR' },
  ];
  assert.deepEqual(findCoverageGaps(rows, archiveUi, labels), []);
});

test('an empty archive produces no gaps', () => {
  assert.deepEqual(findCoverageGaps([], archiveUi, labels), []);
});

// --- The rank-99 silent failure this check exists to catch ------------------

test('an unlisted industry is reported', () => {
  const rows = [{ industry: 'Fintech', assetType: 'Reviews' }];
  const gaps = findCoverageGaps(rows, archiveUi, labels);
  assert.equal(gaps.length, 1);
  assert.match(gaps[0], /Fintech/);
  assert.match(gaps[0], /industryOrder/);
});

test('an unlisted asset type is reported', () => {
  const rows = [{ industry: 'Cloud', assetType: 'Webinars' }];
  const gaps = findCoverageGaps(rows, archiveUi, labels);
  assert.ok(gaps.some((g) => /Webinars/.test(g) && /assetTypeOrder/.test(g)));
});

test('an asset type with no display label is reported', () => {
  const rows = [{ industry: 'Cloud', assetType: 'Reviews' }];
  const gaps = findCoverageGaps(rows, archiveUi, { 'Press & PR': 'Press' });
  assert.ok(gaps.some((g) => /Reviews/.test(g) && /assetTypeLabels/.test(g)));
});

// --- Reporting quality -----------------------------------------------------

test('each missing value is reported once, not once per row', () => {
  const rows = [
    { industry: 'Fintech', assetType: 'Reviews' },
    { industry: 'Fintech', assetType: 'Reviews' },
    { industry: 'Fintech', assetType: 'Reviews' },
  ];
  assert.equal(findCoverageGaps(rows, archiveUi, labels).length, 1);
});

test('an unlisted asset type reports BOTH its ordering and label gaps', () => {
  const rows = [{ industry: 'Cloud', assetType: 'Webinars' }];
  const gaps = findCoverageGaps(rows, archiveUi, labels);
  assert.equal(gaps.length, 2);
});

test('several distinct gaps are all reported', () => {
  const rows = [
    { industry: 'Fintech', assetType: 'Reviews' },
    { industry: 'Robotics', assetType: 'Reviews' },
  ];
  const gaps = findCoverageGaps(rows, archiveUi, labels);
  assert.equal(gaps.length, 2);
  assert.ok(gaps.some((g) => /Fintech/.test(g)));
  assert.ok(gaps.some((g) => /Robotics/.test(g)));
});

// A label inherited from Object.prototype must not count as coverage.
test('a prototype key does not satisfy the label check', () => {
  const rows = [{ industry: 'Cloud', assetType: 'constructor' }];
  const gaps = findCoverageGaps(rows, archiveUi, labels);
  assert.ok(gaps.some((g) => /assetTypeLabels/.test(g)));
});
