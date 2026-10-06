import { Div } from "@k8slens/element-components";
import { mainViewTabHostKind } from "@k8slens/main-view-contracts";
import { getTabKind, getTabKindInjectableBunch, type TabProps } from "@k8slens/tab-contracts";
import type { ComponentType } from "react";
import { type DockerView, dockerViewTitles, isDockerView } from "./docker-resource";
import { Overview } from "./overview/overview";
import { dockerApps } from "./apps/apps.injectable";
import { dockerContainers } from "./containers/containers.injectable";
import { dockerImages } from "./images/images.injectable";
import { dockerVolumes } from "./volumes/volumes.injectable";

// One tab per Docker view, the overview or a list, opened by the view's name as its tab id.
export const dockerTabKind = getTabKind()("docker");

const views: Record<DockerView, ComponentType> = {
  overview: Overview,
  apps: dockerApps.View,
  containers: dockerContainers.View,
  images: dockerImages.View,
  volumes: dockerVolumes.View,
};

const DockerTab = ({ tabId }: TabProps<typeof mainViewTabHostKind>) => {
  const View = isDockerView(tabId) ? views[tabId] : undefined;

  return <Div $size="full">{View && <View />}</Div>;
};

const DockerTabTitle = ({ tabId }: TabProps<typeof mainViewTabHostKind>) => (
  <Div>Docker {isDockerView(tabId) ? dockerViewTitles[tabId] : tabId}</Div>
);

export const dockerTab = getTabKindInjectableBunch({
  tabHostKind: mainViewTabHostKind,
  kind: dockerTabKind,
  Component: DockerTab,
  Title: DockerTabTitle,
});
