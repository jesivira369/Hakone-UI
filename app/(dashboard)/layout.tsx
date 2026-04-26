"use client";

import { useEffect, useState, useCallback } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Header } from "@/components/ui/Header";
import { SidebarDesktop } from "@/components/ui/SidebarDesktop";
import { SidebarMobile } from "@/components/ui/SidebarMobile";
import { useAuth } from "@/context/auth-provider";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isLoading } = useAuth();
  const [sidebarExpanded, setSidebarExpanded] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleMobileMenuOpenChange = useCallback((open: boolean) => {
    setMobileMenuOpen(open);
  }, []);

  useEffect(() => {
    if (isLoading) return;
    if (!user) router.replace(`/login?next=${encodeURIComponent(pathname || "/dashboard")}`);
  }, [isLoading, user, router, pathname]);

  if (isLoading || !user) return null;

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
