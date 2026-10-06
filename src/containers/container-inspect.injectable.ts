import { getPolledDockerBunch } from "../list/get-polled-docker-bunch";
import { isContainerId } from "./container-rows.injectable";

// The parts of `docker inspect` the details show.
export interface ContainerInspect {
  readonly Id: string;
  readonly Name: string;
  readonly Created: string;
  readonly Path: string;
  readonly Args: readonly string[];
  readonly RestartCount: number;
  readonly Platform: string;
  readonly State: {
    readonly Status: string;
    readonly ExitCode: number;
    readonly Error: string;
    readonly StartedAt: string;
    readonly FinishedAt: string;
  };
  readonly Config: {
    readonly Image: string;
    readonly Env: readonly string[] | null;
    readonly Labels: Record<string, string> | null;
    readonly WorkingDir: string;
    readonly User: string;
  };
  readonly HostConfig: {
    readonly RestartPolicy: { readonly Name: string; readonly MaximumRetryCount: number };
  };
  readonly Mounts: readonly {
    readonly Type: string;
    readonly Source: string;
    readonly Destination: string;
    readonly RW: boolean;
  }[];
  readonly NetworkSettings: {
    readonly Ports: Record<string, readonly { readonly HostIp: string; readonly HostPort: string }[] | null> | null;
    readonly Networks: Record<string, { readonly IPAddress: string; readonly Gateway: string }> | null;
  };
}

export const containerInspect = getPolledDockerBunch<ContainerInspect, [containerId: string]>(
  "docker-container-inspect",
  (containerId) => {
    if (!isContainerId(containerId)) {
      throw new Error(`Not a container id: ${containerId}`);
    }

    return `docker inspect --format '{{json .}}' ${containerId}`;
  },
  (output) => JSON.parse(output) as ContainerInspect,
);
