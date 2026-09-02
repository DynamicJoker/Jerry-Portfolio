// Work-archive model: an "All" tab plus per-type chip-tabs and an industry
// chip filter over a flat, sorted list.
//
// Ordering comes in via `archiveUi` rather than being imported directly, so
// this module stays pure and testable. The rank helpers return 99 for any
// value the ordering lists don't mention, which means an unlisted industry or
// asset type sinks silently to the bottom — `check:content-coverage` exists to
// turn that into a build failure.

export function buildArchiveModel(workArchive, archiveUi) {
  const industryOrder = archiveUi.industryOrder;
  const industryRank = (x) => {
    const i = industryOrder.indexOf(x);
    return i === -1 ? 99 : i;
  };
  const archiveIndustries = [
    ...new Set(workArchive.map((p) => p.industry)),
  ].sort((a, b) => industryRank(a) - industryRank(b));

  const assetTypeOrder = archiveUi.assetTypeOrder;
  const assetRank = (x) => {
    const i = assetTypeOrder.indexOf(x);
    return i === -1 ? 99 : i;
  };

  // `assetTypes` drives the per-type tabs (the "All" tab is added in markup and
  // is the default); `archiveRows` is sorted by type, then industry, then
  // newest-first.
  const assetTypes = [...new Set(workArchive.map((p) => p.assetType))]
    .sort((a, b) => assetRank(a) - assetRank(b))
    .map((assetType) => ({
      assetType,
      count: workArchive.filter((p) => p.assetType === assetType).length,
    }));

  const archiveRows = [...workArchive].sort((a, b) => {
    const byType = assetRank(a.assetType) - assetRank(b.assetType);
    if (byType) return byType;
    const byIndustry = industryRank(a.industry) - industryRank(b.industry);
    if (byIndustry) return byIndustry;
    return (b.year || '').localeCompare(a.year || '');
  });

  // Default view is All types · All industries, showing the first few of each
  // type; "see more" (JS) then reveals everything. Precompute that sample so
  // the first paint and the no-JS fallback match the JS default — both read
  // archiveUi.samplePerType, so they cannot disagree.
  const archiveSampleCount = {};
  const archiveInitialShow = new Set();
  for (const row of archiveRows) {
    const n = archiveSampleCount[row.assetType] || 0;
    if (n < archiveUi.samplePerType) {
      archiveInitialShow.add(row);
      archiveSampleCount[row.assetType] = n + 1;
    }
  }

  const archiveHasLink = (status) =>
    status === 'live' || status === 'press' || status === 'archived';

  return {
    archiveIndustries,
    assetTypes,
    archiveRows,
    archiveInitialShow,
    archiveHasLink,
  };
}
