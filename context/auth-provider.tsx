"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import { AuthUser } from "@/lib/types";

interface AuthContextType {
    user: AuthUser | null;
    token: string | null;
    login: (token: string, userData: AuthUser) => void;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<AuthUser | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const router = useRouter();

    useEffect(() => {
        const storedToken = Cookies.get("token");
        const storedUser = Cookies.get("user");

        if (storedToken) {
            setToken(storedToken);
            setUser(storedUser ? (JSON.parse(storedUser) as AuthUser) : null);
        }
    }, []);

    const login = (token: string, userData: AuthUser) => {
        Cookies.set("token", token, { expires: 1 });
        Cookies.set("user", JSON.stringify(userData), { expires: 1 });
        setToken(token);
        setUser(userData);
        router.push("/dashboard");
    };

    const logout = () => {
        Cookies.remove("token");
        Cookies.remove("user");
        setToken(null);
        setUser(null);
        router.push("/login");
    };

    return (
        <AuthContext.Provider value={{ user, token, login, logout }}>
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
