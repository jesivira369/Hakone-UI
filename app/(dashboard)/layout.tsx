"use client";

import { Header } from "@/components/ui/Header";
import { Sidebar } from "@/components/ui/Sidebar";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="flex h-screen bg-background">
            <Sidebar />
            <div className="flex flex-col flex-1 overflow-hidden">
                <Header />
                <main className="flex-1 overflow-x-hidden overflow-y-auto bg-background p-6">{children}</main>
            </div>
        </div>
    );
}