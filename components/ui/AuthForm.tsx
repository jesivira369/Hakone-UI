"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { login, register } from "@/lib/auth";
import { authSchema, registerSchema } from "@/lib/schemas";
import { AuthError, AuthData } from "@/lib/types";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { useRouter } from 'next/navigation';
import Image from "next/image";
import { ThemeProvider } from "next-themes";

type AuthFormProps = {
    type: "login" | "register";
};

export function AuthForm({ type }: AuthFormProps) {
    const [loading, setLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const {
        register: formRegister,
        handleSubmit,
        formState: { errors },
    } = useForm<AuthData>({
        resolver: zodResolver(type === "login" ? authSchema : registerSchema),
    });

    const router = useRouter();

    const onSubmit = async (data: AuthData) => {
        setLoading(true);
        setErrorMessage(null);

        try {
            if (type === "login") {
                await login(data.email, data.password);
                router.replace("/dashboard");
            } else {
                const response = await register(data.email, data.password, data.shopName);
                if (!response) {
                    throw new Error("Registro fallido.");
                }
                router.replace("/register/success");
            }
        } catch (error) {
            const err = error as AuthError;
            setErrorMessage(err.message);
        } finally {
            setLoading(false);
        }
    };


    return (
        <ThemeProvider forcedTheme="light">
            <div className="flex min-h-dvh items-center justify-center bg-muted/30 p-4 sm:p-6">
                <Card className="relative w-full max-w-sm rounded-xl border border-border bg-card p-6 shadow-md sm:max-w-lg sm:p-8">
                    <div className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2">
                        <Image
                            src="/HakoneFondoTransparente.png"
                            alt="Hakone Services Logo"
                            width={200}
                            height={200}
                            className="h-auto w-[180px] max-w-[90vw] sm:w-[220px]"
                        />
                    </div>

                    <CardHeader className="pt-16 text-center sm:pt-20">
                        <CardTitle className="text-xl">{type === "login" ? "Iniciar Sesión" : "Registrarse"}</CardTitle>
                    </CardHeader>

                    <CardContent>
                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 sm:space-y-6">
                            <div>
                                <label className="block text-sm font-medium">Correo Electrónico</label>
                                <Input type="email" {...formRegister("email")} className="mt-1 p-3 text-base sm:text-lg" />
                                {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
                            </div>

                            <div>
                                <label className="block text-sm font-medium">Contraseña</label>
                                <Input type="password" {...formRegister("password")} className="mt-1 p-3 text-base sm:text-lg" />
                                {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
                            </div>

                            {type === "register" && (
                                <div>
                                    <label className="block text-sm font-medium">Nombre de la Tienda</label>
                                    <Input type="text" {...formRegister("shopName")} className="mt-1 p-3 text-base sm:text-lg" />
                                    {errors.shopName && <p className="text-sm text-destructive">{errors.shopName.message}</p>}
                                </div>
                            )}

                            <Button type="submit" className="w-full py-3 text-base sm:text-lg" disabled={loading}>
                                {loading ? "Procesando..." : type === "login" ? "Iniciar Sesión" : "Registrarse"}
                            </Button>
                        </form>

                        {errorMessage && <p className="mt-2 text-center text-sm text-destructive">{errorMessage}</p>}

                        <div className="mt-6 text-center text-sm">
                            {type === "login" ? (
                                <p>
                                    {/* Registro deshabilitado: creación de usuarios solo por admin */}
                                </p>
                            ) : (
                                <p>
                                    ¿Ya tienes una cuenta?{" "}
                                    <Link href="/login" className="text-primary underline-offset-4 hover:underline">
                                        Inicia sesión
                                    </Link>
                                </p>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </ThemeProvider>
    );
}
