import { SubjectIcon } from "@k8slens/icon";
import { getInjectable2 } from "@k8slens/injectable";
import {
  getTerminalInjectableBunch,
  getTerminalKind,
  openTerminalInjectionToken,
  type TerminalTabIconProps,
} from "@k8slens/terminal-contracts";
import { dockerTerminalStartup } from "../settings/docker-environment";
import { dockerSettingsInjectable } from "../settings/docker-settings.injectable";
import type { DockerApp } from "./app-rows.injectable";
import { shellQuote } from "../actions/run-docker-command.injectable";
import { composeOf, withCompose } from "./compose";

type AppLogsInput = [appName: string];

// Every container of the app, each line led by its service: Compose's own logs where it is installed,
// and without it, each container's logs led by the container's name. The containers are looked up as
// it starts, after a restart too.
const followLogs = (appName: string) =>
  withCompose(
    `${composeOf(appName)} logs --follow --tail 200`,
    [
      `for id in $(docker ps --all --quiet --filter ${shellQuote(`label=com.docker.compose.project=${appName}`)}); do`,
      `name=$(docker inspect --format '{{.Name}}' "$id" | cut -c 2-);`,
      `docker logs --follow --tail 200 "$id" 2>&1 | while IFS= read -r line; do printf '%s | %s\\n' "$name" "$line"; done &`,
      `done; wait`,
    ].join(" "),
  );

export const appLogsTerminalKind = getTerminalKind<AppLogsInput>()("app-logs");

const AppLogsTabIcon = ({ $size }: TerminalTabIconProps<AppLogsInput>) => <SubjectIcon $size={$size} />;

export const appLogsTerminal = getTerminalInjectableBunch({
  kind: appLogsTerminalKind,
  TabIcon: AppLogsTabIcon,
  startup: {
    instantiate: (di) => {
      const settings = di.inject(dockerSettingsInjectable)();

      return () => async (appName) =>
        dockerTerminalStartup(await settings.loaded(), {
          title: `Logs: ${appName}`,
          command: followLogs(appName),
          reuseKey: appName,
        });
    },
  },
});

export const openAppLogsInjectable = getInjectable2({
  id: "docker-open-app-logs",
  consumptions: [openTerminalInjectionToken],

  instantiate: (di) => {
    const openLogs = di.inject(openTerminalInjectionToken.for(appLogsTerminalKind).for(di.scopeIds))();

    return () => (app: DockerApp) => openLogs(app.name);
  },
});
