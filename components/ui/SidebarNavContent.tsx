"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SIDEBAR_MENU_ITEMS } from "./sidebar-config";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/auth-provider";
import type { UserRole } from "@/lib/types";

type MenuItem = (typeof SIDEBAR_MENU_ITEMS)[number] & { roles?: UserRole[] };

interface SidebarNavContentProps {
  /** Desktop: labels hidden when collapsed. Mobile: always show labels. */
  showLabels?: boolean;
  /** Optional class for the list container */
  className?: string;
}

export function SidebarNavContent({ showLabels = true, className }: SidebarNavContentProps) {
  const pathname = usePathname();
  const { user } = useAuth();

  return (
    <ul className={cn("flex flex-1 flex-col gap-1 px-2 py-4", className)}>
      {(SIDEBAR_MENU_ITEMS as readonly MenuItem[]).filter((item) => {
        const roles = item.roles;
        if (!roles) return true;
        if (!user?.role) return false;
        return roles.includes(user.role);
      }).map((item) => (
        <li key={item.href}>
          <Link
            href={item.href}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-foreground transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              pathname === item.href && "bg-accent"
            )}
          >
            <item.icon className="h-5 w-5 shrink-0" />
            {showLabels && <span className="truncate">{item.label}</span>}
          </Link>
        </li>
      ))}
    </ul>
  );
}
