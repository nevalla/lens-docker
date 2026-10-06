import { Button, Div, Span } from "@k8slens/element-components";
import { CheckCircleIcon, ErrorIcon } from "@k8slens/icon";
import { PlainButton, type SelectOption, SingleSelect, TextInput } from "@k8slens/input-components";
import { getExtensionPreferencePageInjectableBunch } from "@k8slens/preferences-contracts";
import { useInject } from "@k8slens/use-inject";
import { observer } from "mobx-react";
import { type ReactNode, Suspense, useState } from "react";
import packageJson from "../../package.json";
import { ErrorBoundary } from "../list/error-boundary";
import { Checkbox } from "../list/checkbox";
import { useLoaded } from "../list/use-loaded";
import { type ConnectionTest, dockerContexts, testDockerConnectionInjectable } from "./docker-connection.injectable";
import { type DockerSettings, dockerSettingsInjectable } from "./docker-settings.injectable";

const Block = ({ title, children }: { title: string; children: ReactNode }) => (
  <Div $flex={{ direction: "vertical", gap: "m" }} $padding={{ bottom: "xl" }}>
    <Div $font={{ size: "l" }} $color="textHighlight">
      {title}
    </Div>
    {children}
  </Div>
);

const Field = ({ label, help, children }: { label: string; help?: ReactNode; children: ReactNode }) => (
  <Div $flex={{ direction: "vertical", gap: "xs" }}>
    <Span $color="textHighlight">{label}</Span>
    {children}
    {help && <Span $color="textMuted">{help}</Span>}
  </Div>
);

// A text setting, saved when the field is left or Enter is pressed: a half-typed engine never takes effect.
const TextSetting = observer(
  ({ setting, placeholder }: { setting: "engine" | "dockerPath"; placeholder: string }) => {
    const settings = useInject(dockerSettingsInjectable)();
    const saved = settings.current()[setting];
    const [draft, setDraft] = useState<string | undefined>(undefined);
    const save = () => {
      if (draft !== undefined && draft !== saved) {
        void settings.update({ [setting]: draft.trim() });
      }

      setDraft(undefined);
    };

    return (
      <TextInput
        value={draft ?? saved}
        placeholder={placeholder}
        spellCheck={false}
        onChange={(event) => setDraft(event.target.value)}
        onBlur={save}
        onKeyDown={(event) => event.key === "Enter" && save()}
        $style={{ maxWidth: "36rem" }}
      />
    );
  },
);

const Toggle = observer(
  ({ setting, label, help }: { setting: keyof DockerSettings & `${string}`; label: string; help: string }) => {
    const settings = useInject(dockerSettingsInjectable)();
    const checked = Boolean(settings.current()[setting]);

    return (
      <Div $flex={{ gap: "s", verticalAlign: "top" }}>
        <Checkbox label={label} checked={checked} onToggle={() => void settings.update({ [setting]: !checked })} />
        <Div $flex={{ direction: "vertical", gap: "xxs" }}>
          <Span $color="textHighlight">{label}</Span>
          <Span $color="textMuted">{help}</Span>
        </Div>
      </Div>
    );
  },
);

const LoadedContexts = observer(({ dockerPath }: { dockerPath: string }) => {
  const settings = useInject(dockerSettingsInjectable)();
  const contexts = useLoaded(dockerContexts.subscribable, dockerPath);
  const engine = settings.current().engine;

  return (
    <Span $color="textMuted">
      Contexts:{" "}
      {contexts.map((context, index) => (
        <Span key={context.Name}>
          {index > 0 && ", "}
          <Button
            $color="link"
            $style={{ textDecoration: "underline", fontWeight: engine === context.Name ? "bold" : undefined }}
            $tooltip={`${context.DockerEndpoint}${context.Current ? " (docker's current context)" : ""}`}
            $onClick={() => void settings.update({ engine: context.Name })}
          >
            {context.Name}
          </Button>
          {context.Current && " (current)"}
        </Span>
      ))}
      {engine && (
        <>
          {" · "}
          <Button $color="link" $style={{ textDecoration: "underline" }} $onClick={() => void settings.update({ engine: "" })}>
            use docker's default
          </Button>
        </>
      )}
    </Span>
  );
});

const TestConnection = () => {
  const testConnection = useInject(testDockerConnectionInjectable)();
  const [result, setResult] = useState<ConnectionTest | "testing" | undefined>(undefined);
  const test = async () => {
    setResult("testing");
    setResult(await testConnection());
  };

  return (
    <Div $flex={{ gap: "m", verticalAlign: "center" }}>
      <PlainButton $disabled={result === "testing"} onClick={() => void test()}>
        Test connection
      </PlainButton>
      {result === "testing" && <Span $color="textMuted">Connecting…</Span>}
      {result && result !== "testing" && (
        <Div $flex={{ gap: "xs", verticalAlign: "center" }} $color={result.ok ? "success" : "critical"}>
          {result.ok ? <CheckCircleIcon $size="m" /> : <ErrorIcon $size="m" />}
          <Span>{result.ok ? `Connected to Docker ${result.version}` : result.error}</Span>
        </Div>
      )}
    </Div>
  );
};

// The contexts under the engine field, read anew, and their failure forgotten, when the path changes.
const Contexts = observer(() => {
  const { dockerPath } = useInject(dockerSettingsInjectable)().current();

  return (
    <ErrorBoundary key={dockerPath} fallback="Contexts could not be listed: is the path to docker right?">
      <Suspense fallback={null}>
        <LoadedContexts dockerPath={dockerPath} />
      </Suspense>
    </ErrorBoundary>
  );
});

const Connection = () => (
  <Block title="Connection">
    <Field label="Docker engine" help={<Contexts />}>
      <TextSetting setting="engine" placeholder="docker's default — or a context, unix:///…/docker.sock, ssh://user@host" />
    </Field>
    <Field label="Path to docker" help="Where the docker command is, when Lens does not find it: the program, or the folder it is in.">
      <TextSetting setting="dockerPath" placeholder="docker, found on the PATH — or /opt/homebrew/bin/docker" />
    </Field>
    <TestConnection />
  </Block>
);

const refreshOptions: readonly SelectOption<string>[] = [
  { id: "2", label: "Every 2 seconds" },
  { id: "5", label: "Every 5 seconds" },
  { id: "10", label: "Every 10 seconds" },
  { id: "30", label: "Every 30 seconds" },
];

const RefreshInterval = observer(() => {
  const settings = useInject(dockerSettingsInjectable)();

  return (
    <SingleSelect
      options={refreshOptions}
      selected={String(settings.current().refreshSeconds)}
      onSelect={(seconds) => void settings.update({ refreshSeconds: Number(seconds) })}
      $width={{ min: "11xl", width: "11xl", max: "11xl" }}
    />
  );
});

const Refreshing = () => (
  <Block title="Refreshing">
    <Field label="Read Docker again" help="Lists, details and the overview, while they are open. Volume sizes and disk usage take three times as long, the engine six.">
      <RefreshInterval />
    </Field>
    <Toggle
      setting="measureUsage"
      label="Measure CPU and memory"
      help="Running containers' use, with its charts. Measuring keeps Docker busy a second or two at each reading."
    />
    <Toggle
      setting="measureVolumeSizes"
      label="Measure volume sizes"
      help="Measuring reads every volume on disk, which takes long with large ones."
    />
  </Block>
);

const CleanUps = () => (
  <Block title="Clean-ups">
    <Toggle
      setting="pruneTaggedImages"
      label="Removing unused images takes tagged ones too"
      help="Off, the overview's clean-up removes only dangling images: untagged ones no container uses."
    />
    <Toggle
      setting="pruneNamedVolumes"
      label="Removing unused volumes takes named ones too"
      help="Off, the overview's clean-up removes only anonymous volumes, keeping named ones, such as a database's, and their data."
    />
  </Block>
);

export const dockerPreferences = getExtensionPreferencePageInjectableBunch({
  packageJson,
  blocks: [
    { id: "connection", orderNumber: 10, Component: Connection },
    { id: "refreshing", orderNumber: 20, Component: Refreshing },
    { id: "clean-ups", orderNumber: 30, Component: CleanUps },
  ],
});
