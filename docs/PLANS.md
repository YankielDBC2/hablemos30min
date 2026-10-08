# Plan

1. Inspeccionar demo y evidencia de calendarios reales (Lazyweb).
2. Crear arquitectura modular con frontend responsive y backend de reservas.
3. Persistir disponibilidad, bloqueos, pagos, reservas, correo y auditoría en proyecto Neon independiente.
4. Integrar Stripe Checkout con precio del servidor, webhooks firmados e idempotencia.
5. Crear administración protegida, disponibilidad, detalles de clientes, notas y estados.
6. Crear buzón Purelymail, autenticación DNS y cola persistente de confirmaciones y recordatorios.
7. Validar lógica, concurrencia, errores, accesibilidad, tamaños 320/móvil/tablet/escritorio y compilación.
8. Desplegar en proyecto Vercel propio, conectar dominio y verificar proveedores.

## Riesgos
Credenciales expuestas en chat requieren rotación. Permisos API y acceso DNS pueden limitar operaciones. La agenda permanece pausada si falta información operativa. La política sin reembolsos se muestra antes del pago y requiere aceptación explícita del cliente.
