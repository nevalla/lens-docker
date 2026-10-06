import { getInjectable2 } from "@k8slens/injectable";
import {
  showErrorNotificationInjectionToken,
  showSuccessNotificationInjectionToken,
} from "@k8slens/notifications-contracts";
import type { DockerSettings } from "../settings/docker-settings.injectable";
import { runDockerInjectable } from "../settings/run-docker.injectable";

export { describeItems, dockerScript, shellQuote } from "./shell";

export interface DockerCommand {
  // The shell script to run, "" when there is nothing to do; or how to build it from the settings.
  readonly script: string | ((settings: DockerSettings) => string);
  // What the notifications name: "container web", "3 images".
  readonly subject: string;
  // "Started", "Removed": what the success notification says was done.
  readonly done: string;
  // "start", "remove": what the error notification says could not be done.
  readonly verb: string;
}

// Runs a docker command, and says how it went.
export const runDockerCommandInjectable = getInjectable2({
  id: "docker-run-command",
  consumptions: [showErrorNotificationInjectionToken, showSuccessNotificationInjectionToken],

  instantiate: (di) => {
    const runDocker = di.inject(runDockerInjectable)();
    const showError = di.inject(showErrorNotificationInjectionToken)();
    const showSuccess = di.inject(showSuccessNotificationInjectionToken)();

    return () =>
      async ({ script, subject, done, verb }: DockerCommand) => {
        if (!script) {
          return;
        }

        try {
          await runDocker(script);
          showSuccess(`${done} ${subject}`);
        } catch (error) {
          showError(`Could not ${verb} ${subject}: ${error instanceof Error ? error.message : String(error)}`);
        }
      };
  },
});
