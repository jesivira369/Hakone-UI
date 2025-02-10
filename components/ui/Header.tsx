"use client"

import { useTheme } from "next-themes"
import { Moon, Sun } from "lucide-react"
import { Button } from "@/components/ui/button"

export function Header() {
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
                    <div className="w-10 h-10 bg-gray-300 dark:bg-gray-700 rounded-full">{/* Aquí iría el logo o avatar */}</div>
                </div>
            </div>
        </header>
    )
}