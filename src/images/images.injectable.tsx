import { Span } from "@k8slens/element-components";
import { formatAge, isNone, parseDockerTime, parseSize } from "../docker-values";
import { getDockerList } from "../list/get-docker-list";
import { ImageDetails } from "./image-details";
import { type DockerImage, dockerImageRows, imageReference } from "./image-rows.injectable";
import { RemoveDanglingImages } from "./remove-dangling-images.injectable";
import { imageRemoval } from "./remove-images.injectable";

// "<none>" muted, the way Lens shows what is not there.
const OrNone = ({ value }: { value: string }) =>
  isNone(value) ? <Span $color="textMuted">none</Span> : <span>{value}</span>;

const RepositoryCell = ({ row }: { row: DockerImage }) => <OrNone value={row.Repository} />;
const TagCell = ({ row }: { row: DockerImage }) => <OrNone value={row.Tag} />;

export const dockerImages = getDockerList<DockerImage>({
  id: "images",
  title: "Images",
  rows: dockerImageRows,
  getRowId: imageReference,
  columns: [
    { id: "repository", header: "Repository", value: (row) => row.Repository, Cell: RepositoryCell },
    { id: "tag", header: "Tag", value: (row) => row.Tag, Cell: TagCell },
    { id: "id", header: "Image ID", value: (row) => row.ID },
    {
      id: "used-by",
      header: "Used by",
      value: (row) => row.usedBy.join(", "),
      sortValue: (row) => row.usedBy.length,
    },
    { id: "size", header: "Size", value: (row) => row.Size, sortValue: (row) => parseSize(row.Size) },
    {
      id: "age",
      header: "Age",
      value: (row) => formatAge(parseDockerTime(row.CreatedAt)),
      sortValue: (row) => -parseDockerTime(row.CreatedAt),
    },
  ],
  SelectionActions: imageRemoval.RemoveSelected,
  RowActions: imageRemoval.RowActions,
  Details: ImageDetails,
  ToolbarActions: RemoveDanglingImages,
});
