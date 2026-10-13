# TDS Ganadería (Finca Tierra de Sueños) — Documentación del dominio

Este directorio es el **cerebro del proyecto**: la definición del negocio ganadero que
guía la aplicación. Fase actual: **construcción de la app** (en pruebas, sin datos reales).
Las preguntas de negocio (B1–B11) se respondieron el 2026-10-07.
El estado actual del código y cómo retomarlo está en el documento 09.

## Cómo leer esta carpeta

Leer en orden:

| # | Documento | Para qué |
|---|---|---|
| 00 | [Cómo funciona todo el proyecto](00-explicacion-proyecto.md) | Explicación general de la app: módulos, datos, lógica y despliegue. |
| 00 | [Visión y alcance](00-vision-y-alcance.md) | Qué es el proyecto, filosofía, prioridades, rol de Kiro, qué NO hacer. |
| 01 | [Glosario del dominio](01-glosario-dominio.md) | Vocabulario común. |
| 02 | [Reglas de negocio](02-reglas-de-negocio.md) | Reglas **confirmadas** vs **pendientes**. |
| 03 | [Modelo de datos](03-modelo-de-datos.md) | Entidades y relaciones (conceptual, sin tecnología). |
| 04 | [Eventos e historial](04-eventos-e-historial.md) | Principio estado vs historial y catálogo de eventos. |
| 05 | [Genealogía y familia](05-genealogia-y-familia.md) | Parentesco derivado y progenitores externos. |
| 06 | [Alertas](06-alertas.md) | Alertas identificadas y sus reglas de cálculo. |
| 07 | [Preguntas al dueño](07-preguntas-pendientes.md) | Decisiones de negocio B1–B11, respondidas el 2026-10-07. |
| 08 | [Bitácora de cambios](08-bitacora-de-cambios.md) | Historia de cómo evolucionó la definición. |
| 09 | [Estado del proyecto](09-estado-del-proyecto.md) | Estado actual de la app, stack y cómo retomar el trabajo. |
| 10 | [Supabase](10-supabase.md) | Base de datos PostgreSQL en Supabase: conexión, variables y rendimiento. |
| 11 | [Seguridad](11-seguridad.md) | Acceso con contraseña, sesión y medidas de seguridad. |
| 12 | [Pedidos al backend](12-pedidos-backend.md) | Canal entre frontend (Kiro) y backend (Claude Code). |
| 13 | [Despliegue en Vercel](13-despliegue-vercel.md) | Publicación en Vercel y sus límites. |
| 14 | [App móvil](14-app-movil.md) | App Android (APK con Capacitor) e instalación en iPhone. |

## Convenciones

- **CONFIRMADO** = dicho explícitamente por nosotros. **PENDIENTE** = requiere validar con el papá.
- Las dudas de negocio llevan ID estable (`B1`, `B2`, …) y viven en el documento 07.
- Las aproximaciones de tiempo se escriben con "~" tal como fueron dadas (~7 meses, ~2 meses, ~40 días).
- Nada marcado como pendiente debe tratarse como definitivo ni "resolverse inventando".

## Flujo de trabajo cuando llega información nueva del papá

1. Identificar el requisito nuevo.
2. Relacionarlo con lo existente.
3. Detectar contradicciones.
4. Detectar duplicados.
5. Identificar ambigüedades.
6. Separar hechos confirmados de decisiones pendientes.
7. Actualizar estos documentos.
8. Reflejar el cambio en la app (cuando el dueño lo indique) y registrarlo en la bitácora (08).

## Regla de oro

La aplicación se adapta al manejo real de nuestro ganado, no al revés. Si una suposición
común de software/ganadería contradice lo especificado aquí, **prevalece lo nuestro**.
