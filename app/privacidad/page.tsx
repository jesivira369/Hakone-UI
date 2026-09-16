import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Política de Privacidad | Hakone",
  description: "Cómo Hakone recopila, usa y protege los datos de talleres y clientes.",
  alternates: { canonical: "/privacidad" },
};

export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16 text-sm leading-relaxed text-muted-foreground">
      <Link href="/" className="text-primary hover:underline">
        &larr; Volver al inicio
      </Link>

      <h1 className="mt-6 mb-8 text-3xl font-bold text-foreground">Política de Privacidad</h1>

      <p className="mb-6">
        Última actualización: {new Date().toLocaleDateString("es-AR", { year: "numeric", month: "long", day: "numeric" })}
      </p>

      <section className="mb-8 space-y-3">
        <h2 className="text-xl font-bold text-foreground">1. Datos que recopilamos</h2>
        <p>
          Al usar Hakone recopilamos los datos que el taller carga para operar (clientes,
          bicicletas, servicios y pagos) y datos técnicos básicos de la cuenta (email, nombre
          del taller) necesarios para brindar el servicio.
        </p>
      </section>

      <section className="mb-8 space-y-3">
        <h2 className="text-xl font-bold text-foreground">2. Uso de los datos</h2>
        <p>
          Los datos se usan exclusivamente para operar la plataforma: gestión de servicios,
          facturación, recordatorios y soporte. No vendemos datos a terceros.
        </p>
      </section>

      <section className="mb-8 space-y-3">
        <h2 className="text-xl font-bold text-foreground">3. Almacenamiento y seguridad</h2>
        <p>
          Los datos se almacenan en infraestructura con controles de acceso y cifrado en
          tránsito. El acceso a la información de cada taller está restringido a sus propios
          usuarios.
        </p>
      </section>

      <section className="mb-8 space-y-3">
        <h2 className="text-xl font-bold text-foreground">4. Derechos del usuario</h2>
        <p>
          Podés solicitar la exportación o eliminación de tus datos escribiéndonos a través del
          formulario de <Link href="/#contacto" className="text-primary hover:underline">contacto</Link>.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold text-foreground">5. Contacto</h2>
        <p>
          Ante cualquier consulta sobre privacidad, escribinos desde la sección de{" "}
          <Link href="/#contacto" className="text-primary hover:underline">contacto</Link> de la landing.
        </p>
      </section>
    </main>
  );
}
