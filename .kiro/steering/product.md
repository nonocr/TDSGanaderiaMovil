---
inclusion: always
---

# Producto: TDS Ganadería

App web para registrar el ganado de la Finca Tierra de Sueños: animales, genealogía,
peso, leche, montas, partos y etapas de los terneros. La usa una familia, sobre todo
**desde el celular, en el campo**. Interfaz en **español**.

- Contexto de negocio completo en `docs/` (empezar por `docs/09-estado-del-proyecto.md`).
- Regla de oro del proyecto: **no inventar reglas de negocio**. Lo que no está definido
  se marca como pendiente (`docs/07-preguntas-pendientes.md`), no se asume.

## Reparto del trabajo

| Área | Quién | Carpetas |
| --- | --- | --- |
| **Frontend** (páginas, componentes, estilos) | **Kiro** | `src/app/**/page.tsx`, componentes `.tsx` de `src/app/**`, `src/components/**`, `src/app/globals.css`, `tailwind.config.ts`, `public/**` |
| **Backend** (API, datos, seguridad) | **Claude Code** | `src/app/api/**`, `src/lib/validar.ts`, `src/lib/sesion.ts`, `src/lib/prisma.ts`, `src/middleware.ts`, `prisma/**`, `next.config.mjs`, `scripts/**`, `.env*` |

Lógica de dominio compartida (`src/lib/fechas.ts`, `estado.ts`, `genealogia.ts`,
`alertas.ts`, `tipos.ts`, `leche.ts`, `modulos.ts`): se puede **usar** desde el frontend;
cambiarla se coordina. Para llamar a la API desde el cliente, usar `llamarApi` de
`src/lib/api-cliente.ts`: nunca lanza (sin conexión devuelve `{ ok: false, error }`).

**Si el frontend necesita algo del backend** (un campo nuevo, un endpoint, un cambio de
validación), no lo implementes: anótalo en `docs/12-pedidos-backend.md` siguiendo el
formato de ese archivo.
