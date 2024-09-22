declare module "@tanstack/react-table" {
  interface ColumnMeta<TData extends RowData, TValue> {
    name?: string;
    dontExport?: boolean;
  }
}
