import { openLinkInBrowserInjectionToken } from "@k8slens/electron-contracts";
import { TerminalIcon } from "@k8slens/icon";
import { getInjectable2 } from "@k8slens/injectable";
import {
  getTerminalInjectableBunch,
  getTerminalKind,
  openTerminalInjectionToken,
  type TerminalTabIconProps,
} from "@k8slens/terminal-contracts";
import { shellQuote } from "../actions/run-docker-command.injectable";
import { type ConsoleId, consoleTypes, type Endpoint } from "./container-endpoints";
import { dockerTerminalStartup } from "../settings/docker-environment";
import { dockerSettingsInjectable } from "../settings/docker-settings.injectable";
import { type ContainerRef, isContainerId } from "./container-rows.injectable";

type ConsoleInput = [containerId: string, containerName: string, consoleId: ConsoleId];

export const containerConsoleTerminalKind = getTerminalKind<ConsoleInput>()("container-console");

const ConsoleTabIcon = ({ $size }: TerminalTabIconProps<ConsoleInput>) => <TerminalIcon $size={$size} />;

// The database's or cache's own client, inside its container, with the container's own credentials.
export const containerConsoleTerminal = getTerminalInjectableBunch({
  kind: containerConsoleTerminalKind,
  TabIcon: ConsoleTabIcon,
  startup: {
    instantiate: (di) => {
      const settings = di.inject(dockerSettingsInjectable)();

      return () => async (containerId, containerName, consoleId) => {
        const type = consoleTypes.find(({ id }) => id === consoleId);

        if (!type || !isContainerId(containerId)) {
          throw new Error(`No ${consoleId} console for container ${containerId}`);
        }

        return dockerTerminalStartup(await settings.loaded(), {
          title: `${type.label}: ${containerName}`,
          command: `docker exec -it ${containerId} sh -c ${shellQuote(type.script)}`,
          reuseKey: `${consoleId}:${containerId}`,
        });
      };
    },
  },
});

// Goes where an endpoint leads: a page in the browser, or a console in a terminal.
export const connectToContainerInjectable = getInjectable2({
  id: "docker-connect-to-container",
  consumptions: [openLinkInBrowserInjectionToken, openTerminalInjectionToken],

  instantiate: (di) => {
    const openLinkInBrowser = di.inject(openLinkInBrowserInjectionToken)();
    const openConsole = di.inject(openTerminalInjectionToken.for(containerConsoleTerminalKind).for(di.scopeIds))();

    return () => async (container: ContainerRef, endpoint: Endpoint) => {
      if (endpoint.kind === "web") {
        await openLinkInBrowser(endpoint.url);
      } else {
        await openConsole(container.ID, container.Names, endpoint.console);
      }
    };
  },
});
