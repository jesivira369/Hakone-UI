"use client";

import Link from "next/link";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Image from "next/image";

export default function RegisterSuccess() {
    return (
        <div className="flex min-h-dvh items-center justify-center bg-muted/30 p-4 sm:p-6">
            <Card className="relative w-full max-w-sm rounded-xl border border-border bg-card p-6 shadow-md sm:max-w-lg sm:p-8">
                <div className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2">
                    <Image
                        src="/HakoneIsotipo.png"
                        alt="Hakone Services Logo"
                        width={160}
                        height={160}
                        className="h-auto w-[140px] max-w-[90vw] sm:w-[180px]"
                    />
                </div>
                <CardHeader className="pt-16 text-center sm:pt-20">
                    <CardTitle className="text-xl">¡Registro Exitoso!</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="mb-4 text-sm text-muted-foreground sm:text-base">Tu cuenta ha sido creada correctamente. Ahora puedes iniciar sesión.</p>
                    <Link href="/login">
                        <Button className="w-full">Ir a Iniciar Sesión</Button>
                    </Link>
                </CardContent>
            </Card>
        </div>
    );
}
