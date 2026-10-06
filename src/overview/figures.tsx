import { Div, Span } from "@k8slens/element-components";
import { observer } from "mobx-react";
import type { ReactNode } from "react";
import { dockerAppRows } from "../apps/app-rows.injectable";
import { formatCpu } from "../charts/usage-metrics";
import { measureColors } from "../charts/colors";
import { Sparkline } from "../charts/sparkline";
import { dockerContainerRows } from "../containers/container-rows.injectable";
import { totalSeries, usageHistory } from "../containers/usage-history.injectable";
import { formatMemory, parseSize } from "../docker-values";
import { useLoaded } from "../list/use-loaded";
import { type DiskUsage, diskUsage } from "./disk-usage.injectable";
import { dockerInfo } from "./docker-info.injectable";
import { Card, OverviewSection, WhenRead } from "./section";

// A stat tile: what it counts, the figure, and a line of detail under it.
const Figure = ({ label, value, detail, children }: { label: string; value: ReactNode; detail?: ReactNode; children?: ReactNode }) => (
  <Card>
    <Span $color="textMuted">{label}</Span>
    <Div $flex={{ gap: "s", verticalAlign: "center", horizontalAlign: "space-between" }}>
      <Span $font={{ size: "xxl", bold: true }} $color="textHighlight">
        {value}
      </Span>
      {children}
    </Div>
    {detail && <Span $color="textMuted">{detail}</Span>}
  </Card>
);

// How full something is: the fill carries how serious it is, on a track of the same hue.
const Meter = ({ fraction }: { fraction: number }) => {
  const color = fraction > 0.9 ? "critical" : fraction > 0.8 ? "warning" : "primary";

  return (
    <Div $relative $style={{ height: 3, borderRadius: 1.5, overflow: "hidden" }}>
      <Div $backgroundColor={color} $style={{ position: "absolute", inset: 0, opacity: 0.2 }} />
      <Div
        $backgroundColor={color}
        $style={{ position: "absolute", top: 0, bottom: 0, left: 0, width: `${Math.min(1, fraction) * 100}%`, borderRadius: 1.5 }}
      />
    </Div>
  );
};

const countOf = (usage: readonly DiskUsage[], type: DiskUsage["Type"]) => usage.find((line) => line.Type === type);

const Counts = observer(() => {
  const containers = useLoaded(dockerContainerRows.subscribable);
  const apps = useLoaded(dockerAppRows.subscribable);
  const usage = useLoaded(diskUsage.subscribable);
  const running = containers.filter((container) => container.State === "running").length;
  const images = countOf(usage, "Images");
  const volumes = countOf(usage, "Local Volumes");

  return (
    <>
      <Figure label="Containers" value={containers.length} detail={`${running} running · ${containers.length - running} stopped`} />
      <Figure label="Apps" value={apps.length} detail="Docker Compose projects" />
      <Figure label="Images" value={images?.TotalCount ?? "—"} detail={images && `${images.Size} on disk`} />
      <Figure label="Volumes" value={volumes?.TotalCount ?? "—"} detail={volumes && `${volumes.Size} on disk`} />
    </>
  );
});

const Usage = observer(() => {
  const containers = useLoaded(dockerContainerRows.subscribable);
  const history = useLoaded(usageHistory.subscribable);
  const info = useLoaded(dockerInfo.subscribable);
  const cpu = containers.reduce((total, { usage }) => total + parseFloat(usage?.CPUPerc ?? "0"), 0);
  const memory = containers.reduce((total, { usage }) => total + parseSize(usage?.MemUsage.split(" / ")[0] ?? ""), 0);

  return (
    <>
      <Figure label="CPU" value={formatCpu(cpu)} detail={`of ${info.NCPU * 100}% across ${info.NCPU} CPUs`}>
        <Sparkline points={totalSeries(history, "cpu")} atLeast={1} color={measureColors.cpu} />
      </Figure>
      <Figure
        label="Memory"
        value={formatMemory(memory)}
        detail={
          <Div $flex={{ direction: "vertical", gap: "xs" }}>
            <Meter fraction={memory / info.MemTotal} />
            <Span>of {formatMemory(info.MemTotal)}</Span>
          </Div>
        }
      >
        <Sparkline
          points={totalSeries(history, "memory").map(({ time, value }) => ({ time, value: value / 2 ** 20 }))}
          atLeast={1}
          color={measureColors.memory}
        />
      </Figure>
    </>
  );
});

// The headline figures: how much there is, and how much of the machine it takes.
export const Figures = () => (
  <OverviewSection title="Docker">
    <Div $flex={{ gap: "m", wrap: true }}>
      <WhenRead what="the counts">
        <Counts />
      </WhenRead>
      <WhenRead what="the usage">
        <Usage />
      </WhenRead>
    </Div>
  </OverviewSection>
);
