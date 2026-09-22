import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Términos y Condiciones | Hakone",
  description: "Términos de uso del servicio Hakone para talleres de bicicletas.",
  alternates: { canonical: "/terminos" },
};

export default function TermsPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16 text-sm leading-relaxed text-muted-foreground">
      <Link href="/" className="text-primary hover:underline">
        &larr; Volver al inicio
      </Link>

      <h1 className="mt-6 mb-8 text-3xl font-bold text-foreground">Términos y Condiciones</h1>

      <p className="mb-6">
        Última actualización: {new Date().toLocaleDateString("es-AR", { year: "numeric", month: "long", day: "numeric" })}
      </p>

      <section className="mb-8 space-y-3">
        <h2 className="text-xl font-bold text-foreground">1. Aceptación</h2>
        <p>
          Al crear una cuenta y usar Hakone, el taller acepta estos términos. Si no estás de
          acuerdo, no debés usar el servicio.
        </p>
      </section>

      <section className="mb-8 space-y-3">
        <h2 className="text-xl font-bold text-foreground">2. El servicio</h2>
        <p>
          Hakone es una aplicación de gestión para talleres de bicicletas: servicios, clientes,
          bicicletas, calendario y facturación. Se ofrece bajo un modelo de suscripción.
        </p>
      </section>

      <section className="mb-8 space-y-3">
        <h2 className="text-xl font-bold text-foreground">3. Cuenta y responsabilidad</h2>
        <p>
          El taller es responsable de la veracidad de los datos que carga y de mantener segura
          su contraseña. Hakone no se hace responsable por el uso indebido de la cuenta por
          terceros con acceso a sus credenciales.
        </p>
      </section>

      <section className="mb-8 space-y-3">
        <h2 className="text-xl font-bold text-foreground">4. Suscripción y pagos</h2>
        <p>
          El acceso al panel requiere una suscripción activa. Ante el vencimiento, el servicio
          puede restringirse según lo indicado en el panel, con un período de gracia previo al
          bloqueo total.
        </p>
      </section>

      <section className="mb-8 space-y-3">
        <h2 className="text-xl font-bold text-foreground">5. Disponibilidad</h2>
        <p>
          Hacemos esfuerzos razonables para mantener el servicio disponible, pero no garantizamos
          disponibilidad ininterrumpida.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold text-foreground">6. Contacto</h2>
        <p>
          Consultas sobre estos términos: sección de{" "}
          <Link href="/#contacto" className="text-primary hover:underline">contacto</Link> de la landing.
        </p>
      </section>
    </main>
  );
}
