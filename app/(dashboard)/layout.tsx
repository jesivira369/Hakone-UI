"use client";

import { useState, useCallback } from "react";
import { Header } from "@/components/ui/Header";
import { SidebarDesktop } from "@/components/ui/SidebarDesktop";
import { SidebarMobile } from "@/components/ui/SidebarMobile";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarExpanded, setSidebarExpanded] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleMobileMenuOpenChange = useCallback((open: boolean) => {
    setMobileMenuOpen(open);
  }, []);

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-background md:flex-row">
      <SidebarDesktop
        isExpanded={sidebarExpanded}
        onToggle={() => setSidebarExpanded((p) => !p)}
      />
      <SidebarMobile
        open={mobileMenuOpen}
        onOpenChange={handleMobileMenuOpenChange}
      />
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <Header onMenuClick={() => setMobileMenuOpen(true)} />
        <main className="flex min-h-0 flex-1 flex-col overflow-y-auto overflow-x-hidden p-4 md:p-6 xl:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
