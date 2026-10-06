import { runCliCommandInjectionToken } from "@k8slens/cli-contracts";
import { getInjectable2 } from "@k8slens/injectable";
import { getSubscribableInjectableBunch } from "@k8slens/subscribable";
import { parseJsonLines } from "../list/get-polled-docker-bunch";
import { dockerPathPrefix } from "./docker-environment";
import { defaultDockerSettings } from "./docker-settings.injectable";
import { runDockerInjectable } from "./run-docker.injectable";

// What talking to the engine came to: its version, or why it failed.
export type ConnectionTest = { readonly ok: true; readonly version: string } | { readonly ok: false; readonly error: string };

// Tries the settings: the engine's version, asked the way every reading asks.
export const testDockerConnectionInjectable = getInjectable2({
  id: "docker-test-connection",

  instantiate: (di) => {
    const runDocker = di.inject(runDockerInjectable)();

    return () => async (): Promise<ConnectionTest> => {
      try {
        return { ok: true, version: (await runDocker("docker version --format '{{.Server.Version}}'")).trim() };
      } catch (error) {
        return { ok: false, error: error instanceof Error ? error.message : String(error) };
      }
    };
  },
});

// A context docker knows: what the engine field can be set to with a click.
export interface DockerContext {
  readonly Name: string;
  readonly DockerEndpoint: string;
  readonly Current: boolean;
}

// The contexts, read with a docker path but no engine: a context the settings name that does not exist
// would otherwise fail the very list that would put it right. One reading per path, so that putting a
// wrong path right reads them anew.
export const dockerContexts = getSubscribableInjectableBunch<readonly DockerContext[], [dockerPath: string]>()({
  id: "docker-contexts",

  load: {
    consumptions: [runCliCommandInjectionToken],
    instantiate: (di) => {
      const runCliCommand = di.inject(runCliCommandInjectionToken)();

      return () => async (dockerPath) =>
        parseJsonLines<DockerContext>(
          await runCliCommand(
            `${dockerPathPrefix({ ...defaultDockerSettings, dockerPath })}docker context ls --format '{{json .}}'`,
          ),
        );
    },
  },
});
