import type { Metadata } from "next";

// Enlace personal con token en la URL: no se indexa y no se manda como referrer a otros sitios.
export const metadata: Metadata = {
  title: "Mis trabajos",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

export default function MechanicLayout({ children }: { children: React.ReactNode }) {
  return children;
}
