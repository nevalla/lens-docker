import { dockerScript, shellQuote } from "../actions/run-docker-command.injectable";
import type { DockerApp } from "./app-rows.injectable";

// Runs `compose` where Docker Compose is installed, `otherwise` where it is not.
export const withCompose = (compose: string, otherwise: string) =>
  `if docker compose version >/dev/null 2>&1; then ${compose}; else ${otherwise}; fi`;

// `docker compose` for an app found by its project name alone: enough for what needs no compose files.
export const composeOf = (appName: string) => `docker compose --progress quiet --project-name ${shellQuote(appName)}`;

// `docker compose` for an app with its compose files, as it was brought up: what builds it needs them.
export const composeWithFilesOf = (appName: string, workingDir: string, configFiles: readonly string[]) =>
  [
    `docker compose --project-name ${shellQuote(appName)}`,
    `--project-directory ${shellQuote(workingDir)}`,
    ...configFiles.map((file) => `--file ${shellQuote(file)}`),
  ].join(" ");

// Down with Compose, its networks too; the containers alone without it.
export const removeAppScript = (app: DockerApp) =>
  withCompose(
    `${composeOf(app.name)} down --remove-orphans`,
    dockerScript("rm --force", app.containers.map((container) => container.ID)),
  );
