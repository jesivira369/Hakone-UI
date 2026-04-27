"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/axiosInstance";
import { useAuth } from "@/context/auth-provider";
import { DataTable } from "@/components/ui/DataTable";
import type { ColumnDef } from "@tanstack/react-table";
import { ContactRequest, ContactRequestsQuery, ContactRequestStatus } from "@/lib/types";
import { Input } from "@/components/ui/input";
import { formatDate } from "@/lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function ContactRequestsPage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [status, setStatus] = useState<ContactRequestStatus | "ALL">("NEW");
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (isLoading) return;
    if (!user) router.replace("/login");
    else if (user.role !== "SUPER_ADMIN") router.replace("/dashboard");
  }, [user, isLoading, router]);

  const { data } = useQuery<ContactRequestsQuery>({
    queryKey: ["contact-requests", page, limit, status, search],
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page), limit: String(limit) });
      if (status !== "ALL") params.set("status", status);
      // Búsqueda simple por query param (futuro): por ahora filtramos en UI si hace falta.
      const res = await api.get(`/contact-requests?${params.toString()}`);
      const payload = res.data as ContactRequestsQuery;
      if (!search) return payload;
      const q = search.toLowerCase();
      return {
        ...payload,
        data: payload.data.filter((r) =>
          [r.name, r.shopName, r.email, r.phone].some((v) => String(v).toLowerCase().includes(q))
        ),
      };
    },
    enabled: !!user && user.role === "SUPER_ADMIN",
  });

  const updateStatus = useMutation({
    mutationFn: async (payload: { id: number; status: ContactRequestStatus }) => {
      const res = await api.patch(`/contact-requests/${payload.id}`, { status: payload.status });
      return res.data as ContactRequest;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contact-requests"] });
    },
  });

  const columns: ColumnDef<ContactRequest>[] = useMemo(
    () => [
      { accessorKey: "name", header: "Nombre" },
      { accessorKey: "shopName", header: "Tienda" },
      { accessorKey: "phone", header: "Teléfono" },
      { accessorKey: "email", header: "Email" },
      {
        accessorKey: "status",
        header: "Estado",
        cell: ({ row }) => {
          const r = row.original;
          return (
            <Select
              value={r.status}
              onValueChange={(v) =>
                updateStatus.mutate({ id: r.id, status: v as ContactRequestStatus })
              }
            >
              <SelectTrigger className="h-8 w-[160px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="NEW">Nuevo</SelectItem>
                <SelectItem value="CONTACTED">Contactado</SelectItem>
                <SelectItem value="CLOSED">Cerrado</SelectItem>
              </SelectContent>
            </Select>
          );
        },
      },
      {
        accessorKey: "createdAt",
        header: "Fecha",
        cell: ({ row }) => formatDate(row.original.createdAt),
      },
      {
        accessorKey: "message",
        header: "Comentario",
        cell: ({ row }) => (
          <span className="line-clamp-2 max-w-[420px] text-sm text-muted-foreground">
            {row.original.message}
          </span>
        ),
      },
    ],
    [updateStatus]
  );

  if (isLoading || !user || user.role !== "SUPER_ADMIN") return null;

  return (
    <div className="min-w-0 space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-xl font-bold sm:text-2xl">Contactos</h1>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Input
          placeholder="Buscar por nombre, tienda, email o teléfono..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full min-w-0 sm:max-w-md"
        />
        <Select
          value={status}
          onValueChange={(v) => setStatus(v as ContactRequestStatus | "ALL")}
        >
          <SelectTrigger className="w-full sm:w-[220px]">
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="NEW">Nuevos</SelectItem>
            <SelectItem value="CONTACTED">Contactados</SelectItem>
            <SelectItem value="CLOSED">Cerrados</SelectItem>
            <SelectItem value="ALL">Todos</SelectItem>
          </SelectContent>
        </Select>
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
      />
    </div>
  );
}

