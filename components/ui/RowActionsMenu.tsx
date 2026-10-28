"use client";

import { Fragment, type ReactNode } from "react";
import { MoreVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export interface RowAction {
    label: string;
    icon: ReactNode;
    onSelect: () => void;
    destructive?: boolean;
    /** Separador antes de este ítem (por ejemplo, para aislar "Borrar"). */
    separatorBefore?: boolean;
}

interface RowActionsMenuProps {
    items: RowAction[];
    /** Nombre accesible del botón ⋮, por ejemplo "Acciones del cliente". */
    ariaLabel: string;
}

/**
 * Menú ⋮ de una fila de DataTable. Cada tabla pasa sus propias acciones.
 * El contenedor frena el click: abrir el menú no debe navegar al detalle
 * (la fila entera puede ser clicable). Como los portales de React burbujean
 * por el árbol del componente, también frena los clicks de los ítems.
 */
export function RowActionsMenu({ items, ariaLabel }: RowActionsMenuProps) {
    return (
        <div className="flex justify-end" onClick={(e) => e.stopPropagation()}>
            <DropdownMenu modal={false}>
                <DropdownMenuTrigger asChild>
                    <Button size="sm" variant="ghost" aria-label={ariaLabel} className="h-8 w-8 p-0">
                        <MoreVertical size={16} />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    {items.map((item) => (
                        <Fragment key={item.label}>
                            {item.separatorBefore && <DropdownMenuSeparator />}
                            <DropdownMenuItem
                                className={item.destructive ? "text-destructive focus:text-destructive" : undefined}
                                onSelect={item.onSelect}
                            >
                                <span className="mr-2 inline-flex">{item.icon}</span>
                                {item.label}
                            </DropdownMenuItem>
                        </Fragment>
                    ))}
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    );
}
