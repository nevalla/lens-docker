import { DeleteSweepIcon } from "@k8slens/icon";
import { getInjectable2 } from "@k8slens/injectable";
import { PlainButton } from "@k8slens/input-components";
import { openModalInjectionToken } from "@k8slens/modal-contracts";
import { useInject } from "@k8slens/use-inject";
import { observer } from "mobx-react";
import { confirmRemovalModalKind } from "../actions/confirm-removal-modal.injectable";
import { runDockerCommandInjectable } from "../actions/run-docker-command.injectable";
import { isNone } from "../docker-values";
import { useLoaded } from "../list/use-loaded";
import { type DockerImage, dockerImageRows } from "./image-rows.injectable";

// What `docker image prune` removes: images with neither repository nor tag that no container uses.
const isDangling = (image: DockerImage) => isNone(image.Repository) && isNone(image.Tag) && image.usedBy.length === 0;

export const removeDanglingImagesInjectable = getInjectable2({
  id: "docker-remove-dangling-images",
  consumptions: [openModalInjectionToken],

  instantiate: (di) => {
    const confirmRemoval = di.inject(openModalInjectionToken.for(confirmRemovalModalKind).for(di.scopeIds))();
    const runDockerCommand = di.inject(runDockerCommandInjectable)();
    const refreshImages = di.inject(dockerImageRows.refresh)();

    return () => async (dangling: readonly DockerImage[]) => {
      const ids = dangling.map((image) => image.ID);

      if (!(await confirmRemoval("dangling image", ids, "Untagged images no container uses are removed. This cannot be undone."))) {
        return;
      }

      await runDockerCommand({
        script: "docker image prune --force",
        subject: "dangling images",
        done: "Removed",
        verb: "remove",
      });
      refreshImages();
    };
  },
});

export const RemoveDanglingImages = observer(() => {
  const dangling = useLoaded(dockerImageRows.subscribable).filter(isDangling);
  const removeDanglingImages = useInject(removeDanglingImagesInjectable)();

  return (
    <PlainButton
      Icon={DeleteSweepIcon}
      $disabled={dangling.length === 0}
      $tooltip={
        dangling.length === 0
          ? "No untagged images that no container uses"
          : `Remove ${dangling.length} untagged ${dangling.length === 1 ? "image" : "images"} that no container uses`
      }
      onClick={() => void removeDanglingImages(dangling)}
    >
      Remove dangling
    </PlainButton>
  );
});
