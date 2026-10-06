import { Button, Div, Span } from "@k8slens/element-components";
import { CheckCircleIcon, PlayArrowIcon, ReplayIcon, SubjectIcon } from "@k8slens/icon";
import { useInject } from "@k8slens/use-inject";
import { observer } from "mobx-react";
import { containerActions } from "../containers/container-actions";
import { type DockerContainer, dockerContainerRows } from "../containers/container-rows.injectable";
import { ContainerState } from "../containers/container-state";
import { openContainerTerminalsInjectable } from "../containers/container-terminals.injectable";
import { openContainerDetailsInjectable } from "../containers/open-container-details.injectable";
import { runContainerActionInjectable } from "../containers/run-container-action.injectable";
import { IconAction } from "../list/icon-action";
import { useLoaded } from "../list/use-loaded";
import { OverviewSection, WhenRead } from "./section";

const exitCode = (container: DockerContainer) => Number(/^Exited \((\d+)\)/.exec(container.Status)?.[1] ?? 0);

// What a container is in trouble with, if anything: the way Lens lists a cluster's issues.
const problemOf = (container: DockerContainer): string | undefined => {
  if (container.Status.includes("(unhealthy)")) return "Unhealthy";
  if (container.State === "restarting") return "Restarting";
  if (container.State === "dead") return "Dead";
  if (container.State === "exited" && exitCode(container) !== 0) return `Exited with code ${exitCode(container)}`;

  return undefined;
};

const shown = 5;

const ProblemRow = ({ container, problem }: { container: DockerContainer; problem: string }) => {
  const openContainerDetails = useInject(openContainerDetailsInjectable)();
  const terminals = useInject(openContainerTerminalsInjectable)();
  const runContainerAction = useInject(runContainerActionInjectable)();
  const restartOrStart = containerActions.find(({ id }) => id === (container.State === "running" ? "restart" : "start"))!;

  return (
    <Div
      $flex={{ gap: "m", verticalAlign: "center" }}
      $padding={{ horizontal: "s", vertical: "xs" }}
      $border={{ bottom: { width: "xxs", color: "grey60" }, exceptLast: true }}
    >
      <Div $style={{ width: "6rem" }} $flexChild="fixed">
        <ContainerState state={container.State} exitCode={exitCode(container)} />
      </Div>
      <Button
        $color="link"
        $style={{ textDecoration: "underline" }}
        $onClick={() => void openContainerDetails(container.ID)}
      >
        {container.Names}
      </Button>
      <Span $color="textMuted" $flexChild>
        {problem} · {container.Status}
      </Span>
      <IconAction label="Logs" Icon={SubjectIcon} onClick={() => void terminals.logs(container)} />
      <IconAction
        label={restartOrStart.label}
        Icon={restartOrStart.id === "start" ? PlayArrowIcon : ReplayIcon}
        onClick={() => void runContainerAction(restartOrStart, [container])}
      />
    </Div>
  );
};

const LoadedProblems = observer(() => {
  const problems = useLoaded(dockerContainerRows.subscribable).flatMap((container) => {
    const problem = problemOf(container);

    return problem ? [{ container, problem }] : [];
  });

  if (problems.length === 0) {
    return (
      <Div $flex={{ gap: "xs", verticalAlign: "center" }} $color="success">
        <CheckCircleIcon $size="m" />
        <Span>No container is failing, restarting or unhealthy.</Span>
      </Div>
    );
  }

  return (
    <Div $border={{ radius: "m", width: "xxs", color: "grey60" }} $backgroundColor="backgroundSecondary">
      {problems.slice(0, shown).map(({ container, problem }) => (
        <ProblemRow key={container.ID} container={container} problem={problem} />
      ))}
      {problems.length > shown && (
        <Div $padding={{ horizontal: "s", vertical: "xs" }} $color="textMuted">
          And {problems.length - shown} more, in the containers list.
        </Div>
      )}
    </Div>
  );
});

// Containers in trouble, first, with the way in to each: the reason to open the overview at all.
export const Problems = () => (
  <OverviewSection title="Problems">
    <WhenRead what="the containers">
      <LoadedProblems />
    </WhenRead>
  </OverviewSection>
);
