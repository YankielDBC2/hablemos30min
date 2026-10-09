# Verificación

## Neon gratuito y caché, 9 de octubre de 2026

Hablemos30min migrado al proyecto `calm-shape-51914969` en la organización gratuita Yankiel Deniel. Las cinco tablas se copiaron en una transacción y coinciden en conteos y hashes: 1 configuración, 5 reservas, 0 notificaciones, 1017 entradas de auditoría y 7 límites de acceso. Respaldo privado conservado; Mailnova y el Hablemos30min antiguo de la cuenta de pago fueron retirados. EasyPrintMiami permanece intacto.

El cron ya no está registrado y su ruta responde 410 sin consultar la base. Login y datos administrativos responden 200 con las cinco reservas. Después de inicializar la agenda, se suspendió Neon y se realizaron cinco solicitudes públicas con dos meses y tres zonas horarias: todas respondieron 200, con 49 USD y 30 minutos, y el endpoint permaneció `idle`.

Typecheck y build correctos; 14 pruebas unitarias pasan y una prueba opcional PostgreSQL se omite. Nuevas pruebas cubren horarios calculados fuera de la caché, bloques, zonas, mantenimiento sin acceso a la base, ausencia de cron, expiración Stripe verificada, eventos de otros productos ignorados sin consultar Neon y dos alarmas ICS. No se hicieron cobros reales. Los recordatorios por correo requieren una acción administrativa o un pago para procesarse; los avisos autónomos son los del calendario importado por el cliente.

La caché persistente no expira por visitas; una lectura inicial es necesaria si está vacía o desalojada. El checkout sigue verificando reglas, idempotencia y exclusión en PostgreSQL.

Fecha: 2026-10-05, hora de Miami.

- Compilación local y Vercel Next.js 16.3.8 correctas; TypeScript sin errores. npm audit: cero vulnerabilidades en producción.
- Nueve pruebas de lógica y seguridad correctas: contraseña y sesión, validación, precio y política, DST, horarios, pago verificado, ICS, idempotencia y pagos ambiguos.
- PostgreSQL real en esquema aislado: cinco reservas concurrentes permiten una; bloqueos y holds vencidos mantienen exclusión. Esquema de prueba retirado al terminar.
- QA pública y administrativa a 320, 390, 768 y 1440/1280 px sin desbordamiento. Formulario conserva datos ante 409/503; consentimiento obligatorio, teclado y diálogo revisados. Axe: cero violaciones WCAG 2/2.1 AA en agenda y formulario. Datos administrativos de QA simulados; autenticación real verificada por API.
- Producción HTTPS responde, disponibilidad real y configuración Miami habilitada. Admin sin sesión devuelve 401; login y datos autenticados 200; origen externo 403; cron sin secreto 401 y autenticado 200; webhook sin firma 400; checkout inválido 400.
- Stripe live: checkout de 49 USD, pago único y español; reintento devuelve la misma sesión. Estado impagado permanece pendiente. Sesión interna expirada sin cobro y horario liberado después de verificar Stripe expired/unpaid.
- Purelymail: autenticación TLS SMTP correcta, correo de prueba aceptado y recibido en el buzón business. MX/SPF/DKIM comprobados por Purelymail. DMARC público resuelve mediante CNAME a dmarcroot.purelymail.com y TXT v=DMARC1; p=reject; ruf=mailto:dmarc@purelymail.com. El resumen cacheado del proveedor todavía puede tardar en reflejar ese cambio.
- Cron registrado cada cinco minutos: ejecución automática observada en auditoría a las 21:10:48 de Miami (01:10:48 UTC), además de la prueba manual a las 21:05:48. Cola vacía, sin fallos. Recordatorios de reservas pagadas a 24 h y 1 h, procesados en cada ciclo.
- Estados completed, no_show, cancelled y payment_review se presentan sin pedir un segundo pago ni mostrar enlaces de calendario obsoletos.

Recibos privados en `.private/`; capturas en `output/playwright/`. No se realizó ninguna compra, cobro real, commit ni push. Despliegue exclusivamente en Telegram Bot’s projects. Otros proyectos Neon intactos.

## Corrección móvil, 5 de octubre de 2026

Fondo blanco y esquema claro explícito; iconos SVG funcionales reemplazan símbolos de texto. Se retiraron eslóganes y adornos. Calendario/formulario comparten márgenes; horarios móviles en dos columnas. Verificación local a 320, 360, 390, 430, 768, 1024 y 1440 px: scrollWidth igual a clientWidth, controles de al menos 44 px de alto. Reserva inicia aproximadamente en 275 px a 390, frente a unos 615 px antes.

Formulario a 320 px: selección de canal, datos, revisión y vuelta conservando nombre, correo, celular, tema y canal. Avance por teclado y consentimiento visible; no se inició checkout ni se enviaron datos de prueba al servidor. Nueve pruebas existentes correctas; prueba opcional PostgreSQL omitida. TypeScript y compilación correctos.

Vercel producción READY: `dpl_DqJQRCz95E7j6w3jTExoVKytpRFn`, equipo Telegram Bot’s projects, alias https://hablemos30min.online. Capturas en `output/mobile-polish/`.
