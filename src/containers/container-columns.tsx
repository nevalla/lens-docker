import { formatAge, imageName, parseDockerTime, parseSize } from "../docker-values";
import type { DockerListColumn } from "../list/docker-list-column";
import type { DockerContainer } from "./container-rows.injectable";
import { ValueWithTrend } from "../charts/usage-metrics";
import { ContainerState } from "./container-state";
import { PortsCell } from "./ports-cell";

// "33.51MiB / 7.746GiB": what is used, of what the container may use.
const memoryUsed = (container: DockerContainer) => container.usage?.MemUsage.split(" / ")[0];

const exitCode = (container: DockerContainer) => Number(/^Exited \((\d+)\)/.exec(container.Status)?.[1] ?? 0);

const running = (container: DockerContainer) => (container.usage ? [container.ID] : []);

const CpuCell = ({ row }: { row: DockerContainer }) => (
  <ValueWithTrend value={row.usage?.CPUPerc ?? "N/A"} containerIds={running(row)} measure="cpu" />
);

const MemoryCell = ({ row }: { row: DockerContainer }) => (
  <ValueWithTrend value={memoryUsed(row) ?? "N/A"} containerIds={running(row)} measure="memory" />
);

const ContainerStateCell = ({ row }: { row: DockerContainer }) => (
  <ContainerState state={row.State} exitCode={exitCode(row)} />
);

type Column = DockerListColumn<DockerContainer>;

// What a table of containers can show of each, the containers list and an app's services alike.
export const containerColumns = {
  name: { id: "name", header: "Name", value: (row) => row.Names },
  app: { id: "app", header: "App", value: (row) => row.compose?.project ?? "" },
  service: { id: "service", header: "Service", value: (row) => row.compose?.service ?? "" },
  image: { id: "image", header: "Image", value: (row) => imageName(row.Image) },
  cpu: {
    id: "cpu",
    header: "CPU",
    value: (row) => row.usage?.CPUPerc ?? "N/A",
    sortValue: (row) => (row.usage ? parseFloat(row.usage.CPUPerc) : -1),
    Cell: CpuCell,
  },
  memory: {
    id: "memory",
    header: "Memory",
    value: (row) => memoryUsed(row) ?? "N/A",
    sortValue: (row) => parseSize(memoryUsed(row) ?? ""),
    Cell: MemoryCell,
  },
  ports: { id: "ports", header: "Ports", value: (row) => row.Ports, Cell: PortsCell },
  state: { id: "state", header: "State", value: (row) => row.State, Cell: ContainerStateCell },
  status: { id: "status", header: "Status", value: (row) => row.Status },
  age: {
    id: "age",
    header: "Age",
    value: (row) => formatAge(parseDockerTime(row.CreatedAt)),
    sortValue: (row) => -parseDockerTime(row.CreatedAt),
  },
} satisfies Record<string, Column>;
