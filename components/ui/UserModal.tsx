"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/axiosInstance";
import { toast } from "react-toastify";
import type { UserRole } from "@/lib/types";

const createUserSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "Mínimo 6 caracteres"),
  shopName: z.string().min(2, "Mínimo 2 caracteres"),
  role: z.enum(["ADMIN", "SUPER_ADMIN"]).default("ADMIN"),
});

type CreateUserForm = z.infer<typeof createUserSchema>;

export function UserModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<CreateUserForm>({
    resolver: zodResolver(createUserSchema),
    defaultValues: { email: "", password: "", shopName: "", role: "ADMIN" },
  });

  useEffect(() => {
    if (isOpen) reset();
  }, [isOpen, reset]);

  const mutation = useMutation({
    mutationFn: async (payload: CreateUserForm) => {
      setIsLoading(true);
      await api.post("/users", payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast.success("Usuario creado con éxito", {
        className: "bg-green-600 text-white border border-green-700",
      });
      setIsLoading(false);
      onClose();
    },
    onError: (error: unknown) => {
      const message =
        error instanceof Error ? error.message : "Ocurrió un error al crear el usuario";
      toast.error(message, {
        className: "bg-red-600 text-white border border-red-700",
      });
      setIsLoading(false);
    },
  });

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Crear usuario</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit((data) => mutation.mutate(data))} className="space-y-4">
          <div>
            <label className="block text-sm font-medium">Email</label>
            <Input type="email" {...register("email")} placeholder="usuario@empresa.com" />
            {errors.email && <p className="text-red-500 text-sm">{errors.email.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium">Contraseña</label>
            <Input type="password" {...register("password")} placeholder="••••••••" />
            {errors.password && <p className="text-red-500 text-sm">{errors.password.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium">Nombre de la tienda</label>
            <Input {...register("shopName")} placeholder="Taller Demo" />
            {errors.shopName && <p className="text-red-500 text-sm">{errors.shopName.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium">Rol</label>
            <Select
              onValueChange={(v) => setValue("role", v as UserRole, { shouldValidate: true })}
              defaultValue="ADMIN"
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecciona un rol" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ADMIN">ADMIN (una tienda)</SelectItem>
                <SelectItem value="SUPER_ADMIN">SUPER_ADMIN (global)</SelectItem>
              </SelectContent>
            </Select>
            {errors.role && <p className="text-red-500 text-sm">{errors.role.message}</p>}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Creando..." : "Crear"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

