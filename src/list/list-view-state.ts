import type { SortDirection } from "@k8slens/table-components";
import { action, observable } from "mobx";

export interface ListSort {
  readonly columnId: string;
  readonly direction: SortDirection;
}

export const createListViewState = () => {
  const search = observable.box("");
  const sort = observable.box<ListSort | undefined>(undefined);
  const selected = observable.set<string>();
  const detailsRowId = observable.box<string | undefined>(undefined);

  return {
    search: () => search.get(),
    sort: () => sort.get(),
    isSelected: (rowId: string) => selected.has(rowId),
    detailsRowId: () => detailsRowId.get(),

    setSearch: action((value: string) => search.set(value)),
    toggleSort: action((columnId: string) => {
      const current = sort.get();
      const isAscending = current?.columnId === columnId && current.direction === "ascending";

      sort.set({ columnId, direction: isAscending ? "descending" : "ascending" });
    }),
    toggleSelected: action((rowId: string) => {
      if (!selected.delete(rowId)) {
        selected.add(rowId);
      }
    }),
    setSelected: action((rowIds: readonly string[], value: boolean) =>
      rowIds.forEach((rowId) => (value ? selected.add(rowId) : selected.delete(rowId))),
    ),
    clearSelection: action(() => selected.clear()),
    openDetails: action((rowId: string) => detailsRowId.set(rowId)),
    closeDetails: action(() => detailsRowId.set(undefined)),
  };
};

export type ListViewState = ReturnType<typeof createListViewState>;
