"use client";

import Link from "next/link";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function RegisterSuccess() {
    return (
        <div className="flex items-center justify-center min-h-full">
            <Card className="w-full max-w-md p-6 shadow-lg text-center">
                <CardHeader>
                    <CardTitle>¡Registro Exitoso!</CardTitle>
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
