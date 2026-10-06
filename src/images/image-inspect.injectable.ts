import { shellQuote } from "../actions/run-docker-command.injectable";
import { getPolledDockerBunch } from "../list/get-polled-docker-bunch";

// The parts of `docker image inspect` the details show.
export interface ImageInspect {
  readonly Id: string;
  readonly RepoTags: readonly string[] | null;
  readonly RepoDigests: readonly string[] | null;
  readonly Created: string;
  readonly Size: number;
  readonly Architecture: string;
  readonly Os: string;
  readonly Config: {
    readonly Cmd: readonly string[] | null;
    readonly Entrypoint: readonly string[] | null;
    readonly Env: readonly string[] | null;
    readonly ExposedPorts: Record<string, unknown> | null;
    readonly Labels: Record<string, string> | null;
    readonly WorkingDir: string;
    readonly User: string;
  } | null;
  readonly RootFS: { readonly Layers: readonly string[] | null };
}

export const imageInspect = getPolledDockerBunch<ImageInspect, [reference: string]>(
  "docker-image-inspect",
  (_settings, reference) => `docker image inspect --format '{{json .}}' ${shellQuote(reference)}`,
  (output) => JSON.parse(output) as ImageInspect,
);
