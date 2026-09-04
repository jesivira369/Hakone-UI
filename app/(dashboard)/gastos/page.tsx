"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useDebounce } from "@/hooks/useDebounce";
import api from "@/lib/axiosInstance";
import { Expense } from "@/lib/types";
import { ExpenseCategory, ExpenseCategoryLabels } from "@/lib/enums";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash, Edit } from "lucide-react";
import { DeleteModal } from "@/components/ui/DeleteModal";
import { ExpenseModal } from "@/components/ui/ExpenseModal";
import { DataTable } from "@/components/ui/DataTable";
import { ColumnDef } from "@tanstack/react-table";
import { formatCurrency, formatDate } from "@/lib/utils";
import { toast } from "react-toastify";
import { TableSkeleton } from "@/components/ui/Skeleton/TableSkeleton";

export default function GastosPage() {
    const queryClient = useQueryClient();
    const [search, setSearch] = useState("");
    const debouncedSearch = useDebounce(search);
    const [category, setCategory] = useState<string>("ALL");
    const [modalOpen, setModalOpen] = useState(false);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);
    const [sortBy, setSortBy] = useState("paidAt");
    const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

    useEffect(() => { setPage(1); }, [debouncedSearch, category]);

    const { data: expensesData, isLoading, error } = useQuery({
        queryKey: ["expenses", page, limit, debouncedSearch, category, sortBy, sortOrder],
        queryFn: async () => {
            const params = new URLSearchParams({ page: String(page), limit: String(limit) });
            if (debouncedSearch) params.set("search", debouncedSearch);
            if (category !== "ALL") params.set("category", category);
            if (sortBy) params.set("sortBy", sortBy);
            if (sortOrder) params.set("sortOrder", sortOrder);
            const { data } = await api.get(`/expenses?${params.toString()}`);
            return data;
        },
        placeholderData: (prev: unknown) => prev,
    });

    const deleteMutation = useMutation({
        mutationFn: async (id: number) => {
            await api.delete(`/expenses/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["expenses"] });
            queryClient.invalidateQueries({ queryKey: ["stats-expenses"] });
            queryClient.invalidateQueries({ queryKey: ["stats-overview"] });

            toast.success("Gasto eliminado con éxito", {
                className: "bg-green-600 text-white border border-green-700",
            });

            setDeleteModalOpen(false);
        },
        onError: (error) => {
            toast.error(error.message || "Ocurrió un error al eliminar el gasto", {
                className: "bg-red-600 text-white border border-red-700",
            });
        },
    });

    const columns: ColumnDef<Expense>[] = [
        {
            accessorKey: "paidAt",
            header: "Fecha",
            enableSorting: true,
            cell: ({ row }) => formatDate(row.original.paidAt),
        },
        {
            accessorKey: "category",
            header: "Categoría",
            enableSorting: true,
            cell: ({ row }) => ExpenseCategoryLabels[row.original.category],
        },
        { accessorKey: "description", header: "Descripción", enableSorting: false },
        {
            id: "providerOrEmployee",
            header: "Proveedor / Empleado",
            enableSorting: false,
            cell: ({ row }) =>
                row.original.category === ExpenseCategory.SUELDOS
                    ? (row.original.employeeName ?? "—")
                    : (row.original.provider ?? "—"),
        },
        {
            accessorKey: "amount",
            header: "Monto",
            enableSorting: true,
            cell: ({ row }) => `$${formatCurrency(row.original.amount)}`,
        },
        {
            id: "actions",
            header: "Acciones",
            enableSorting: false,
            cell: ({ row }) => (
                <div className="flex justify-end gap-2">
                    <Button size="sm" variant="outline" onClick={() => { setSelectedExpense(row.original); setModalOpen(true); }}>
                        <Edit size={16} />
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => { setSelectedExpense(row.original); setDeleteModalOpen(true); }}>
                        <Trash size={16} />
                    </Button>
                </div>
            ),
        },
    ];

    if (isLoading && !expensesData) return <TableSkeleton />;
    if (error) return <p>Error al cargar los gastos.</p>;

    return (
        <div className="min-w-0 space-y-4">
            <h1 className="text-xl font-bold sm:text-2xl">Gastos</h1>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                    <Input
                        placeholder="Buscar gasto..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full min-w-0 sm:max-w-xs"
                    />
                    <Select value={category} onValueChange={setCategory}>
                        <SelectTrigger className="w-full sm:w-56">
                            <SelectValue placeholder="Categoría" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="ALL">Todas las categorías</SelectItem>
                            {Object.values(ExpenseCategory).map((c) => (
                                <SelectItem key={c} value={c}>
                                    {ExpenseCategoryLabels[c]}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <Button className="shrink-0" onClick={() => { setSelectedExpense(null); setModalOpen(true); }}>Nuevo Gasto</Button>
            </div>
            <DataTable
                columns={columns}
                data={expensesData.data ?? []}
                page={page}
                setPage={setPage}
                limit={limit}
                setLimit={setLimit}
                total={expensesData?.totalItems}
                totalPage={expensesData?.totalPages}
                sortBy={sortBy}
                setSortBy={setSortBy}
                sortOrder={sortOrder}
                setSortOrder={setSortOrder}
            />
            {modalOpen && (
                <ExpenseModal
                    isOpen={modalOpen}
                    onClose={() => setModalOpen(false)}
                    expense={selectedExpense}
                />
            )}
            {deleteModalOpen && selectedExpense && (
                <DeleteModal
                    isOpen={deleteModalOpen}
                    onClose={() => setDeleteModalOpen(false)}
                    onDelete={() => deleteMutation.mutate(selectedExpense.id)}
                    itemName="gasto"
                />
            )}
        </div>
    );
}
