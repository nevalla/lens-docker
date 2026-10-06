import { getInjectable2, getInjectableBunch } from "@k8slens/injectable";
import { derivedSubscribable } from "@k8slens/subscribable";
import { parseDockerTime, parseSize } from "../docker-values";
import { type DockerContainer, dockerContainerRows } from "../containers/container-rows.injectable";

// The containers Docker Compose made for one project.
export interface DockerApp {
  readonly name: string;
  readonly containers: readonly DockerContainer[];
  readonly workingDir: string;
  readonly configFiles: readonly string[];
  // When its first container was made.
  readonly createdAt: number;
}

export const runningContainers = (app: DockerApp) => app.containers.filter((container) => container.State === "running");

// What the app's running containers use together: CPU in percent of a core, memory in bytes.
export const appUsage = (app: DockerApp) =>
  runningContainers(app).reduce(
    (total, { usage }) => ({
      cpu: total.cpu + parseFloat(usage?.CPUPerc ?? "0"),
      memory: total.memory + parseSize(usage?.MemUsage.split(" / ")[0] ?? ""),
    }),
    { cpu: 0, memory: 0 },
  );

const toApps = (containers: readonly DockerContainer[]): DockerApp[] => {
  const byProject = Map.groupBy(
    containers.filter((container) => container.compose),
    (container) => container.compose!.project,
  );

  return [...byProject].map(([name, appContainers]) => {
    const { workingDir, configFiles } = appContainers[0].compose!;

    return {
      name,
      containers: appContainers.toSorted((a, b) => a.compose!.service.localeCompare(b.compose!.service)),
      workingDir,
      configFiles: configFiles ? configFiles.split(",") : [],
      createdAt: Math.min(...appContainers.map((container) => parseDockerTime(container.CreatedAt))),
    };
  });
};

// Apps are read off the containers, so they cost no reading of their own and stay in step with them.
const appSubscribable = getInjectable2({
  id: "docker-app-rows",
  instantiate: (di) => {
    const apps = derivedSubscribable(di.inject(dockerContainerRows.subscribable)(), toApps);

    return () => apps;
  },
});

// A bunch, so that registering this module registers the apps; refreshing them is refreshing the containers.
export const dockerAppRows = getInjectableBunch({ subscribable: appSubscribable });
