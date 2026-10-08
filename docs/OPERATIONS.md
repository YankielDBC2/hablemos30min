# Operación

## Proveedores
- Vercel proyecto `hablemos30min` dentro de **Telegram Bot's projects**, equipo `telegram-bots-projects-871f5ac8`, ID `team_ETqW09ANuH1YTO87rC7KdMWi`. Framework obligatorio `nextjs` en configuración y vercel.json.
- GoDaddy administra hablemos30min.online. A @ apunta a 76.76.21.21, recomendado por Vercel; nameservers originales se conservan.
- Neon proyecto **Hablemos30min** independiente; región US East, autosuspend 300s, mínimo0.25CU y máximo1CU, conexión agrupada. Otros proyectos intactos.
- Stripe Checkout un pago de4900centavosUSD con webhooks firmados. No suscripciones ni devolución automática.
- Purelymail buzones **reservas@hablemos30min.online** (emisor) y **business@hablemos30min.online** (administración/contacto). Webmail https://inbox.purelymail.com.

## Agenda
America/New_York (Miami). Lunes-viernes09:00-20:00, sábado11:00-16:00, domingo cerrado. Última llamada termina al cierre. Anticipación2horas, horizonte60días, duración30min. Administrador puede ajustar horario, anticipación, horizonte, intervalo y bloqueos puntuales.

WhatsApp o teléfono al celular facilitado por cliente. Número anfitrión+19797301283. Enlace WhatsApp https://wa.me/19797301283.

## Reserva y pago
Un hold exclusivo bloquea el horario durante el checkout. PostgreSQL impide solapamiento entre reservas y bloqueos. Stripe y la base comparten idempotencia. Solo una sesión completada y pagada, de49USD y correspondiente a la reserva, confirma y encola avisos. La página de retorno consulta Stripe en el servidor y no sustituye al webhook.

Un pago o hold ambiguo conserva el horario; se registra para revisión. No marcar manualmente un pago como confirmado. Los pagos tardíos sobre reservas liberadas requieren revisión y contacto con el cliente. Editar estados administrativos no inicia reembolsos.

## Correos y recordatorios
Confirmación inmediata al cliente y al buzón business. Recordatorios24horas y1hora antes, cuando queda ese tiempo desde la compra. Cron Vercel Pro cada5minutos: `/api/cron`, autenticación `CRON_SECRET`. El envío puede ocurrir dentro de los5minutos siguientes al momento previsto; los proveedores pueden demorar la entrega.

Cola persistente con leases y hasta6intentos, estados visibles en Comunicaciones. SMTP es al menos una vez: un cierre del proceso justo después de enviar puede repetir un mensaje, aunque conserva Message-ID. Nunca afirmar entrega en bandeja solo por aceptación SMTP.

## Administración
Contraseña cifrada con scrypt, sesión HttpOnly/Secure/SameSiteStrict, límites de intentos y comprobación de origen. Caduca8horas. Admin muestra clientes, datos de llamada, estados de pago, notas, correo, auditoría y exportación CSV. Accesos en `.private/ACCESOS.md`; no compartir ese archivo.

## Despliegue
La sesión actual CLI está autorizada. Eliminar únicamente `VERCEL_TOKEN` del proceso si una variable antigua interfiere; no modificar variables globales de Windows.

```powershell
Remove-Item Env:VERCEL_TOKEN -ErrorAction SilentlyContinue
vercel deploy --prod --yes --scope telegram-bots-projects-871f5ac8
```

No añadir las credenciales de proveedores al repositorio. Las credenciales pegadas en chat deben rotarse en cada proveedor y actualizarse en Vercel si corresponden al runtime. No revocar otras integraciones sin comprobar dependencias.
