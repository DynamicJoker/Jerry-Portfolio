// Deal the testimonials across N masonry columns, round-robin, so each column
// stays close to the same length regardless of how many entries there are.

export function buildTestimonialColumns(testimonials, columnCount) {
  const columns = Array.from({ length: columnCount }, () => []);
  testimonials.forEach((testimonial, index) => {
    columns[index % columnCount].push(testimonial);
  });
  return columns;
}
