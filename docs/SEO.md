# SEO y descubrimiento público

- Dominio canónico único: `https://hablemos30min.online`, incluida la portada con `/`. No se usa el dominio de previews como canonical.
- Cada página pública define título, descripción, canonical, Open Graph y Twitter de forma completa en `lib/seo.ts`. Next combina metadatos superficialmente; una ruta no debe heredar el título ni la URL social de la portada.
- La imagen social común es `/og-hablemos30min.png`, 1200 × 630, con alternativa textual en español.
- `/admin` y `/confirmacion` llevan `noindex, nofollow, nosnippet`. Se permite rastrear su HTML para que los buscadores lean `noindex`; sus APIs están bloqueadas en `robots.txt` y requieren controles de acceso aplicables. No indexar no sustituye autenticación.
- El sitemap contiene exclusivamente `/`, `/terminos` y `/privacidad`. No incluye enlaces con tokens, administración ni APIs; no fabrica fechas `lastModified`.
- La portada describe el servicio mediante JSON-LD `WebSite`, `WebPage`, `Person`, `Service` y `Offer`: nombre confirmado, español, llamada/WhatsApp, sesión de 30 minutos, 49 USD y pago único sin reembolsos. No se añaden dirección física, calificaciones, testimonios ni premios.
- `/llms.txt` y su alias `/llm.txt` comparten un texto público en español. Son ayuda de descubrimiento; no garantizan indexación, posicionamiento ni inclusión en respuestas de buscadores.

## Verificación

Ejecuta `npm run typecheck` y `npm run build`. Con el servidor disponible, `npx tsx scripts/verify-seo.ts http://localhost:3100` verifica el HTML, canonicals, indexación, etiquetas sociales, JSON-LD, sitemap, robots, ambos archivos LLM y dimensiones reales del PNG Open Graph. Tras desplegar, ejecuta el mismo script con `https://hablemos30min.online`. La indexación efectiva requiere que el buscador rastree el dominio y se verifica por separado en Search Console.

Fuentes primarias: [documentación de Next instalada](../node_modules/next/dist/docs/01-app/01-getting-started/14-metadata-and-og-images.md), [Google: noindex necesita rastreo](https://developers.google.com/search/docs/crawling-indexing/block-indexing), [Schema.org: Service](https://schema.org/Service) y [ServiceChannel](https://schema.org/ServiceChannel).
