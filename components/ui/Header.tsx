"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { logout } from "@/lib/auth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { User, LogOut, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

export function Header() {
    const router = useRouter();
    const [dropdownOpen, setDropdownOpen] = useState(false);

    const { theme, setTheme } = useTheme()

    return (
        <header className="bg-background border-b">
            <div className="flex items-center justify-between px-6 py-4">
                <h1 className="text-2xl font-semibold text-foreground">Hakone</h1>
                <div className="flex items-center space-x-4">
                    <Button variant="ghost" size="icon" onClick={() => setTheme(theme === "light" ? "dark" : "light")}>
                        <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                        <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                        <span className="sr-only">Toggle theme</span>
                    </Button>
                    <DropdownMenu open={dropdownOpen} onOpenChange={setDropdownOpen}>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="flex items-center space-x-2">
                                <Avatar className="w-8 h-8">
                                    <AvatarFallback>
                                        <User size={18} />
                                    </AvatarFallback>
                                </Avatar>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuItem onClick={() => router.push("/cuenta")}>
                                <User size={16} className="mr-2" /> Cuenta
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={logout} className="text-red-500">
                                <LogOut size={16} className="mr-2" /> Cerrar Sesión
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>
        </header>
    );
}
