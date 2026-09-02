// Gantt chart model for the Experience section.
//
// Period strings must be 'MM/YYYY - MM/YYYY' (or '- Present') — the parser
// below depends on that exact shape, and so does the chart's geometry.
//
// Note that an entry ending in 'Present' resolves to `new Date()`, so
// `totalDuration` (and therefore every bar's percentage width) moves in real
// time. Two builds minutes apart legitimately emit slightly different bar
// widths; that is by design, not drift.

export function buildGanttModel(experience) {
  const jobs = experience
    .map((job) => {
      const [startStr, endStr] = job.period.split(' - ');
      const [startMonth, startYear] = startStr.split('/');
      const startDate = new Date(`${startYear}-${startMonth}-01`);
      let endDate =
        endStr.toLowerCase() === 'present'
          ? new Date()
          : new Date(`${endStr.split('/')[1]}-${endStr.split('/')[0]}-01`);
      return { ...job, startDate, endDate };
    })
    .sort((a, b) => a.sortOrder - b.sortOrder);

  const firstDate = new Date(Math.min(...jobs.map((j) => j.startDate)));
  const lastDate = new Date(Math.max(...jobs.map((j) => j.endDate)));
  const totalDuration = lastDate.getTime() - firstDate.getTime();

  const ganttYears = [];
  for (let y = firstDate.getFullYear(); y <= lastDate.getFullYear(); y++) {
    ganttYears.push(y);
  }

  return { jobs, firstDate, lastDate, totalDuration, ganttYears };
}

export function getGanttDurationText(startDate, endDate) {
  const totalMonths = Math.max(
    1,
    (endDate.getFullYear() - startDate.getFullYear()) * 12 +
      endDate.getMonth() -
      startDate.getMonth(),
  );
  const years = Math.floor(totalMonths / 12);
  const months = totalMonths % 12;
  const parts = [];

  if (years > 0) {
    parts.push(`${years} ${years === 1 ? 'yr' : 'yrs'}`);
  }

  if (months > 0 || parts.length === 0) {
    parts.push(`${months} ${months === 1 ? 'mo' : 'mos'}`);
  }

  return parts.join(' ');
}
