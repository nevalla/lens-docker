import { getInjectable2, getInjectableBunch } from "@k8slens/injectable";
import { getSubscribableInjectableBunch } from "@k8slens/subscribable";
import { reaction } from "mobx";
import type { DockerSettings } from "../settings/docker-settings.injectable";
import { dockerSettingsInjectable } from "../settings/docker-settings.injectable";
import { runDockerInjectable } from "../settings/run-docker.injectable";

// `--format '{{json .}}'` prints one JSON object per line.
export const parseJsonLines = <Row>(output: string): Row[] =>
  output
    .split("\n")
    .filter((line) => line.trim())
    .map((line) => JSON.parse(line) as Row);

interface PolledOptions<T> {
  // Given, a failed read becomes this value instead of failing what shows it, so it recovers on its own.
  readonly whenFailed?: (error: unknown) => T;
  // How many refresh intervals of the settings pass between readings: more for what is costly to read.
  readonly slowness?: number;
}

// What a docker command prints, polled while something shows it, and read again on `refresh`. The
// command is built from the settings in force at each reading, and so is the wait before the next; a
// changed setting reads again at once.
export const getPolledDockerBunch = <T, TKeys extends string[] = []>(
  id: string,
  command: (settings: DockerSettings, ...keys: TKeys) => string,
  parse: (output: string) => T,
  { whenFailed, slowness = 1 }: PolledOptions<T> = {},
) => {
  const pollers = getInjectable2({
    id: `${id}-pollers`,
    instantiate: () => () => new Set<() => void>(),
  });

  const refresh = getInjectable2({
    id: `${id}-refresh`,
    instantiate: (di) => {
      const activePollers = di.inject(pollers)();

      return () => () => activePollers.forEach((poll) => poll());
    },
  });

  const polled = getSubscribableInjectableBunch<T, TKeys>()({
    id,
    source: {
      instantiate: (di) => {
        const runDocker = di.inject(runDockerInjectable)();
        const settings = di.inject(dockerSettingsInjectable)();
        const activePollers = di.inject(pollers)();

        return () =>
          (...keys) => ({
            start: ({ push, fail }) => {
              // A refresh can start while a slower poll is under way; only the latest one's answer counts.
              let latest = 0;
              let next: ReturnType<typeof setTimeout> | undefined;
              let stopped = false;

              const poll = () => {
                const current = ++latest;

                clearTimeout(next);
                void runDocker((now) => command(now, ...keys))
                  .then(parse)
                  .then(
                    (value) => current === latest && push(value),
                    (error) => current === latest && (whenFailed ? push(whenFailed(error)) : fail(error)),
                  )
                  .finally(() => {
                    if (current === latest && !stopped) {
                      next = setTimeout(poll, settings.current().refreshSeconds * 1000 * slowness);
                    }
                  });
              };

              poll();
              activePollers.add(poll);
              // A changed setting can change the engine, the command or the interval: read again at once.
              const stopFollowingSettings = reaction(() => settings.current(), poll);

              return () => {
                stopped = true;
                stopFollowingSettings();
                clearTimeout(next);
                activePollers.delete(poll);
              };
            },
          });
      },
    },
  });

  return getInjectableBunch({ ...polled, pollers, refresh });
};
