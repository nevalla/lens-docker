import { getInjectable2 } from "@k8slens/injectable";
import { openDockerTabInjectable } from "../open-docker-tab.injectable";
import { dockerContainers } from "./containers.injectable";

// Shows a container's details from anywhere: the containers tab, with its drawer open on the container.
export const openContainerDetailsInjectable = getInjectable2({
  id: "docker-open-container-details",

  instantiate: (di) => {
    const containersView = di.inject(dockerContainers.viewState)();
    const openDockerTab = di.inject(openDockerTabInjectable)();

    return () => async (containerId: string) => {
      containersView.openDetails(containerId);
      await openDockerTab("containers");
    };
  },
});
