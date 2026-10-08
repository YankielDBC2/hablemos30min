# Hablemos30min

Consultas en español con Yankiel: 30 minutos, un pago fijo de 49 USD, sin reembolsos. Reserva con celular obligatorio y elección entre WhatsApp y llamada telefónica.

Sitio: https://hablemos30min.online
Admin: https://hablemos30min.online/admin

## Código abierto

Este proyecto se distribuye bajo la [licencia MIT](LICENSE). Puedes usar, modificar y redistribuir el código respetando sus condiciones. Las dependencias conservan sus propias licencias.

## Desarrollo

Requiere Node.js 24 y npm. Stack: Next.js App Router, React, TypeScript, PostgreSQL en Neon, Stripe Checkout y SMTP mediante Nodemailer.

```powershell
git clone https://github.com/YankielDBC2/hablemos30min.git
cd hablemos30min
npm ci
Copy-Item .env.example .env.local
```

Completa `.env.local` con credenciales propias. El archivo de ejemplo contiene únicamente valores de muestra.

```powershell
npm run db:migrate
npm run dev
```

Abre http://localhost:3100. La migración crea el esquema en la base configurada; usa una base independiente para tu instalación. La agenda comienza pausada y se configura desde `/admin`.

```powershell
npm run typecheck
npm test
npm run build
```

La prueba de concurrencia PostgreSQL es opcional y requiere `TEST_DATABASE_URL` apuntando a una base exclusiva de pruebas.

## Configuración

- `APP_URL`: origen de tu instalación. Para un dominio distinto, actualiza también `SITE_URL` en `lib/seo.ts` y los textos/enlaces de marca.
- `DATABASE_URL`: conexión PostgreSQL con soporte de la extensión `btree_gist`.
- `STRIPE_SECRET_KEY` y `STRIPE_WEBHOOK_SECRET`: credenciales propias; registra `/api/webhooks/stripe` para `checkout.session.completed` y `checkout.session.async_payment_succeeded`.
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` y `MAIL_FROM`: cuenta SMTP para confirmación y recordatorios.
- `ADMIN_PASSWORD_HASH`: formato `salthex:hashhex`, con hash generado por `crypto.scryptSync(contraseña, salthex, 64).toString('hex')`; almacena el hash, nunca la contraseña, en las variables de la aplicación.
- `ADMIN_SESSION_SECRET` y `CRON_SECRET`: valores aleatorios distintos de al menos 32 caracteres.

Para producción, configura las variables en Vercel y registra el cron autenticado de `vercel.json`. El intervalo de cinco minutos requiere un plan de Vercel que lo admita. Usa claves Stripe de prueba en tu entorno de desarrollo.

Los scripts de operaciones en `scripts/` que usan `.private/` están ligados a la instalación original. Revísalos antes de usarlos con otras cuentas o dominios; no son pasos necesarios de instalación.

## Documentación
- [Índice](docs/CODEBASE_INDEX.md)
- [Operación](docs/OPERATIONS.md)
- [Verificación](docs/VERIFICATION.md)

Los accesos generados están exclusivamente en `.private/ACCESOS.md`, excluido de Git y del despliegue.

El repositorio público no incluye credenciales, datos de clientes, recibos operativos, archivos `.env.local`, configuraciones locales de Vercel ni capturas privadas.
