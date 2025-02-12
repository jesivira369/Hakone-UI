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
                router.push('/dashboard');
            } else {
                await register(data.email, data.password, data.shopName);
                router.push("/register/success");
            }
        } catch (error) {
            const err = error as AuthError;
            setErrorMessage(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card className="w-full max-w-md mx-auto mt-20 p-6 shadow-lg">
            <CardHeader>
                <CardTitle>{type === "login" ? "Iniciar Sesión" : "Registrarse"}</CardTitle>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 m-2 p-2">
                    <div>
                        <label className="block text-sm font-medium">Correo Electrónico</label>
                        <Input type="email" {...formRegister("email")} className="mt-1" />
                        {errors.email && <p className="text-red-500 text-sm">{errors.email.message}</p>}
                    </div>

                    <div>
                        <label className="block text-sm font-medium">Contraseña</label>
                        <Input type="password" {...formRegister("password")} className="mt-1" />
                        {errors.password && <p className="text-red-500 text-sm">{errors.password.message}</p>}
                    </div>

                    {type === "register" && (
                        <div>
                            <label className="block text-sm font-medium">Nombre de la Tienda</label>
                            <Input type="text" {...formRegister("shopName")} className="mt-1" />
                            {errors.shopName && <p className="text-red-500 text-sm">{errors.shopName.message}</p>}
                        </div>
                    )}

                    <Button type="submit" className="w-full" disabled={loading}>
                        {loading ? "Procesando..." : type === "login" ? "Iniciar Sesión" : "Registrarse"}
                    </Button>
                </form>

                {errorMessage && <p className="text-red-500 mt-2 ml-4">{errorMessage}</p>}

                <div className="mt-4 text-center">
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
    );
}
