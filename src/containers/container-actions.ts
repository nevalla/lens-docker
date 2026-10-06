import { PlayArrowIcon, ReplayIcon, StopIcon } from "@k8slens/icon";
import type { ComponentType } from "react";
import type { ContainerRef } from "./container-rows.injectable";

export interface ContainerAction {
  readonly id: string;
  readonly label: string;
  readonly done: string;
  readonly command: string;
  readonly Icon: ComponentType;
  readonly appliesTo: (container: ContainerRef) => boolean;
}

const isRunning = (container: ContainerRef) => container.State === "running";

export const containerActions: readonly ContainerAction[] = [
  { id: "start", label: "Start", done: "Started", command: "start", Icon: PlayArrowIcon, appliesTo: (container) => !isRunning(container) },
  { id: "stop", label: "Stop", done: "Stopped", command: "stop", Icon: StopIcon, appliesTo: isRunning },
  { id: "restart", label: "Restart", done: "Restarted", command: "restart", Icon: ReplayIcon, appliesTo: isRunning },
];
