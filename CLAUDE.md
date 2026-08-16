# Hakone UI — guía para trabajar en este repo

Frontend Next.js (App Router) del sistema de gestión para talleres de
bicicletas. La API vive en un repo aparte (`Hakone-API`) y se despliega por
separado.

---

## Comandos

```bash
yarn install
yarn dev      # http://localhost:3000
yarn build    # build de producción
yarn lint
```

Necesita la API corriendo (por defecto en `http://localhost:4001`).

---

## Arquitectura

### El proxy BFF (importante)

El browser **nunca** llama a la API directamente. Todo pasa por
`/api/v1/*` en el mismo origen, y `app/api/v1/[...path]/route.ts` lo reenvía al
backend. Ese route handler es el que lee la cookie `HttpOnly` y la convierte en
`Authorization: Bearer` para el backend.

Por eso `lib/axiosInstance.ts` tiene `baseURL: "/api/v1"` (relativa) y
`NEXT_PUBLIC_API_URL` **solo se usa del lado del servidor**, dentro del route
handler.

> No agregues un `rewrites()` en `next.config.js` para esto. Ya hubo uno y era
> código muerto: los rewrites devueltos como array corren en la fase
> "afterFiles", o sea después de las rutas del filesystem, así que el route
> handler siempre gana. Tener las dos definiciones solo hizo que divergieran.

### Autenticación

Tres capas, y cada una cubre algo distinto:

1. **`middleware.ts`** — solo mira que la cookie `token` exista y redirige a
   `/login` si no está. No valida firma ni expiración; es para evitar el flash
   de contenido. Si agregás una ruta protegida, hay que sumarla **en los dos**
   lugares: `isProtectedRoute` y `config.matcher`.
2. **`context/auth-provider.tsx`** — llama a `/auth/me` y guarda el usuario.
   Saltea las rutas públicas (`/`, `/login`, `/register`, `/contact`) para no
   spamear la API ni entrar en loops.
3. **El backend** — la autorización real. La UI nunca es la fuente de verdad.

El interceptor de `lib/axiosInstance.ts` redirige a `/login` ante un 401, con
excepciones para las rutas de auth (si no, un login fallido haría un loop).

### Estado del servidor

TanStack Query para todo lo que viene de la API. No metas datos del servidor en
`useState`.

---

## Reglas de negocio a respetar en la UI

### Total de un servicio

`price` es **mano de obra**; los repuestos se cobran aparte. Lo que se le cobra
al cliente es la suma. Usá `serviceTotal()` / `partsTotal()` de
`lib/utils/serviceTotal.ts` en cualquier lugar que muestre "el total".

### Suscripción vencida

`app/(dashboard)/layout.tsx` muestra `SubscriptionExpiredScreen` cuando
`subscriptionStatus === "EXPIRED"`, y el banner de gracia cuando es `"GRACE"`.

Esto es **solo presentación**. El bloqueo real lo hace la API con un 403
`SUBSCRIPTION_EXPIRED`; la pantalla existe para que el usuario entienda qué
pasa, no para impedir nada. Nunca muevas la decisión de acceso al cliente.

### Filtros de fecha

Las estadísticas reciben `tzOffset` (`new Date().getTimezoneOffset()`) además
de `dateFrom`/`dateTo`, porque los filtros son días del calendario del taller y
no instantes UTC. Ver `buildStatsQuery()` en el dashboard.

Las tarjetas de KPI y los gráficos **comparten** el filtro. Si una parte lo
ignora, el panel muestra un total histórico arriba y uno del período abajo y
parece que los números están mal.

### Listados

La API limita `limit` a **100**. No pidas más esperando que funcione: si
necesitás un rango, filtralo del lado del servidor (como hace el calendario con
`scheduledFrom`/`scheduledTo`) en vez de traer de más y recortar en el browser.

---

## Convenciones

- Componentes de shadcn/ui en `components/ui/`. Los archivos en minúscula
  (`button.tsx`, `dialog.tsx`) son de la librería; los que empiezan en
  mayúscula (`ServiceModal.tsx`) son propios.
- Formularios con react-hook-form + resolvers de Zod.
- Teléfonos siempre en E.164 (`PhoneInputE164`); el backend los valida y
  normaliza.
- Rutas del dashboard bajo el grupo `app/(dashboard)/`, que aporta el layout
  con sidebar y los guards de sesión y suscripción.

---

## Variables de entorno

| Variable | Notas |
|---|---|
| `NEXT_PUBLIC_API_URL` | Base de la API **sin** `/api/v1`. La usa el proxy del lado del servidor |
| `NEXT_PUBLIC_SUPPORT_WHATSAPP` | Solo dígitos, sin `+` (va dentro de un link `wa.me/`) |

Ojo: las `NEXT_PUBLIC_*` se inlinean **en tiempo de build**. Cambiarlas exige
un redeploy, no alcanza con reiniciar.

---

## Deploy

Railway detecta Next.js solo. `next start` respeta el `PORT` que inyecta la
plataforma; no lo fijes a mano.
