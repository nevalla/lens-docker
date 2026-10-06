import { getInjectable2 } from "@k8slens/injectable";
import { describeItems, dockerScript, runDockerCommandInjectable } from "../actions/run-docker-command.injectable";
import type { ContainerAction } from "./container-actions";
import { type ContainerRef, dockerContainerRows } from "./container-rows.injectable";

// Runs an action over the containers it applies to, leaving the others be, and shows the result right away.
export const runContainerActionInjectable = getInjectable2({
  id: "docker-run-container-action",

  instantiate: (di) => {
    const runDockerCommand = di.inject(runDockerCommandInjectable)();
    const refreshContainers = di.inject(dockerContainerRows.refresh)();

    return () => async (action: ContainerAction, containers: readonly ContainerRef[]) => {
      const applicable = containers.filter(action.appliesTo);

      await runDockerCommand({
        script: dockerScript(action.command, applicable.map((container) => container.ID)),
        subject: describeItems("container", applicable.map((container) => container.Names)),
        done: action.done,
        verb: action.label.toLowerCase(),
      });
      refreshContainers();
    };
  },
});
