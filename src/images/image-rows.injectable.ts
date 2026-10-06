import { isNone } from "../docker-values";
import { getPolledDockerBunch, parseJsonLines } from "../list/get-polled-docker-bunch";

export interface DockerImage {
  readonly ID: string;
  readonly Repository: string;
  readonly Tag: string;
  readonly Size: string;
  readonly CreatedAt: string;
  // Names of the containers made from the image.
  readonly usedBy: readonly string[];
}

// What names an image to docker: its repository and tag, or its id while it has none.
export const imageReference = (image: Pick<DockerImage, "ID" | "Repository" | "Tag">) =>
  isNone(image.Repository) || isNone(image.Tag) ? image.ID : `${image.Repository}:${image.Tag}`;

const separator = "---docker-containers---";

// The images, and which container was made from which image, read in one go so a row carries both.
const command = [
  "docker images --format '{{json .}}'",
  `echo '${separator}'`,
  // Containers removed while this runs are left out rather than failing the list; no containers at all
  // leaves docker inspect without arguments, which is the same nothing.
  `(docker inspect --format '{{.Image}} {{.Name}}' $(docker ps -aq) 2>/dev/null; true)`,
].join(" && ");

// Lines of "sha256:<image id> /<container name>", as image ids as short as the list's.
const parseUsedBy = (output: string) => {
  const usedBy = new Map<string, string[]>();

  output
    .split("\n")
    .filter((line) => line.trim())
    .forEach((line) => {
      const [image, name] = line.trim().split(" ");
      const id = image.replace(/^sha256:/, "").slice(0, 12);

      usedBy.set(id, [...(usedBy.get(id) ?? []), name.replace(/^\//, "")]);
    });

  return usedBy;
};

const parse = (output: string): DockerImage[] => {
  const [imagesOutput, containersOutput = ""] = output.split(separator);
  const usedBy = parseUsedBy(containersOutput);

  return parseJsonLines<Omit<DockerImage, "usedBy">>(imagesOutput).map((image) => ({
    ...image,
    usedBy: usedBy.get(image.ID) ?? [],
  }));
};

export const dockerImageRows = getPolledDockerBunch<readonly DockerImage[]>("docker-image-rows", () => command, parse);
