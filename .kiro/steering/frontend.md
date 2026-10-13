---
inclusion: always
---

# Reglas del frontend

## Stack

- Next.js 15 (App Router) + React 19 + TypeScript + Tailwind CSS 3.
- En Next 15, `params` y `searchParams` de las páginas son **promesas**:
  `const { id } = await params;`
- Páginas = Server Components que leen con Prisma (`import { prisma } from "@/lib/prisma"`).
  Interactividad = componentes `"use client"` que llaman a la API con `fetch`.
- Windows: usar `npm.cmd` / `npx.cmd`. Verificar con `npx.cmd tsc --noEmit` y `npm.cmd run build`
  (detener `npm.cmd run dev` antes de `build`).
- La app **en uso** corre con `npm.cmd run prod` en el puerto **3000** y compila en
  `.next-produccion`. No detenerla. `npm.cmd run dev` usa `.next` y, con el 3000 ocupado,
  arranca en el 3001: probar ahí. Que `next-env.d.ts` cambie solo es normal; no editarlo.
- Al empezar, leer la sección **Avisos del backend** de `docs/12-pedidos-backend.md`.

## Rendimiento de las consultas (la base está en EE. UU.: ~100 ms por consulta)

- Lo que define el tiempo es la **cadena más larga** de consultas, no cuántas hay.
  Lanzarlas **en paralelo** con `Promise.all` y pedirlas "planas": cada `include`/`select`
  de una relación es otra consulta que espera a la anterior.
- Si una página consulta algo (conteos) y además renderiza otro componente async que consulta
  (p. ej. `ListaAnimales`), **no hacer `await` arriba**: crear la promesa y pasarla a un componente
  async hermano que la espere (ver `src/app/engorde/page.tsx` y `src/components/AvisoBajas.tsx`).
  Así van en paralelo (medido: `/engorde` 184 → 100 ms) y, sin `<Suspense>`, la página sale entera.
- Para nombres de animales relacionados (toro, vaca, crías) usar `listarAnimales()` de
  `src/lib/genealogia.ts` (ya cargada y compartida en la petición) en vez de `include`.
- Genealogía (padres, abuelos, árbol, hijos, hermanos): funciones de `src/lib/genealogia.ts`.
  Ciclo de las vacas: `calcularPendientes()` / `calcularEventosCalendario()` de `src/lib/alertas.ts`
  y `desgloseReproLecheria()` de `src/lib/modulos.ts` (todas usan `cargarVacasConCiclo(modulo?)`).
  Conteos de los tres módulos de una vez: `conteosTodosModulos()` (un solo groupBy).
- **Nunca traer `fotoUrl`** en listas ni de animales relacionados: usar `fotoMiniatura`.
- Componentes pesados que no se ven al cargar (p. ej. gráficas): cargarlos con
  `next/dynamic` solo cuando se muestran (ver `GraficaPesoDiferida.tsx`).
- **Gráficas (recharts 2.15.4)**: poner sus piezas (`Tooltip`, `XAxis`, `CartesianGrid`,
  `ReferenceLine`, `Line`, `Bar`…) como hijos directos de `LineChart`/`AreaChart`/`BarChart`,
  **nunca dentro de un componente propio** (recharts busca por tipo y no lo vería). Los Fragments
  `<>…</>` ya funcionan: `package.json` fuerza `react-is@19` para recharts (`overrides`); con el
  `react-is` 18 que trae por defecto no reconocía los Fragments de React 19 y lo de dentro
  desaparecía sin error (así se perdió el tooltip de leche). Si se quita ese override, vuelve el fallo.
- Con datos vacíos, el componente `*Diferida` muestra el aviso él mismo: así no se descarga recharts.
- `src/app/loading.tsx` es el esqueleto que se ve al instante al navegar (vale para todas
  las rutas). Una ruta puede tener el suyo propio si conviene.
- El navegador guarda 30 s las páginas visitadas (`staleTimes` en `next.config.mjs`). Tras
  guardar, borrar o editar algo, llamar **siempre** `router.refresh()` para no mostrar datos viejos.
- **Llamadas a la API desde el cliente: usar `llamarApi()` de `src/lib/api-cliente.ts`**, no
  `fetch` directo. Nunca lanza: devuelve `{ ok: true, data }` o `{ ok: false, error }` (incluido
  "Sin conexión…" si no hay red). Con `fetch` directo, sin señal el botón quedaba en "Guardando…"
  para siempre. Patrón: `const r = await llamarApi(url, { method: "POST", body }); setCargando(false); if (!r.ok) return setError(r.error);`
- Nunca declarar un componente dentro de otro y usarlo como `<Interno />`: se remonta en cada
  render y se pierde lo escrito en sus inputs. Sacarlo fuera o llamarlo como función `{interno()}`.
- Formularios: cada `<label>` con `htmlFor` + `id` en su campo (o `aria-label` si solo hay
  placeholder), y `maxLength`/`min`/`max` iguales a los límites de la API (`.kiro/steering/api.md`).

## Mobile-first (obligatorio)

- Diseñar primero para **390 px de ancho**; ampliar con `sm:` / `lg:`. El menú lateral
  solo existe en `lg:`; en móvil hay **barra inferior** (`src/components/Navegacion.tsx`).
- El `<main>` ya deja espacio abajo para la barra inferior; no taparla con elementos `fixed`.
  Si se agrega algo fijo abajo, sumar `env(safe-area-inset-bottom)`.
- Áreas táctiles de **al menos 44 px** (`h-11`, `py-2.5`+). Filas de listas = enlace completo,
  no solo el texto.
- Campos de formulario: `globals.css` ya fuerza 16 px en móvil (evita el zoom de iOS); no
  bajar el tamaño de letra de inputs.
- Pestañas que deben caber sin scroll horizontal en 390 px (ver `FichaTabs.tsx`).
- Sin `hover:` como única pista: acompañar con `active:` para el toque.

## Estilo

- Color de marca: `marca-50…950` (`tailwind.config.ts`). Neutros: `stone`.
- Reutilizar `src/components/ui.tsx`: `Card`, `SectionTitle`, `Badge` (tonos neutral/verde/rojo/
  ambar/azul), `EstadoBadge`, `SexoBadge`, `AnimalLink`, `PageHeader`, `BotonPrimario`, `Vacio`.
- Iconos de línea en `src/components/iconos.tsx` (heredan `currentColor`). Agregar ahí los nuevos.
- **Modo oscuro** por clase (`dark:`): toda clase de color lleva su variante `dark:`.
- Impresión: `no-print` oculta elementos al imprimir; la ficha del animal se imprime.
- Bordes `rounded-xl`, sombra `shadow-card`, textos de ayuda `text-xs text-stone-400`.

## Seguridad en el frontend

- Nunca usar `dangerouslySetInnerHTML` con datos de usuario.
- Los `fetch` a la API van al mismo origen (`/api/...`); el middleware rechaza otros orígenes.
- La sesión es una cookie `HttpOnly`: el frontend no la lee ni la guarda.
- Los errores de la API traen `{ error: string }` en español, listo para mostrar.
