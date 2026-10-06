import { Button, Div, Span } from "@k8slens/element-components";
import { CpuIcon, MemoryIcon } from "@k8slens/icon";
import { observer } from "mobx-react";
import { type ReactNode, Suspense, useState } from "react";
import {
  type UsagePoint,
  type UsageReading,
  usageHistory,
  usageSeries,
} from "../containers/usage-history.injectable";
import { formatMemory } from "../docker-values";
import { DetailsSection } from "../list/details-drawer";
import { ErrorBoundary } from "../list/error-boundary";
import { useLoaded } from "../list/use-loaded";
import { dockerSettingsInjectable } from "../settings/docker-settings.injectable";
import { TurnedOff } from "../settings/open-docker-preferences.injectable";
import { useInject } from "@k8slens/use-inject";
import { type MeasureId, measureColors } from "./colors";
import { Sparkline } from "./sparkline";
import { UsageChart } from "./usage-chart";

const mebibyte = 2 ** 20;

// Memory is charted in MiB, so that its axis rounds to 1, 2, 5, 10 MiB and the like.
const inMebibytes = (points: readonly UsagePoint[]) => points.map(({ time, value }) => ({ time, value: value / mebibyte }));

export const formatCpu = (percent: number) => `${percent.toFixed(2)}%`;
const formatMebibytes = (value: number) => formatMemory(value * mebibyte);

interface Measure {
  readonly id: MeasureId;
  readonly label: string;
  readonly title: string;
  readonly Icon: typeof CpuIcon;
  readonly points: (history: readonly UsageReading[], containerIds: readonly string[]) => UsagePoint[];
  readonly format: (value: number) => string;
}

const measures: readonly Measure[] = [
  {
    id: "cpu",
    label: "CPU",
    title: "CPU usage",
    Icon: CpuIcon,
    points: (history, containerIds) => usageSeries(history, containerIds, "cpu"),
    format: formatCpu,
  },
  {
    id: "memory",
    label: "Memory",
    title: "Memory usage",
    Icon: MemoryIcon,
    points: (history, containerIds) => inMebibytes(usageSeries(history, containerIds, "memory")),
    format: formatMebibytes,
  },
];

const Chart = observer(({ containerIds, measure }: { containerIds: readonly string[]; measure: Measure }) => {
  const history = useLoaded(usageHistory.subscribable);

  return (
    <UsageChart
      title={measure.title}
      points={measure.points(history, containerIds)}
      format={measure.format}
      color={measureColors[measure.id]}
      atLeast={1}
    />
  );
});

// Which measure is charted, picked the way Lens's pod metrics pick theirs: icons, the chosen one boxed.
const MeasureTabs = ({ selected, onSelect }: { selected: Measure; onSelect: (measure: Measure) => void }) => (
  <Div $flex={{ gap: "xs", verticalAlign: "center" }} $padding={{ horizontal: "s" }} role="tablist">
    {measures.map((measure) => (
      <Button
        key={measure.id}
        role="tab"
        aria-selected={measure === selected}
        aria-label={measure.label}
        $tooltip={measure.label}
        $interactive
        $flex={{ horizontalAlign: "center", verticalAlign: "center" }}
        $padding="xxs"
        $border={{ radius: "s", width: "xxs", color: measure === selected ? "grey40" : "transparent" }}
        $onClick={() => onSelect(measure)}
      >
        <measure.Icon $size="l" />
      </Button>
    ))}
  </Div>
);

const Charts = observer(({ containerIds }: { containerIds: readonly string[] }) => {
  const [selected, setSelected] = useState(measures[0]);
  const { measureUsage } = useInject(dockerSettingsInjectable)().current();

  if (!measureUsage) {
    return (
      <Div $padding="s">
        <TurnedOff what="Measuring CPU and memory" />
      </Div>
    );
  }

  return (
    <>
      <MeasureTabs selected={selected} onSelect={setSelected} />
      <ErrorBoundary fallback={<Div $padding="s">Could not read the usage.</Div>}>
        <Suspense fallback={<Div $padding="s">Loading…</Div>}>
          <Chart containerIds={containerIds} measure={selected} />
        </Suspense>
      </ErrorBoundary>
    </>
  );
});

// CPU and memory over the last minutes, of a container, or summed over an app's.
export const UsageMetrics = ({ containerIds }: { containerIds: readonly string[] }) => (
  <DetailsSection title="Metrics">
    <Charts containerIds={containerIds} />
  </DetailsSection>
);

const LoadedSparkline = observer(
  ({ containerIds, measure }: { containerIds: readonly string[]; measure: "cpu" | "memory" }) => {
    const points = usageSeries(useLoaded(usageHistory.subscribable), containerIds, measure);

    return (
      <Sparkline points={measure === "memory" ? inMebibytes(points) : points} atLeast={1} color={measureColors[measure]} />
    );
  },
);

// A table cell's value, with its recent trend beside it once there is one.
export const ValueWithTrend = ({
  value,
  containerIds,
  measure,
}: {
  value: ReactNode;
  containerIds: readonly string[];
  measure: "cpu" | "memory";
}) => (
  <Div $flex={{ gap: "s", verticalAlign: "center" }}>
    <Span $style={{ minWidth: "4.5em" }}>{value}</Span>
    {containerIds.length > 0 && (
      <ErrorBoundary>
        <Suspense fallback={null}>
          <LoadedSparkline containerIds={containerIds} measure={measure} />
        </Suspense>
      </ErrorBoundary>
    )}
  </Div>
);
