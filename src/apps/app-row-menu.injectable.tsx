import { getDropDownMenuItemInjectableBunch } from "@k8slens/drop-down-menu-contracts";
import { DropDownMenuItemRow } from "@k8slens/drop-down-menu-items";
import { SubjectIcon } from "@k8slens/icon";
import { getInjectableBunch } from "@k8slens/injectable";
import { useInject } from "@k8slens/use-inject";
import { type ContainerAction, containerActions } from "../containers/container-actions";
import { runContainerActionInjectable } from "../containers/run-container-action.injectable";
import type { DockerApp } from "./app-rows.injectable";
import {
  type ComposeOperation,
  composeOperations,
  hasComposeFiles,
  runComposeOperationInjectable,
} from "./app-compose-terminal.injectable";
import { openAppLogsInjectable } from "./app-logs-terminal.injectable";
import { appRemoval } from "./remove-apps.injectable";

// An app's actions are its containers' ones, offered while any of its containers they apply to.
export const appliesToApp = (action: ContainerAction, app: DockerApp) => app.containers.some(action.appliesTo);

interface RowMenuData {
  readonly item: DockerApp;
}

const RunAppAction = ({ data, action }: { data: RowMenuData; action: ContainerAction }) => {
  const runContainerAction = useInject(runContainerActionInjectable)();

  return (
    <DropDownMenuItemRow Icon={action.Icon} $onClick={() => void runContainerAction(action, data.item.containers)}>
      {action.label}
    </DropDownMenuItemRow>
  );
};

const actionItem = (action: ContainerAction, index: number) => {
  const Component = ({ data }: { data: RowMenuData }) => <RunAppAction data={data} action={action} />;

  return getDropDownMenuItemInjectableBunch({
    id: `docker-app-${action.id}`,
    kind: appRemoval.rowMenuKind,
    orderNumber: (index + 1) * 10,
    isVisible: ({ item }) => appliesToApp(action, item),
    Component,
  });
};

export const appActionMenuItems = getInjectableBunch({ ...containerActions.map(actionItem) });

const OpenLogs = ({ data }: { data: RowMenuData }) => {
  const openAppLogs = useInject(openAppLogsInjectable)();

  return (
    <DropDownMenuItemRow Icon={SubjectIcon} $onClick={() => void openAppLogs(data.item)}>
      Logs
    </DropDownMenuItemRow>
  );
};

export const openAppLogsMenuItem = getDropDownMenuItemInjectableBunch({
  id: "docker-app-logs",
  kind: appRemoval.rowMenuKind,
  orderNumber: 60,
  Component: OpenLogs,
});

const RunComposeOperation = ({ data, operation }: { data: RowMenuData; operation: ComposeOperation }) => {
  const runComposeOperation = useInject(runComposeOperationInjectable)();

  return (
    <DropDownMenuItemRow Icon={operation.Icon} $onClick={() => void runComposeOperation(operation, data.item)}>
      {operation.label}
    </DropDownMenuItemRow>
  );
};

const composeOperationItem = (operation: ComposeOperation, index: number) => {
  const Component = ({ data }: { data: RowMenuData }) => <RunComposeOperation data={data} operation={operation} />;

  return getDropDownMenuItemInjectableBunch({
    id: `docker-app-compose-${operation.id}`,
    kind: appRemoval.rowMenuKind,
    orderNumber: 40 + index,
    isVisible: ({ item }) => hasComposeFiles(item),
    Component,
  });
};

export const composeOperationMenuItems = getInjectableBunch({ ...composeOperations.map(composeOperationItem) });
