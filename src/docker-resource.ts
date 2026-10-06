// What the navigator lists under Docker, each opening its list.
export const dockerResources = ["apps", "containers", "images", "volumes"] as const;

export type DockerResource = (typeof dockerResources)[number];

// What a Docker tab can show: a list, or the overview the Docker item itself opens.
export type DockerView = "overview" | DockerResource;

export const dockerViewTitles: Record<DockerView, string> = {
  overview: "Overview",
  apps: "Apps",
  containers: "Containers",
  images: "Images",
  volumes: "Volumes",
};

export const dockerResourceTitles: Record<DockerResource, string> = dockerViewTitles;

export const isDockerResource = (value: string): value is DockerResource =>
  (dockerResources as readonly string[]).includes(value);

// What the navigator lists under Docker: the overview first, then the lists.
export const dockerNavigatorViews: readonly DockerView[] = ["overview", ...dockerResources];

export const isDockerView = (value: string): value is DockerView => value === "overview" || isDockerResource(value);
