"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Bike, ClipboardList, Home, Menu, Users, X } from "lucide-react"
import { motion } from "framer-motion"

const menuItems = [
    { icon: Home, label: "Dashboard", href: "/" },
    { icon: ClipboardList, label: "Servicios", href: "/servicios" },
    { icon: Users, label: "Clientes", href: "/clientes" },
    { icon: Bike, label: "Bicicletas", href: "/bicicletas" },
]

export function Sidebar() {
    const [isOpen, setIsOpen] = useState(false)
    const pathname = usePathname()

    return (
        <>
            <button
                className="fixed p-2 text-foreground bg-background rounded-md lg:hidden top-4 left-4 z-50"
                onClick={() => setIsOpen(!isOpen)}
            >
                {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>

            <motion.aside
                className="fixed inset-y-0 left-0 z-40 w-64 bg-background border-r border-border shadow-lg lg:translate-x-0"
                initial={{ x: "-100%" }}
                animate={{ x: isOpen ? 0 : "-100%" }}
                transition={{ duration: 0.3 }}
            >
                <nav className="flex flex-col h-full">
                    <div className="flex items-center justify-center h-16 bg-primary">
                        <span className="text-2xl font-semibold text-primary-foreground">Hakone</span>
                    </div>
                    <ul className="flex-1 px-4 py-4 space-y-2">
                        {menuItems.map((item, index) => (
                            <motion.li
                                key={item.href}
                                initial={{ opacity: 0, x: -50 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.1 }}
                            >
                                <Link
                                    href={item.href}
                                    className={`flex items-center px-4 py-2 text-foreground rounded-lg hover:bg-accent ${pathname === item.href ? "bg-accent" : ""
                                        }`}
                                >
                                    <item.icon className="w-5 h-5 mr-3" />
                                    {item.label}
                                </Link>
                            </motion.li>
                        ))}
                    </ul>
                </nav>
            </motion.aside>
        </>
    )
}