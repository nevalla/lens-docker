import { DrawerItem, DrawerItemLabels, ExpandableDrawerItem } from "@k8slens/details-panel-components";
import { Code, Div, P } from "@k8slens/element-components";
import { observer } from "mobx-react";
import { Suspense } from "react";
import { formatMoment, formatSize } from "../docker-values";
import { DetailsDrawer, DetailsSection } from "../list/details-drawer";
import { ErrorBoundary } from "../list/error-boundary";
import type { DetailsProps } from "../list/get-docker-list";
import { useLoaded } from "../list/use-loaded";
import { UsedBySection } from "../list/used-by-section";
import { type ImageInspect, imageInspect } from "./image-inspect.injectable";
import { dockerImageRows, imageReference } from "./image-rows.injectable";
import { imageRemoval } from "./remove-images.injectable";

const List = ({ values }: { values: readonly string[] }) => (
  <>
    {values.map((value) => (
      <Div key={value}>{value}</Div>
    ))}
  </>
);

const Properties = ({ image }: { image: ImageInspect }) => {
  const config = image.Config;
  const command = [...(config?.Entrypoint ?? []), ...(config?.Cmd ?? [])].join(" ");
  const ports = Object.keys(config?.ExposedPorts ?? {});
  const env = config?.Env ?? [];

  return (
    <>
      <DetailsSection title="Properties">
        <DrawerItem name="Created">{formatMoment(Date.parse(image.Created))}</DrawerItem>
        <DrawerItem name="ID">{image.Id.replace(/^sha256:/, "").slice(0, 12)}</DrawerItem>
        <DrawerItem name="Tags">
          <List values={image.RepoTags ?? []} />
        </DrawerItem>
        <DrawerItem name="Digests">
          <List values={image.RepoDigests ?? []} />
        </DrawerItem>
        <DrawerItem name="Size">{formatSize(image.Size)}</DrawerItem>
        <DrawerItem name="Platform">
          {image.Os}/{image.Architecture}
        </DrawerItem>
        <DrawerItem name="Layers">{image.RootFS.Layers?.length ?? 0}</DrawerItem>
        <DrawerItemLabels name="Labels" labels={config?.Labels ?? {}} />
      </DetailsSection>

      <DetailsSection title="Configuration">
        <DrawerItem name="Command">{command && <Code>{command}</Code>}</DrawerItem>
        {config?.WorkingDir && <DrawerItem name="Working directory">{config.WorkingDir}</DrawerItem>}
        {config?.User && <DrawerItem name="User">{config.User}</DrawerItem>}
        {ports.length > 0 && (
          <DrawerItem name="Ports">
            <List values={ports} />
          </DrawerItem>
        )}
        <ExpandableDrawerItem
          name="Environment"
          collapsedContent={`${env.length} ${env.length === 1 ? "variable" : "variables"}`}
          isExpandable={env.length > 0}
        >
          {env.map((variable) => (
            <Div key={variable}>
              <Code>{variable}</Code>
            </Div>
          ))}
        </ExpandableDrawerItem>
      </DetailsSection>
    </>
  );
};

const LoadedImageDetails = observer(({ rowId, close }: DetailsProps) => {
  const image = useLoaded(imageInspect.subscribable, rowId);
  const row = useLoaded(dockerImageRows.subscribable).find((candidate) => imageReference(candidate) === rowId);

  return (
    <DetailsDrawer
      title={`Image: ${rowId}`}
      actions={row && <imageRemoval.RemoveIcon item={row} close={close} />}
      onClose={close}
    >
      <Properties image={image} />
      <UsedBySection containers={row?.usedBy ?? []} noun="image" />
    </DetailsDrawer>
  );
});

const Placeholder = ({ close, children }: DetailsProps & { children: string }) => (
  <DetailsDrawer title="Image" onClose={close}>
    <P $color="textMuted" $padding="s">
      {children}
    </P>
  </DetailsDrawer>
);

// The details of an image, from `docker image inspect`, kept current while the drawer is open.
export const ImageDetails = (props: DetailsProps) => (
  <ErrorBoundary fallback={<Placeholder {...props}>Could not read the image. It may have been removed.</Placeholder>}>
    <Suspense fallback={<Placeholder {...props}>Loading…</Placeholder>}>
      <LoadedImageDetails {...props} />
    </Suspense>
  </ErrorBoundary>
);
