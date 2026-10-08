# Yankiel — Consultas digitales

Landing en español para una consulta online 1 a 1: **30 minutos, $49 USD**.

Sitio estático, responsive, sin dependencias de compilación. El directorio publicable es `dist/`.

## Experiencia

- Calendario de 90 días, selección de fecha y hora, y conversión de zona horaria.
- Temas: inteligencia artificial, websites, apps, desarrollo y diseño.
- Formulario con validación y resumen de la consulta.
- Vista previa explícita del pago. No se procesan pagos, no se envían datos y no se confirman reservas.
- Preguntas frecuentes y navegación accesible con teclado.

Los horarios son **ilustrativos**, generados de lunes a viernes en America/New_York. Se muestran en la zona elegida con ajuste por horario de verano. No representan la disponibilidad real de Yankiel.

## Activar reservas reales

Se necesita la URL del evento de 30 minutos de la agenda elegida (por ejemplo, Calendly), con precio de $49 USD y una cuenta de cobro conectada, o una integración con backend que valide la disponibilidad y confirme el pago antes de crear la cita. Sustituir el calendario de muestra por la disponibilidad real; no habilitar una confirmación a partir de los horarios ilustrativos.

Los datos del formulario se conservan solo en memoria de la página. Las fuentes de Google Fonts se usan cuando la conexión está disponible; hay fuentes de sistema como alternativa.

## Verificación

`node --test tests/calendar.test.mjs` comprueba cambios de zona, DST y límites del calendario. `node --check dist/app.mjs` comprueba la sintaxis. No se ha ejecutado una revisión visual de navegador porque el controlador de navegador requerido por Sites no está disponible.
