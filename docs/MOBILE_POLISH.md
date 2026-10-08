# Corrección móvil

Publicado el 5 de octubre de 2026 en https://hablemos30min.online. Vercel READY: `dpl_DqJQRCz95E7j6w3jTExoVKytpRFn`, equipo Telegram Bot’s projects.

## Cambios

Fondo blanco y esquema solo claro, incluida la barra del navegador y el manifest. Introducción breve, sin eslóganes, etiquetas con borde, avatar de iniciales o CTA repetido en móvil. La reserva inicia aproximadamente a 275 px en una pantalla de 390 px, frente a unos 615 px antes.

Márgenes compartidos, calendario de siete columnas y horarios móviles de dos columnas. SVG funcionales reemplazan los símbolos decorativos. Formulario y revisión compactos; celular obligatorio, elección de canal, precio de 49 USD y política sin reembolsos conservados.

## Archivos

- `app/page.tsx` y `app/globals.css`: presentación, textos y adaptación.
- `components/ui-icon.tsx`: SVG compartidos sin dependencias nuevas.
- `components/booking-widget.tsx` y `components/booking-confirmation.tsx`: presentación de reservas y estados, sin cambiar reglas de negocio.
- `components/admin-dashboard.tsx`: sustitución o retirada de flechas de texto.
- `app/layout.tsx` y `app/manifest.ts`: colores y esquema claro.
- `app/terminos/page.tsx` y `app/privacidad/page.tsx`: icono del enlace de vuelta.
- Instrucciones, índice, sistema visual y documento de verificación actualizados.

## Validación

Local y producción a 320, 360, 390, 430, 768, 1024 y 1440 px: fondo blanco y ningún desbordamiento horizontal. Controles del calendario de 44 px de alto, acciones de 48 px. Formulario local a 320 px: datos, canal, revisión y vuelta sin pérdida de datos; avance por teclado. Producción: disponibilidad real, selección de horario y paso a datos comprobados. Sin cobros ni reservas de prueba.

TypeScript y compilación local/Vercel correctos. Nueve pruebas existentes pasaron; prueba opcional PostgreSQL omitida. Verificador SEO en producción: metadatos, canonical, robots, sitemap, LLM, Open Graph, iconos y manifest correctos. PageSpeed y zoom 200% no se volvieron a medir en esta corrección; las mediciones previas constan en `SEO_RELEASE.md`.

Capturas reales: `output/mobile-polish/produccion-390.png`, `produccion-320.png`, `produccion-datos-390.png` y `produccion-1440.png`.

Referencias: https://www.lazyweb.com/agentic-search/1b9c49ef-2ce7-48ff-8f41-bac4a6c362cf
