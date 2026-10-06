import { dockerScript } from "../actions/run-docker-command.injectable";
import { getRemoveActions } from "../actions/get-remove-actions";
import { type ContainerRef, dockerContainerRows } from "./container-rows.injectable";

export const containerRemoval = getRemoveActions<ContainerRef>({
  id: "containers",
  noun: "container",
  scriptFor: (containers) => dockerScript("rm --force", containers.map((container) => container.ID)),
  note: "Running containers are stopped first. This cannot be undone.",
  nameOf: (container) => container.Names,
  refresh: dockerContainerRows.refresh,
});
