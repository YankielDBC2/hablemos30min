# Consumo de Neon

Solicitud: trasladar Hablemos30min a la cuenta gratuita facilitada, eliminar Mailnova y evitar consultas periódicas o una lectura por cada visita pública.

Plan: retirar cron y proteger la ruta antigua; cachear una única agenda persistente con invalidación por cambios reales; conservar exclusión y verificación de pago; pausar escrituras durante copia consistente; copiar esquema y las cinco tablas con comprobación por conteos y hashes; cambiar conexión en Vercel; verificar producción y suspensión sin tráfico. No tocar EasyPrintMiami ni cambiar el plan de la organización de origen.

Los datos y credenciales de migración permanecen en `.private/`. La ausencia de cron implica que los recordatorios por correo no son autónomos; el ICS incluye alarmas y los correos pendientes se procesan al entrar al admin o confirmar pagos.

Completado: nueva cuenta Free, copia verificada de las cinco tablas, conexión de producción actualizada, cinco reservas visibles, cron 410 y cinco consultas públicas sin despertar Neon. Mailnova y el proyecto antiguo retirados; EasyPrintMiami intacto. Typecheck, build y 14 pruebas pasan; integración PostgreSQL opcional omitida. Respaldos y evidencia en `.private/`.
