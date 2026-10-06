import { Div, Span } from "@k8slens/element-components";
import { CloseIcon } from "@k8slens/icon";
import type { ReactNode } from "react";
import { IconAction } from "./icon-action";

interface DetailsDrawerProps {
  readonly title: ReactNode;
  readonly actions?: ReactNode;
  readonly onClose: () => void;
  readonly children: ReactNode;
}

// The frame of a details drawer, as Lens draws the one of a pod: a title bar with actions and a
// close button, over scrolling sections whose rows reach the drawer's edges.
export const DetailsDrawer = ({ title, actions, onClose, children }: DetailsDrawerProps) => (
  <Div
    $size="full"
    $flex={{ direction: "vertical" }}
    $backgroundColor="backgroundPrimary"
    $border={{ left: { width: "xxs", color: "grey60" } }}
    $boxShadow="elevated"
  >
    <Div
      $flex={{ gap: "m", verticalAlign: "center", horizontalAlign: "space-between" }}
      $padding={{ horizontal: "s", vertical: "xs" }}
      $backgroundColor="backgroundSecondary"
      $border={{ bottom: { width: "xxs", color: "grey60" } }}
      $flexChild="fixed"
    >
      <Span
        $font={{ size: "m", bold: true }}
        $color="textHighlight"
        $overflow="hidden"
        $style={{ textOverflow: "ellipsis", whiteSpace: "nowrap" }}
      >
        {title}
      </Span>
      <Div $flex={{ gap: "m", verticalAlign: "center" }} $flexChild="fixed">
        {actions}
        <IconAction label="Close" Icon={CloseIcon} size="l" onClick={onClose} />
      </Div>
    </Div>
    <Div $flexChild $overflow="auto" $padding={{ bottom: "l" }} $style={{ minHeight: 0 }}>
      {children}
    </Div>
  </Div>
);

// A titled section of a drawer, its title as large as Lens's "Properties", in line with the rows.
export const DetailsSection = ({ title, children }: { title: string; children: ReactNode }) => (
  <Div $padding={{ top: "l" }}>
    <Div $font={{ size: "xl" }} $color="textHighlight" $padding={{ horizontal: "s", bottom: "s" }}>
      {title}
    </Div>
    {children}
  </Div>
);
