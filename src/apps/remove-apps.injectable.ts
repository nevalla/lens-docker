import { getRemoveActions } from "../actions/get-remove-actions";
import { dockerContainerRows } from "../containers/container-rows.injectable";
import type { DockerApp } from "./app-rows.injectable";
import { removeAppScript } from "./compose";

export const appRemoval = getRemoveActions<DockerApp>({
  id: "apps",
  noun: "app",
  scriptFor: (apps) => apps.map(removeAppScript).join(" && "),
  note: "Its containers are stopped and removed, and its networks too where Docker Compose is installed. Its volumes and images stay.",
  nameOf: (app) => app.name,
  refresh: dockerContainerRows.refresh,
});
