import { Button, Span } from "@k8slens/element-components";
import { WorkloadsIcon } from "@k8slens/icon";
import { getInjectable2 } from "@k8slens/injectable";
import { statusBarItemInjectionToken } from "@k8slens/status-bar-contracts";
import { useSubscribable } from "@k8slens/subscribable-react";
import { useInject } from "@k8slens/use-inject";
import { observer } from "mobx-react";
import { Suspense, use } from "react";
import { getPolledDockerBunch } from "../list/get-polled-docker-bunch";
import { openDockerTabInjectable } from "../open-docker-tab.injectable";

// How many containers are running, or undefined while docker cannot be reached.
export const runningContainersCount = getPolledDockerBunch<number | undefined>(
  "docker-running-containers-count",
  () => "docker ps --quiet --filter status=running",
  (output) => output.split("\n").filter((line) => line.trim()).length,
  () => undefined,
);

const RunningContainers = observer(() => {
  const count = use(useSubscribable(useInject(runningContainersCount.subscribable)()).value).get();
  const openDockerTab = useInject(openDockerTabInjectable)();

  return (
    <Button
      $flex={{ gap: "xs", verticalAlign: "center" }}
      $interactive
      $tooltip={count === undefined ? "Docker cannot be reached" : "Show the Docker overview"}
      $onClick={() => void openDockerTab("overview")}
    >
      <WorkloadsIcon $size="s" />
      {count === undefined ? (
        <Span $color="textMuted">Docker unavailable</Span>
      ) : (
        <Span>
          {count} {count === 1 ? "container" : "containers"} running
        </Span>
      )}
    </Button>
  );
});

const RunningContainersStatus = () => (
  <Suspense fallback={null}>
    <RunningContainers />
  </Suspense>
);

export const runningContainersStatusItem = getInjectable2({
  id: "docker-running-containers-status",
  instantiate: () => () => ({
    Component: RunningContainersStatus,
    position: "right" as const,
    orderNumber: 90,
  }),
  injectionToken: statusBarItemInjectionToken,
});
