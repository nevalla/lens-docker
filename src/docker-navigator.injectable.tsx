import { ComputerIcon, DashboardIcon, GroupingIcon, LayersIcon, StorageIcon, WorkloadsIcon } from "@k8slens/icon";
import {
  NavigatorBranchIndicator,
  NavigatorItemIcon,
  NavigatorItemLabel,
  NavigatorLeafIndicator,
} from "@k8slens/navigator-components";
import {
  getNavigatorItemKind,
  getNavigatorItemKindInjectableBunch2,
  type NavigatorItemProps,
  navigatorRootKind,
  noNavigatorItemActivation,
  useItemIsOpen,
} from "@k8slens/navigator-contracts";
import { computed } from "mobx";
import { type DockerView, dockerNavigatorViews, dockerViewTitles, isDockerView } from "./docker-resource";
import { openDockerTabInjectable } from "./open-docker-tab.injectable";

interface DockerItem {
  readonly id: string;
  readonly name: string;
}

interface DockerResourceItem {
  readonly id: DockerView;
  readonly name: string;
  readonly orderNumber: number;
}

export const dockerNavigatorItemKind = getNavigatorItemKind<DockerItem, []>()("docker");
export const dockerResourceNavigatorItemKind = getNavigatorItemKind<DockerResourceItem, [dockerId: string]>()(
  "docker-resource",
);

const DockerRow = ({ kind, ids, item }: NavigatorItemProps<DockerItem, typeof navigatorRootKind>) => {
  const isOpen = useItemIsOpen(kind, ...ids);

  return (
    <>
      <NavigatorBranchIndicator isOpen={isOpen} />
      <NavigatorItemIcon>
        <ComputerIcon />
      </NavigatorItemIcon>
      <NavigatorItemLabel>{item.name}</NavigatorItemLabel>
    </>
  );
};

export const dockerNavigatorItem = getNavigatorItemKindInjectableBunch2({
  kind: dockerNavigatorItemKind,
  parentKind: navigatorRootKind,
  description: "Docker on this machine, at the top of the navigator.",
  items: {
    instantiate: () => async () => computed((): DockerItem[] => [{ id: "local", name: "Docker" }]),
  },
  activate: noNavigatorItemActivation,
  Component: DockerRow,
});

const resourceIcons: Record<DockerView, () => React.ReactNode> = {
  overview: () => <DashboardIcon />,
  apps: () => <GroupingIcon />,
  containers: () => <WorkloadsIcon />,
  images: () => <LayersIcon />,
  volumes: () => <StorageIcon />,
};

const DockerResourceRow = ({ item }: NavigatorItemProps<DockerResourceItem, typeof dockerNavigatorItemKind>) => (
  <>
    <NavigatorLeafIndicator />
    <NavigatorItemIcon>{resourceIcons[item.id]()}</NavigatorItemIcon>
    <NavigatorItemLabel>{item.name}</NavigatorItemLabel>
  </>
);

export const dockerResourceNavigatorItem = getNavigatorItemKindInjectableBunch2({
  kind: dockerResourceNavigatorItemKind,
  parentKind: dockerNavigatorItemKind,
  description: "Docker's overview, apps, containers, images and volumes, each opening in a tab.",
  items: {
    instantiate: () => async () =>
      computed(() =>
        dockerNavigatorViews.map((view, index): DockerResourceItem => ({
          id: view,
          name: dockerViewTitles[view],
          orderNumber: index,
        })),
      ),
  },
  activate: {
    instantiate: (di) => {
      const openDockerTab = di.inject(openDockerTabInjectable)();

      return async (_dockerId, view) => {
        if (isDockerView(view)) {
          await openDockerTab(view);
        }
      };
    },
  },
  Component: DockerResourceRow,
});
