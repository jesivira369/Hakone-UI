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
}

export function DataTable<TData>({ columns, data, page, setPage, limit, setLimit, total }: DataTableProps<TData>) {
    const table = useReactTable({
        data,
        columns,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        manualPagination: true,
        pageCount: Math.ceil(total / limit),
    });

    return (
        <div>
            <Table>
                <TableHeader>
                    {table.getHeaderGroups().map((headerGroup) => (
                        <TableRow key={headerGroup.id}>
                            {headerGroup.headers.map((header) => (
                                <TableCell key={header.id}>
                                    {flexRender(header.column.columnDef.header, header.getContext())}
                                </TableCell>
                            ))}
                        </TableRow>
                    ))}
                </TableHeader>
                <TableBody>
                    {table.getRowModel().rows.map((row) => (
                        <TableRow key={row.id}>
                            {row.getVisibleCells().map((cell) => (
                                <TableCell key={cell.id}>
                                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                </TableCell>
                            ))}
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
            {/* Paginación */}
            <div className="flex justify-between items-center mt-4">
                <div>
                    <span>Resultados por página: </span>
                    <Select value={limit.toString()} onValueChange={(val) => setLimit(Number(val))}>
                        <SelectTrigger>
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
                <div className="flex gap-2">
                    <Button onClick={() => setPage(page - 1)} disabled={page === 1}>
                        Anterior
                    </Button>
                    <span>Página {page} de {Math.ceil(total / limit)}</span>
                    <Button onClick={() => setPage(page + 1)} disabled={page * limit >= total}>
                        Siguiente
                    </Button>
                </div>
            </div>
        </div>
    );
}