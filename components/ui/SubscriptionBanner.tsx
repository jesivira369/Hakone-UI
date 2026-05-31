"use client";

import { AlertTriangle } from "lucide-react";

interface SubscriptionBannerProps {
    graceDaysLeft: number;
}

export function SubscriptionBanner({ graceDaysLeft }: SubscriptionBannerProps) {
    const waPhone = process.env.NEXT_PUBLIC_SUPPORT_WHATSAPP ?? "";
    const waText = encodeURIComponent("Hola, quiero renovar mi suscripción de Hakone.");
    const waHref = waPhone ? `https://wa.me/${waPhone}?text=${waText}` : undefined;

    return (
        <div className="flex items-center justify-between gap-3 bg-amber-500 px-4 py-2 text-sm text-white dark:bg-amber-600">
            <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <span>
                    Tu suscripción venció.{" "}
                    <strong>
                        {graceDaysLeft === 0
                            ? "Hoy es tu último día"
                            : `Te quedan ${graceDaysLeft} día${graceDaysLeft === 1 ? "" : "s"}`}
                    </strong>{" "}
                    antes del bloqueo total.
                </span>
            </div>
            {waHref && (
                <a
                    href={waHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="shrink-0 rounded-md bg-white/20 px-3 py-1 font-medium hover:bg-white/30 transition-colors"
                >
                    Renovar ahora
                </a>
            )}
        </div>
    );
}
