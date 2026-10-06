import { getPolledDockerBunch, parseJsonLines } from "../list/get-polled-docker-bunch";

// One line of `docker system df`: what a kind of thing takes on disk, and how much of it is unused.
export interface DiskUsage {
  readonly Type: "Images" | "Containers" | "Local Volumes" | "Build Cache";
  readonly TotalCount: string;
  readonly Active: string;
  readonly Size: string;
  // "9.222GB (96%)", or "0B".
  readonly Reclaimable: string;
}

export const diskUsage = getPolledDockerBunch<readonly DiskUsage[]>(
  "docker-disk-usage",
  () => "docker system df --format '{{json .}}'",
  parseJsonLines<DiskUsage>,
  { slowness: 3 },
);
