import { getSubscribableInjectableBunch } from "@k8slens/subscribable";
import { reaction } from "mobx";
import { parseSize } from "../docker-values";
import { type DockerContainer, dockerContainerRows } from "./container-rows.injectable";

// What one container used at one reading: CPU in percent of a core, memory in bytes.
export interface UsageSample {
  readonly cpu: number;
  readonly memory: number;
}

// One reading of every running container, as taken together.
export interface UsageReading {
  readonly time: number;
  readonly byContainer: ReadonlyMap<string, UsageSample>;
}

// Five minutes of readings, at one every five seconds.
const kept = 60;

const readingOf = (containers: readonly DockerContainer[]): UsageReading => ({
  time: Date.now(),
  byContainer: new Map(
    containers.flatMap(({ ID, usage }) =>
      usage ? [[ID, { cpu: parseFloat(usage.CPUPerc), memory: parseSize(usage.MemUsage.split(" / ")[0]) }]] : [],
    ),
  ),
});

// The containers' recent usage, newest last: recorded from each reading of the containers while
// anything shows it, and kept a minute past that, so a chart opened again picks up where it was.
export const usageHistory = getSubscribableInjectableBunch<readonly UsageReading[]>()({
  id: "docker-usage-history",
  gracePeriodMs: 60_000,

  source: {
    instantiate: (di) => {
      const containers = di.inject(dockerContainerRows.subscribable)();

      return () => () => ({
        start: ({ push, fail }) => {
          const subscription = containers.subscribe();
          let history: readonly UsageReading[] = [];
          let stopRecording = () => {};

          subscription.claim();
          subscription.value.then((rows) => {
            stopRecording = reaction(
              () => rows.get(),
              (current) => {
                history = [...history, readingOf(current)].slice(-kept);
                push(history);
              },
              { fireImmediately: true },
            );
          }, fail);

          return () => {
            stopRecording();
            subscription.dispose();
          };
        },
      });
    },
  },
});

export interface UsagePoint {
  readonly time: number;
  readonly value: number;
}

// One measure of some containers over the history, summed where there are several, as an app's.
export const usageSeries = (
  history: readonly UsageReading[],
  containerIds: readonly string[],
  measure: keyof UsageSample,
): UsagePoint[] =>
  history
    .filter(({ byContainer }) => containerIds.some((id) => byContainer.has(id)))
    .map(({ time, byContainer }) => ({
      time,
      value: containerIds.reduce((total, id) => total + (byContainer.get(id)?.[measure] ?? 0), 0),
    }));

// One measure of every container together over the history.
export const totalSeries = (history: readonly UsageReading[], measure: keyof UsageSample): UsagePoint[] =>
  history.map(({ time, byContainer }) => ({
    time,
    value: [...byContainer.values()].reduce((total, sample) => total + sample[measure], 0),
  }));
