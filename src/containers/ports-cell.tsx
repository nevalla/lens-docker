import { Button, Span } from "@k8slens/element-components";
import { useInject } from "@k8slens/use-inject";
import { Fragment } from "react";
import { parsePorts, webUrl } from "./container-endpoints";
import type { DockerContainer } from "./container-rows.injectable";
import { connectToContainerInjectable } from "./connect-to-container.injectable";

// A port as short as it reads: "8088→80", or "5432" when not published.
const describePort = ({ containerPort, host }: ReturnType<typeof parsePorts>[number]) =>
  host ? `${host.port}→${containerPort}` : `${containerPort}`;

// A container's ports, those serving pages as links that open them, the way Lens links a port forward.
export const PortsCell = ({ row }: { row: DockerContainer }) => {
  const connectToContainer = useInject(connectToContainerInjectable)();
  const ports = parsePorts(row.Ports);

  return (
    <span>
      {ports.map((port, index) => {
        const url = row.State === "running" ? webUrl(port, row) : undefined;

        return (
          <Fragment key={`${port.containerPort}/${port.protocol}:${port.host?.port}`}>
            {index > 0 && ", "}
            {url ? (
              <Button
                $color="link"
                $style={{ textDecoration: "underline" }}
                $tooltip={`Open ${url}`}
                $onClick={() => void connectToContainer(row, { kind: "web", label: url, url })}
              >
                {describePort(port)}
              </Button>
            ) : (
              <Span>{describePort(port)}</Span>
            )}
          </Fragment>
        );
      })}
    </span>
  );
};
