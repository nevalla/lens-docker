import { Div } from "@k8slens/element-components";
import { Disk } from "./disk";
import { Engine } from "./engine";
import { Figures } from "./figures";
import { Problems } from "./problems";
import { TopConsumers } from "./top-consumers";

// Docker at a glance: what is in trouble first, then how much there is and takes, then the engine.
export const Overview = () => (
  <Div $size="full" $overflow="auto">
    <Div $flex={{ direction: "vertical", gap: "xl" }} $padding="l" $style={{ maxWidth: "70rem" }}>
      <Problems />
      <Figures />
      <Disk />
      <TopConsumers />
      <Engine />
    </Div>
  </Div>
);
