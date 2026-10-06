import { getInjectable2 } from "@k8slens/injectable";
import { getPersistableValueInjectableBunch } from "@k8slens/persistable-contracts";
import { type IObservableValue, observable, runInAction } from "mobx";

export interface DockerSettings {
  // Which Docker engine to talk to: a context's name, a host such as unix:///… or ssh://user@host, or
  // "" for whatever docker itself defaults to.
  readonly engine: string;
  // Where the docker command is, when Lens does not find it: the program or the folder it is in.
  readonly dockerPath: string;
  // How often lists are read again; slower readings are a multiple of it.
  readonly refreshSeconds: number;
  readonly measureUsage: boolean;
  readonly measureVolumeSizes: boolean;
  // Whether cleaning up unused volumes also takes named ones, with their data.
  readonly pruneNamedVolumes: boolean;
  // Whether cleaning up unused images also takes tagged ones, rather than dangling ones only.
  readonly pruneTaggedImages: boolean;
}

export const defaultDockerSettings: DockerSettings = {
  engine: "",
  dockerPath: "",
  refreshSeconds: 5,
  measureUsage: true,
  measureVolumeSizes: true,
  pruneNamedVolumes: true,
  pruneTaggedImages: true,
};

export const dockerSettingsBunch = getPersistableValueInjectableBunch<Partial<DockerSettings>>()({
  id: "docker-settings",
  defaultValue: { instantiate: () => async () => ({}) },
});

// Settings saved by an older version lack what was added since; those take their defaults.
const complete = (saved: Partial<DockerSettings> | undefined): DockerSettings => ({ ...defaultDockerSettings, ...saved });

// The settings, as they are now: the defaults until what was saved has been read.
export const dockerSettingsInjectable = getInjectable2({
  id: "docker-settings-state",

  instantiate: (di) => {
    const saved = observable.box<IObservableValue<Partial<DockerSettings>> | undefined>(undefined, { deep: false });
    const loading = di
      .inject(dockerSettingsBunch.persistable)()
      .then((box) => {
        runInAction(() => saved.set(box));

        return box;
      });

    return () => ({
      // Observable: what reads it re-renders, or re-reads, when a setting changes.
      current: () => complete(saved.get()?.get()),
      // What was saved, once read: what anything that acts on Docker waits for, so that it never acts
      // on the wrong engine for the moment it takes.
      loaded: async () => complete((await loading).get()),
      update: async (change: Partial<DockerSettings>) => {
        const box = await loading;

        runInAction(() => box.set({ ...box.get(), ...change }));
      },
    });
  },
});
