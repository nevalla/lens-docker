import { DrawerItem, NoItemsDetailItem } from "@k8slens/details-panel-components";
import { Div } from "@k8slens/element-components";
import { DetailsSection } from "./details-drawer";

// Which containers use an image or a volume.
export const UsedBySection = ({ containers, noun }: { containers: readonly string[]; noun: string }) => (
  <DetailsSection title="Used by">
    {containers.length > 0 ? (
      <DrawerItem name="Containers">
        {containers.map((container) => (
          <Div key={container}>{container}</Div>
        ))}
      </DrawerItem>
    ) : (
      <NoItemsDetailItem>No container uses this {noun}.</NoItemsDetailItem>
    )}
  </DetailsSection>
);
