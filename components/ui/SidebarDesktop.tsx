"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";
import { SidebarNavContent } from "./SidebarNavContent";

const SIDEBAR_WIDTH_EXPANDED = 224; // 14rem
const SIDEBAR_WIDTH_COLLAPSED = 80;  // 5rem

interface SidebarDesktopProps {
  isExpanded: boolean;
  onToggle: () => void;
}

export function SidebarDesktop({ isExpanded, onToggle }: SidebarDesktopProps) {
  return (
    <motion.aside
      initial={false}
      animate={{ width: isExpanded ? SIDEBAR_WIDTH_EXPANDED : SIDEBAR_WIDTH_COLLAPSED }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      className="inset-y-0 left-0 z-40 hidden shrink-0 flex-col border-r border-border bg-background shadow-lg lg:flex"
    >
      <nav className="flex h-full w-full flex-col">
        <div className="flex h-[72px] items-center gap-2 border-b border-border px-2">
          <button
            type="button"
            onClick={onToggle}
            className="flex h-10 w-10 items-center justify-center rounded-md text-foreground transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label={isExpanded ? "Contraer menú" : "Expandir menú"}
          >
            {isExpanded ? <ChevronLeft className="h-6 w-6" /> : <ChevronRight className="h-6 w-6" />}
          </button>
          {isExpanded && (
            <span className="text-lg font-semibold text-foreground">Menú</span>
          )}
        </div>
        <SidebarNavContent showLabels={isExpanded} />
      </nav>
    </motion.aside>
  );
}
