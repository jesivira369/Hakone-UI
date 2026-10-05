'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';

export function Providers({ children }: { children: React.ReactNode }) {
    const [queryClient] = useState(
        () =>
            new QueryClient({
                defaultOptions: {
                    queries: {
                        // Listados y calendario: datos "frescos" 30 s y sin refetch al volver a la
                        // pestaña. Las mutaciones invalidan (lib/invalidateServiceQueries.ts), así que
                        // lo que el usuario cambia se ve al instante; esto solo evita recargas gratuitas.
                        staleTime: 30 * 1000,
                        refetchOnWindowFocus: false,
                        retry: 1,
                    },
                },
            }),
    );

    return (
        <QueryClientProvider client={queryClient}>
            {children}
        </QueryClientProvider>
    );
}
