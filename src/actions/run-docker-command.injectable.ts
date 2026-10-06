import { runCliCommandInjectionToken } from "@k8slens/cli-contracts";
import { getInjectable2 } from "@k8slens/injectable";
import {
  showErrorNotificationInjectionToken,
  showSuccessNotificationInjectionToken,
} from "@k8slens/notifications-contracts";

// Quoted for the shell, so a name can never be read as anything but one argument.
export const shellQuote = (value: string) => `'${value.replace(/'/g, `'\\''`)}'`;

// "container web" for one, "3 containers" for more.
export const describeItems = (noun: string, names: readonly string[]) =>
  names.length === 1 ? `${noun} ${names[0]}` : `${names.length} ${noun}s`;

// `docker <command> <targets>`, the targets quoted; nothing to run when there are no targets.
export const dockerScript = (command: string, targets: readonly string[]) =>
  targets.length > 0 ? `docker ${command} ${targets.map(shellQuote).join(" ")}` : "";

export interface DockerCommand {
  // The shell script to run, "" when there is nothing to do.
  readonly script: string;
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
  consumptions: [runCliCommandInjectionToken, showErrorNotificationInjectionToken, showSuccessNotificationInjectionToken],

  instantiate: (di) => {
    const runCliCommand = di.inject(runCliCommandInjectionToken)();
    const showError = di.inject(showErrorNotificationInjectionToken)();
    const showSuccess = di.inject(showSuccessNotificationInjectionToken)();

    return () =>
      async ({ script, subject, done, verb }: DockerCommand) => {
        if (!script) {
          return;
        }

        try {
          await runCliCommand(script);
          showSuccess(`${done} ${subject}`);
        } catch (error) {
          showError(`Could not ${verb} ${subject}: ${error instanceof Error ? error.message : String(error)}`);
        }
      };
  },
});
