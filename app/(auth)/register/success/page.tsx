"use client";

import Link from "next/link";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Image from "next/image";

export default function RegisterSuccess() {
    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100">
            <Card className="w-full max-w-lg p-8 shadow-lg relative">
                <div className="absolute left-1/2 transform -translate-x-1/2 -top-20">
                    <Image
                        src="/HakoneIsotipo.png"
                        alt="Hakone Services Logo"
                        width={180}
                        height={180}
                        className="mx-auto"
                    />
                </div>
                <CardHeader className="pt-20 text-center mt-6">
                    <CardTitle className="text-xl">¡Registro Exitoso!</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="mb-4">Tu cuenta ha sido creada correctamente. Ahora puedes iniciar sesión.</p>
                    <Link href="/login">
                        <Button className="w-full">Ir a Iniciar Sesión</Button>
                    </Link>
                </CardContent>
            </Card>
        </div>
    );
}
