import { Div } from "@k8slens/element-components";
import { PlainButton } from "@k8slens/input-components";
import { useInject } from "@k8slens/use-inject";
import { getDockerList, type SelectionActionsProps } from "../list/get-docker-list";
import { containerActions } from "./container-actions";
import { containerColumns } from "./container-columns";
import { ContainerDetails } from "./container-details";
import { type DockerContainer, dockerContainerRows } from "./container-rows.injectable";
import { containerRemoval } from "./remove-containers.injectable";
import { runContainerActionInjectable } from "./run-container-action.injectable";

const SelectedContainerActions = ({ rows, clearSelection }: SelectionActionsProps<DockerContainer>) => {
  const runContainerAction = useInject(runContainerActionInjectable)();

  return (
    <Div $flex={{ gap: "s" }}>
      {containerActions.map((action) => {
        const applicable = rows.filter(action.appliesTo).length;

        return (
          <PlainButton
            key={action.id}
            Icon={action.Icon}
            $disabled={applicable === 0}
            $tooltip={`${action.label} ${applicable} of ${rows.length} selected`}
            onClick={() => void runContainerAction(action, rows)}
          >
            {action.label}
          </PlainButton>
        );
      })}
      <containerRemoval.RemoveSelected rows={rows} clearSelection={clearSelection} />
    </Div>
  );
};

export const dockerContainers = getDockerList<DockerContainer>({
  id: "containers",
  title: "Containers",
  rows: dockerContainerRows,
  getRowId: (container) => container.ID,
  columns: [
    containerColumns.name,
    containerColumns.app,
    containerColumns.image,
    containerColumns.cpu,
    containerColumns.memory,
    containerColumns.ports,
    containerColumns.state,
    containerColumns.status,
    containerColumns.age,
  ],
  SelectionActions: SelectedContainerActions,
  RowActions: containerRemoval.RowActions,
  Details: ContainerDetails,
});
