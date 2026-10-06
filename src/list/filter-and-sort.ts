import type { DockerListColumn } from "./docker-list-column";
import type { ListSort } from "./list-view-state";

const compare = (a: string | number, b: string | number) =>
  typeof a === "number" && typeof b === "number"
    ? a - b
    : String(a).localeCompare(String(b), undefined, { numeric: true });

export const filterAndSort = <Row>(
  rows: readonly Row[],
  columns: readonly DockerListColumn<Row>[],
  search: string,
  sort: ListSort | undefined,
): readonly Row[] => {
  const needle = search.trim().toLowerCase();
  const matching = needle
    ? rows.filter((row) => columns.some((column) => column.value(row).toLowerCase().includes(needle)))
    : rows;

  const column = sort && columns.find(({ id }) => id === sort.columnId);

  if (!column) {
    return matching;
  }

  const sortValue = column.sortValue ?? column.value;
  const sign = sort.direction === "ascending" ? 1 : -1;

  return [...matching].sort((a, b) => sign * compare(sortValue(a), sortValue(b)));
};
