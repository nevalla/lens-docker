import { getPolledDockerBunch } from "../list/get-polled-docker-bunch";

// The parts of `docker info` the overview shows.
export interface DockerInfo {
  readonly Name: string;
  readonly ServerVersion: string;
  readonly OperatingSystem: string;
  readonly Architecture: string;
  readonly KernelVersion: string;
  readonly NCPU: number;
  readonly MemTotal: number;
  readonly Driver: string;
  // Docker Compose's version, where it is installed.
  readonly composeVersion?: string;
}

const separator = "---docker-compose-version---";

// The engine, and Compose's version beside it; a missing Compose prints nothing rather than failing.
const command = [
  "docker info --format '{{json .}}'",
  `echo '${separator}'`,
  "(docker compose version --short 2>/dev/null || true)",
].join(" && ");

const parse = (output: string): DockerInfo => {
  const [info, compose = ""] = output.split(separator);

  return { ...(JSON.parse(info) as DockerInfo), composeVersion: compose.trim() || undefined };
};

export const dockerInfo = getPolledDockerBunch<DockerInfo>("docker-info", () => command, parse, undefined, 30_000);
