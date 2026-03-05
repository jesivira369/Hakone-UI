"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { logout } from "@/lib/auth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { User, LogOut, Moon, Sun, Menu } from "lucide-react";
import { useTheme } from "next-themes";
import Image from "next/image";

interface HeaderProps {
  onMenuClick?: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  const router = useRouter();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const { theme, setTheme } = useTheme();

  return (
    <header className="shrink-0 border-b border-border bg-background">
      <div className="flex items-center justify-between gap-4 px-4 py-3 md:px-6 md:py-4">
        <div className="flex min-w-0 items-center gap-3">
          {onMenuClick && (
            <Button
              variant="ghost"
              size="icon"
              className="shrink-0 lg:hidden"
              onClick={onMenuClick}
              aria-label="Abrir menú"
            >
              <Menu className="h-5 w-5" />
            </Button>
          )}
          <div className="min-w-0">
            {mounted && (
              <Image
                src={theme === "dark" ? "/HakoneLogoBlanco.svg" : "/HakoneLogo.png"}
                alt="Hakone Services Logo"
                width={150}
                height={50}
                className="h-8 w-auto md:h-10"
              />
            )}
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1 md:gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === "light" ? "dark" : "light")}
            className="focus-visible:ring-2 focus-visible:ring-ring"
            aria-label={theme === "dark" ? "Cambiar a tema claro" : "Cambiar a tema oscuro"}
          >
            <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          </Button>
          <DropdownMenu open={dropdownOpen} onOpenChange={setDropdownOpen}>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="flex items-center gap-2 focus-visible:ring-2 focus-visible:ring-ring"
              >
                <Avatar className="h-8 w-8">
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
