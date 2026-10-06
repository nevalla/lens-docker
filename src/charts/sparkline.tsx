import { Svg } from "@k8slens/element-components";
import type { UsagePoint } from "../containers/usage-history.injectable";
import { niceMax, paths, plot } from "./scale";

const width = 48;
const height = 14;

// A trend beside a value in a table cell: the recent past muted, the current reading marked in the
// measure's colour. From zero, so a flat line reads as steady rather than as noise blown up.
export const Sparkline = ({ points, atLeast, color }: { points: readonly UsagePoint[]; atLeast: number; color: string }) => {
  if (points.length < 2) {
    return null;
  }

  const plotted = plot(points, niceMax(Math.max(...points.map(({ value }) => value)), atLeast));
  const { line, area } = paths(plotted, width, height);
  const last = plotted.at(-1)!;

  return (
    <Svg
      $color="textMuted"
      width={width + 4}
      height={height + 4}
      viewBox={`-2 -2 ${width + 4} ${height + 4}`}
      aria-hidden
      $style={{ flexShrink: 0, overflow: "visible" }}
    >
      <path d={area} fill="currentColor" opacity={0.1} />
      <path d={line} fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={last.x * width} cy={last.y * height} r={2.5} fill={color} />
    </Svg>
  );
};
