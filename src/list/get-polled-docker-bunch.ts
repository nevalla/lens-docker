import { runCliCommandInjectionToken } from "@k8slens/cli-contracts";
import { getInjectable2, getInjectableBunch } from "@k8slens/injectable";
import { getSubscribableInjectableBunch } from "@k8slens/subscribable";

const defaultPollIntervalMs = 5000;

// `--format '{{json .}}'` prints one JSON object per line.
export const parseJsonLines = <Row>(output: string): Row[] =>
  output
    .split("\n")
    .filter((line) => line.trim())
    .map((line) => JSON.parse(line) as Row);

// What a docker command prints, polled while something shows it, and read again on `refresh`.
export const getPolledDockerBunch = <T, TKeys extends string[] = []>(
  id: string,
  command: (...keys: TKeys) => string,
  parse: (output: string) => T,
  // Given, a failed read becomes this value instead of failing what shows it, so it recovers on its own.
  whenFailed?: (error: unknown) => T,
  // How often to read again while something shows it: longer for what is costly to read.
  pollIntervalMs = defaultPollIntervalMs,
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
      consumptions: [runCliCommandInjectionToken],
      instantiate: (di) => {
        const runCliCommand = di.inject(runCliCommandInjectionToken)();
        const activePollers = di.inject(pollers)();

        return () =>
          (...keys) => ({
            start: ({ push, fail }) => {
              // A refresh can start while a slower poll is under way; only the latest one's answer counts.
              let latest = 0;

              const poll = () => {
                const current = ++latest;

                void Promise.resolve()
                  .then(() => runCliCommand(command(...keys)))
                  .then(parse)
                  .then(
                    (value) => current === latest && push(value),
                    (error) => current === latest && (whenFailed ? push(whenFailed(error)) : fail(error)),
                  );
              };

              poll();
              activePollers.add(poll);
              const interval = setInterval(poll, pollIntervalMs);

              return () => {
                clearInterval(interval);
                activePollers.delete(poll);
              };
            },
          });
      },
    },
  });

  return getInjectableBunch({ ...polled, pollers, refresh });
};
