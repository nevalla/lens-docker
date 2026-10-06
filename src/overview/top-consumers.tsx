import { Button, Div, Span } from "@k8slens/element-components";
import { useInject } from "@k8slens/use-inject";
import { observer } from "mobx-react";
import { type MeasureId, measureColors } from "../charts/colors";
import { formatCpu } from "../charts/usage-metrics";
import { type DockerContainer, dockerContainerRows } from "../containers/container-rows.injectable";
import { openContainerDetailsInjectable } from "../containers/open-container-details.injectable";
import { formatMemory, parseSize } from "../docker-values";
import { useLoaded } from "../list/use-loaded";
import { Card, OverviewSection, WhenRead } from "./section";

const shown = 5;

interface Ranking {
  readonly id: MeasureId;
  readonly title: string;
  readonly value: (container: DockerContainer) => number;
  readonly format: (value: number) => string;
}

const rankings: readonly Ranking[] = [
  { id: "cpu", title: "CPU", value: ({ usage }) => parseFloat(usage?.CPUPerc ?? "0"), format: formatCpu },
  { id: "memory", title: "Memory", value: ({ usage }) => parseSize(usage?.MemUsage.split(" / ")[0] ?? ""), format: formatMemory },
];

const Bar = ({ fraction, color }: { fraction: number; color: string }) => (
  <Div $style={{ height: 3, borderRadius: 1.5, backgroundColor: color, width: `${Math.max(fraction, 0.01) * 100}%` }} />
);

const Ranked = observer(({ ranking }: { ranking: Ranking }) => {
  const openContainerDetails = useInject(openContainerDetailsInjectable)();
  const top = useLoaded(dockerContainerRows.subscribable)
    .filter(({ usage }) => usage)
    .map((container) => ({ container, value: ranking.value(container) }))
    .toSorted((a, b) => b.value - a.value)
    .slice(0, shown);
  const max = Math.max(...top.map(({ value }) => value), Number.MIN_VALUE);

  return (
    <Card>
      <Span $color="textMuted">{ranking.title}</Span>
      {top.length === 0 && <Span $color="textMuted">No container is running.</Span>}
      {top.map(({ container, value }) => (
        <Div key={container.ID} $flex={{ direction: "vertical", gap: "xxs" }}>
          <Div $flex={{ horizontalAlign: "space-between", gap: "s" }}>
            <Button
              $color="link"
              $style={{ textDecoration: "underline", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
              $onClick={() => void openContainerDetails(container.ID)}
            >
              {container.Names}
            </Button>
            <Span $flexChild="fixed">{ranking.format(value)}</Span>
          </Div>
          <Bar fraction={value / max} color={measureColors[ranking.id]} />
        </Div>
      ))}
    </Card>
  );
});

// Where the machine goes: the containers taking the most of it, each a way into its details.
export const TopConsumers = () => (
  <OverviewSection title="Top consumers">
    <Div $flex={{ gap: "m", wrap: true }}>
      {rankings.map((ranking) => (
        <WhenRead key={ranking.title} what="the containers">
          <Ranked ranking={ranking} />
        </WhenRead>
      ))}
    </Div>
  </OverviewSection>
);
