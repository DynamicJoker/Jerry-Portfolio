import fs from 'node:fs';
import { pathToFileURL } from 'node:url';

// Asserts that every `industry` and `assetType` present in work-data.js is
// listed in content.js's archiveUi ordering arrays, and that every asset type
// has a display label in assetTypeLabels.
//
// Why this exists: the archive's rank helpers (src/lib/work-archive.js) return
// 99 for any value they don't recognise, so an unlisted industry or asset type
// sinks silently to the bottom of the archive with nothing failing anywhere —
// no error, no warning, just a piece of work quietly in the wrong place. A
// missing label is worse: the filter tab renders with an undefined name. This
// turns both into a build failure at the point the data is added.

export function findCoverageGaps(workArchive, archiveUi, assetTypeLabels) {
  const gaps = [];
  // Sets, so a value used by 200 rows is reported once rather than 200 times.
  const industries = new Set(workArchive.map((row) => row.industry));
  const assetTypes = new Set(workArchive.map((row) => row.assetType));

  for (const industry of industries) {
    if (!archiveUi.industryOrder.includes(industry)) {
      gaps.push(
        `industry "${industry}" is used in work-data.js but missing from ` +
          `archiveUi.industryOrder in content.js`,
      );
    }
  }

  for (const assetType of assetTypes) {
    if (!archiveUi.assetTypeOrder.includes(assetType)) {
      gaps.push(
        `assetType "${assetType}" is used in work-data.js but missing from ` +
          `archiveUi.assetTypeOrder in content.js`,
      );
    }
    // hasOwnProperty, not `in`: an assetType of "constructor" or "toString"
    // would otherwise inherit a match from Object.prototype and pass.
    if (!Object.prototype.hasOwnProperty.call(assetTypeLabels, assetType)) {
      gaps.push(
        `assetType "${assetType}" is used in work-data.js but has no entry ` +
          `in assetTypeLabels in content.js`,
      );
    }
  }

  return gaps;
}

async function main() {
  const { siteContent } = await import('../src/content.js');
  const gaps = findCoverageGaps(
    siteContent.workArchive,
    siteContent.archiveUi,
    siteContent.assetTypeLabels,
  );

  if (gaps.length > 0) {
    console.error(
      `Content coverage check failed (${gaps.length} ${
        gaps.length === 1 ? 'gap' : 'gaps'
      }):`,
    );
    console.error(gaps.map((gap) => `  ${gap}`).join('\n'));
    console.error(
      '\nUnlisted values sort to the bottom of the archive with no error. ' +
        'Add them to archiveUi.industryOrder / archiveUi.assetTypeOrder / ' +
        'assetTypeLabels in src/content.js.',
    );
    process.exit(1);
  }
  console.log('Content coverage checks passed.');
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(fs.realpathSync(process.argv[1])).href
) {
  main();
}
