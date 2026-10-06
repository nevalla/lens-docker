import { Span } from "@k8slens/element-components";
import { formatAge, parseSize } from "../docker-values";
import { getDockerList } from "../list/get-docker-list";
import { volumeRemoval } from "./remove-volumes.injectable";
import { VolumeDetails } from "./volume-details";
import { type DockerVolume, dockerVolumeRows, isAnonymous } from "./volume-rows.injectable";

// Anonymous volumes are named by a long hash; mark them, so a glance tells them from named ones.
const NameCell = ({ row }: { row: DockerVolume }) => (
  <span>
    {row.Name}
    {isAnonymous(row) && <Span $color="textMuted"> (anonymous)</Span>}
  </span>
);

export const dockerVolumes = getDockerList<DockerVolume>({
  id: "volumes",
  title: "Volumes",
  rows: dockerVolumeRows,
  getRowId: (volume) => volume.Name,
  columns: [
    { id: "name", header: "Name", value: (row) => row.Name, Cell: NameCell },
    { id: "driver", header: "Driver", value: (row) => row.Driver },
    { id: "scope", header: "Scope", value: (row) => row.Scope },
    {
      id: "size",
      header: "Size",
      value: (row) => row.size ?? "N/A",
      sortValue: (row) => (row.size ? parseSize(row.size) : -1),
    },
    {
      id: "used-by",
      header: "Used by",
      value: (row) => row.usedBy.join(", "),
      sortValue: (row) => row.usedBy.length,
    },
    {
      id: "age",
      header: "Age",
      value: (row) => formatAge(Date.parse(row.CreatedAt)),
      sortValue: (row) => -Date.parse(row.CreatedAt),
    },
  ],
  SelectionActions: volumeRemoval.RemoveSelected,
  RowActions: volumeRemoval.RowActions,
  Details: VolumeDetails,
});
