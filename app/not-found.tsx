import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
      <p className="text-sm font-bold uppercase tracking-widest text-primary">404</p>
      <h1 className="text-3xl font-bold">Esta página no existe</h1>
      <p className="max-w-md text-muted-foreground">
        Puede que el link esté roto o que la página se haya movido. Volvé al inicio para seguir
        navegando.
      </p>
      <Button asChild className="mt-2">
        <Link href="/">Volver al inicio</Link>
      </Button>
    </main>
  );
}
