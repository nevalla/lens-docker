import { Button, Span } from "@k8slens/element-components";
import { getInjectable2 } from "@k8slens/injectable";
import { navigateToPreferencesInjectionToken } from "@k8slens/preferences-contracts";
import { useInject } from "@k8slens/use-inject";
import packageJson from "../../package.json";

// Takes the user to the extension's page of the preferences.
export const openDockerPreferencesInjectable = getInjectable2({
  id: "docker-open-preferences",
  consumptions: [navigateToPreferencesInjectionToken],

  instantiate: (di) => {
    const navigateToPreferences = di.inject(navigateToPreferencesInjectionToken)();

    return () => () => navigateToPreferences({ pageId: packageJson.name });
  },
});

// Says what is not shown because the settings turned it off, and leads to where it is turned on.
export const TurnedOff = ({ what }: { what: string }) => {
  const openDockerPreferences = useInject(openDockerPreferencesInjectable)();

  return (
    <Span $color="textMuted">
      {what} is turned off in the{" "}
      <Button $color="link" $style={{ textDecoration: "underline" }} $onClick={() => void openDockerPreferences()}>
        preferences
      </Button>
      .
    </Span>
  );
};
