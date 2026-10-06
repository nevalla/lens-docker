import type { DropDownMenuSpec } from "@k8slens/drop-down-menu-contracts";
import { Button } from "@k8slens/element-components";
import type { ComponentType } from "react";

type IconSize = "m" | "l";

interface IconActionProps {
  readonly label: string;
  readonly Icon: ComponentType<{ $size?: IconSize }>;
  readonly size?: IconSize;
  readonly onClick?: () => void;
  readonly menu?: DropDownMenuSpec;
}

// An icon that is a control, the way Lens draws them on rows and in drawer headers.
export const IconAction = ({ label, Icon, size = "m", onClick, menu }: IconActionProps) => (
  <Button
    aria-label={label}
    $tooltip={label}
    $interactive
    $flex={{ horizontalAlign: "center", verticalAlign: "center" }}
    $onClick={onClick}
    $dropDownMenu={menu}
  >
    <Icon $size={size} />
  </Button>
);
