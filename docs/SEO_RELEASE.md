# Publicación SEO y rendimiento

5 de octubre de 2026, hora de Miami. Producción Vercel READY: `dpl_5Wt5gr6fYYfnuj3ZKLeKbkrw6Hii`, exclusivamente en Telegram Bot’s projects.

## Resultado medido

| Medición | Antes móvil | Final móvil | Antes escritorio | Final escritorio |
| --- | --- | --- | --- | --- |
| Rendimiento | 99 | 100 | 100 | 100 |
| Accesibilidad | 100 | 100 | 100 | 100 |
| Buenas prácticas | 100 | 100 | 100 | 100 |
| SEO Lighthouse | 100 | 100 | 100 | 100 |
| FCP | 0,9 s | 0,9 s | 0,2 s | 0,2 s |
| LCP | 1,8 s | 1,8 s | 0,4 s | 0,5 s |
| TBT | 100 ms | 50 ms | 20 ms | 10 ms |
| CLS | 0 | 0 | 0 | 0 |

[Informe final PageSpeed](https://pagespeed.web.dev/analysis/https-hablemos30min-online/stlcywy8xx), tomado a las 21:26 de Miami. Estos resultados son de laboratorio y varían entre ejecuciones; aún no hay muestras de usuarios CrUX/INP. Se conserva diseño y contenido. Los avisos de JavaScript heredado y código no usado pertenecen al runtime Next/React; no se retiran polyfills para perjudicar compatibilidad ni se añaden optimizaciones que empeoren el diseño.

[OpenGraph.to](https://www.opengraph.to/u/hablemos30min.online): 58 → 98/100. Sin errores ni advertencias; una sugerencia informativa por `twitter:site`. No se inventó una cuenta de X/Twitter. Imagen real de marca 1200 × 630 y ~101 KB, iconos PNG/ICO, Apple y manifest en español.

## Descubrimiento

- Dominio `hablemos30min.online` creado y verificado mediante TXT en Search Console. Se preservaron SPF y los TXT existentes; no se concedió acceso de Google a GoDaddy.
- Sitemap enviado y leído el 5 de octubre: estado **Correcto**, tres páginas descubiertas: inicio, términos y privacidad.
- Solicitud individual de indexación aceptada para las páginas públicas; se conserva evidencia en `output/seo/`. Que la solicitud se acepte y el sitemap se lea no significa que Google ya haya incluido todas las URLs en resultados.
- Robots y sitemap públicos comprobados. Administración, confirmación, APIs y chunks de Next con exclusión de indexación apropiada; las páginas privadas permiten leer su `noindex`.
- `llms.txt` y `llm.txt` públicos, texto idéntico, español y sin datos de clientes. Son documentación de descubrimiento, no garantía de posicionamiento ni inclusión en respuestas de IA.
- HTTP y `www` redirigen con 308 al dominio HTTPS principal. Certificado `www` emitido en Vercel y redirección HTTPS verificada conservando ruta y query.

## Verificación ejecutada

TypeScript, nueve pruebas unitarias y build local/Vercel correctos. Prueba PostgreSQL opcional omitida en esta fase (la exclusión concurrente ya se verificó en el lanzamiento anterior). `npm audit --omit=dev`: cero vulnerabilidades. `npx tsx scripts/verify-seo.ts https://hablemos30min.online` correcto: cinco páginas, títulos, canonicals, noindex, OG/Twitter, grafo JSON-LD, sitemap/robots, documentos LLM, dimensiones PNG e iconos/manifest.

QA real de agenda: Miami 09:00 se muestra como Ciudad de México 07:00; elegir horario y avanzar conserva fecha/zona y muestra el formulario completo. Retorno a Miami, agenda cargada, sin desbordamiento. No se crearon reservas ni cobros durante esta fase. Sin commits ni push.
