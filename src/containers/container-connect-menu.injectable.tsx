import { getDropDownMenuItemsInjectableBunch } from "@k8slens/drop-down-menu-contracts";
import { DropDownMenuItemRow } from "@k8slens/drop-down-menu-items";
import { OpenInBrowserIcon, TerminalIcon } from "@k8slens/icon";
import { useInject } from "@k8slens/use-inject";
import { detectEndpoints, type Endpoint } from "./container-endpoints";
import type { DockerContainer } from "./container-rows.injectable";
import { connectToContainerInjectable } from "./connect-to-container.injectable";
import { containerRemoval } from "./remove-containers.injectable";

interface RowMenuData {
  readonly item: DockerContainer;
}

const Connect = ({ data, endpoint }: { data: RowMenuData; endpoint: Endpoint }) => {
  const connectToContainer = useInject(connectToContainerInjectable)();

  return (
    <DropDownMenuItemRow
      Icon={endpoint.kind === "web" ? OpenInBrowserIcon : TerminalIcon}
      $onClick={() => void connectToContainer(data.item, endpoint)}
    >
      {endpoint.label}
    </DropDownMenuItemRow>
  );
};

// A row per way into the container, first in its menu: as many as it serves.
export const containerConnectMenuItems = getDropDownMenuItemsInjectableBunch({
  id: "docker-container-connect",
  kind: containerRemoval.rowMenuKind,
  // The menu is opened for list rows, which carry their ports; anything less has nothing to detect.
  instantiate: () => (data) =>
    ("Ports" in data.item ? detectEndpoints(data.item as DockerContainer) : []).map((endpoint, index) => ({
      id: `docker-container-connect-${index}`,
      orderNumber: 1 + index / 100,
      Component: Connect,
      componentProps: { endpoint },
    })),
});
