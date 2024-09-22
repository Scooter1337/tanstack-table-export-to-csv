import React, { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Table } from "@tanstack/react-table";
import { useMediaQuery } from "@/lib/hooks/use-media-query";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { download, generateCsv, mkConfig } from "export-to-csv";
import { MixerHorizontalIcon } from "@radix-ui/react-icons";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { File } from "lucide-react";
type AcceptedData = number | string | boolean | null | undefined;

interface ExportProps<TData> {
  table: Table<TData>;
  children?: React.ReactNode;
  subject: string;
}

export function ExportToCsv<TData>({ table, children, subject }: ExportProps<TData>) {
  const [open, setOpen] = React.useState(false);
  const isDesktop = useMediaQuery("(min-width: 768px)");

  const header = "Export Options";
  const description = "Choose the columns you want to export and the file format.";

  const selectedRows = table.getSelectedRowModel().rows.length;
  const selected = selectedRows > 0;

  const trigger = children || (
    <Button size="sm" variant="secondary" className="h-8 gap-1">
      <File className="h-3.5 w-3.5" />
      <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
        Export
        {selected &&
          ` ${table.getFilteredSelectedRowModel().rows.length} row${selectedRows > 1 ? "s" : ""}`}
      </span>
    </Button>
  );

  const refContent = useRef<HTMLDivElement>(null);

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>{trigger}</DialogTrigger>
        <DialogContent
          className="sm:max-w-[455px] gap-2"
          onOpenAutoFocus={(e) => {
            e.preventDefault(); // prevent focussing first input, as it's ugly
            refContent.current?.focus(); // do focus the content, so we can use keyboard navigation
          }}
          ref={refContent}
        >
          <DialogHeader className="pb-2">
            <DialogTitle>{header}</DialogTitle>
            <DialogDescription>{description}</DialogDescription>
          </DialogHeader>
          <ColumnForm table={table} subject={subject} />
          <DialogFooter className="">
            <DialogClose asChild>
              <Button variant="outline" className="w-full">
                Cancel
              </Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>{trigger}</DrawerTrigger>
      <DrawerContent
        ref={refContent}
        onOpenAutoFocus={(e) => {
          e.preventDefault();
          refContent.current?.focus();
        }}
      >
        <DrawerHeader className="text-left">
          <DrawerTitle>{header}</DrawerTitle>
          <DrawerDescription>{description}</DrawerDescription>
        </DrawerHeader>
        <ColumnForm table={table} subject={subject} className="px-4" />
        <DrawerFooter className="pt-2">
          <DrawerClose asChild>
            <Button variant="outline">Cancel</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}

interface ColumnFormProps<TData> {
  className?: string;
  table: Table<TData>;
  subject: string;
}

function ColumnForm<TData>({ className, table, subject }: ColumnFormProps<TData>) {
  const [decimalSeparator, setDecimalSeparator] = React.useState(".");
  const [fieldSeparator, setFieldSeparator] = React.useState(",");
  const [quoteCharacter, setQuoteCharacter] = React.useState('"');
  const [filename, setFileName] = React.useState(
    `${subject}_` +
      new Date().toLocaleDateString(undefined, {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      })
  );
  const [selectedColumns, setSelectedColumns] = React.useState<string[]>(
    table
      .getAllColumns()
      .filter((column) => !column.columnDef.meta?.dontExport && column.getIsVisible())
      .map((column) => column.id)
  );

  const csvConfig = mkConfig({
    useKeysAsHeaders: true,
    fieldSeparator,
    decimalSeparator,
    filename,
    quoteCharacter,
    fileExtension: "csv",
  });

  const exportFile = () => {
    if (new Set([decimalSeparator, fieldSeparator, quoteCharacter]).size !== 3) {
      toast.error("Field separator, quote character and decimal separator must be different");
      return;
    }

    if ([decimalSeparator, fieldSeparator, quoteCharacter].some((char) => char === "")) {
      toast.error("Field separator, quote character and decimal separator cannot be empty");
      return;
    }

    const selected = table.getSelectedRowModel().rows.length > 0;
    const allRows = selected ? table.getSelectedRowModel().rows : table.getCoreRowModel().rows;

    const rows = allRows.map((row) => {
      const obj: Record<string, AcceptedData> = {};
      selectedColumns.forEach((column) => {
        obj[column] = row.getValue(column);
      });
      return obj;
    });

    const csv = generateCsv(csvConfig)(rows);

    download(csvConfig)(csv);
  };

  return (
    <div className={cn("grid items-start gap-4", className)}>
      <div className="grid gap-2">
        <Label htmlFor="fileName">File Name</Label>
        <Input
          type="text"
          id="fileName"
          value={filename}
          onChange={(e) => setFileName(e.target.value)}
        />
      </div>
      <div className="grid gap-2 grid-cols-3">
        <div className="grid gap-2">
          <Label htmlFor="decimalSep" className="line-clamp-1 text-xs leading-none">
            Decimal Separator
          </Label>
          <Input
            maxLength={1}
            pattern="[.,]"
            id="decimalSep"
            value={decimalSeparator}
            onChange={({ target: { value } }) =>
              [".", ",", ""].includes(value) && setDecimalSeparator(value)
            }
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="fieldSep" className="line-clamp-1 text-xs leading-none">
            Field Separator
          </Label>
          <Input
            maxLength={1}
            pattern="/[^a-zA-Z]/"
            id="fieldSep"
            value={fieldSeparator}
            onChange={({ target: { value } }) =>
              !/[a-zA-Z]/g.test(value) && setFieldSeparator(value)
            }
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="quote" className="line-clamp-1 text-xs leading-none">
            Quote Character
          </Label>
          <Input
            maxLength={1}
            pattern="[.,]"
            id="quote"
            value={quoteCharacter}
            onChange={({ target: { value } }) =>
              !/[a-zA-Z]/g.test(value) && setQuoteCharacter(value)
            }
          />
        </div>
      </div>
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline">
            {" "}
            <MixerHorizontalIcon className="mr-2 size-4" />
            Select Columns
          </Button>
        </PopoverTrigger>
        <PopoverContent className="min-w-[200px] w-min">
          <div className="grid gap-2">
            <div className="pb-2">
              <h4 className="font-medium leading-none">Select Columns</h4>
            </div>
            {table
              .getAllColumns()
              .filter((column) => !column.columnDef.meta?.dontExport)
              .map((column) => {
                const label = column.columnDef.meta?.name || column.id;
                return (
                  <div key={column.id} className="flex gap-3 items-center">
                    <Switch
                      id={"column-" + column.id}
                      checked={selectedColumns.includes(column.id)}
                      onCheckedChange={(checked) =>
                        setSelectedColumns(
                          checked
                            ? [...selectedColumns, column.id]
                            : selectedColumns.filter((col) => col !== column.id)
                        )
                      }
                    />
                    <Label htmlFor={"column-" + column.id} className="line-clamp-1">
                      {label}
                    </Label>
                  </div>
                );
              })}
          </div>
        </PopoverContent>
      </Popover>
      <Button type="button" onClick={exportFile}>
        Export File
      </Button>
    </div>
  );
}
