# Hakone UI

Interfaz web del sistema de gestión para talleres de bicicletas **Hakone**.
Next.js 15 (App Router) + React 19 + TypeScript + Tailwind + shadcn/ui.

El backend está en el repo [`Hakone-API`](https://github.com/jesivira369/Hakone-API).

---

## Qué incluye

**Landing pública** (`/`) con presentación del producto, planes y formulario de
contacto. El precio se muestra en pesos argentinos si el visitante está en
Argentina, y en dólares en el resto del mundo.

**Panel del taller** (requiere sesión):

- **Dashboard** — facturación, servicios por estado, ranking de clientes,
  próximos vencimientos y recordatorios de mantenimiento pendientes de
  contactar. Con filtro por rango de fechas y exportación a Excel.
- **Calendario** — vista mensual de la carga de trabajo, por fecha de ingreso o
  de entrega.
- **Servicios** — alta y seguimiento con repuestos, mecánico asignado, estados
  y contacto por WhatsApp al cliente.
- **Clientes** y **Bicicletas** — fichas con historial completo.
- **Mecánicos** — sin límite de cantidad.
- **Mi cuenta** — datos del taller y cambio de contraseña.

**Panel de administración** (`/admin`, solo `SUPER_ADMIN`) — talleres dados de
alta, estado de sus suscripciones, registro de pagos y consultas recibidas
desde la landing.

---

## Requisitos

- Node.js 20+
- Yarn 3 (viene con el repo)
- La API corriendo

---

## Instalación

```bash
git clone git@github.com:jesivira369/Hakone-UI.git
cd Hakone-UI
yarn install
```

### Variables de entorno

```bash
cp .env.example .env
```

| Variable | Descripción |
|---|---|
| `NEXT_PUBLIC_API_URL` | Base de la API, **sin** `/api/v1` al final. En desarrollo: `http://localhost:4001` |
| `NEXT_PUBLIC_SUPPORT_WHATSAPP` | Número de soporte para los avisos de suscripción. Solo dígitos, sin `+` ni espacios (ej: `5491123456789`) |

> Las variables `NEXT_PUBLIC_*` se incrustan **en tiempo de build**. Si cambiás
> una en producción hay que volver a desplegar; reiniciar no alcanza.

### Levantar

```bash
yarn dev      # http://localhost:3000
```

---

## Scripts

| Comando | Qué hace |
|---|---|
| `yarn dev` | Servidor de desarrollo |
| `yarn build` | Build de producción |
| `yarn start` | Sirve el build |
| `yarn lint` | ESLint |

---

## Cómo habla con la API

El navegador nunca llama al backend directamente: pega contra `/api/v1/*` en el
mismo origen y `app/api/v1/[...path]/route.ts` reenvía la petición al backend,
convirtiendo la cookie `HttpOnly` en un header `Authorization`.

Esto mantiene el token fuera del alcance de JavaScript y evita CORS y cookies
de terceros en el navegador. `NEXT_PUBLIC_API_URL` solo se usa del lado del
servidor, dentro de ese proxy.

---

## Acceso

No hay registro público: las cuentas las crea Hakone. La sesión dura 12 horas.

Si la suscripción del taller venció, la aplicación muestra una pantalla de
bloqueo con el contacto de soporte — pero el corte real lo hace la API, que
responde `403` a los datos de negocio.

---

## Deploy

Se despliega en Railway conectando el repo de GitHub; Next.js se detecta solo y
`next start` toma el `PORT` que inyecta la plataforma.

Hay que configurar `NEXT_PUBLIC_API_URL` apuntando a la URL pública de la API,
y en la API configurar `FRONTEND_URL` con la URL de esta app (es su allowlist
de CORS).

---

## Documentación

- [CLAUDE.md](CLAUDE.md) — arquitectura, convenciones y reglas de negocio.
