import { Div } from "@k8slens/element-components";
import { type ReactNode, Suspense } from "react";
import { ErrorBoundary } from "../list/error-boundary";

// A titled part of the overview, its title as large as a drawer's "Properties".
export const OverviewSection = ({ title, children }: { title: string; children: ReactNode }) => (
  <Div $flex={{ direction: "vertical", gap: "s" }}>
    <Div $font={{ size: "xl" }} $color="textHighlight">
      {title}
    </Div>
    {children}
  </Div>
);

// What needs docker's answer: nothing until it is there, and a word when it cannot be had.
export const WhenRead = ({ children, what }: { children: ReactNode; what: string }) => (
  <ErrorBoundary fallback={<Div $color="textMuted">Could not read {what}.</Div>}>
    <Suspense fallback={<Div $color="textMuted">Loading…</Div>}>{children}</Suspense>
  </ErrorBoundary>
);

// A card the size of its content, on the surface a step off the page's.
export const Card = ({ children, grow = true }: { children: ReactNode; grow?: boolean }) => (
  <Div
    $flex={{ direction: "vertical", gap: "xs" }}
    $padding="m"
    $backgroundColor="backgroundSecondary"
    $border={{ radius: "m", width: "xxs", color: "grey60" }}
    $style={{ flex: grow ? "1 1 10rem" : "0 0 auto", minWidth: "10rem" }}
  >
    {children}
  </Div>
);
