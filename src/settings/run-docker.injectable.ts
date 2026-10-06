import { runCliCommandInjectionToken } from "@k8slens/cli-contracts";
import { getInjectable2 } from "@k8slens/injectable";
import { dockerPathPrefix, dockerVariables } from "./docker-environment";
import { type DockerSettings, dockerSettingsInjectable } from "./docker-settings.injectable";

// Runs a script of docker commands against the engine the settings name, with the docker command they
// point to. A script given as a function is built from the settings in force when it runs, as some
// readings depend on them.
export const runDockerInjectable = getInjectable2({
  id: "docker-run",
  consumptions: [runCliCommandInjectionToken],

  instantiate: (di) => {
    const runCliCommand = di.inject(runCliCommandInjectionToken)();
    const settings = di.inject(dockerSettingsInjectable)();

    return () => async (script: string | ((settings: DockerSettings) => string)) => {
      const current = await settings.loaded();
      const env = dockerVariables(current);
      const command = dockerPathPrefix(current) + (typeof script === "string" ? script : script(current));

      return runCliCommand(command, Object.keys(env).length > 0 ? { env } : undefined);
    };
  },
});
