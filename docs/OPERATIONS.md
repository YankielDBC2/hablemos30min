# Operación

## Proveedores
- Vercel proyecto `hablemos30min` dentro de **Telegram Bot's projects**, equipo `telegram-bots-projects-871f5ac8`, ID `team_ETqW09ANuH1YTO87rC7KdMWi`. Framework obligatorio `nextjs` en configuración y vercel.json.
- GoDaddy administra hablemos30min.online. A @ apunta a 76.76.21.21, recomendado por Vercel; nameservers originales se conservan.
- Neon proyecto **Hablemos30min**, ID `calm-shape-51914969`, en la organización gratuita **Yankiel Deniel** (`org-still-frog-83283432`); región US East, mínimo y máximo 0,25 CU, conexión agrupada y suspensión automática del plan Free. Otros proyectos intactos salvo Mailnova, eliminado por petición del propietario.
- Stripe Checkout un pago de4900centavosUSD con webhooks firmados. No suscripciones ni devolución automática.
- Purelymail buzones **reservas@hablemos30min.online** (emisor) y **business@hablemos30min.online** (administración/contacto). Webmail https://inbox.purelymail.com.

## Agenda
America/New_York (Miami). Lunes-viernes09:00-20:00, sábado11:00-16:00, domingo cerrado. Última llamada termina al cierre. Anticipación2horas, horizonte60días, duración30min. Administrador puede ajustar horario, anticipación, horizonte, intervalo y bloqueos puntuales.

WhatsApp o teléfono al celular facilitado por cliente. Número anfitrión+19797301283. Enlace WhatsApp https://wa.me/19797301283.

## Reserva y pago
Un hold exclusivo bloquea el horario durante el checkout. PostgreSQL impide solapamiento entre reservas y bloqueos. Stripe y la base comparten idempotencia. Solo una sesión completada y pagada, de49USD y correspondiente a la reserva, confirma y encola avisos. La página de retorno consulta Stripe en el servidor y no sustituye al webhook.

Un pago o hold ambiguo conserva el horario; se registra para revisión. No marcar manualmente un pago como confirmado. Los pagos tardíos sobre reservas liberadas requieren revisión y contacto con el cliente. Editar estados administrativos no inicia reembolsos.

## Correos y recordatorios
Confirmación al cliente y al buzón business después de verificar el pago. No hay cron: `/api/cron` devuelve 410 sin acceder a la base. La cola de correos y la conciliación de holds se procesan ante un pago o al abrir el panel administrativo. Los recordatorios por correo que ya vencieron quedan sujetos a esas acciones, por lo que no son autónomos ni tienen garantía horaria. El calendario ICS añade avisos 24 horas y una hora antes, gestionados por el calendario del cliente cuando importa la cita.

Cola persistente con leases y hasta6intentos, estados visibles en Comunicaciones. SMTP es al menos una vez: un cierre del proceso justo después de enviar puede repetir un mensaje, aunque conserva Message-ID. Nunca afirmar entrega en bandeja solo por aceptación SMTP.

## Administración
Contraseña cifrada con scrypt, sesión HttpOnly/Secure/SameSiteStrict, límites de intentos y comprobación de origen. Caduca8horas. Admin muestra clientes, datos de llamada, estados de pago, notas, correo, auditoría y exportación CSV. Accesos en `.private/ACCESOS.md`; no compartir ese archivo.

## Consumo y caché
La agenda pública utiliza una sola caché persistente sin caducidad, común para todos los meses y zonas. El paso del tiempo filtra horarios pasados sin reconsultar Neon. El admin, los cambios de horario/bloqueos, las reservas y las expiraciones verificadas refrescan la instantánea. La exclusión e idempotencia se verifican siempre en PostgreSQL antes del pago; la caché no decide la confirmación. Una caché vacía o desalojada requiere una lectura inicial.

El plan Free limita el consumo y no factura recursos como Launch; agotarlo puede limitar el servicio hasta su renovación. No actualizar el plan ni activar tareas periódicas sin petición del propietario. Para migrar, `DATABASE_MAINTENANCE=1` detiene accesos de la aplicación; Stripe recibe un error temporal y reintenta los webhooks. Restaurar a `0` al finalizar. Respaldos y verificaciones de copia solo en `.private/`.

## Despliegue
Repositorio público MIT: https://github.com/YankielDBC2/hablemos30min. La integración Git de Vercel está conectada a la rama `main` de ese repositorio, dentro del proyecto existente en Telegram Bot's projects. Un push a `main` inicia el despliegue de producción. No crear un segundo proyecto Vercel ni subir variables de entorno a GitHub.

La sesión actual CLI está autorizada. Eliminar únicamente `VERCEL_TOKEN` del proceso si una variable antigua interfiere; no modificar variables globales de Windows.

```powershell
Remove-Item Env:VERCEL_TOKEN -ErrorAction SilentlyContinue
vercel deploy --prod --yes --scope telegram-bots-projects-871f5ac8
```

No añadir las credenciales de proveedores al repositorio. Las credenciales pegadas en chat deben rotarse en cada proveedor y actualizarse en Vercel si corresponden al runtime. No revocar otras integraciones sin comprobar dependencias.
