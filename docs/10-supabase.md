# 10 — Base de datos en Supabase

Desde 2026-10-08 la app usa **PostgreSQL en Supabase** en lugar del archivo SQLite local
(`prisma/dev.db`). La app sigue hablando con la base solo a través de **Prisma**; no usa
`supabase-js` ni la API REST de Supabase.

## Conectar (primera vez o en otra computadora)

1. Crear el proyecto en https://supabase.com/dashboard y anotar la **contraseña de la base**.
2. En el proyecto: botón **Connect** → copiar la cadena **Session pooler**
   (`postgresql://postgres.<ref>:[YOUR-PASSWORD]@aws-0-<region>.pooler.supabase.com:5432/postgres`).
   No usar la conexión directa `db.<ref>.supabase.co`: solo funciona por IPv6.
3. Detener `npm.cmd run dev` si está corriendo.
4. Copiar `.env.example` a `.env` y completar los valores (ver la tabla de abajo).
5. Crear las tablas y activar RLS:

   ```powershell
   npx.cmd prisma db push
   npx.cmd prisma db execute --file prisma/supabase-rls.sql --schema prisma/schema.prisma
   ```

(El asistente `scripts\conectar-supabase.ps1`, que hacía estos pasos solo, ya no está en el
repositorio: se guarda únicamente en el equipo de desarrollo.)

## Variables de entorno

| Variable       | Puerto | Para qué                                                         |
| -------------- | ------ | ---------------------------------------------------------------- |
| `DATABASE_URL` | 5432   | Pooler de sesión con tiempos límite; la usa la app.              |
| `DIRECT_URL`   | 5432   | Pooler de sesión sin parámetros extra; la usa Prisma (`db push`). |

La contraseña va **codificada para URL** si tiene `@ : / ? # % &` (p. ej. `@` → `%40`).

### Por qué el pooler de sesión (rendimiento, medido 2026-10-08)

La base está en EE. UU. (us-east-2); cada ida y vuelta de red cuesta ~85 ms.

- **Pooler de transacción (6543, `pgbouncer=true`)**: Prisma envuelve cada consulta en pasos
  extra → **4 idas y vueltas por consulta** (`SELECT 1` = 360 ms). Pensado para *serverless*.
- **Pooler de sesión (5432)**: 1 ida y vuelta por consulta (`SELECT 1` = 73 ms). Es el
  indicado para un servidor que queda encendido, como esta app.
- `connection_limit=5`: varias consultas en paralelo por página (con 1 se ponen en fila).
- `socket_timeout=30`, `connect_timeout=10`, `pool_timeout=10`: si una conexión queda muerta
  (pasó al cambiar de red Wi-Fi: una página se colgó indefinidamente), la consulta falla y la
  conexión se reemplaza en lugar de colgarse.

En **Vercel** (serverless) se usa el pooler de transacción (6543) con `pgbouncer=true`; ahí
la función corre en `cle1`, al lado de la base, y las idas y vueltas extra cuestan poco.
Ver `docs/13-despliegue-vercel.md`.

### Optimizaciones en el código (2026-10-08)

- **Índices** en todas las claves foráneas (montas, partos, crías, leche, pesos, etapas,
  padre/madre) y en `sexo + estado` y `modulo + estado` (`@@index` en `prisma/schema.prisma`).
- **Consultas planas y en paralelo**: el tiempo lo marca la cadena más larga de consultas.
  La ficha hace 8 consultas a la vez sin `include`; los nombres de animales relacionados
  salen de la lectura de genealogía, que se hace **una vez** por petición (`cache` de React).
- **Inicio**: los conteos de los tres módulos salen de **un solo `groupBy`**
  (`conteosTodosModulos` en `src/lib/modulos.ts`). Las vacas con sus montas/partos se cargan
  con `cargarVacasConCiclo` (`src/lib/alertas.ts`): tres consultas en paralelo, compartidas
  por petición (`cache` de React). Pendientes y calendario la usan sin módulo (todas las
  hembras activas); el desglose de la página de Lechería la usa con `"LECHERIA"`.
- **Escrituras en una consulta**: editar/borrar no lee antes; si el registro no existe
  Prisma devuelve P2025 (→ 404) y un arete repetido P2002 (→ 409).
- **Fotos**: el servidor las re-codifica con `sharp` (quita EXIF/GPS, valida que sea una
  imagen real) y genera `fotoMiniatura` (160 px, ~10 KB) para listas y encabezados.
- **Navegador**: la librería de gráficas se descarga solo al abrir la pestaña Peso o Leche
  (la ficha pasó de 219 KB a 118 KB de JS); favicon de 56 KB a 12 KB.

Tiempos de servidor (mediana, conexión caliente): Inicio, listas y ficha ≈ 0,4 s;
Familias y Calendario ≈ 0,3 s. El piso es una ida y vuelta a EE. UU. (~85 ms) más el render.

## Utilidades

- `npm.cmd run db:studio` — Prisma Studio contra Supabase. También sirve el *Table Editor* de Supabase.

## Seguridad

- Supabase expone las tablas de `public` por su API REST. Como la app no la usa,
  `prisma/supabase-rls.sql` activa **RLS sin políticas**: la API REST queda sin acceso y
  Prisma (usuario `postgres`) funciona igual. Si se agregan tablas, añadirlas a ese archivo.
- `.env` tiene la contraseña: no se sube al repositorio.
- La app pide contraseña para todo (ver `docs/11-seguridad.md`).

## Cambios de comportamiento respecto a SQLite

- La búsqueda (`/api/animales?q=`) usa `mode: "insensitive"`, porque en Postgres `contains`
  distingue mayúsculas y en SQLite no.
- Las fotos siguen guardadas como base64 en `Animal.fotoUrl`. Funciona, pero si crecen mucho
  conviene moverlas a Supabase Storage.
