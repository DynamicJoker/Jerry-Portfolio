import { config } from './config.js';

// Resolve CSS lengths and breakpoint tokens to pixels. Media queries cannot
// read custom properties, so JS that needs a breakpoint reads the token here
// instead of repeating the literal.
export function cssLengthToPx(value, fallbackRem) {
  const trimmedValue = value.trim();
  const rootFontSize =
    Number.parseFloat(getComputedStyle(document.documentElement).fontSize) ||
    16;

  if (trimmedValue.endsWith('rem')) {
    return Number.parseFloat(trimmedValue) * rootFontSize;
  }

  if (trimmedValue.endsWith('px')) {
    return Number.parseFloat(trimmedValue);
  }

  return fallbackRem * rootFontSize;
}

export function getBreakpointPx(key) {
  const breakpoint = config.breakpoints[key];
  const value = getComputedStyle(document.documentElement).getPropertyValue(
    breakpoint.cssVar,
  );
  return cssLengthToPx(value, breakpoint.fallbackRem);
}
