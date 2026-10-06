import { getPolledDockerBunch } from "../list/get-polled-docker-bunch";

export interface DockerVolume {
  readonly Name: string;
  readonly Driver: string;
  readonly Scope: string;
  readonly Mountpoint: string;
  readonly CreatedAt: string;
  readonly Labels: Record<string, string> | null;
  readonly Options: Record<string, string> | null;
  // Names of the containers that mount the volume.
  readonly usedBy: readonly string[];
  // As docker measures it: "48.98MB"; undefined where the driver cannot tell.
  readonly size?: string;
}

// Docker labels a volume made for a container without a name of its own.
export const isAnonymous = (volume: DockerVolume) => "com.docker.volume.anonymous" in (volume.Labels ?? {});

const separator = "---docker-containers---";
const sizesSeparator = "---docker-volume-sizes---";

// Measuring the volumes reads them on disk, so the volumes are read less often than other lists.
const pollIntervalMs = 15000;

// The volumes in full, which container mounts which volume, and how large each is, read in one go so a
// row carries all of it.
const command = [
  // Volumes and containers removed while this runs are left out rather than failing the list.
  `(docker volume inspect $(docker volume ls -q) 2>/dev/null; true)`,
  `echo '${sizesSeparator}'`,
  `docker system df --verbose --format '{{json .Volumes}}'`,
  `echo '${separator}'`,
  `(docker inspect --format '{{.Name}}{{range .Mounts}}{{if .Name}} {{.Name}}{{end}}{{end}}' $(docker ps -aq) 2>/dev/null; true)`,
].join(" && ");

// Lines of "/<container name> <volume> <volume>…".
const parseUsedBy = (output: string) => {
  const usedBy = new Map<string, string[]>();

  output
    .split("\n")
    .filter((line) => line.trim())
    .forEach((line) => {
      const [container, ...volumes] = line.trim().split(" ");

      volumes.forEach((volume) => usedBy.set(volume, [...(usedBy.get(volume) ?? []), container.replace(/^\//, "")]));
    });

  return usedBy;
};

const parseSizes = (output: string) =>
  new Map(
    ((JSON.parse(output.trim() || "[]") ?? []) as { Name: string; Size: string }[])
      .filter(({ Size }) => Size && Size !== "N/A")
      .map(({ Name, Size }) => [Name, Size]),
  );

const parse = (output: string): DockerVolume[] => {
  const [volumesAndSizes, containersOutput = ""] = output.split(separator);
  const [volumesOutput, sizesOutput = ""] = volumesAndSizes.split(sizesSeparator);
  const usedBy = parseUsedBy(containersOutput);
  const sizes = parseSizes(sizesOutput);

  return (JSON.parse(volumesOutput.trim() || "[]") as Omit<DockerVolume, "usedBy" | "size">[]).map((volume) => ({
    ...volume,
    usedBy: usedBy.get(volume.Name) ?? [],
    size: sizes.get(volume.Name),
  }));
};

export const dockerVolumeRows = getPolledDockerBunch<readonly DockerVolume[]>(
  "docker-volume-rows",
  () => command,
  parse,
  undefined,
  pollIntervalMs,
);
