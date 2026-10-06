import { getPolledDockerBunch, parseJsonLines } from "../list/get-polled-docker-bunch";
import type { DockerSettings } from "../settings/docker-settings.injectable";

// What `docker stats` measures of a running container.
export interface ContainerUsage {
  readonly CPUPerc: string;
  readonly MemUsage: string;
  readonly MemPerc: string;
}

interface ContainerStats extends ContainerUsage {
  readonly ID: string;
}

// What Docker Compose labels a container it made with.
export interface ComposeLabels {
  readonly project: string;
  readonly service: string;
  readonly workingDir: string;
  readonly configFiles: string;
}

export interface DockerContainer {
  readonly ID: string;
  readonly Names: string;
  readonly Image: string;
  readonly State: string;
  readonly Status: string;
  readonly Ports: string;
  readonly CreatedAt: string;
  // Only of running containers.
  readonly usage?: ContainerUsage;
  // Only of containers Docker Compose made.
  readonly compose?: ComposeLabels;
}

// What acting on a container takes, from a row of the list or from its details alike.
export type ContainerRef = Pick<DockerContainer, "ID" | "Names" | "State">;

// Container ids are hex; anything else stays out of shell commands.
export const isContainerId = (id: string) => /^[0-9a-f]+$/i.test(id);

const separator = "---docker-stats---";

const label = (name: string) => `{{json (.Label "${name}")}}`;

// A container as `docker ps` has it, beside its Compose labels: read on their own, as the labels
// `docker ps` lists in one string can hold commas of their own.
const containerFormat =
  `{"container":{{json .}},"compose":{` +
  `"project":${label("com.docker.compose.project")},` +
  `"service":${label("com.docker.compose.service")},` +
  `"workingDir":${label("com.docker.compose.project.working_dir")},` +
  `"configFiles":${label("com.docker.compose.project.config_files")}}}`;

interface ContainerLine {
  readonly container: Omit<DockerContainer, "usage" | "compose">;
  readonly compose: ComposeLabels;
}

// The containers, and what the running ones use, read in one go so a row carries both. Measuring takes
// docker stats a second or two, so it is left out where the settings say not to measure.
const command = ({ measureUsage }: DockerSettings) =>
  [
    `docker ps --all --no-trunc --format '${containerFormat}'`,
    `echo '${separator}'`,
    ...(measureUsage ? ["docker stats --no-stream --no-trunc --format '{{json .}}'"] : []),
  ].join(" && ");

const parse = (output: string): DockerContainer[] => {
  const [containersOutput, statsOutput = ""] = output.split(separator);
  const stats = new Map(parseJsonLines<ContainerStats>(statsOutput).map((stat) => [stat.ID, stat]));

  return parseJsonLines<ContainerLine>(containersOutput).map(({ container, compose }) => {
    const stat = stats.get(container.ID);

    return {
      ...container,
      ...(stat && { usage: { CPUPerc: stat.CPUPerc, MemUsage: stat.MemUsage, MemPerc: stat.MemPerc } }),
      ...(compose.project && { compose }),
    };
  });
};

export const dockerContainerRows = getPolledDockerBunch<readonly DockerContainer[]>(
  "docker-container-rows",
  command,
  parse,
);
