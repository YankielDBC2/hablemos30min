# Índice

## Stack
Next.js App Router, React, TypeScript, PostgreSQL Neon, Stripe Checkout y SMTP Purelymail mediante Nodemailer. Todos los textos de producto en español.

## Carpetas
- `app/`: páginas y rutas HTTP.
- `components/`: interfaz pública y administrativa.
- `lib/`: servicios, validación, adaptadores y repositorios.
- `db/`: esquema persistente.
- `tests/`: pruebas de negocio y seguridad.
- `scripts/`: migraciones y operaciones.
- `reference/`: demo original del usuario.
- `.private/`: credenciales y recibos operativos ignorados.

## Comandos
`npm install`, `npm run dev` (puerto 3100), `npm run typecheck`, `npm test`, `npm run build`, `npm run db:migrate`.

## Contratos
GET `/api/availability?month=YYYY-MM&timezone=IANA`: `{slots:string[], settings:{hostName, timezone, meetingType, bookingEnabled}, price:4900, duration:30}`.
POST `/api/checkout`: `{name,email,phone,callChannel,topic,notes,startAt,timezone,acceptedPolicy:true,idempotencyKey:UUID}` -> `{url}`.
GET `/api/booking?session_id=...`: verificación Stripe del servidor -> `{status,booking:{id,name,startAt,timezone,meetingType,meetingUrl,phone}}` (sin exponer otras reservas).
POST `/api/webhooks/stripe`: firma obligatoria, cumplimiento idempotente.
GET `/api/cron`: 410; no conecta a PostgreSQL. No hay cron programado.
Admin: sesión HttpOnly, protección origen, disponibilidad, reservas, comunicaciones y auditoría.

## Operación
30 minutos, 49 USD fijo, pago único, sin reembolsos. Reservas habilitadas con horario confirmado: L-V 09:00-20:00, sábado 11:00-16:00, domingo cerrado, America/New_York (Miami). Cliente elige WhatsApp o llamada; anfitrión +1 979 730 1283. Contacto y avisos administrativos: business@hablemos30min.online. Emisor SMTP: reservas@hablemos30min.online.

Producción: https://hablemos30min.online, proyecto Vercel `hablemos30min` dentro del equipo `telegram-bots-projects-871f5ac8`. Neon independiente en la organización gratuita Yankiel Deniel, proyecto `calm-shape-51914969`, cómputo limitado a 0,25 CU. Sin cron. Consulta `OPERATIONS.md` y `VERIFICATION.md` para operación y límites de las pruebas.

`lib/public-agenda.ts` mantiene una sola instantánea de configuración y ocupación con Data Cache de Next.js, sin caducidad temporal. `lib/public-agenda-service.ts` calcula mes, zona horaria y anticipación en cada solicitud sin consultar PostgreSQL. Reservas, modificaciones administrativas y expiraciones verificadas actualizan la caché inmediatamente. El checkout conserva validación y exclusión PostgreSQL. La caché puede requerir una lectura inicial si está vacía o fue desalojada. `DATABASE_MAINTENANCE=1` impide accesos de la aplicación a la base durante migraciones.

Repositorio público: https://github.com/YankielDBC2/hablemos30min, licencia MIT y rama `main`. El repositorio está conectado al proyecto existente de Vercel; los cambios en `main` se publican mediante la integración Git. Credenciales y recibos continúan excluidos de Git.

Rendimiento y SEO: `PERFORMANCE.md`, `SEO.md` y `SEO_RELEASE.md`. El render de la agenda agrupa horarios por fecha con un formateador compartido y memoización, invalidando por datos y zona. Imagen social e iconos: `ASSET_MANIFEST.md`. Search Console tiene la propiedad del dominio verificada por TXT y sitemap público leído; solicitudes aceptadas no equivalen a inclusión inmediata en Google.

## SEO

`lib/seo.ts` centraliza dominio canónico, metadatos públicos/privados, JSON-LD real del servicio y contenido público de `/llms.txt` y `/llm.txt`. `app/sitemap.ts` incluye únicamente portada y páginas legales; administración y confirmación tienen `noindex`. `scripts/verify-seo.ts [origen]` comprueba HTML renderizado, sitemap/robots, LLM, imagen social, iconos y manifest. Detalles: `docs/SEO.md`.

## Interfaz móvil

`components/ui-icon.tsx` contiene SVG funcionales compartidos. `app/globals.css` fija fondo blanco y esquema claro, con adaptación compacta hasta 600 px y ajustes estrechos hasta 360 px. Introducción móvil sin etiquetas, avatar o CTA repetido; calendario de siete columnas y horarios de dos columnas. Se preservan estados y lógica de pago. Reglas en `DESIGN_SYSTEM.md`.
