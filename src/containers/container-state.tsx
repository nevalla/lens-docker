import { Span } from "@k8slens/element-components";

type StateColor = "success" | "warning" | "notice" | "critical" | "textMuted";

const stateColor = (state: string, exitCode: number): StateColor => {
  switch (state) {
    case "running":
      return "success";
    case "restarting":
    case "removing":
      return "warning";
    case "paused":
      return "notice";
    case "dead":
      return "critical";
    default:
      return exitCode === 0 ? "textMuted" : "critical";
  }
};

const capitalize = (value: string) => value.charAt(0).toUpperCase() + value.slice(1);

// A container's state, coloured the way Lens colours pod statuses.
export const ContainerState = ({ state, exitCode = 0 }: { state: string; exitCode?: number }) => (
  <Span $color={stateColor(state, exitCode)}>{capitalize(state)}</Span>
);
