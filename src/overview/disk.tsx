import { Div, Span } from "@k8slens/element-components";
import { DeleteSweepIcon } from "@k8slens/icon";
import { PlainButton } from "@k8slens/input-components";
import { useInject } from "@k8slens/use-inject";
import { observer } from "mobx-react";
import { cleanUps, runCleanUpInjectable } from "./clean-up.injectable";
import { type DiskUsage, diskUsage } from "./disk-usage.injectable";
import { useLoaded } from "../list/use-loaded";
import { OverviewSection, WhenRead } from "./section";

// Columns shared by the header and the rows, so they line up.
const columns = { display: "grid", gridTemplateColumns: "8rem 1fr 1fr 1fr 11rem", alignItems: "center" } as const;

const names: Record<DiskUsage["Type"], string> = {
  Images: "Images",
  Containers: "Containers",
  "Local Volumes": "Volumes",
  "Build Cache": "Build cache",
};

const isNothing = (size: string) => /^0(\.0+)?\s*[kMGT]?B/.test(size);

const Row = ({ line }: { line: DiskUsage }) => {
  const runCleanUp = useInject(runCleanUpInjectable)();
  const cleanUp = cleanUps.find(({ type }) => type === line.Type);
  const reclaimable = line.Reclaimable.split(" ")[0];

  return (
    <Div
      $style={columns}
      $padding={{ horizontal: "s", vertical: "xs" }}
      $border={{ bottom: { width: "xxs", color: "grey60" }, exceptLast: true }}
    >
      <Span>{names[line.Type]}</Span>
      <Span>
        {line.TotalCount} <Span $color="textMuted">({line.Active} in use)</Span>
      </Span>
      <Span>{line.Size}</Span>
      <Span $color={isNothing(reclaimable) ? "textMuted" : "textDefault"}>{line.Reclaimable}</Span>
      <Div $flex={{ horizontalAlign: "right" }}>
        {cleanUp && (
          <PlainButton Icon={DeleteSweepIcon} $disabled={isNothing(reclaimable)} onClick={() => void runCleanUp(cleanUp)}>
            {cleanUp.label}
          </PlainButton>
        )}
      </Div>
    </Div>
  );
};

const LoadedDisk = observer(() => {
  const usage = useLoaded(diskUsage.subscribable);

  return (
    <Div $border={{ radius: "m", width: "xxs", color: "grey60" }} $backgroundColor="backgroundSecondary">
      <Div
        $style={columns}
        $padding={{ horizontal: "s", vertical: "xs" }}
        $color="textMuted"
        $border={{ bottom: { width: "xxs", color: "grey60" } }}
      >
        <Span />
        <Span>Count</Span>
        <Span>Size</Span>
        <Span>Reclaimable</Span>
        <Span />
      </Div>
      {usage.map((line) => (
        <Row key={line.Type} line={line} />
      ))}
    </Div>
  );
});

// What Docker keeps on disk, and what of it nothing uses: where space is won back.
export const Disk = () => (
  <OverviewSection title="Disk">
    <WhenRead what="the disk usage">
      <LoadedDisk />
    </WhenRead>
  </OverviewSection>
);
