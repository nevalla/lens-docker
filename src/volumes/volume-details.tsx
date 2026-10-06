import { DrawerItem, DrawerItemLabels } from "@k8slens/details-panel-components";
import { P } from "@k8slens/element-components";
import { observer } from "mobx-react";
import { Suspense } from "react";
import { formatMoment } from "../docker-values";
import { DetailsDrawer, DetailsSection } from "../list/details-drawer";
import { ErrorBoundary } from "../list/error-boundary";
import type { DetailsProps } from "../list/get-docker-list";
import { useLoaded } from "../list/use-loaded";
import { UsedBySection } from "../list/used-by-section";
import { volumeRemoval } from "./remove-volumes.injectable";
import { isAnonymous, dockerVolumeRows } from "./volume-rows.injectable";

const Placeholder = ({ close, children }: DetailsProps & { children: string }) => (
  <DetailsDrawer title="Volume" onClose={close}>
    <P $color="textMuted" $padding="s">
      {children}
    </P>
  </DetailsDrawer>
);

// A volume's details are all in its row: the list reads volumes in full.
const LoadedVolumeDetails = observer(({ rowId, close }: DetailsProps) => {
  const volume = useLoaded(dockerVolumeRows.subscribable).find((candidate) => candidate.Name === rowId);

  if (!volume) {
    return (
      <Placeholder rowId={rowId} close={close}>
        The volume is gone.
      </Placeholder>
    );
  }

  return (
    <DetailsDrawer
      title={`Volume: ${volume.Name}`}
      actions={<volumeRemoval.RemoveIcon item={volume} close={close} />}
      onClose={close}
    >
      <DetailsSection title="Properties">
        <DrawerItem name="Created">{formatMoment(Date.parse(volume.CreatedAt))}</DrawerItem>
        <DrawerItem name="Name">{volume.Name}</DrawerItem>
        <DrawerItem name="Anonymous">{isAnonymous(volume) ? "Yes" : "No"}</DrawerItem>
        <DrawerItem name="Driver">{volume.Driver}</DrawerItem>
        <DrawerItem name="Scope">{volume.Scope}</DrawerItem>
        <DrawerItem name="Size">{volume.size ?? "N/A"}</DrawerItem>
        <DrawerItem name="Mountpoint">{volume.Mountpoint}</DrawerItem>
        <DrawerItemLabels name="Labels" labels={volume.Labels ?? {}} />
        <DrawerItemLabels name="Options" labels={volume.Options ?? {}} />
      </DetailsSection>
      <UsedBySection containers={volume.usedBy} noun="volume" />
    </DetailsDrawer>
  );
});

export const VolumeDetails = (props: DetailsProps) => (
  <ErrorBoundary fallback={<Placeholder {...props}>Could not read the volume.</Placeholder>}>
    <Suspense fallback={<Placeholder {...props}>Loading…</Placeholder>}>
      <LoadedVolumeDetails {...props} />
    </Suspense>
  </ErrorBoundary>
);
