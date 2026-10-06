// Docker prints times as "2024-05-01 12:34:56 +0300 EEST".
export const parseDockerTime = (value: string): number => {
  const [date, time, offset = "+0000"] = value.split(" ");

  return Date.parse(`${date}T${time}${offset.slice(0, 3)}:${offset.slice(3, 5)}`);
};

// The way Lens shows ages: "45s", "13m", "5h21m", "3d".
export const formatAge = (since: number, now = Date.now()): string => {
  const seconds = Math.max(0, Math.floor((now - since) / 1000));
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d`;
  if (hours > 0) return `${hours}h${minutes % 60}m`;
  if (minutes > 0) return `${minutes}m`;

  return `${seconds}s`;
};

const sizeUnits: Record<string, number> = {
  B: 1,
  KB: 1e3,
  MB: 1e6,
  GB: 1e9,
  TB: 1e12,
  KIB: 2 ** 10,
  MIB: 2 ** 20,
  GIB: 2 ** 30,
  TIB: 2 ** 40,
};

// Docker prints sizes as "1.2GB", "512MB" or "12.3kB", and memory as "33.51MiB".
export const parseSize = (value: string): number => {
  const match = /^([\d.]+)\s*([kKMGT]?i?B)$/.exec(value.trim());

  return match ? Number(match[1]) * (sizeUnits[match[2].toUpperCase()] ?? 1) : 0;
};

// Containers of an untagged image name it by digest; show it short, the way docker does.
export const imageName = (image: string) => (image.startsWith("sha256:") ? image.slice(7, 19) : image);

// The way Lens's details show a duration, to two units: "45s", "77m 8s", "5h 21m", "247d 3h".
export const formatDuration = (ms: number): string => {
  const seconds = Math.max(0, Math.floor(ms / 1000));
  const units: [string, number][] = [
    ["d", Math.floor(seconds / 86400)],
    ["h", Math.floor(seconds / 3600) % 24],
    ["m", Math.floor(seconds / 60) % 60],
    ["s", seconds % 60],
  ];
  const first = units.findIndex(([, value]) => value > 0);

  if (first === -1) {
    return "0s";
  }

  return units
    .slice(first, first + 2)
    .filter(([, value]) => value > 0)
    .map(([unit, value]) => `${value}${unit}`)
    .join(" ");
};

const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const twoDigits = (value: number) => String(value).padStart(2, "0");

const timeZoneName = (time: number) =>
  new Intl.DateTimeFormat("en-GB", { timeZoneName: "short" })
    .formatToParts(time)
    .find((part) => part.type === "timeZoneName")?.value ?? "";

// "05 Oct 2026, 13:07:45 EEST": three-letter months always, where en-GB writes "Sept".
const formatDateTime = (time: number) => {
  const date = new Date(time);
  const day = `${twoDigits(date.getDate())} ${months[date.getMonth()]} ${date.getFullYear()}`;
  const clock = [date.getHours(), date.getMinutes(), date.getSeconds()].map(twoDigits).join(":");

  return `${day}, ${clock} ${timeZoneName(time)}`;
};

// The way Lens's details show a moment: "77m 8s ago (05 Oct 2026, 13:07:45 EEST)".
export const formatMoment = (time: number, now = Date.now()) =>
  `${formatDuration(now - time)} ago (${formatDateTime(time)})`;

// The way docker shows sizes: "3.88GB", "471MB", "12.3kB".
export const formatSize = (bytes: number): string => {
  const units = ["B", "kB", "MB", "GB", "TB"];
  const exponent = Math.min(units.length - 1, Math.max(0, Math.floor(Math.log10(Math.max(bytes, 1)) / 3)));

  return `${parseFloat((bytes / 1000 ** exponent).toPrecision(3))}${units[exponent]}`;
};

// Docker marks what an image or a container lacks, a tag or a repository, as "<none>".
export const isNone = (value: string) => value === "<none>";

// The way Lens shows memory: "227.0MiB", "1.5GiB".
export const formatMemory = (bytes: number): string => {
  const units = ["B", "KiB", "MiB", "GiB", "TiB"];
  const exponent = Math.min(units.length - 1, Math.max(0, Math.floor(Math.log2(Math.max(bytes, 1)) / 10)));

  return `${(bytes / 1024 ** exponent).toFixed(exponent === 0 ? 0 : 1)}${units[exponent]}`;
};
