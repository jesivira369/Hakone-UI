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
                const response = await login(data.email, data.password);
                if (!response || !response.accessToken) {
                    throw new Error("No se recibió un token válido.");
                }
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
        <ThemeProvider forcedTheme="light"> {/* 🔹 Forzar tema claro */}
            <div className="flex items-center justify-center min-h-screen bg-gray-100">
                <Card className="w-full max-w-lg p-8 shadow-lg relative bg-white text-black">
                    <div className="absolute left-1/2 transform -translate-x-1/2 -top-20">
                        <Image
                            src="/HakoneFondoTransparente.png"
                            alt="Hakone Services Logo"
                            width={250}
                            height={250}
                            className="mx-auto"
                        />
                    </div>

                    <CardHeader className="pt-20 text-center mt-6">
                        <CardTitle className="text-xl">{type === "login" ? "Iniciar Sesión" : "Registrarse"}</CardTitle>
                    </CardHeader>

                    <CardContent>
                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium">Correo Electrónico</label>
                                <Input type="email" {...formRegister("email")} className="mt-1 text-lg p-3" />
                                {errors.email && <p className="text-red-500 text-sm">{errors.email.message}</p>}
                            </div>

                            <div>
                                <label className="block text-sm font-medium">Contraseña</label>
                                <Input type="password" {...formRegister("password")} className="mt-1 text-lg p-3" />
                                {errors.password && <p className="text-red-500 text-sm">{errors.password.message}</p>}
                            </div>

                            {type === "register" && (
                                <div>
                                    <label className="block text-sm font-medium">Nombre de la Tienda</label>
                                    <Input type="text" {...formRegister("shopName")} className="mt-1 text-lg p-3" />
                                    {errors.shopName && <p className="text-red-500 text-sm">{errors.shopName.message}</p>}
                                </div>
                            )}

                            <Button type="submit" className="w-full text-lg py-3" disabled={loading}>
                                {loading ? "Procesando..." : type === "login" ? "Iniciar Sesión" : "Registrarse"}
                            </Button>
                        </form>

                        {errorMessage && <p className="text-red-500 mt-2 text-center">{errorMessage}</p>}

                        <div className="mt-6 text-center">
                            {type === "login" ? (
                                <p>
                                    ¿No tienes una cuenta?{" "}
                                    <Link href="/register" className="text-blue-500 hover:underline">
                                        Regístrate aquí
                                    </Link>
                                </p>
                            ) : (
                                <p>
                                    ¿Ya tienes una cuenta?{" "}
                                    <Link href="/login" className="text-blue-500 hover:underline">
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
