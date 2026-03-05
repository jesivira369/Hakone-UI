"use client";

import {
    flexRender,
    getCoreRowModel,
    useReactTable,
    getPaginationRowModel,
    ColumnDef,
} from "@tanstack/react-table";
import { Table, TableHeader, TableBody, TableRow, TableCell } from "@/components/ui/Table";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface DataTableProps<TData> {
    columns: ColumnDef<TData>[];
    data: TData[];
    page: number;
    setPage: (page: number) => void;
    limit: number;
    setLimit: (limit: number) => void;
    total: number;
    totalPage: number;
}

export function DataTable<TData>({ columns, data, page, setPage, limit, setLimit, total, totalPage }: DataTableProps<TData>) {
    const table = useReactTable({
        data,
        columns,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        manualPagination: true,
        pageCount: totalPage,
    });

    return (
        <div className="w-full min-w-0">
            <div className="overflow-x-auto rounded-lg border">
                <Table className="w-full">
                    <TableHeader>
                        {table.getHeaderGroups().map((headerGroup) => (
                            <TableRow key={headerGroup.id}>
                                {headerGroup.headers.map((header, index) => (
                                    <TableCell key={header.id} className={`font-semibold ${index === headerGroup.headers.length - 1 ? 'text-right' : ''}`}>
                                        {flexRender(header.column.columnDef.header, header.getContext())}
                                    </TableCell>
                                ))}
                            </TableRow>
                        ))}
                    </TableHeader>
                    <TableBody>
                        {table.getRowModel().rows.map((row) => (
                            <TableRow key={row.id}>
                                {row.getVisibleCells().map((cell, index) => (
                                    <TableCell key={cell.id} className={`${index === row.getVisibleCells().length - 1 ? 'text-right' : ''}`}>
                                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                    </TableCell>
                                ))}
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
            <div className="mt-4 flex w-full flex-col gap-4 border-t border-border p-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
                <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm text-muted-foreground">Resultados por página:</p>
                    <Select value={limit.toString()} onValueChange={(val) => setLimit(Number(val))}>
                        <SelectTrigger className="w-20">
                            <SelectValue placeholder="Selecciona" />
                        </SelectTrigger>
                        <SelectContent>
                            {[10, 20, 50].map((size) => (
                                <SelectItem key={size} value={size.toString()}>
                                    {size}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-2 sm:justify-end sm:gap-4">
                    <p className="text-sm text-muted-foreground">Página {page} de {Math.max(1, Math.ceil(total / limit))}</p>
                    <div className="flex gap-2">
                        <Button variant="outline" size="sm" className="px-4" onClick={() => setPage(page - 1)} disabled={page === 1}>
                            Anterior
                        </Button>
                        <Button variant="outline" size="sm" className="px-4" onClick={() => setPage(page + 1)} disabled={page * limit >= total}>
                            Siguiente
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}