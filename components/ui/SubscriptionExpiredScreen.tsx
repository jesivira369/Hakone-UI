"use client";

import { Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/auth-provider";

export function SubscriptionExpiredScreen() {
    const { logout } = useAuth();
    const waPhone = process.env.NEXT_PUBLIC_SUPPORT_WHATSAPP ?? "";
    const waText = encodeURIComponent("Hola, mi suscripción de Hakone venció y necesito renovarla.");
    const waHref = waPhone ? `https://wa.me/${waPhone}?text=${waText}` : undefined;

    return (
        <div className="flex h-dvh flex-col items-center justify-center gap-6 bg-background p-6 text-center">
            <div className="rounded-full bg-red-100 p-4 dark:bg-red-900/30">
                <Lock className="h-10 w-10 text-red-600 dark:text-red-400" />
            </div>
            <div className="max-w-sm space-y-2">
                <h1 className="text-2xl font-bold">Suscripción vencida</h1>
                <p className="text-muted-foreground">
                    Tu período de acceso ha terminado. Contáctanos para renovar y recuperar el acceso a tu cuenta.
                </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
                {waHref && (
                    <a href={waHref} target="_blank" rel="noopener noreferrer">
                        <Button className="bg-green-600 hover:bg-green-700 text-white w-full sm:w-auto">
                            Contactar por WhatsApp
                        </Button>
                    </a>
                )}
                <Button variant="outline" onClick={logout}>
                    Cerrar sesión
                </Button>
            </div>
        </div>
    );
}
