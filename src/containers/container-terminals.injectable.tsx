import { SubjectIcon, TerminalIcon } from "@k8slens/icon";
import { getInjectable2 } from "@k8slens/injectable";
import {
  getTerminalInjectableBunch,
  getTerminalKind,
  openTerminalInjectionToken,
  type TerminalTabIconProps,
} from "@k8slens/terminal-contracts";
import { dockerTerminalStartup } from "../settings/docker-environment";
import { dockerSettingsInjectable } from "../settings/docker-settings.injectable";
import { type ContainerRef, isContainerId } from "./container-rows.injectable";

type ContainerTerminalInput = [containerId: string, containerName: string];

const checkedId = (containerId: string) => {
  if (!isContainerId(containerId)) {
    throw new Error(`Not a container id: ${containerId}`);
  }

  return containerId;
};

export const containerLogsTerminalKind = getTerminalKind<ContainerTerminalInput>()("container-logs");
export const containerShellTerminalKind = getTerminalKind<ContainerTerminalInput>()("container-shell");

const LogsTabIcon = ({ $size }: TerminalTabIconProps<ContainerTerminalInput>) => <SubjectIcon $size={$size} />;
const ShellTabIcon = ({ $size }: TerminalTabIconProps<ContainerTerminalInput>) => <TerminalIcon $size={$size} />;

// Follows the container's logs from its last lines on, and again from there after Lens restarts.
export const containerLogsTerminal = getTerminalInjectableBunch({
  kind: containerLogsTerminalKind,
  TabIcon: LogsTabIcon,
  startup: {
    instantiate: (di) => {
      const settings = di.inject(dockerSettingsInjectable)();

      return () => async (containerId, containerName) =>
        dockerTerminalStartup(await settings.loaded(), {
          title: `Logs: ${containerName}`,
          command: `docker logs --follow --tail 1000 ${checkedId(containerId)}`,
          reuseKey: containerId,
        });
    },
  },
});

// A shell inside the container: bash where the image has it, sh otherwise.
export const containerShellTerminal = getTerminalInjectableBunch({
  kind: containerShellTerminalKind,
  TabIcon: ShellTabIcon,
  startup: {
    instantiate: (di) => {
      const settings = di.inject(dockerSettingsInjectable)();

      return () => async (containerId, containerName) =>
        dockerTerminalStartup(await settings.loaded(), {
          title: `Shell: ${containerName}`,
          command: `docker exec -it ${checkedId(containerId)} sh -c 'command -v bash >/dev/null && exec bash || exec sh'`,
          reuseKey: containerId,
        });
    },
  },
});

export const openContainerTerminalsInjectable = getInjectable2({
  id: "docker-open-container-terminals",
  consumptions: [openTerminalInjectionToken],

  instantiate: (di) => {
    const openLogs = di.inject(openTerminalInjectionToken.for(containerLogsTerminalKind).for(di.scopeIds))();
    const openShell = di.inject(openTerminalInjectionToken.for(containerShellTerminalKind).for(di.scopeIds))();

    return () => ({
      logs: (container: ContainerRef) => openLogs(container.ID, container.Names),
      shell: (container: ContainerRef) => openShell(container.ID, container.Names),
    });
  },
});

export const canOpenShell = (container: ContainerRef) => container.State === "running";
