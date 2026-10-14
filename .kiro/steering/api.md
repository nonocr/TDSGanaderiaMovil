---
inclusion: fileMatch
fileMatchPattern: ["src/app/**/*.tsx", "src/components/**/*.tsx"]
---

# Contrato de la API (lo mantiene el backend)

Todas las rutas requieren sesión (cookie). Sin sesión: **401** `{ error }`.
Peticiones que modifican datos sin `Origin` del propio sitio: **403**.
Cuerpo JSON (`Content-Type: application/json`). Errores siempre `{ error: string }`:
400 datos inválidos · 404 no existe · 409 conflicto · 413 muy grande · 429 demasiados intentos.

Fechas: `"YYYY-MM-DD"` o ISO. Se guardan a medianoche UTC; para "hoy" usar el día **local**
del navegador (no `new Date().toISOString()`, que desde las 18:00 en la finca ya da mañana). Campos vacíos (`""` o `null`) = sin dato. Textos ≤ 120
caracteres (notas/descripción ≤ 2000; arete/raza ≤ 60).

| Método y ruta | Cuerpo / parámetros | Respuesta |
| --- | --- | --- |
| `POST /api/sesion` | `{ clave, recordar }` (`recordar: false` → sesión hasta cerrar el navegador; si no, 1 año) | 200 + cookie · 401 · 429 |
| `DELETE /api/sesion` | — | 200 (cierra sesión) |
| `GET /api/animales` | `?sexo=MACHO\|HEMBRA&estado=ACTIVO\|VENDIDO\|MUERTO&modulo=ENGORDE\|LECHERIA\|REPRODUCTOR&q=texto` (`q` busca en arete, **arete de CENASA**, nombre y raza) | `Animal[]` |
| `POST /api/animales` | `arete*`, `sexo*`, `modulo` (ENGORDE\|LECHERIA\|REPRODUCTOR; por defecto ENGORDE), `codigo` (≤ 60), `areteCenasa` (≤ 60, opcional, cualquier módulo; arete oficial de CENASA, **no único**), `sinArete` (bool; si `true` el animal no tiene arete físico: el backend genera un `arete` interno único `S/N-…` y **exige `areteCenasa`**, que pasa a identificarlo), `nombre`, `raza`, `fechaNacimiento`, `descripcion`, `estado`, `fechaBaja`, `motivoBaja`, `padreId`\|`padreExterno`, `madreId`\|`madreExterno`. **Pajilla**: `{ esPajilla: true, codigo*, areteCenasa?, estado?, fechaBaja?, motivoBaja? }` (sin arete ni sexo: arete = codigo, sexo MACHO, módulo REPRODUCTOR) | 201 `Animal` · 409 si el arete (o el código de la pajilla) ya existe |
| `GET /api/animales/[id]` | — | `Animal` |
| `PUT /api/animales/[id]` | igual que POST; si no se manda `modulo`, se conserva el actual | `Animal` |
| `PATCH /api/animales/[id]` | `{ fotoUrl }`: data URL JPEG/PNG/WebP base64 ≤ 3 MB, o `null`. El servidor la re-codifica (sin EXIF/GPS) y genera `fotoMiniatura` (160 px, ~10 KB) | `{ id, fotoMiniatura }` · 400 si no es una imagen real |
| `DELETE /api/animales/[id]` | — | 200 · 409 si tiene hijos, es cría de un parto o es el toro de alguna monta. En partos de otras vacas donde era el toro, el toro queda vacío (el parto se conserva) |
| `POST /api/leche` | **un ordeño**: `vacaId*`, `fecha*`, `cantidad*` (0–1000, litros de ese ordeño), `turno` (MANANA\|TARDE, opcional), `notas` | 201 · 409 si ya hay un ordeño de ese turno ese día para la vaca |
| `PUT/DELETE /api/leche/[id]` | `fecha`, `cantidad` (0–1000), `turno` (`null` lo quita), `notas` | 200 |
| `POST /api/pesos` | `animalId*`, `fecha*`, `pesoKg*` (0–3000), `notas` | 201 |
| `PUT/DELETE /api/pesos/[id]` | `fecha`, `pesoKg`, `notas` | 200 |
| `POST /api/montas` | `vacaId*`, `toroId*`, `fecha*`, `notas`, `prenezConfirmada`, `fechaConfirmacion`, `inseminacion` (booleano `true` = con pajilla) | 201 |
| `PUT/DELETE /api/montas/[id]` | `fecha`, `toroId`, `vacaId`, `notas`, `inseminacion`, `prenezConfirmada` (bool; `false` borra la fecha), `fechaConfirmacion` | 200 |
| `POST /api/partos` | `vacaId*`, `fecha*`, `toroId`, `descripcion`, `criaSana`/`necesitoAyuda` (`"si"`\|`"no"`), `pesoNacimientoKg` (0–200), `crias: [{ criaId }]` (≤ 10) | 201 |
| `PUT/DELETE /api/partos/[id]` | `fecha`, `toroId`, `descripcion` | 200 |
| `POST /api/etapas` | `animalId*`, `etapa*` (LACTANCIA\|DESTETE\|DESARROLLO\|ENGORDE), `fechaInicio*`, `fechaFin`, `notas` | 201 |
| `PUT/DELETE /api/etapas/[id]` | `etapa`, `fechaInicio`, `fechaFin` (si no se manda se conserva; `null` reabre la etapa), `notas` | 200 |
| `POST /api/etapas/cambiar` | `animalId*`, `etapa*`, `fecha` (día **local** `"YYYY-MM-DD"`; mandarlo siempre), `notas`. Cierra la etapa abierta con esa fecha y abre la nueva | 201 etapa nueva · 200 si ya estaba en esa etapa · 404 |
| `GET /api/exportar` | `?sexo=&modulo=&estado=ACTIVOS\|BAJAS` (sin `estado` = todos) | archivo CSV (incluye columnas Módulo y Código) |
| `GET /api/respaldo` | — | archivo JSON con todos los datos |
| `POST /api/respaldo` | JSON del respaldo (≤ 80 MB; **en Vercel ≤ 4,5 MB**) | `{ ok, animales }` · **reemplaza todo** |

`*` = obligatorio. El modelo de datos está en `prisma/schema.prisma` (solo lectura para el frontend).

`PUT`/`DELETE` de un registro que no existe → **404** `{ error: "Registro no encontrado." }`.
Alta o edición con un arete ya usado → **409** `{ error: "Ya existe un animal con el arete …" }`.

**Animales sin arete** (`sinArete: true`): `arete` es obligatorio y único en la base, así que el
backend le pone un valor interno autogenerado único con prefijo `S/N-` (`esAreteInterno()` en
`src/lib/validar.ts`). Ese valor **no se muestra**: en la UI se usa el helper `etiquetaArete()` de
`src/lib/tipos.ts`, que devuelve `CENASA <areteCenasa>` (o "Sin arete"). Al editar un animal sin
arete, el cliente **reenvía el `arete` interno** para que se conserve. En el CSV la columna "Arete"
sale como "(sin arete)".

**Fotos**: `Animal.fotoUrl` (600 px) y `Animal.fotoMiniatura` (160 px). En listas, avatares y
encabezados usar **siempre `fotoMiniatura`**; `fotoUrl` solo para ver la foto en grande.
El `Animal` que devuelve la API (`GET`, `POST`, `PUT`) **no trae `fotoUrl`**, solo
`fotoMiniatura`; en las páginas, leer con `select: ANIMAL_SIN_FOTO` (`src/lib/validar.ts`).
