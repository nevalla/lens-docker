import { DrawerItem } from "@k8slens/details-panel-components";
import { Div, P } from "@k8slens/element-components";
import { SubjectIcon } from "@k8slens/icon";
import { Table } from "@k8slens/table-contracts";
import { useInject } from "@k8slens/use-inject";
import { observer } from "mobx-react";
import { Suspense } from "react";
import { containerActions } from "../containers/container-actions";
import { runContainerActionInjectable } from "../containers/run-container-action.injectable";
import { UsageMetrics } from "../charts/usage-metrics";
import { formatMemory, formatMoment } from "../docker-values";
import { DetailsDrawer, DetailsSection } from "../list/details-drawer";
import { ErrorBoundary } from "../list/error-boundary";
import type { DetailsProps } from "../list/get-docker-list";
import { IconAction } from "../list/icon-action";
import { useLoaded } from "../list/use-loaded";
import { composeOperations, hasComposeFiles, runComposeOperationInjectable } from "./app-compose-terminal.injectable";
import { openAppLogsInjectable } from "./app-logs-terminal.injectable";
import { appliesToApp } from "./app-row-menu.injectable";
import { appServicesTableKind } from "./app-services-table.injectable";
import { type DockerApp, appUsage, dockerAppRows, runningContainers } from "./app-rows.injectable";
import { AppState } from "./app-state";
import { appRemoval } from "./remove-apps.injectable";

const Actions = ({ app, close }: { app: DockerApp; close: () => void }) => {
  const runContainerAction = useInject(runContainerActionInjectable)();
  const openAppLogs = useInject(openAppLogsInjectable)();
  const runComposeOperation = useInject(runComposeOperationInjectable)();

  return (
    <>
      <IconAction label="Logs" Icon={SubjectIcon} size="l" onClick={() => void openAppLogs(app)} />
      {hasComposeFiles(app) &&
        composeOperations.map((operation) => (
          <IconAction
            key={operation.id}
            label={operation.label}
            Icon={operation.Icon}
            size="l"
            onClick={() => void runComposeOperation(operation, app)}
          />
        ))}
      {containerActions
        .filter((action) => appliesToApp(action, app))
        .map((action) => (
          <IconAction
            key={action.id}
            label={action.label}
            Icon={action.Icon}
            size="l"
            onClick={() => void runContainerAction(action, app.containers)}
          />
        ))}
      <appRemoval.RemoveIcon item={app} close={close} />
    </>
  );
};

const Placeholder = ({ close, children }: DetailsProps & { children: string }) => (
  <DetailsDrawer title="App" onClose={close}>
    <P $color="textMuted" $padding="s">
      {children}
    </P>
  </DetailsDrawer>
);

const LoadedAppDetails = observer(({ rowId, close }: DetailsProps) => {
  const app = useLoaded(dockerAppRows.subscribable).find((candidate) => candidate.name === rowId);

  if (!app) {
    return (
      <Placeholder rowId={rowId} close={close}>
        The app has no containers anymore.
      </Placeholder>
    );
  }

  const usage = appUsage(app);
  const running = runningContainers(app).length;

  return (
    <DetailsDrawer title={`App: ${app.name}`} actions={<Actions app={app} close={close} />} onClose={close}>
      {running > 0 && <UsageMetrics containerIds={runningContainers(app).map((container) => container.ID)} />}
      <DetailsSection title="Properties">
        <DrawerItem name="Created">{formatMoment(app.createdAt)}</DrawerItem>
        <DrawerItem name="Name">{app.name}</DrawerItem>
        <DrawerItem name="Working directory">{app.workingDir}</DrawerItem>
        <DrawerItem name="Compose files">
          {app.configFiles.map((file) => (
            <Div key={file}>{file}</Div>
          ))}
        </DrawerItem>
      </DetailsSection>

      <DetailsSection title="State">
        <DrawerItem name="Status">
          <AppState app={app} />
        </DrawerItem>
        <DrawerItem name="Containers">
          {running} of {app.containers.length} running
        </DrawerItem>
        {running > 0 && (
          <>
            <DrawerItem name="CPU">{usage.cpu.toFixed(2)}%</DrawerItem>
            <DrawerItem name="Memory">{formatMemory(usage.memory)}</DrawerItem>
          </>
        )}
      </DetailsSection>

      <DetailsSection title="Services">
        {/* As tall as its rows: a header and a row per service, then it is the drawer that scrolls. */}
        <Div $style={{ height: `calc(${app.containers.length + 1} * 2.75rem + 0.5rem)`, isolation: "isolate" }}>
          <Table kind={appServicesTableKind} params={[app.name]} />
        </Div>
      </DetailsSection>
    </DetailsDrawer>
  );
});

// An app's details, read off its containers.
export const AppDetails = (props: DetailsProps) => (
  <ErrorBoundary fallback={<Placeholder {...props}>Could not read the app.</Placeholder>}>
    <Suspense fallback={<Placeholder {...props}>Loading…</Placeholder>}>
      <LoadedAppDetails {...props} />
    </Suspense>
  </ErrorBoundary>
);
