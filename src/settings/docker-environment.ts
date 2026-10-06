import { shellQuote } from "../actions/shell";
import type { DockerSettings } from "./docker-settings.injectable";

// The folder of the docker command, from its own path or the folder's.
const dockerFolder = (dockerPath: string) => dockerPath.trim().replace(/\/docker$/, "").replace(/\/+$/, "");

// The engine the settings name, as Docker's own variables say it: a context, or a host.
export const dockerVariables = ({ engine }: DockerSettings): Record<string, string> => {
  const target = engine.trim();

  if (!target) {
    return {};
  }

  return target.includes("://") ? { DOCKER_HOST: target } : { DOCKER_CONTEXT: target };
};

// What goes before a command for the docker command's folder to come first on the PATH: extended within
// the command, as an extension cannot read the PATH Lens runs commands with. `export` reads alike in
// sh, bash, zsh and fish.
export const dockerPathPrefix = ({ dockerPath }: DockerSettings) =>
  dockerPath.trim() ? `export PATH=${shellPath(dockerFolder(dockerPath))}:"$PATH"; ` : "";

// A path quoted for the shell, but for a leading ~, which still means the home folder.
const shellPath = (path: string) => (path.startsWith("~/") ? `"$HOME"/${shellQuote(path.slice(2))}` : shellQuote(path));

interface DockerTerminal {
  readonly title: string;
  readonly command: string;
  // Run instead of `command` when the terminal starts again after Lens restarts; `command` if left out.
  readonly resumeCommand?: string;
  readonly reuseKey: string;
  readonly workingDirectory?: string;
}

// How a terminal of docker commands starts, against the engine and with the docker command the settings
// name, as every other docker command runs.
export const dockerTerminalStartup = (settings: DockerSettings, terminal: DockerTerminal) => ({
  ...terminal,
  environment: dockerVariables(settings),
  command: dockerPathPrefix(settings) + terminal.command,
  resumeCommand: dockerPathPrefix(settings) + (terminal.resumeCommand ?? terminal.command),
});
