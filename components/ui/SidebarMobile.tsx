"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "./sheet";
import { SidebarNavContent } from "./SidebarNavContent";

interface SidebarMobileProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SidebarMobile({ open, onOpenChange }: SidebarMobileProps) {
  const pathname = usePathname();

  useEffect(() => {
    onOpenChange(false);
  }, [pathname, onOpenChange]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" showClose={true} className="flex flex-col p-0">
        <SheetHeader className="flex h-[72px] items-center border-b border-border px-4 text-left">
          <SheetTitle>Menú</SheetTitle>
        </SheetHeader>
        <SidebarNavContent showLabels={true} className="px-3" />
      </SheetContent>
    </Sheet>
  );
}
