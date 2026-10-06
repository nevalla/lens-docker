import type { ComponentType } from "react";

export interface DockerListColumn<Row> {
  readonly id: string;
  readonly header: string;
  // What the cell shows unless it has a Cell of its own, and what search matches against.
  readonly value: (row: Row) => string;
  readonly sortValue?: (row: Row) => string | number;
  readonly Cell?: ComponentType<{ row: Row }>;
}
