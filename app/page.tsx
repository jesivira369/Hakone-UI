"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  ArrowRight,
  BarChart3,
  Calendar,
  CheckCircle2,
  ClipboardList,
  Instagram,
  Linkedin,
  Mail,
  ShieldCheck,
  Users,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Input } from "@/components/ui/input";
import api from "@/lib/axiosInstance";
import { toast } from "react-toastify";

const fadeIn = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.6 },
};

const contactSchema = z.object({
  name: z.string().min(2, "Tu nombre es requerido"),
  shopName: z.string().min(2, "El nombre de la tienda es requerido"),
  phone: z
    .string()
    .min(6, "El teléfono debe tener al menos 6 caracteres")
    .regex(/^[+\d][\d\s\-().+]*$/, "Solo se permiten números"),
  email: z.string().email("Debe ser un email válido"),
  message: z.string().min(5, "Escribe un comentario").max(2000, "Máximo 2000 caracteres"),
});

type ContactForm = z.infer<typeof contactSchema>;

export default function LandingPage() {
  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ContactForm>({
    resolver: zodResolver(contactSchema),
    defaultValues: { name: "", shopName: "", phone: "", email: "", message: "" },
  });

  const onSubmitContact = async (data: ContactForm) => {
    try {
      await api.post("/contact-requests", data);
      toast.success("¡Listo! Te contactaremos pronto.", {
        className: "bg-green-600 text-white border border-green-700",
      });
      reset();
    } catch (e: unknown) {
      const msg =
        e instanceof Error ? e.message : "No pudimos enviar tu mensaje. Intenta de nuevo.";
      toast.error(msg, {
        className: "bg-red-600 text-white border border-red-700",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary/30">
      {/* --- NAV --- */}
      <nav className="fixed top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-md">
        <div className="container mx-auto flex min-h-16 items-center justify-between gap-3 px-4 py-3">
          <Link href="/" className="flex shrink-0 items-center gap-2 sm:gap-3">
            <Image
              src="/HakoneIsotipo.png"
              alt="Hakone"
              width={32}
              height={32}
              className="h-8 w-8 rounded-full"
              priority
            />
            <span className="text-lg font-bold tracking-tight sm:text-xl">HAKONE</span>
          </Link>

          <div className="hidden items-center gap-4 text-xs font-medium text-muted-foreground md:flex lg:gap-8 lg:text-sm">
            <a href="#features" className="transition-colors hover:text-primary">
              Funcionalidades
            </a>
            <a href="#solutions" className="transition-colors hover:text-primary">
              Soluciones
            </a>
            <a href="#pricing" className="transition-colors hover:text-primary">
              Planes
            </a>
            <a href="#contacto" className="transition-colors hover:text-primary">
              Contacto
            </a>
            <a href="#faq" className="transition-colors hover:text-primary">
              FAQ
            </a>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <Button
              asChild
              variant="outline"
              className="h-9 rounded-full px-3 text-sm whitespace-nowrap md:px-4 lg:h-10 lg:px-5"
            >
              <Link href="/login">Iniciar sesión</Link>
            </Button>
            <Button
              asChild
              variant="default"
              className="h-9 rounded-full bg-primary px-3 text-sm text-white whitespace-nowrap hover:bg-primary/90 md:px-4 lg:h-10 lg:px-6"
            >
              <a href="#contacto">Probar Hakone</a>
            </Button>
          </div>
        </div>
      </nav>

      {/* --- HERO --- */}
      <section className="relative overflow-hidden pb-20 pt-32">
        <div className="absolute inset-0 -z-10">
          <div className="absolute left-1/2 top-0 h-full w-full -translate-x-1/2 bg-[radial-gradient(45%_40%_at_50%_20%,hsl(var(--primary)/0.14)_0%,transparent_70%)]" />
          <div className="absolute -left-20 -top-20 h-72 w-72 rounded-full bg-primary/10 blur-[120px]" />
          <div className="absolute -bottom-20 -right-20 h-72 w-72 rounded-full bg-accent/10 blur-[120px]" />
        </div>
        <div className="container mx-auto px-4 text-center">
          <motion.div {...fadeIn}>
            <span className="mb-6 inline-block rounded-full border border-accent/20 bg-accent/10 px-4 py-1.5 text-xs font-semibold tracking-widest text-accent uppercase">
              SaaS para talleres de elite
            </span>
            <h1 className="mb-6 text-5xl font-extrabold tracking-tight md:text-7xl">
              Gestioná tu taller en <br />
              <span className="bg-gradient-to-r from-primary via-accent to-highlight bg-clip-text text-transparent">
                un solo lugar.
              </span>
            </h1>
            <p className="mx-auto mb-10 max-w-2xl text-lg text-muted-foreground md:text-xl">
              Gestioná agenda, servicios, clientes y métricas en un solo lugar. Ordená la operación diaria y reducí
              tiempos muertos desde la recepción hasta el mecánico.
            </p>
            <div className="flex flex-col justify-center gap-4 sm:flex-row">
              <Button asChild size="lg" className="h-12 bg-primary px-8 text-base transition-transform hover:scale-105">
                <a href="#contacto">Solicitar demo gratuita</a>
              </Button>
              <Button asChild size="lg" variant="outline" className="h-12 px-8 text-base">
                <a href="#features">Ver funcionalidades</a>
              </Button>
            </div>
          </motion.div>

          {/* MOCKUP */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.8 }}
            className="relative mx-auto mt-16 max-w-6xl"
          >
            <div className="overflow-hidden rounded-2xl border border-border bg-card p-2 shadow-[0_0_50px_rgba(0,0,0,0.10)] dark:shadow-[0_0_50px_rgba(0,0,0,0.30)]">
              <div className="relative aspect-[16/9] overflow-hidden rounded-xl border border-border/50 bg-muted/20">
                <Image
                  src="/01-dashboard-light.png"
                  alt="Vista previa de Hakone"
                  width={1200}
                  height={675}
                  className="h-full w-full object-contain p-3 md:p-4 opacity-95"
                  priority
                />
              </div>
            </div>

            <div className="absolute -right-6 -top-6 hidden rounded-xl border border-border bg-background p-4 shadow-xl lg:block">
              <BarChart3 className="h-6 w-6 text-primary" />
            </div>

            <div className="absolute -bottom-6 -left-6 hidden rounded-xl border border-border bg-background p-4 shadow-2xl lg:block">
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-green-500/10 p-2 text-green-600 dark:text-green-400">
                  <CheckCircle2 className="h-5 w-5" />
                </div>
                <div className="text-left">
                  <p className="text-xs font-bold uppercase text-muted-foreground">Servicios hoy</p>
                  <p className="text-lg font-bold">+14 bicis</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* --- TRUST --- */}
      <section className="border-y border-border/50 bg-muted/10 py-12">
        <div className="container mx-auto px-4">
          <p className="mb-8 text-center text-xs font-bold tracking-widest text-muted-foreground uppercase">
            Talleres que confían en nosotros
          </p>
          <div className="flex flex-wrap justify-center gap-8 opacity-40 grayscale md:gap-16">
            <div className="text-2xl font-black italic tracking-tighter">SPECIALIZED</div>
            <div className="text-2xl font-black italic tracking-tighter">TREK</div>
            <div className="text-2xl font-black italic tracking-tighter">CANNONDALE</div>
            <div className="text-2xl font-black italic tracking-tighter">SCOTT</div>
            <div className="text-2xl font-black italic tracking-tighter">GIANT</div>
          </div>
        </div>
      </section>

      {/* --- FEATURES --- */}
      <section id="features" className="bg-muted/30 py-24">
        <div className="container mx-auto px-4">
          <div className="mb-16 max-w-3xl">
            <h2 className="mb-3 text-sm font-bold tracking-widest text-accent uppercase underline decoration-primary underline-offset-4">
              Beneficios
            </h2>
            <p className="text-4xl font-bold tracking-tight">
              Todo bajo control,
              <br />
              para que vos solo pedalees.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {[
              {
                icon: <Calendar className="h-6 w-6" />,
                title: "Agenda inteligente",
                desc: "Planificá la semana y evitá cuellos de botella en el taller.",
              },
              {
                icon: <ClipboardList className="h-6 w-6" />,
                title: "Órdenes de servicio",
                desc: "Digitalizá cada ingreso con estados claros para todo el equipo.",
              },
              {
                icon: <Users className="h-6 w-6" />,
                title: "Gestión de clientes",
                desc: "Historial por bicicleta: qué se hizo, cuándo y quién lo realizó.",
              },
              {
                icon: <BarChart3 className="h-6 w-6" />,
                title: "Métricas pro",
                desc: "Conocé tu facturación, servicios más pedidos y eficiencia del equipo.",
              },
              {
                icon: <ShieldCheck className="h-6 w-6" />,
                title: "Roles de equipo",
                desc: "Accesos diferenciados para mecánicos, recepción y admin.",
              },
              {
                icon: <Zap className="h-6 w-6" />,
                title: "Modo oscuro",
                desc: "Interfaz optimizada para cualquier ambiente de trabajo.",
              },
            ].map((f, i) => (
              <motion.div key={f.title} {...fadeIn} transition={{ delay: i * 0.08 }}>
                <Card className="h-full border-border/60 bg-card p-8 transition-all hover:border-primary/50 hover:shadow-lg">
                  <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary transition-transform group-hover:scale-110">
                    {f.icon}
                  </div>
                  <h3 className="mb-2 text-xl font-semibold">{f.title}</h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">{f.desc}</p>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* --- SOLUTIONS / DEEP DIVE --- */}
      <section id="solutions" className="bg-muted/20 py-24">
        <div className="container mx-auto space-y-24 px-4">
          <div className="flex flex-col items-center justify-between gap-6 text-center lg:flex-row lg:text-left">
            <div className="max-w-2xl">
              <h2 className="text-4xl font-bold tracking-tight">Soluciones pensadas para el día a día</h2>
              <p className="mt-4 text-lg text-muted-foreground">
                Menos idas y vueltas. Más claridad. Todo lo que pasa en el taller, ordenado y visible.
              </p>
            </div>
            <Button asChild variant="outline" className="rounded-full">
              <Link href="/login" className="inline-flex items-center gap-2">
                Ver el producto <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>

          {/* Highlight 01 */}
          <div className="grid items-center gap-10 lg:grid-cols-2">
            <div className="space-y-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent/20 text-accent font-bold">
                01
              </div>
              <h3 className="text-4xl font-bold">Un dashboard que habla por vos</h3>
              <p className="text-lg leading-relaxed text-muted-foreground">
                Visualizá ingresos, estados de órdenes activas y próximos servicios en una sola pantalla. Decidí con
                datos, no con suposiciones.
              </p>
              <ul className="space-y-3">
                {["Ingresos y rendimiento", "Top clientes", "Visibilidad operativa"].map((item) => (
                  <li key={item} className="flex items-center gap-3 text-sm font-medium">
                    <CheckCircle2 className="h-5 w-5 text-primary" /> {item}
                  </li>
                ))}
              </ul>
            </div>

            <Card className="relative aspect-video overflow-hidden rounded-2xl border border-border bg-card shadow-2xl">
              <div className="absolute inset-0 flex items-center justify-center bg-muted/20">
                <Image
                  src="/02-services-list-light.png"
                  alt="Vista de servicios"
                  width={1100}
                  height={650}
                  className="h-full w-full object-contain p-2 md:p-4 opacity-95"
                />
              </div>
            </Card>
          </div>

          {/* Highlight 02 */}
          <div className="grid items-center gap-10 lg:grid-cols-2">
            <Card className="order-2 relative aspect-video overflow-hidden rounded-2xl border border-border bg-card shadow-2xl lg:order-1">
              <div className="absolute inset-0 flex items-center justify-center bg-muted/20">
                <Image
                  src="/04-calendar-week-light.png"
                  alt="Servicios y trazabilidad"
                  width={900}
                  height={900}
                  className="h-full w-full object-contain p-2 md:p-4 opacity-95"
                />
              </div>
            </Card>

            <div className="order-1 space-y-6 lg:order-2">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/20 text-primary font-bold">
                02
              </div>
              <h3 className="text-4xl font-bold">Calendario y planificación</h3>
              <p className="text-lg leading-relaxed text-muted-foreground">
                Organizá la carga de trabajo por fecha programada o entrega. Evitá solapamientos y anticipá picos de
                demanda con una vista semanal clara.
              </p>
              <Button asChild variant="link" className="h-auto p-0 font-bold text-primary">
                <a href="#contacto" className="inline-flex items-center gap-2">
                  Conocer más sobre el calendario <ArrowRight className="h-4 w-4" />
                </a>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* --- PRICING (placeholder) --- */}
      <section id="pricing" className="bg-muted/30 py-24">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-4xl font-bold">Un plan simple, todo incluido</h2>
            <p className="mt-4 text-muted-foreground">
              Empezá con todo lo que necesitás para operar el taller. Si necesitás algo a medida (sucursales,
              integraciones o onboarding), lo vemos juntos.
            </p>
          </div>

          <div className="mx-auto mt-12 max-w-3xl">
            <Card className="relative border-border/60 bg-primary/5 p-8 shadow-2xl">
              <div className="absolute right-0 top-0 rounded-bl-lg bg-primary px-3 py-1 text-[10px] font-bold text-white uppercase">
                Más elegido
              </div>

              <div className="text-lg font-bold text-primary">Plan Único</div>
              <div className="mt-4 flex items-baseline justify-center gap-2 text-center md:justify-start md:text-left">
                <span className="text-4xl font-bold">$20</span>
                <span className="text-sm text-muted-foreground">/mes</span>
              </div>

              <ul className="mt-6 grid gap-3 text-sm text-muted-foreground sm:grid-cols-2">
                {[
                  "Mecánicos ilimitados",
                  "Agenda y calendario",
                  "Servicios con estados y trazabilidad",
                  "Clientes y bicicletas (historial)",
                  "Métricas del negocio",
                  "Roles y permisos",
                ].map((perk) => (
                  <li key={perk} className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                    {perk}
                  </li>
                ))}
              </ul>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
                <Button
                  asChild
                  className="w-full rounded-full bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/30 sm:w-auto"
                >
                  <a href="#contacto">Empezar ahora</a>
                </Button>

                <Button asChild variant="link" className="h-auto p-0 font-bold text-primary">
                  <a href="#faq" className="inline-flex items-center gap-2">
                    ¿Necesitás algo a medida? Hablemos <ArrowRight className="h-4 w-4" />
                  </a>
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* --- CONTACTO (lead form) --- */}
      <section id="contacto" className="bg-muted/20 py-24">
        <div className="container mx-auto max-w-4xl px-4">
          <div className="mx-auto mb-10 max-w-2xl text-center">
            <h2 className="text-3xl font-bold sm:text-4xl">Contacto</h2>
            <p className="mt-3 text-muted-foreground">
              Dejanos tus datos y un comentario. Te contactaremos para ayudarte a implementar Hakone en tu taller.
            </p>
          </div>

          <Card className="border-border/60 bg-card p-6 shadow-lg sm:p-8">
            <form onSubmit={handleSubmit(onSubmitContact)} className="space-y-4 sm:space-y-5">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium">Nombre</label>
                  <Input {...register("name")} placeholder="Tu nombre" className="mt-1" />
                  {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium">Tienda</label>
                  <Input {...register("shopName")} placeholder="Nombre del taller" className="mt-1" />
                  {errors.shopName && <p className="text-sm text-destructive">{errors.shopName.message}</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium">Teléfono</label>
                  <Input
                    {...register("phone")}
                    placeholder="Ej: +54 11 1234-5678"
                    className="mt-1"
                    onChange={(e) => {
                      const value = e.target.value.replace(/[^\d\s+\-().]/g, "");
                      setValue("phone", value);
                    }}
                  />
                  {errors.phone && <p className="text-sm text-destructive">{errors.phone.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium">Email</label>
                  <Input type="email" {...register("email")} placeholder="taller@email.com" className="mt-1" />
                  {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium">Comentario</label>
                <textarea
                  {...register("message")}
                  className="mt-1 w-full rounded-md border border-border bg-background p-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  rows={5}
                  placeholder="Contanos qué necesitas y cuándo te gustaría empezar..."
                />
                {errors.message && <p className="text-sm text-destructive">{errors.message.message}</p>}
              </div>

              <Button type="submit" className="w-full py-3 text-base sm:text-lg" disabled={isSubmitting}>
                {isSubmitting ? "Enviando..." : "Enviar"}
              </Button>
            </form>
          </Card>
        </div>
      </section>

      {/* --- FAQ --- */}
      <section id="faq" className="bg-muted/10 py-24">
        <div className="container mx-auto max-w-3xl px-4">
          <h2 className="mb-12 text-center text-3xl font-bold">Preguntas frecuentes</h2>
          <Accordion type="single" collapsible className="w-full space-y-4">
            {[
              {
                q: "¿Necesito instalar algún software?",
                a: "No. Hakone es una app web: solo necesitás un navegador y conexión a internet.",
              },
              {
                q: "¿Puedo usarlo desde el celular?",
                a: "Sí. La interfaz es responsive y funciona bien en tablet/celular para uso en el taller.",
              },
              {
                q: "¿Cómo funcionan los roles de usuario?",
                a: "Podés manejar accesos por rol para que cada miembro del equipo vea lo que necesita.",
              },
              {
                q: "¿Mis datos están seguros?",
                a: "La sesión se maneja con cookie HttpOnly y el backend valida permisos. (Podés complementar con tu política de seguridad.)",
              },
            ].map((faq, idx) => (
              <AccordionItem key={faq.q} value={`item-${idx}`} className="rounded-xl border border-border bg-card px-6">
                <AccordionTrigger className="text-left font-bold hover:no-underline">{faq.q}</AccordionTrigger>
                <AccordionContent className="leading-relaxed">{faq.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* --- CTA FINAL --- */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <div className="relative overflow-hidden rounded-3xl bg-primary p-12 text-center text-white">
            <div className="absolute right-0 top-0 h-64 w-64 -mr-32 -mt-32 bg-accent opacity-20 blur-3xl" />
            <h2 className="mb-6 text-4xl font-bold">¿Listo para llevar tu taller al siguiente nivel?</h2>
            <p className="mx-auto mb-10 max-w-xl text-primary-foreground/80">
              Unite a los talleres que ya optimizaron su tiempo y mejoraron la experiencia de sus clientes con Hakone.
            </p>
            <Button asChild size="lg" variant="secondary" className="h-14 rounded-full px-10 text-lg font-bold">
              <a href="#contacto">Empezar ahora</a>
            </Button>
          </div>
        </div>
      </section>

      {/* --- FOOTER --- */}
      <footer className="border-t border-border bg-background py-12">
        <div className="container mx-auto px-4">
          <div className="grid gap-10 pb-12 md:grid-cols-4">
            <div className="space-y-5 md:col-span-2">
              <div className="flex items-center gap-3">
                <Image src="/HakoneIsotipo.png" alt="Hakone" width={40} height={40} className="rounded-full" />
                <span className="text-2xl font-black tracking-tight">HAKONE</span>
              </div>
              <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">
                Plataforma moderna para gestionar servicios, agenda y operación de talleres de bicicletas.
              </p>
              <div className="flex gap-2">
                <Button size="icon" variant="ghost" className="rounded-full hover:bg-primary/10 hover:text-primary">
                  <Instagram className="h-5 w-5" />
                </Button>
                <Button size="icon" variant="ghost" className="rounded-full hover:bg-primary/10 hover:text-primary">
                  <Linkedin className="h-5 w-5" />
                </Button>
                <Button size="icon" variant="ghost" className="rounded-full hover:bg-primary/10 hover:text-primary">
                  <Mail className="h-5 w-5" />
                </Button>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-sm font-bold tracking-widest uppercase">Producto</h3>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li>
                  <a className="transition-colors hover:text-primary" href="#features">
                    Funcionalidades
                  </a>
                </li>
                <li>
                  <a className="transition-colors hover:text-primary" href="#solutions">
                    Soluciones
                  </a>
                </li>
                <li>
                  <a className="transition-colors hover:text-primary" href="#pricing">
                    Planes
                  </a>
                </li>
              </ul>
            </div>

            <div className="space-y-4">
              <h3 className="text-sm font-bold tracking-widest uppercase">Legal</h3>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li>
                  <a className="transition-colors hover:text-primary" href="#">
                    Privacidad
                  </a>
                </li>
                <li>
                  <a className="transition-colors hover:text-primary" href="#">
                    Términos
                  </a>
                </li>
                <li>
                  <a className="transition-colors hover:text-primary" href="#contacto">
                    Contacto
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="flex flex-col items-center justify-between gap-4 border-t border-border pt-8 md:flex-row">
            <p className="text-xs font-medium text-muted-foreground">© 2026 Hakone Services. Todos los derechos reservados.</p>
            <div className="flex items-center gap-3 text-xs font-bold text-muted-foreground uppercase tracking-widest">
              Hecho para talleres exigentes
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
