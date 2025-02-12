'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { login, register } from '@/lib/auth';

type AuthFormProps = {
    type: 'login' | 'register';
};

type FormData = {
    email: string;
    password: string;
};

export function AuthForm({ type }: AuthFormProps) {
    const {
        register: formRegister,
        handleSubmit,
        formState: { errors },
    } = useForm<FormData>();
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');

    const onSubmit = async (data: FormData) => {
        setLoading(true);
        setErrorMessage('');

        try {
            if (type === 'login') {
                await login(data.email, data.password);
            } else {
                await register(data.email, data.password);
            }
            router.push('/dashboard');
        } catch (error) {
            setErrorMessage(error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card className="w-full max-w-md mx-auto mt-20 p-6 shadow-lg">
            <CardHeader>
                <CardTitle>{type === 'login' ? 'Iniciar Sesión' : 'Registrarse'}</CardTitle>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 m-2 p-2">
                    <div>
                        <label className="block text-sm font-medium">Correo Electrónico</label>
                        <Input
                            type="email"
                            {...formRegister('email', { required: 'El correo es obligatorio' })}
                            className="mt-1"
                        />
                        {errors.email && <p className="text-red-500 text-sm">{errors.email.message}</p>}
                    </div>

                    <div>
                        <label className="block text-sm font-medium">Contraseña</label>
                        <Input
                            type="password"
                            {...formRegister('password', { required: 'La contraseña es obligatoria' })}
                            className="mt-1"
                        />
                        {errors.password && <p className="text-red-500 text-sm">{errors.password.message}</p>}
                    </div>

                    <Button type="submit" className="w-full" disabled={loading}>
                        {loading ? 'Procesando...' : type === 'login' ? 'Iniciar Sesión' : 'Registrarse'}
                    </Button>
                </form>
                {errorMessage && <p className="text-red-500 mt-2 ml-4">{errorMessage}</p>}
            </CardContent>
        </Card>
    );
}
