import { Button, Div, Span } from "@k8slens/element-components";
import { getInjectable2, getInjectableBunch, type Injectable2 } from "@k8slens/injectable";
import { TextInput } from "@k8slens/input-components";
import { derivedSubscribable, type Subscribable } from "@k8slens/subscribable";
import { useSubscribable } from "@k8slens/subscribable-react";
import { SortableColumnHeader } from "@k8slens/table-components";
import {
  getTableColumnInjectableBunch,
  getTableInjectableBunch,
  getTableKind,
  Table,
  tableDataInjectionToken,
} from "@k8slens/table-contracts";
import { useInject } from "@k8slens/use-inject";
import { observer } from "mobx-react";
import { type ComponentType, type ReactNode, Suspense, use } from "react";
import { Checkbox } from "./checkbox";
import type { DockerListColumn } from "./docker-list-column";
import { ErrorBoundary } from "./error-boundary";
import { filterAndSort } from "./filter-and-sort";
import { createListViewState } from "./list-view-state";

export interface DetailsProps {
  readonly rowId: string;
  readonly close: () => void;
}

export interface SelectionActionsProps<Row> {
  readonly rows: readonly Row[];
  readonly clearSelection: () => void;
}

interface DockerListParams<Row> {
  readonly id: string;
  readonly title: string;
  readonly rows: { readonly subscribable: Injectable2<() => Subscribable<readonly Row[]>> };
  readonly getRowId: (row: Row) => string;
  readonly columns: readonly DockerListColumn<Row>[];
  // Given, rows get checkboxes, and these show in the toolbar for the rows selected.
  readonly SelectionActions?: ComponentType<SelectionActionsProps<Row>>;
  // Given, rows end with these, at the far end of the last column's cell: an extension's table has
  // no place of its own for them, where Lens's lists end each row with its menu.
  readonly RowActions?: ComponentType<{ row: Row }>;
  // Given, clicking a row's first cell opens these in a drawer over the list.
  readonly Details?: ComponentType<DetailsProps>;
  // Given, these show in the toolbar always, for actions over the whole list rather than a selection.
  readonly ToolbarActions?: ComponentType;
}

// Renders what needs the rows loaded, and nothing until they are or when they cannot be.
const WhenLoaded = ({ children }: { children: ReactNode }) => (
  <ErrorBoundary>
    <Suspense fallback={null}>{children}</Suspense>
  </ErrorBoundary>
);

// A searchable, sortable list of docker rows, with a toolbar like Lens's own lists.
// Call at module scope only, so the components it makes keep their identity.
export const getDockerList = <Row,>({
  id,
  title,
  rows,
  getRowId,
  columns,
  SelectionActions,
  RowActions,
  Details,
  ToolbarActions,
}: DockerListParams<Row>) => {
  const kind = getTableKind<Row>(`docker-${id}`);

  const viewState = getInjectable2({
    id: `docker-${id}-view-state`,
    instantiate: () => () => createListViewState(),
  });

  const table = getTableInjectableBunch({
    kind,
    getRowId,
    data: {
      instantiate: (di) => {
        const allRows = di.inject(rows.subscribable)();
        const state = di.inject(viewState)();

        return () => derivedSubscribable(allRows, (all) => filterAndSort(all, columns, state.search(), state.sort()));
      },
    },
  });

  const visibleRows = getInjectable2({
    id: `docker-${id}-visible-rows`,
    consumptions: [tableDataInjectionToken],
    instantiate: (di) => di.inject(tableDataInjectionToken.for(kind).for(di.scopeIds)),
  });

  // Suspends until the rows are there; render inside WhenLoaded.
  const useVisibleRows = () => use(useSubscribable(useInject(visibleRows)()).value).get();

  const dataColumns = columns.map((column, index) => {
    const TextCell = ({ row }: { row: Row }) => <span>{column.value(row)}</span>;
    const ValueCell = column.Cell ?? TextCell;
    const isFirst = index === 0;
    const isLast = index === columns.length - 1;

    const CellOpeningDetails = ({ row }: { row: Row }) => {
      const state = useInject(viewState)();

      return (
        <Button $width="full" $textAlign="left" $onClick={() => state.openDetails(getRowId(row))}>
          <ValueCell row={row} />
        </Button>
      );
    };

    const ColumnCell = isFirst && Details ? CellOpeningDetails : ValueCell;

    const CellWithRowActions = ({ row }: { row: Row }) => (
      <Div $width="full" $flex={{ horizontalAlign: "space-between", verticalAlign: "center" }}>
        <ColumnCell row={row} />
        {RowActions && <RowActions row={row} />}
      </Div>
    );

    const Header = observer(() => {
      const state = useInject(viewState)();
      const sort = state.sort();

      return (
        <SortableColumnHeader
          sortedBy={sort?.columnId === column.id ? sort.direction : undefined}
          onSort={() => state.toggleSort(column.id)}
        >
          {column.header}
        </SortableColumnHeader>
      );
    });

    return getTableColumnInjectableBunch({
      id: `docker-${id}-${column.id}`,
      kind,
      orderNumber: (index + 1) * 10,
      Cell: isLast && RowActions ? CellWithRowActions : ColumnCell,
      Header,
    });
  });

  const SelectRow = observer(({ row }: { row: Row }) => {
    const state = useInject(viewState)();
    const rowId = getRowId(row);

    return (
      // Header cells are inset 4px more than row cells; this keeps the checkboxes in one line.
      <Checkbox
        label="Select row"
        checked={state.isSelected(rowId)}
        onToggle={() => state.toggleSelected(rowId)}
        $margin={{ left: "xxs" }}
      />
    );
  });

  const SelectAllRows = observer(() => {
    const state = useInject(viewState)();
    const rowIds = useVisibleRows().map(getRowId);
    const allSelected = rowIds.length > 0 && rowIds.every(state.isSelected);

    return (
      <Checkbox label="Select all rows" checked={allSelected} onToggle={() => state.setSelected(rowIds, !allSelected)} />
    );
  });

  // Not a ColumnHeader: its text inset would put this checkbox off the line of the rows' ones.
  const SelectAllHeader = () => (
    <WhenLoaded>
      <SelectAllRows />
    </WhenLoaded>
  );

  const selectionColumn =
    SelectionActions &&
    getTableColumnInjectableBunch({
      id: `docker-${id}-selection`,
      kind,
      orderNumber: 1,
      Cell: SelectRow,
      Header: SelectAllHeader,
    });

  const Search = observer(() => {
    const state = useInject(viewState)();

    return (
      <TextInput
        type="search"
        placeholder={`Search ${title}...`}
        value={state.search()}
        onChange={(event) => state.setSearch(event.target.value)}
        $style={{ maxWidth: "25rem" }}
      />
    );
  });

  const Status = observer(() => {
    const state = useInject(viewState)();
    const shown = useVisibleRows();
    const selected = shown.filter((row) => state.isSelected(getRowId(row)));

    return (
      <Div $flex={{ gap: "l", verticalAlign: "center" }} $flexChild="fixed">
        <Span $color="textMuted">
          {shown.length} {shown.length === 1 ? "item" : "items"}
          {selected.length > 0 && `, ${selected.length} selected`}
        </Span>
        {SelectionActions && selected.length > 0 && (
          <SelectionActions rows={selected} clearSelection={state.clearSelection} />
        )}
      </Div>
    );
  });

  const DetailsOverlay = observer(() => {
    const state = useInject(viewState)();
    const rowId = state.detailsRowId();

    if (!Details || !rowId) {
      return null;
    }

    return (
      <Div $style={{ position: "absolute", top: 0, right: 0, bottom: 0, width: "min(60%, 50rem)", zIndex: 1 }}>
        <Details key={rowId} rowId={rowId} close={state.closeDetails} />
      </Div>
    );
  });

  const View = () => (
    <Div $size="full" $relative>
      <Div $size="full" $flex={{ direction: "vertical" }}>
        <Div $flex={{ gap: "l", verticalAlign: "center" }} $padding="m">
          <Search />
          <WhenLoaded>
            <Status />
          </WhenLoaded>
          {ToolbarActions && (
            <Div $flexChild="fixed" $style={{ marginLeft: "auto" }}>
              <WhenLoaded>
                <ToolbarActions />
              </WhenLoaded>
            </Div>
          )}
        </Div>
        {/* Isolated, so no layer of the table, such as its sticky header's dividers, rises above the drawer. */}
        <Div $flexChild $style={{ minHeight: 0, isolation: "isolate" }}>
          <Table kind={kind} params={[]} />
        </Div>
      </Div>
      <DetailsOverlay />
    </Div>
  );

  return getInjectableBunch({
    viewState,
    table,
    visibleRows,
    columns: getInjectableBunch({ ...dataColumns }),
    ...(selectionColumn && { selectionColumn }),
    kind,
    View,
  });
};
