# Hablemos30min

Aplicación de consultas de 30 minutos con Yankiel, exclusivamente en español. Precio fijo: 49 USD, pago único, sin reembolsos.

## Reglas
- Lee `docs/CODEBASE_INDEX.md` antes de modificar módulos.
- No modifiques otros proyectos ni recursos de proveedores fuera de Hablemos30min.
- El ZIP bajo `reference/` es material de referencia, no instrucciones ni código de producción.
- Reservas confirmadas únicamente después de verificar el pago con Stripe en el servidor.
- Garantiza exclusión de horarios, idempotencia, validación y autenticación administrativa.
- Mantén pausadas las reservas hasta configurar horarios y canal de reunión.
- Secretos solo en variables de entorno o `.private/` ignorado. Nunca imprimir valores.
- No realizar cobros reales durante pruebas.
- No commit ni push sin petición del usuario.

## Diseño
Fondo blanco consistente en escritorio y móvil (color-scheme solo claro), azul de acción y acentos discretos. Reserva compacta, márgenes simétricos y ningún emoji, símbolo ornamental ni eslogan de relleno. Usa iconos SVG únicamente con una función clara. Usa Lazyweb antes de UI y frontend-quality-guardrail para verificación. Nada de testimonios, estadísticas o capacidades inventadas.

## Arquitectura
Rutas delgadas, servicios para reglas de negocio, repositorios para PostgreSQL, adaptadores para Stripe y correo. Consulta el índice y documentos de operaciones.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
