"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { usePathname } from "next/navigation";
import { AuthUser } from "@/lib/types";
import { getMe, login as apiLogin, logout as apiLogout } from "@/lib/auth";

interface AuthContextType {
    user: AuthUser | null;
    isLoading: boolean;
    login: (email: string, password: string) => Promise<void>;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<AuthUser | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        let cancelled = false;

        (async () => {
            // Evita spamear /auth/me en pantallas públicas (previene loops y requests innecesarios).
            if (pathname?.startsWith("/login") || pathname?.startsWith("/register")) {
                if (!cancelled) setIsLoading(false);
                return;
            }

            try {
                const me = await getMe();
                if (!cancelled) setUser(me.user as AuthUser);
            } catch {
                if (!cancelled) setUser(null);
            } finally {
                if (!cancelled) setIsLoading(false);
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [pathname]);

    const login = async (email: string, password: string) => {
        setIsLoading(true);
        const data = await apiLogin(email, password);
        setUser(data.user as AuthUser);
        setIsLoading(false);
        router.push("/dashboard");
    };

    const logout = () => {
        setUser(null);
        apiLogout();
        router.push("/login");
    };

    return (
        <AuthContext.Provider value={{ user, isLoading, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
}
