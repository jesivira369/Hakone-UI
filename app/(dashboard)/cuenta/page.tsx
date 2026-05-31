"use client";

import { useState } from "react";
import { useAuth } from "@/context/auth-provider";
import { useMutation } from "@tanstack/react-query";
import api from "@/lib/axiosInstance";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "react-toastify";
import { Eye, EyeOff } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";

function PasswordInput({
    value,
    onChange,
    placeholder,
    autoComplete,
}: {
    value: string;
    onChange: (v: string) => void;
    placeholder?: string;
    autoComplete?: string;
}) {
    const [show, setShow] = useState(false);
    return (
        <div className="relative">
            <Input
                type={show ? "text" : "password"}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                autoComplete={autoComplete}
                className="pr-10"
            />
            <button
                type="button"
                tabIndex={-1}
                onClick={() => setShow((s) => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
                {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
        </div>
    );
}

export default function CuentaPage() {
    const { user } = useAuth();

    // Profile form
    const [shopName, setShopName] = useState(user?.shopName ?? "");
    const [showProfileModal, setShowProfileModal] = useState(false);

    // Password form
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPasswordModal, setShowPasswordModal] = useState(false);

    const profileMutation = useMutation({
        mutationFn: async () => {
            const { data } = await api.patch("/account/profile", { shopName });
            return data;
        },
        onSuccess: () => {
            setShowProfileModal(false);
            toast.success("Nombre de la tienda actualizado", {
                className: "bg-green-600 text-white border border-green-700",
            });
        },
        onError: () => {
            setShowProfileModal(false);
            toast.error("Error al actualizar el perfil", {
                className: "bg-red-600 text-white border border-red-700",
            });
        },
    });

    const passwordMutation = useMutation({
        mutationFn: async () => {
            await api.patch("/account/password", { currentPassword, newPassword });
        },
        onSuccess: () => {
            setShowPasswordModal(false);
            toast.success("Contraseña actualizada con éxito", {
                className: "bg-green-600 text-white border border-green-700",
            });
            setCurrentPassword("");
            setNewPassword("");
            setConfirmPassword("");
        },
        onError: (err: unknown) => {
            setShowPasswordModal(false);
            const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
            toast.error(msg ?? "Error al cambiar la contraseña", {
                className: "bg-red-600 text-white border border-red-700",
            });
        },
    });

    const handlePasswordSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) {
            toast.error("Las contraseñas no coinciden", {
                className: "bg-red-600 text-white border border-red-700",
            });
            return;
        }
        if (newPassword.length < 6) {
            toast.error("La nueva contraseña debe tener al menos 6 caracteres", {
                className: "bg-red-600 text-white border border-red-700",
            });
            return;
        }
        setShowPasswordModal(true);
    };

    const subStatusLabel: Record<string, string> = {
        TRIAL: "Trial activo",
        ACTIVE: "Activa",
        GRACE: "Período de gracia",
        EXPIRED: "Vencida",
    };
    const subStatusColor: Record<string, string> = {
        TRIAL: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
        ACTIVE: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
        GRACE: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
        EXPIRED: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
    };

    const effectiveExpiry = user?.subscriptionEndsAt ?? user?.trialEndsAt;

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold">Mi Cuenta</h1>

            {/* Subscription status */}
            {user?.role === "ADMIN" && (
                <div className="rounded-xl border bg-card p-5 space-y-2">
                    <h2 className="text-base font-semibold">Suscripción</h2>
                    <div className="flex items-center gap-3">
                        <span className={`rounded px-2 py-0.5 text-xs font-semibold ${subStatusColor[user.subscriptionStatus]}`}>
                            {subStatusLabel[user.subscriptionStatus]}
                        </span>
                        {effectiveExpiry && (
                            <span className="text-sm text-muted-foreground">
                                Vence: {new Date(effectiveExpiry).toLocaleDateString("es")}
                            </span>
                        )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                        Para renovar tu suscripción, contacta con soporte.
                    </p>
                </div>
            )}

            {/* Two-column layout */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                {/* Profile */}
                <div className="rounded-xl border bg-card p-5 space-y-4">
                    <h2 className="text-base font-semibold">Perfil</h2>
                    <div className="space-y-3">
                        <div>
                            <label className="mb-1 block text-sm font-medium">Nombre de la tienda</label>
                            <Input
                                value={shopName}
                                onChange={(e) => setShopName(e.target.value)}
                                placeholder="Mi Taller"
                            />
                        </div>
                        <div>
                            <label className="mb-1 block text-sm font-medium text-muted-foreground">Email</label>
                            <Input
                                type="email"
                                value={user?.email ?? ""}
                                readOnly
                                disabled
                                className="cursor-not-allowed opacity-60"
                            />
                            <p className="mt-1 text-xs text-muted-foreground">El email no se puede modificar.</p>
                        </div>
                        <Button
                            onClick={() => setShowProfileModal(true)}
                            disabled={profileMutation.isPending}
                        >
                            Guardar cambios
                        </Button>
                    </div>
                </div>

                {/* Change password */}
                <div className="rounded-xl border bg-card p-5 space-y-4">
                    <h2 className="text-base font-semibold">Cambiar contraseña</h2>
                    <form onSubmit={handlePasswordSubmit} className="space-y-3">
                        <div>
                            <label className="mb-1 block text-sm font-medium">Contraseña actual</label>
                            <PasswordInput
                                value={currentPassword}
                                onChange={setCurrentPassword}
                                placeholder="••••••••"
                                autoComplete="current-password"
                            />
                        </div>
                        <div>
                            <label className="mb-1 block text-sm font-medium">Nueva contraseña</label>
                            <PasswordInput
                                value={newPassword}
                                onChange={setNewPassword}
                                placeholder="••••••••"
                                autoComplete="new-password"
                            />
                        </div>
                        <div>
                            <label className="mb-1 block text-sm font-medium">Confirmar nueva contraseña</label>
                            <PasswordInput
                                value={confirmPassword}
                                onChange={setConfirmPassword}
                                placeholder="••••••••"
                                autoComplete="new-password"
                            />
                        </div>
                        <Button type="submit" disabled={passwordMutation.isPending}>
                            Actualizar contraseña
                        </Button>
                    </form>
                </div>
            </div>

            {/* Profile confirm modal */}
            <Dialog open={showProfileModal} onOpenChange={setShowProfileModal}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Confirmar cambios de perfil</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-2 text-sm text-muted-foreground">
                        <p>¿Deseas guardar los siguientes cambios?</p>
                        <div className="rounded-lg border bg-muted/40 p-3">
                            <div className="flex justify-between">
                                <span className="font-medium text-foreground">Nombre de la tienda</span>
                                <span>{shopName}</span>
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowProfileModal(false)}>
                            Cancelar
                        </Button>
                        <Button
                            onClick={() => profileMutation.mutate()}
                            disabled={profileMutation.isPending}
                        >
                            {profileMutation.isPending ? "Guardando..." : "Confirmar"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Password confirm modal */}
            <Dialog open={showPasswordModal} onOpenChange={setShowPasswordModal}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Confirmar cambio de contraseña</DialogTitle>
                    </DialogHeader>
                    <p className="text-sm text-muted-foreground">
                        ¿Estás seguro de que quieres cambiar tu contraseña? Esta acción no se puede deshacer.
                    </p>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowPasswordModal(false)}>
                            Cancelar
                        </Button>
                        <Button
                            onClick={() => passwordMutation.mutate()}
                            disabled={passwordMutation.isPending}
                        >
                            {passwordMutation.isPending ? "Actualizando..." : "Confirmar"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
