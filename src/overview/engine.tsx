import { DrawerItem } from "@k8slens/details-panel-components";
import { Div } from "@k8slens/element-components";
import { observer } from "mobx-react";
import { formatMemory } from "../docker-values";
import { useLoaded } from "../list/use-loaded";
import { dockerInfo } from "./docker-info.injectable";
import { OverviewSection, WhenRead } from "./section";

const LoadedEngine = observer(() => {
  const info = useLoaded(dockerInfo.subscribable);

  return (
    <Div $border={{ radius: "m", width: "xxs", color: "grey60" }} $backgroundColor="backgroundSecondary">
      <DrawerItem name="Name">{info.Name}</DrawerItem>
      <DrawerItem name="Docker">{info.ServerVersion}</DrawerItem>
      <DrawerItem name="Docker Compose">{info.composeVersion ?? "Not installed"}</DrawerItem>
      <DrawerItem name="Operating system">{info.OperatingSystem}</DrawerItem>
      <DrawerItem name="Kernel">{info.KernelVersion}</DrawerItem>
      <DrawerItem name="Architecture">{info.Architecture}</DrawerItem>
      <DrawerItem name="CPUs">{info.NCPU}</DrawerItem>
      <DrawerItem name="Memory">{formatMemory(info.MemTotal)}</DrawerItem>
      <DrawerItem name="Storage driver">{info.Driver}</DrawerItem>
    </Div>
  );
});

// What runs the containers: the engine, and the machine or VM it runs on.
export const Engine = () => (
  <OverviewSection title="Engine">
    <WhenRead what="the engine">
      <LoadedEngine />
    </WhenRead>
  </OverviewSection>
);
