import { Div, Span, Svg } from "@k8slens/element-components";
import { type PointerEvent, useState } from "react";
import type { UsagePoint } from "../containers/usage-history.injectable";
import { formatDuration } from "../docker-values";
import { niceMax, paths, plot } from "./scale";

// The plot's own coordinates; it is stretched to the width it is given, its lines kept 2px wide.
const viewWidth = 1000;
const viewHeight = 100;
const plotHeight = "7.5rem";

const clock = (time: number) =>
  new Date(time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false });

const shortClock = (time: number) =>
  new Date(time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false });

// Times along the bottom, the way Lens's metrics mark them: at whole minutes, as fractions of the span.
const timeTicks = (first: number, last: number) => {
  const minute = 60_000;
  const span = last - first;
  const ticks: { at: number; label: string }[] = [];

  for (let time = Math.ceil(first / minute) * minute; time <= last && span > 0; time += minute) {
    ticks.push({ at: (time - first) / span, label: shortClock(time) });
  }

  return ticks;
};

interface UsageChartProps {
  // What the line is, as its legend says: "CPU usage".
  readonly title: string;
  readonly points: readonly UsagePoint[];
  readonly format: (value: number) => string;
  readonly color: string;
  // The axis reaches at least this high, so that a value near zero is drawn near zero.
  readonly atLeast: number;
}

// One measure over the last minutes, the way Lens's pod details chart their metrics: a line over a
// faint area, a recessive grid, and a crosshair that finds the reading under the pointer.
export const UsageChart = ({ title, points, format, color, atLeast }: UsageChartProps) => {
  const [hovered, setHovered] = useState<number | undefined>(undefined);
  const top = niceMax(Math.max(0, ...points.map(({ value }) => value)), atLeast);
  const plotted = plot(points, top);
  const { line, area } = paths(plotted, viewWidth, viewHeight);
  const current = points.at(-1);
  const ticks = timeTicks(points[0]?.time ?? 0, current?.time ?? 0);
  const shown = hovered === undefined ? undefined : { point: points[hovered], at: plotted[hovered] };

  const findReading = (event: PointerEvent<HTMLDivElement>) => {
    const bounds = event.currentTarget.getBoundingClientRect();
    const x = (event.clientX - bounds.left) / bounds.width;
    const nearest = plotted.reduce(
      (best, { x: pointX }, index) => (Math.abs(pointX - x) < Math.abs(plotted[best].x - x) ? index : best),
      0,
    );

    setHovered(plotted.length > 0 ? nearest : undefined);
  };

  return (
    <Div $flex={{ direction: "vertical", gap: "xs" }} $padding={{ horizontal: "s", vertical: "s" }}>
      <Div $relative $style={{ height: plotHeight }}>
        {/* The grid: hairlines at zero, half and the top, their values at the right, in muted ink. */}
        {[0, 0.5, 1].map((fraction) => (
          <Div
            key={fraction}
            $border={{ top: { width: "xxs", color: "grey60" } }}
            $style={{ position: "absolute", left: 0, right: 0, top: `${(1 - fraction) * 100}%` }}
          >
            <Span
              $color="textMuted"
              $font={{ size: "xs" }}
              $style={{ position: "absolute", right: 0, bottom: 2 }}
            >
              {format(top * fraction)}
            </Span>
          </Div>
        ))}

        {points.length > 1 ? (
          <Svg
            viewBox={`0 0 ${viewWidth} ${viewHeight}`}
            preserveAspectRatio="none"
            role="img"
            aria-label={`${title} over the last ${formatDuration(points.at(-1)!.time - points[0].time)}, now ${format(current!.value)}`}
            $style={{ position: "absolute", inset: 0, width: "100%", height: "100%", overflow: "visible", color }}
          >
            <path d={area} fill="currentColor" opacity={0.1} />
            <path
              d={line}
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinejoin="round"
              strokeLinecap="round"
              vectorEffect="non-scaling-stroke"
            />
          </Svg>
        ) : (
          <Span $color="textMuted" $style={{ position: "absolute", left: 0, top: "40%" }}>
            Collecting readings…
          </Span>
        )}

        {shown && (
          <>
            <Div
              $backgroundColor="grey60"
              $style={{ position: "absolute", top: 0, bottom: 0, width: 1, left: `${shown.at.x * 100}%` }}
            />
            <Div
              $style={{
                position: "absolute",
                backgroundColor: color,
                width: 8,
                height: 8,
                borderRadius: "50%",
                left: `calc(${shown.at.x * 100}% - 4px)`,
                top: `calc(${shown.at.y * 100}% - 4px)`,
              }}
            />
            <Div
              $backgroundColor="backgroundSecondary"
              $border={{ radius: "s", width: "xxs", color: "grey60" }}
              $padding={{ horizontal: "s", vertical: "xxs" }}
              $boxShadow="subtle"
              $style={{
                position: "absolute",
                top: 0,
                whiteSpace: "nowrap",
                pointerEvents: "none",
                ...(shown.at.x > 0.5 ? { right: `calc(${(1 - shown.at.x) * 100}% + 8px)` } : { left: `calc(${shown.at.x * 100}% + 8px)` }),
              }}
            >
              <Span $color="textMuted">{clock(shown.point.time)}</Span> <Span>{format(shown.point.value)}</Span>
            </Div>
          </>
        )}

        {/* Larger than the line, so the reader aims at a moment, never at a 2px stroke. */}
        <Div
          $style={{ position: "absolute", inset: 0 }}
          onPointerMove={findReading}
          onPointerLeave={() => setHovered(undefined)}
        />
      </Div>

      {/* Times along the bottom, at whole minutes. */}
      <Div $relative $style={{ height: "1.25rem" }}>
        {ticks.map(({ at, label }) => (
          <Span
            key={label}
            $color="textMuted"
            $font={{ size: "xs" }}
            $style={{ position: "absolute", left: `${at * 100}%`, transform: "translateX(-50%)", whiteSpace: "nowrap" }}
          >
            {label}
          </Span>
        ))}
      </Div>

      {/* The legend: the line's colour beside its name, the name in text ink, the current value after it. */}
      <Div $flex={{ gap: "xs", verticalAlign: "center", horizontalAlign: "center" }}>
        <Div $style={{ width: 10, height: 10, borderRadius: 2, backgroundColor: color }} />
        <Span>{title}</Span>
        {current && <Span $color="textMuted">· {format(current.value)}</Span>}
      </Div>
    </Div>
  );
};
