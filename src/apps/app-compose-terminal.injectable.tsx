import { CloudDownloadIcon, UpgradeIcon } from "@k8slens/icon";
import { getInjectable2 } from "@k8slens/injectable";
import {
  getTerminalInjectableBunch,
  getTerminalKind,
  openTerminalInjectionToken,
  type TerminalTabIconProps,
} from "@k8slens/terminal-contracts";
import type { DockerApp } from "./app-rows.injectable";
import { composeWithFilesOf } from "./compose";

// What Compose does to an app from its compose files, shown in a terminal as it happens.
export interface ComposeOperation {
  readonly id: "up" | "pull";
  readonly label: string;
  readonly Icon: typeof UpgradeIcon;
  readonly script: (compose: string) => string;
}

export const composeOperations: readonly ComposeOperation[] = [
  {
    id: "up",
    label: "Up",
    Icon: UpgradeIcon,
    script: (compose) => `${compose} up --detach --remove-orphans`,
  },
  {
    id: "pull",
    label: "Pull and up",
    Icon: CloudDownloadIcon,
    script: (compose) => `${compose} pull && ${compose} up --detach --remove-orphans`,
  },
];

// Only an app whose compose files Docker recorded can be brought up from them.
export const hasComposeFiles = (app: DockerApp) => app.configFiles.length > 0 && Boolean(app.workingDir);

type ComposeInput = [appName: string, operation: ComposeOperation["id"], workingDir: string, configFiles: string[]];

export const appComposeTerminalKind = getTerminalKind<ComposeInput>()("app-compose");

const ComposeTabIcon = ({ input: [, operation], $size }: TerminalTabIconProps<ComposeInput>) => {
  const Icon = composeOperations.find(({ id }) => id === operation)?.Icon ?? UpgradeIcon;

  return <Icon $size={$size} />;
};

export const appComposeTerminal = getTerminalInjectableBunch({
  kind: appComposeTerminalKind,
  TabIcon: ComposeTabIcon,
  startup: {
    instantiate: () => () => (appName, operationId, workingDir, configFiles) => {
      const operation = composeOperations.find(({ id }) => id === operationId) ?? composeOperations[0];
      const command = operation.script(composeWithFilesOf(appName, workingDir, configFiles));

      return {
        title: `${operation.label}: ${appName}`,
        workingDirectory: workingDir,
        command,
        // Not again by itself after Lens restarts: that is the user's to decide.
        resumeCommand: `echo "To run it again: ${operation.label} on the app in Lens."`,
        reuseKey: `${operation.id}:${appName}`,
      };
    },
  },
});

export const runComposeOperationInjectable = getInjectable2({
  id: "docker-run-compose-operation",
  consumptions: [openTerminalInjectionToken],

  instantiate: (di) => {
    const openComposeTerminal = di.inject(openTerminalInjectionToken.for(appComposeTerminalKind).for(di.scopeIds))();

    return () => (operation: ComposeOperation, app: DockerApp) =>
      openComposeTerminal(app.name, operation.id, app.workingDir, [...app.configFiles]);
  },
});
