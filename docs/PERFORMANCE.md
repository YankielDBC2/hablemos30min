# Rendimiento

## Medición inicial, 5 de octubre de 2026 (Miami)

PageSpeed Insights en producción: [informe inicial](https://pagespeed.web.dev/analysis/https-hablemos30min-online/tlr82oqs6t).

| Medición | Móvil | Escritorio |
| --- | --- | --- |
| Rendimiento | 99 | 100 |
| Accesibilidad / buenas prácticas / SEO | 100 / 100 / 100 | 100 / 100 / 100 |
| FCP | 0,9 s | 0,2 s |
| LCP | 1,8 s | 0,4 s |
| TBT | 100 ms | 20 ms |
| CLS | 0 | 0 |

No hay muestras CrUX disponibles para el dominio nuevo; los números son de laboratorio, no mediciones de usuarios ni prueba de INP.

## Cambios

El render de la agenda creaba cientos de `Intl.DateTimeFormat` y recorría dos veces los horarios en cada cambio de estado. Se agrupa una sola vez por fecha con un formateador compartido y `useMemo`, conservando invalidación por zona y datos de agenda. Comparación aislada sobre los horarios reales: 40 ms por pasada frente a 2 ms usando el mismo formateador en Node local. Este microbenchmark no sustituye a PageSpeed.

La portada continúa estática con un único componente interactivo para reservas. Sin fuentes remotas, scripts de analítica, librerías nuevas ni imágenes de hero. La imagen social se sirve como PNG estático y no se descarga al visitar la portada. Se preservan jerarquía, contenido y aspecto.

La medición final y los comprobantes de indexación se registran en `SEO_RELEASE.md` después del despliegue.
