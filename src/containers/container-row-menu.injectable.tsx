import { getDropDownMenuItemInjectableBunch } from "@k8slens/drop-down-menu-contracts";
import { DropDownMenuItemRow } from "@k8slens/drop-down-menu-items";
import { SubjectIcon, TerminalIcon } from "@k8slens/icon";
import { getInjectableBunch } from "@k8slens/injectable";
import { useInject } from "@k8slens/use-inject";
import { type ContainerAction, containerActions } from "./container-actions";
import type { ContainerRef } from "./container-rows.injectable";
import { canOpenShell, openContainerTerminalsInjectable } from "./container-terminals.injectable";
import { containerRemoval } from "./remove-containers.injectable";
import { runContainerActionInjectable } from "./run-container-action.injectable";

// Container actions join Remove in the row menu the removal gives containers.
const rowMenuKind = containerRemoval.rowMenuKind;

interface RowMenuData {
  readonly item: ContainerRef;
}

const RunContainerAction = ({ data, action }: { data: RowMenuData; action: ContainerAction }) => {
  const runContainerAction = useInject(runContainerActionInjectable)();

  return (
    <DropDownMenuItemRow Icon={action.Icon} $onClick={() => void runContainerAction(action, [data.item])}>
      {action.label}
    </DropDownMenuItemRow>
  );
};

const actionItem = (action: ContainerAction, index: number) => {
  const Component = ({ data }: { data: RowMenuData }) => <RunContainerAction data={data} action={action} />;

  return getDropDownMenuItemInjectableBunch({
    id: `docker-container-${action.id}`,
    kind: rowMenuKind,
    orderNumber: (index + 1) * 10,
    isVisible: ({ item }) => action.appliesTo(item),
    Component,
  });
};

export const containerActionMenuItems = getInjectableBunch({ ...containerActions.map(actionItem) });

const OpenShell = ({ data }: { data: RowMenuData }) => {
  const terminals = useInject(openContainerTerminalsInjectable)();

  return (
    <DropDownMenuItemRow Icon={TerminalIcon} $onClick={() => void terminals.shell(data.item)}>
      Shell
    </DropDownMenuItemRow>
  );
};

export const openShellMenuItem = getDropDownMenuItemInjectableBunch({
  id: "docker-container-shell",
  kind: rowMenuKind,
  orderNumber: 50,
  isVisible: ({ item }) => canOpenShell(item),
  Component: OpenShell,
});

const OpenLogs = ({ data }: { data: RowMenuData }) => {
  const terminals = useInject(openContainerTerminalsInjectable)();

  return (
    <DropDownMenuItemRow Icon={SubjectIcon} $onClick={() => void terminals.logs(data.item)}>
      Logs
    </DropDownMenuItemRow>
  );
};

export const openLogsMenuItem = getDropDownMenuItemInjectableBunch({
  id: "docker-container-logs",
  kind: rowMenuKind,
  orderNumber: 60,
  Component: OpenLogs,
});
