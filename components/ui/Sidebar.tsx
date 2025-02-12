"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bike, ClipboardList, Home, Users, ChevronLeft, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";

const menuItems = [
    { icon: Home, label: "Dashboard", href: "/dashboard" },
    { icon: ClipboardList, label: "Servicios", href: "/servicios" },
    { icon: Users, label: "Clientes", href: "/clientes" },
    { icon: Bike, label: "Bicicletas", href: "/bicicletas" },
];

export function Sidebar() {
    const [isExpanded, setIsExpanded] = useState(true);
    const pathname = usePathname();

    return (
        <motion.aside
            className={`fixed inset-y-0 left-0 z-40 bg-background border-r border-border shadow-lg transition-all duration-300 ${isExpanded ? "w-56" : "w-20"
                } lg:relative lg:flex`}
        >
            <nav className="flex flex-col h-full">
                <div className={`flex items-center h-[72px] ${isExpanded ? "w-56" : "w-20"} w-20 px-2 bg-primary`}>
                    <button
                        className="py-2 px-4 text-primary-foreground hover:bg-primary-foreground/20 rounded-md"
                        onClick={() => setIsExpanded(!isExpanded)}
                    >
                        {isExpanded ? <ChevronLeft size={28} /> : <ChevronRight size={28} />}
                    </button>
                    <span className={`text-2xl font-semibold text-primary-foreground transition-all duration-300 ${isExpanded ? "opacity-100" : "opacity-0 hidden"
                        }`}>Menu</span>
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
                                className={`flex items-center px-4 py-2 text-foreground rounded-lg hover:bg-accent transition-all duration-200 ${pathname === item.href ? "bg-accent" : ""
                                    }`}
                            >
                                <item.icon className="w-5 h-5" />
                                <span className={`ml-3 transition-all duration-300 ${isExpanded ? "opacity-100" : "opacity-0 hidden"}`}>
                                    {item.label}
                                </span>
                            </Link>
                        </motion.li>
                    ))}
                </ul>
            </nav>
        </motion.aside>
    );
}
