import { Button, Div } from "@k8slens/element-components";
import { getInjectableBunch } from "@k8slens/injectable";
import { derivedSubscribable } from "@k8slens/subscribable";
import { ColumnHeader } from "@k8slens/table-components";
import {
  getTableColumnInjectableBunch,
  getTableInjectableBunch,
  getTableKind,
  type TableColumnCellProps,
} from "@k8slens/table-contracts";
import { useInject } from "@k8slens/use-inject";
import { containerColumns } from "../containers/container-columns";
import { type DockerContainer, dockerContainerRows } from "../containers/container-rows.injectable";
import { openContainerDetailsInjectable } from "../containers/open-container-details.injectable";
import { containerRemoval } from "../containers/remove-containers.injectable";
import type { DockerListColumn } from "../list/docker-list-column";

// The containers of one app, one per service, as the containers list shows them.
export const appServicesTableKind = getTableKind<DockerContainer, [appName: string]>("docker-app-services");

export const appServicesTable = getTableInjectableBunch({
  kind: appServicesTableKind,
  getRowId: (container) => container.ID,
  data: {
    instantiate: (di) => {
      const containers = di.inject(dockerContainerRows.subscribable)();

      return (appName) =>
        derivedSubscribable(containers, (all) =>
          all
            .filter((container) => container.compose?.project === appName)
            .toSorted((a, b) => (a.compose?.service ?? "").localeCompare(b.compose?.service ?? "")),
        );
    },
  },
});

// A service names its container: following it opens the container's details, the way Lens links a pod's owner.
const ServiceCell = ({ row }: { row: DockerContainer }) => {
  const openContainerDetails = useInject(openContainerDetailsInjectable)();

  return (
    <Button
      $color="link"
      $textAlign="left"
      $style={{ textDecoration: "underline" }}
      $tooltip={`Show container ${row.Names}`}
      $onClick={() => void openContainerDetails(row.ID)}
    >
      {row.compose?.service}
    </Button>
  );
};

const columns: readonly DockerListColumn<DockerContainer>[] = [
  { ...containerColumns.service, Cell: ServiceCell },
  { ...containerColumns.name, header: "Container" },
  containerColumns.image,
  containerColumns.cpu,
  containerColumns.memory,
  containerColumns.ports,
  containerColumns.state,
  containerColumns.age,
];

const columnBunch = (column: DockerListColumn<DockerContainer>, index: number) => {
  const ValueCell = column.Cell ?? (({ row }: { row: DockerContainer }) => <span>{column.value(row)}</span>);

  // Rows end with the container's menu, as in the containers list.
  const LastCell = ({ row }: TableColumnCellProps<DockerContainer>) => (
    <Div $width="full" $flex={{ horizontalAlign: "space-between", verticalAlign: "center" }}>
      <ValueCell row={row} />
      <containerRemoval.RowActions row={row} />
    </Div>
  );

  const Header = () => <ColumnHeader>{column.header}</ColumnHeader>;

  return getTableColumnInjectableBunch({
    id: `docker-app-service-${column.id}`,
    kind: appServicesTableKind,
    orderNumber: (index + 1) * 10,
    Cell: index === columns.length - 1 ? LastCell : ValueCell,
    Header,
  });
};

export const appServicesColumns = getInjectableBunch({ ...columns.map(columnBunch) });
