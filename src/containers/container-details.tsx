import { DrawerItem, DrawerItemLabels, ExpandableDrawerItem } from "@k8slens/details-panel-components";
import { Button, Code, Div, P } from "@k8slens/element-components";
import { SubjectIcon, TerminalIcon } from "@k8slens/icon";
import { useSubscribable } from "@k8slens/subscribable-react";
import { useInject } from "@k8slens/use-inject";
import { observer } from "mobx-react";
import { Suspense, use } from "react";
import { UsageMetrics } from "../charts/usage-metrics";
import { formatMoment, imageName } from "../docker-values";
import { DetailsDrawer, DetailsSection } from "../list/details-drawer";
import { ErrorBoundary } from "../list/error-boundary";
import type { DetailsProps } from "../list/get-docker-list";
import { IconAction } from "../list/icon-action";
import { useLoaded } from "../list/use-loaded";
import { containerActions } from "./container-actions";
import { detectEndpoints } from "./container-endpoints";
import { connectToContainerInjectable } from "./connect-to-container.injectable";
import { type ContainerInspect, containerInspect } from "./container-inspect.injectable";
import { type ContainerRef, dockerContainerRows } from "./container-rows.injectable";
import { ContainerState } from "./container-state";
import { canOpenShell, openContainerTerminalsInjectable } from "./container-terminals.injectable";
import { containerRemoval } from "./remove-containers.injectable";
import { runContainerActionInjectable } from "./run-container-action.injectable";

// Docker marks a time that has not happened yet, such as a running container's finish, with year 1.
const hasHappened = (time: string) => !time.startsWith("0001-");

const formatTime = (time: string) => formatMoment(Date.parse(time));

const toRef = (container: ContainerInspect): ContainerRef => ({
  ID: container.Id,
  Names: container.Name.replace(/^\//, ""),
  State: container.State.Status,
});

const Actions = ({ container, close }: { container: ContainerRef; close: () => void }) => {
  const runContainerAction = useInject(runContainerActionInjectable)();
  const terminals = useInject(openContainerTerminalsInjectable)();

  return (
    <>
      {canOpenShell(container) && (
        <IconAction label="Shell" Icon={TerminalIcon} size="l" onClick={() => void terminals.shell(container)} />
      )}
      <IconAction label="Logs" Icon={SubjectIcon} size="l" onClick={() => void terminals.logs(container)} />
      {containerActions
        .filter((action) => action.appliesTo(container))
        .map((action) => (
          <IconAction
            key={action.id}
            label={action.label}
            Icon={action.Icon}
            size="l"
            onClick={() => void runContainerAction(action, [container])}
          />
        ))}
      <containerRemoval.RemoveIcon item={container} close={close} />
    </>
  );
};

const ConnectRows = observer(({ containerId }: { containerId: string }) => {
  const row = useLoaded(dockerContainerRows.subscribable).find((container) => container.ID === containerId);
  const connectToContainer = useInject(connectToContainerInjectable)();
  const endpoints = row ? detectEndpoints(row) : [];

  if (!row || endpoints.length === 0) {
    return null;
  }

  return (
    <DetailsSection title="Connect">
      {endpoints.map((endpoint) => (
        <DrawerItem key={endpoint.label} name={endpoint.kind === "web" ? "Web" : "Console"}>
          <Button
            $color="link"
            $style={{ textDecoration: "underline" }}
            $onClick={() => void connectToContainer(row, endpoint)}
            $tooltip={endpoint.kind === "web" ? `Open ${endpoint.url}` : undefined}
          >
            {endpoint.kind === "web" ? endpoint.url : `Open ${endpoint.label.toLowerCase()}`}
          </Button>
        </DrawerItem>
      ))}
    </DetailsSection>
  );
});

// Ways into the container, as its list row has them; nothing while that is not there.
const Connect = ({ containerId }: { containerId: string }) => (
  <ErrorBoundary>
    <Suspense fallback={null}>
      <ConnectRows containerId={containerId} />
    </Suspense>
  </ErrorBoundary>
);

// What the container uses now, from the same reading the list shows.
const LoadedUsage = observer(({ containerId }: { containerId: string }) => {
  const containers = use(useSubscribable(useInject(dockerContainerRows.subscribable)()).value).get();
  const usage = containers.find((container) => container.ID === containerId)?.usage;

  if (!usage) {
    return null;
  }

  return (
    <>
      <DrawerItem name="CPU">{usage.CPUPerc}</DrawerItem>
      <DrawerItem name="Memory">
        {usage.MemUsage} ({usage.MemPerc})
      </DrawerItem>
    </>
  );
});

const Usage = ({ containerId }: { containerId: string }) => (
  <ErrorBoundary>
    <Suspense fallback={null}>
      <LoadedUsage containerId={containerId} />
    </Suspense>
  </ErrorBoundary>
);

const Properties = ({ container }: { container: ContainerInspect }) => {
  const { State: state, Config: config } = container;
  const ports = Object.entries(container.NetworkSettings.Ports ?? {}).flatMap(([port, bindings]) =>
    bindings?.length ? bindings.map((binding) => `${binding.HostIp || "*"}:${binding.HostPort} → ${port}`) : [port],
  );
  const networks = Object.entries(container.NetworkSettings.Networks ?? {}).filter(([, network]) => network.IPAddress);
  const env = config.Env ?? [];
  const labels = config.Labels ?? {};
  const compose = {
    project: labels["com.docker.compose.project"],
    service: labels["com.docker.compose.service"],
  };

  return (
    <>
      <DetailsSection title="Properties">
        <DrawerItem name="Created">{formatTime(container.Created)}</DrawerItem>
        <DrawerItem name="Name">{toRef(container).Names}</DrawerItem>
        <DrawerItem name="ID">{container.Id.slice(0, 12)}</DrawerItem>
        {compose.project && <DrawerItem name="App">{compose.project}</DrawerItem>}
        {compose.service && <DrawerItem name="Service">{compose.service}</DrawerItem>}
        <DrawerItem name="Image">{imageName(config.Image)}</DrawerItem>
        <DrawerItem name="Command">
          <Code>{[container.Path, ...container.Args].join(" ")}</Code>
        </DrawerItem>
        {config.WorkingDir && <DrawerItem name="Working directory">{config.WorkingDir}</DrawerItem>}
        {config.User && <DrawerItem name="User">{config.User}</DrawerItem>}
        <DrawerItemLabels name="Labels" labels={config.Labels ?? {}} />
      </DetailsSection>

      <DetailsSection title="State">
        <DrawerItem name="Status">
          <ContainerState state={state.Status} exitCode={state.ExitCode} />
        </DrawerItem>
        {state.Status === "running" && <Usage containerId={container.Id} />}
        {hasHappened(state.StartedAt) && <DrawerItem name="Started">{formatTime(state.StartedAt)}</DrawerItem>}
        {state.Status !== "running" && hasHappened(state.FinishedAt) && (
          <DrawerItem name="Finished">{formatTime(state.FinishedAt)}</DrawerItem>
        )}
        {state.Status === "exited" && <DrawerItem name="Exit code">{state.ExitCode}</DrawerItem>}
        {state.Error && <DrawerItem name="Error">{state.Error}</DrawerItem>}
        <DrawerItem name="Restarts">{container.RestartCount}</DrawerItem>
        <DrawerItem name="Restart policy">{container.HostConfig.RestartPolicy.Name || "no"}</DrawerItem>
        <DrawerItem name="Platform">{container.Platform}</DrawerItem>
      </DetailsSection>

      {(ports.length > 0 || networks.length > 0) && (
        <DetailsSection title="Network">
          {ports.length > 0 && (
            <DrawerItem name="Ports">
              {ports.map((port) => (
                <Div key={port}>{port}</Div>
              ))}
            </DrawerItem>
          )}
          {networks.map(([name, network]) => (
            <DrawerItem key={name} name={`IP on ${name}`}>
              {network.IPAddress}
            </DrawerItem>
          ))}
        </DetailsSection>
      )}

      {container.Mounts.length > 0 && (
        <DetailsSection title="Mounts">
          {container.Mounts.map((mount) => (
            <DrawerItem key={mount.Destination} name={mount.Destination}>
              {mount.Type} {mount.Source}
              {mount.RW ? "" : " (read-only)"}
            </DrawerItem>
          ))}
        </DetailsSection>
      )}

      <DetailsSection title="Environment">
        <ExpandableDrawerItem
          name="Variables"
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

const LoadedDetails = observer(({ rowId, close }: DetailsProps) => {
  const container = use(useSubscribable(useInject(containerInspect.subscribable)(rowId)).value).get();

  return (
    <DetailsDrawer
      title={`Container: ${toRef(container).Names}`}
      actions={<Actions container={toRef(container)} close={close} />}
      onClose={close}
    >
      <Connect containerId={container.Id} />
      {container.State.Status === "running" && <UsageMetrics containerIds={[container.Id]} />}
      <Properties container={container} />
    </DetailsDrawer>
  );
});

const Placeholder = ({ close, children }: DetailsProps & { children: string }) => (
  <DetailsDrawer title="Container" onClose={close}>
    <P $color="textMuted" $padding="s">
      {children}
    </P>
  </DetailsDrawer>
);

// The details of a container, from `docker inspect`, kept current while the drawer is open.
export const ContainerDetails = (props: DetailsProps) => (
  <ErrorBoundary fallback={<Placeholder {...props}>Could not read the container. It may have been removed.</Placeholder>}>
    <Suspense fallback={<Placeholder {...props}>Loading…</Placeholder>}>
      <LoadedDetails {...props} />
    </Suspense>
  </ErrorBoundary>
);
