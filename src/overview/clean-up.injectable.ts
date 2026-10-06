import { getInjectable2 } from "@k8slens/injectable";
import { openModalInjectionToken } from "@k8slens/modal-contracts";
import { confirmModalKind } from "../actions/confirm-modal.injectable";
import { runDockerCommandInjectable } from "../actions/run-docker-command.injectable";
import { dockerContainerRows } from "../containers/container-rows.injectable";
import { dockerImageRows } from "../images/image-rows.injectable";
import { dockerVolumeRows } from "../volumes/volume-rows.injectable";
import type { DiskUsage } from "./disk-usage.injectable";
import { diskUsage } from "./disk-usage.injectable";

// Freeing what `docker system df` counts as reclaimable, one kind of thing at a time.
export interface CleanUp {
  readonly type: DiskUsage["Type"];
  readonly label: string;
  readonly script: string;
  readonly question: string;
  readonly note: string;
  readonly subject: string;
}

export const cleanUps: readonly CleanUp[] = [
  {
    type: "Images",
    label: "Remove unused",
    script: "docker image prune --all --force",
    question: "Remove every image no container uses?",
    note: "Tagged images go too, and are pulled or built again when next needed. This cannot be undone.",
    subject: "unused images",
  },
  {
    type: "Containers",
    label: "Remove stopped",
    script: "docker container prune --force",
    question: "Remove every stopped container?",
    note: "Their logs and anything they wrote outside a volume are lost. This cannot be undone.",
    subject: "stopped containers",
  },
  {
    type: "Local Volumes",
    label: "Remove unused",
    script: "docker volume prune --all --force",
    question: "Remove every volume no container uses?",
    note: "Named volumes go too, with their data, such as a database's. This cannot be undone.",
    subject: "unused volumes",
  },
  {
    type: "Build Cache",
    label: "Clear",
    // The legacy builder warns of its deprecation on stderr, which would read as a failure: an
    // actual failure still shows, as its exit code.
    script: "docker builder prune --force 2>&1",
    question: "Clear the build cache?",
    note: "Builds take longer until it fills again.",
    subject: "the build cache",
  },
];

export const runCleanUpInjectable = getInjectable2({
  id: "docker-run-clean-up",
  consumptions: [openModalInjectionToken],

  instantiate: (di) => {
    const confirm = di.inject(openModalInjectionToken.for(confirmModalKind).for(di.scopeIds))();
    const runDockerCommand = di.inject(runDockerCommandInjectable)();
    const refreshers = [diskUsage.refresh, dockerContainerRows.refresh, dockerImageRows.refresh, dockerVolumeRows.refresh].map(
      (refresh) => di.inject(refresh)(),
    );

    return () => async (cleanUp: CleanUp) => {
      if (!(await confirm(cleanUp.question, cleanUp.note, cleanUp.label))) {
        return;
      }

      await runDockerCommand({ script: cleanUp.script, subject: cleanUp.subject, done: "Removed", verb: "remove" });
      refreshers.forEach((refresh) => refresh());
    };
  },
});
