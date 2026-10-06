import { getInjectable2 } from "@k8slens/injectable";
import { mainViewTabHostKind } from "@k8slens/main-view-contracts";
import { focusTabInjectionToken, openTabInjectionToken, tabIsOpenInjectionToken } from "@k8slens/tab-contracts";
import { type DockerView } from "./docker-resource";
import { dockerTabKind } from "./docker-tab.injectable";

export const openDockerTabInjectable = getInjectable2({
  id: "docker-open-tab",
  consumptions: [openTabInjectionToken, focusTabInjectionToken, tabIsOpenInjectionToken],

  instantiate: (di) => {
    const openTab = di.inject(openTabInjectionToken.for(mainViewTabHostKind).for(dockerTabKind).for(di.scopeIds))();
    const focusTab = di.inject(focusTabInjectionToken.for(mainViewTabHostKind).for(dockerTabKind).for(di.scopeIds))();
    const isOpen = di.inject(tabIsOpenInjectionToken.for(mainViewTabHostKind).for(dockerTabKind).for(di.scopeIds))();

    return () => async (view: DockerView) => {
      if (await isOpen({ tabId: view })) {
        await focusTab({ tabId: view });
      } else {
        await openTab({ tabId: view });
      }
    };
  },
});
