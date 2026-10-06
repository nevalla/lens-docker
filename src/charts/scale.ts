import type { UsagePoint } from "../containers/usage-history.injectable";

// The top of an axis from zero: the maximum rounded up to 1, 2, 2.5 or 5 times a power of ten.
export const niceMax = (max: number, atLeast: number) => {
  const target = Math.max(max, atLeast);
  const magnitude = 10 ** Math.floor(Math.log10(target));

  return ([1, 2, 2.5, 5, 10].find((step) => step * magnitude >= target) ?? 10) * magnitude;
};

// Where points sit, as fractions of the plot: time left to right, value from the bottom up.
export const plot = (points: readonly UsagePoint[], top: number) => {
  const first = points[0]?.time ?? 0;
  const span = (points.at(-1)?.time ?? 0) - first;

  return points.map(({ time, value }) => ({
    x: span > 0 ? (time - first) / span : 1,
    y: top > 0 ? 1 - Math.min(value, top) / top : 1,
  }));
};

// The line through plotted points, and the area under it, in a viewBox of the given size.
export const paths = (plotted: readonly { x: number; y: number }[], width: number, height: number) => {
  const coordinates = plotted.map(({ x, y }) => `${(x * width).toFixed(1)},${(y * height).toFixed(1)}`);
  const line = `M${coordinates.join("L")}`;
  const area = plotted.length > 1 ? `${line}L${width},${height}L0,${height}Z` : "";

  return { line, area };
};
