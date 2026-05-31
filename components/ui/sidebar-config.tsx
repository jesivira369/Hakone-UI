import { Bike, Calendar, ClipboardList, Home, Users, Wrench, ShieldCheck } from "lucide-react";

export const SIDEBAR_MENU_ITEMS = [
  { icon: Home, label: "Dashboard", href: "/dashboard" },
  { icon: Calendar, label: "Calendario", href: "/calendar" },
  { icon: ClipboardList, label: "Servicios", href: "/services" },
  { icon: Users, label: "Clientes", href: "/clients" },
  { icon: Bike, label: "Bicicletas", href: "/bikes" },
  { icon: Wrench, label: "Mecánicos", href: "/mechanics" },
  // Solo SUPER_ADMIN
  { icon: ShieldCheck, label: "Super Admin", href: "/admin", roles: ["SUPER_ADMIN"] },
] as const;
