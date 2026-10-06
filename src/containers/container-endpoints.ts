import type { DockerContainer } from "./container-rows.injectable";

// A port of a container, as `docker ps` lists it: "0.0.0.0:8088->80/tcp", or "5432/tcp" when not published.
export interface ContainerPort {
  readonly containerPort: number;
  readonly protocol: string;
  // Where it is published on this machine, when it is.
  readonly host?: { readonly address: string; readonly port: number };
}

// A published range ("0.0.0.0:8000-8001->8000-8001/tcp") does not match, and is shown but not linked.
const portPattern = /^(?:(.*):(\d+)->)?(\d+)(?:-\d+)?\/(\w+)$/;

// Each port once, though docker lists a published one for IPv4 and IPv6 alike.
export const parsePorts = (ports: string): ContainerPort[] => {
  const parsed = ports
    .split(", ")
    .map((port) => portPattern.exec(port.trim()))
    .filter((match) => match !== null)
    .map(([, address, hostPort, containerPort, protocol]) => ({
      containerPort: Number(containerPort),
      protocol,
      ...(hostPort && { host: { address, port: Number(hostPort) } }),
    }));

  return parsed.filter(
    (port, index) =>
      parsed.findIndex(
        (other) =>
          other.containerPort === port.containerPort && other.protocol === port.protocol && other.host?.port === port.host?.port,
      ) === index,
  );
};

// A way into what a container serves: a page to open, or a client to talk to it in.
export type Endpoint =
  | { readonly kind: "web"; readonly label: string; readonly url: string }
  | { readonly kind: "console"; readonly label: string; readonly console: ConsoleId };

export type ConsoleId = "postgres" | "mysql" | "redis" | "mongo";

interface ConsoleType {
  readonly id: ConsoleId;
  readonly label: string;
  readonly port: number;
  readonly images: RegExp;
  // Run in the container's own shell, so the client and the credentials are the container's own.
  readonly script: string;
}

export const consoleTypes: readonly ConsoleType[] = [
  {
    id: "postgres",
    label: "Postgres console",
    port: 5432,
    images: /postgres|postgis|timescale/,
    script: 'exec psql -U "${POSTGRES_USER:-postgres}" -d "${POSTGRES_DB:-${POSTGRES_USER:-postgres}}"',
  },
  {
    id: "mysql",
    label: "MySQL console",
    port: 3306,
    images: /mysql|mariadb|percona/,
    script:
      'MYSQL_PWD="${MYSQL_ROOT_PASSWORD:-$MARIADB_ROOT_PASSWORD}" exec "$(command -v mysql || command -v mariadb)" -uroot',
  },
  {
    id: "redis",
    label: "Redis console",
    port: 6379,
    images: /redis|valkey|keydb/,
    script: 'exec "$(command -v redis-cli || command -v valkey-cli || command -v keydb-cli)" ${REDIS_PASSWORD:+-a "$REDIS_PASSWORD"}',
  },
  {
    id: "mongo",
    label: "MongoDB console",
    port: 27017,
    // Not mongo-express, a web UI for it.
    images: /(^|\/)mongo(:|$)|mongodb/,
    script:
      'exec "$(command -v mongosh || command -v mongo)" ${MONGO_INITDB_ROOT_USERNAME:+-u "$MONGO_INITDB_ROOT_USERNAME" -p "$MONGO_INITDB_ROOT_PASSWORD" --authenticationDatabase admin}',
  },
];

const httpPorts = new Set([80, 3000, 3001, 4200, 5000, 5173, 8000, 8008, 8080, 8081, 8888, 9000, 9090]);
const httpsPorts = new Set([443, 8443]);
const webServerImages = /nginx|httpd|apache|caddy|traefik|grafana|jenkins|wordpress|nextcloud/;

const imageOf = (container: Pick<DockerContainer, "Image">) => container.Image.toLowerCase().split("@")[0];

// An address published on every interface is reached on this machine as localhost.
const hostName = (address: string) => (["", "0.0.0.0", "::", "[::]"].includes(address) ? "localhost" : address);

// What a page of a published port is reached at, if it serves pages.
export const webUrl = (port: ContainerPort, container: Pick<DockerContainer, "Image">): string | undefined => {
  if (!port.host || port.protocol !== "tcp") {
    return undefined;
  }

  const isHttps = httpsPorts.has(port.containerPort);

  if (!isHttps && !httpPorts.has(port.containerPort) && !webServerImages.test(imageOf(container))) {
    return undefined;
  }

  return `${isHttps ? "https" : "http"}://${hostName(port.host.address)}:${port.host.port}`;
};

// The ways into a running container: its web pages, and a console for the database or cache it is.
export const detectEndpoints = (container: Pick<DockerContainer, "Image" | "Ports" | "State">): Endpoint[] => {
  if (container.State !== "running") {
    return [];
  }

  const ports = parsePorts(container.Ports);
  const image = imageOf(container);

  const web = ports.flatMap((port) => {
    const url = webUrl(port, container);

    return url ? [{ kind: "web" as const, label: `Open ${url.replace(/^https?:\/\//, "")}`, url }] : [];
  });

  const consoles = consoleTypes
    .filter((type) => type.images.test(image) || ports.some((port) => port.containerPort === type.port))
    .map((type) => ({ kind: "console" as const, label: type.label, console: type.id }));

  return [...web, ...consoles];
};
