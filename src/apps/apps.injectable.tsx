import { Div } from "@k8slens/element-components";
import { PlainButton } from "@k8slens/input-components";
import { useInject } from "@k8slens/use-inject";
import { containerActions } from "../containers/container-actions";
import { runContainerActionInjectable } from "../containers/run-container-action.injectable";
import { formatAge, formatMemory } from "../docker-values";
import { getDockerList, type SelectionActionsProps } from "../list/get-docker-list";
import { formatCpu, ValueWithTrend } from "../charts/usage-metrics";
import { AppDetails } from "./app-details";
import { appliesToApp } from "./app-row-menu.injectable";
import { type DockerApp, appUsage, dockerAppRows, runningContainers } from "./app-rows.injectable";
import { AppState, appState } from "./app-state";
import { appRemoval } from "./remove-apps.injectable";

const runningIds = (app: DockerApp) => runningContainers(app).map((container) => container.ID);

const AppCpuCell = ({ row }: { row: DockerApp }) => (
  <ValueWithTrend
    value={runningIds(row).length > 0 ? formatCpu(appUsage(row).cpu) : "N/A"}
    containerIds={runningIds(row)}
    measure="cpu"
  />
);

const AppMemoryCell = ({ row }: { row: DockerApp }) => (
  <ValueWithTrend
    value={runningIds(row).length > 0 ? formatMemory(appUsage(row).memory) : "N/A"}
    containerIds={runningIds(row)}
    measure="memory"
  />
);

const AppStateCell = ({ row }: { row: DockerApp }) => <AppState app={row} />;

const SelectedAppActions = ({ rows, clearSelection }: SelectionActionsProps<DockerApp>) => {
  const runContainerAction = useInject(runContainerActionInjectable)();

  return (
    <Div $flex={{ gap: "s" }}>
      {containerActions.map((action) => {
        const applicable = rows.filter((app) => appliesToApp(action, app)).length;

        return (
          <PlainButton
            key={action.id}
            Icon={action.Icon}
            $disabled={applicable === 0}
            $tooltip={`${action.label} ${applicable} of ${rows.length} selected`}
            onClick={() => void runContainerAction(action, rows.flatMap((app) => app.containers))}
          >
            {action.label}
          </PlainButton>
        );
      })}
      <appRemoval.RemoveSelected rows={rows} clearSelection={clearSelection} />
    </Div>
  );
};

const services = (app: DockerApp) => app.containers.map((container) => container.compose?.service).join(", ");

export const dockerApps = getDockerList<DockerApp>({
  id: "apps",
  title: "Apps",
  rows: dockerAppRows,
  getRowId: (app) => app.name,
  columns: [
    { id: "name", header: "Name", value: (row) => row.name },
    { id: "services", header: "Services", value: services },
    {
      id: "containers",
      header: "Containers",
      value: (row) => `${runningContainers(row).length}/${row.containers.length}`,
      sortValue: (row) => runningContainers(row).length,
    },
    {
      id: "cpu",
      header: "CPU",
      value: (row) => (runningContainers(row).length > 0 ? `${appUsage(row).cpu.toFixed(2)}%` : "N/A"),
      sortValue: (row) => appUsage(row).cpu,
      Cell: AppCpuCell,
    },
    {
      id: "memory",
      header: "Memory",
      value: (row) => (runningContainers(row).length > 0 ? formatMemory(appUsage(row).memory) : "N/A"),
      sortValue: (row) => appUsage(row).memory,
      Cell: AppMemoryCell,
    },
    { id: "state", header: "State", value: (row) => appState(row).label, Cell: AppStateCell },
    { id: "age", header: "Age", value: (row) => formatAge(row.createdAt), sortValue: (row) => -row.createdAt },
  ],
  SelectionActions: SelectedAppActions,
  RowActions: appRemoval.RowActions,
  Details: AppDetails,
});
