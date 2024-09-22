# tanstack-table-export-to-csv
> Uses:
> - shadcn/ui
> - export-to-csv
>
> Supports Light & Dark Mode
> 
> Columns are inferred, you only need to pass a subject and a table model!

# Getting Started
1. Add the `declare module "@tanstack/react-table"` from **react-table-module.ts**, to add dontExport and Name properties.
2. Add the useMediaQuery hook from **use-media-query.ts** if you did not have it yet.
3. Add the **export-to-csv.tsx** component
4. Use the component and pass in the tanstack-table object, and a subject for naming the export.
5. Define a custom trigger as a child of the component, or use the default.
   
That's it, you're done! You do not need to define any columns, it will all be inferred from your table model.
Remember to add the 'dontExport: true' boolean to the meta of columns you don't want to end up in your csv!

# Images
<img width="400" src="https://github.com/user-attachments/assets/0f45838d-b906-4136-9214-a7fd17f6a3da">
<img width="400" src="https://github.com/user-attachments/assets/7327c349-ef76-4a5f-bd56-d2f38e1854b5">

# Example Usage
```typescript
import { ExportToCsv } from "@/components/export-to-csv";
import { type Table } from "@tanstack/react-table";

interface DataTableToolbarProps<TData> {
   table: Table<TData>;
}

export function DataTableToolbar<TData>({ table }: DataTableToolbarProps<TData>) {
   return (
      <div>
         <ExportToCsv table={table} subject="Clients" />
      </div>
   );
}
```
