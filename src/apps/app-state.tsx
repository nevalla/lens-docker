import { Span } from "@k8slens/element-components";
import { type DockerApp, runningContainers } from "./app-rows.injectable";

type AppState = { readonly label: string; readonly color: "success" | "warning" | "critical" | "textMuted" };

const exitedWithError = (app: DockerApp) =>
  app.containers.some((container) => /^Exited \((?!0\))\d+\)/.test(container.Status));

export const appState = (app: DockerApp): AppState => {
  const running = runningContainers(app).length;

  if (running === app.containers.length) {
    return { label: "Running", color: "success" };
  }

  if (running > 0) {
    return { label: "Partially running", color: "warning" };
  }

  return exitedWithError(app) ? { label: "Failed", color: "critical" } : { label: "Stopped", color: "textMuted" };
};

// Running while all its containers are, the way Lens colours a workload by its pods.
export const AppState = ({ app }: { app: DockerApp }) => {
  const { label, color } = appState(app);

  return <Span $color={color}>{label}</Span>;
};
