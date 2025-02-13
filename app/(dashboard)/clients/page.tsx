"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/axiosInstance";
import { Client } from "@/lib/types";
import { useRouter } from "next/navigation";
import { Table, TableHeader, TableBody, TableRow, TableCell } from "@/components/ui/Table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trash, Edit, Eye } from "lucide-react";
import { DeleteModal } from "@/components/ui/DeleteModal";
import { ClientModal } from "@/components/ui/ClientModal";

export default function Clients() {
    const queryClient = useQueryClient();
    const router = useRouter();
    const [search, setSearch] = useState("");
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
    const [selectedClient, setSelectedClient] = useState<Client | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false)

    const { data: clients, isLoading, error } = useQuery<Client[]>({
        queryKey: ["clients"],
        queryFn: async () => {
            const { data } = await api.get("/clients");
            return data;
        },
    });

    const deleteMutation = useMutation({
        mutationFn: async (id: number) => {
            await api.delete(`/clients/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["clients"] });
        },
    });

    if (isLoading) return <p>Cargando clientes...</p>;
    if (error) return <p>Error al cargar los clientes.</p>;
    if (!clients) return null;

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-4">Clientes</h1>
            <div className="flex justify-between mb-4">
                <Input
                    placeholder="Buscar cliente..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
                <Button onClick={() => { setSelectedClient(null); setIsModalOpen(true); }}>Nuevo Cliente</Button>
            </div>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableCell>Nombre</TableCell>
                        <TableCell>Email</TableCell>
                        <TableCell>Teléfono</TableCell>
                        <TableCell>Acciones</TableCell>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {clients
                        .filter((client) => client.name.toLowerCase().includes(search.toLowerCase()))
                        .map((client) => (
                            <TableRow key={client.id}>
                                <TableCell>{client.name}</TableCell>
                                <TableCell>{client.email}</TableCell>
                                <TableCell>{client.phone}</TableCell>
                                <TableCell className="flex gap-2">
                                    <Button size="sm" variant="ghost" onClick={() => router.push(`/clientes/${client.id}`)}>
                                        <Eye size={16} />
                                    </Button>
                                    <Button size="sm" variant="outline" onClick={() => { setSelectedClient(client); setIsModalOpen(true); }}>
                                        <Edit size={16} />
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="destructive"
                                        onClick={() => setIsDeleteModalOpen(true)}
                                    >
                                        <Trash size={16} />
                                    </Button>
                                </TableCell>
                                <DeleteModal
                                    isOpen={isDeleteModalOpen}
                                    onClose={() => setIsDeleteModalOpen(false)}
                                    onDelete={() => deleteMutation.mutate(client.id)}
                                    itemName={client.name}
                                />
                            </TableRow>
                        ))}
                </TableBody>
            </Table>
            <ClientModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                client={selectedClient}
            />
        </div>
    );
}