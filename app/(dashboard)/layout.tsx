"use client";

import { useState } from "react";
import { Header } from "@/components/ui/Header";
import { Sidebar } from "@/components/ui/Sidebar";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const [isExpanded, setIsExpanded] = useState(true);

    return (
        <div className="flex h-screen bg-background overflow-hidden">
            <Sidebar isExpanded={isExpanded} setIsExpanded={setIsExpanded} />
            <div className={`flex flex-1 flex-col transition-all duration-300 ${isExpanded ? "w-cal(100 - 14rem)" : "w-full"}`}>
                <Header />
                <main className="flex-1 overflow-x-hidden overflow-y-auto bg-background p-2 w-full">{children}</main>
            </div>
        </div>
    );
}