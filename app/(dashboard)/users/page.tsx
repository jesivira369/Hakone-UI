"use client";

import { useEffect, useMemo, useState } from "react";
import { useDebounce } from "@/hooks/useDebounce";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/axiosInstance";
import { useAuth } from "@/context/auth-provider";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/DataTable";
import type { ColumnDef } from "@tanstack/react-table";
import { AppUser, UsersQuery } from "@/lib/types";
import { UserModal } from "@/components/ui/UserModal";
import { Input } from "@/components/ui/input";
import { formatDate } from "@/lib/utils";

export default function UsersPage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search);
  const [createOpen, setCreateOpen] = useState(false);
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  useEffect(() => { setPage(1); }, [debouncedSearch]);

  useEffect(() => {
    if (isLoading) return;
    if (!user) router.replace("/login");
    else if (user.role !== "SUPER_ADMIN") router.replace("/dashboard");
  }, [user, isLoading, router]);

  const { data } = useQuery<UsersQuery>({
    queryKey: ["users", page, limit, debouncedSearch, sortBy, sortOrder],
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page), limit: String(limit) });
      if (debouncedSearch) params.set("search", debouncedSearch);
      if (sortBy) params.set("sortBy", sortBy);
      if (sortOrder) params.set("sortOrder", sortOrder);
      const res = await api.get(`/users?${params.toString()}`);
      return res.data as UsersQuery;
    },
    enabled: !!user && user.role === "SUPER_ADMIN",
    placeholderData: (prev: UsersQuery | undefined) => prev,
  });

  const columns: ColumnDef<AppUser>[] = useMemo(
    () => [
      { accessorKey: "email", header: "Email", enableSorting: true },
      { accessorKey: "shopName", header: "Tienda", enableSorting: true },
      { accessorKey: "role", header: "Rol", enableSorting: true },
      {
        accessorKey: "createdAt",
        header: "Creado",
        enableSorting: true,
        cell: ({ row }) => formatDate(row.original.createdAt),
      },
    ],
    []
  );

  if (isLoading || !user || user.role !== "SUPER_ADMIN") {
    return null;
  }

  return (
    <div className="min-w-0 space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-xl font-bold sm:text-2xl">Usuarios</h1>
        <Button className="shrink-0" onClick={() => setCreateOpen(true)}>
          Crear usuario
        </Button>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Input
          placeholder="Buscar por email o tienda..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full min-w-0 sm:max-w-sm"
        />
      </div>

      <DataTable
        columns={columns}
        data={data?.data ?? []}
        page={page}
        setPage={setPage}
        limit={limit}
        setLimit={setLimit}
        total={data?.totalItems ?? 0}
        totalPage={data?.totalPages ?? 0}
        sortBy={sortBy}
        setSortBy={setSortBy}
        sortOrder={sortOrder}
        setSortOrder={setSortOrder}
      />

      {createOpen && <UserModal isOpen={createOpen} onClose={() => setCreateOpen(false)} />}
    </div>
  );
}
