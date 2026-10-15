# 09 — Estado del proyecto (handoff para retomar en un chat nuevo)

> Resumen vivo del estado actual de la app **TDS Ganadería** (Finca Tierra de Sueños).
> Pensado para que, al abrir un chat nuevo, se pueda continuar sin perder contexto.
> Última actualización: 2026-10-12.

---

## 1. Qué es

App web para gestionar el ganado de la familia. Nombre visible: **TDS Ganadería**.
Fase: ya **se está construyendo** (no solo levantamiento). Se desarrolla junto con el dueño,
probablemente con Claude Code también. Por ahora el dueño solo **hace pruebas** (datos no reales).

El dominio está definido en los documentos `00`–`08` de esta carpeta. Regla de oro: la app se
adapta al manejo real del ganado; no se inventan reglas; lo pendiente se marca, no se asume.

---

## 2. Stack técnico

- **Next.js 15** (App Router) + React 19 + TypeScript (desde 2026-10-08; antes Next 14).
  En Next 15 `params`/`searchParams` son promesas (`await params`).
- **Login con contraseña** + validación de la API + cabeceras de seguridad: ver `docs/11-seguridad.md`.
  Las rutas API usan los helpers de `src/lib/validar.ts` (`ruta`, `leerJson`, `texto`, `fecha`...).
- **Prisma + PostgreSQL en Supabase** (desde 2026-10-08; antes SQLite en `prisma/dev.db`).
  Conexión, variables y migración de datos: ver `docs/10-supabase.md`.
- **Tailwind CSS**, con `darkMode: "class"`. Paleta de marca verde (`marca` en `tailwind.config.ts`).
- **Recharts** para las gráficas de peso y leche (se cargan diferidas).
- **`sharp`** (0.35): re-codifica en el servidor las fotos que se suben (`src/lib/fotos.ts`)
  (el favicon se generó una vez con un script auxiliar que ya no está en el repo).
- **Node.js 20.9 o superior** (lo exige sharp 0.35; `"engines"` en `package.json`).
- Publicada en **Vercel** (ver `docs/13-despliegue-vercel.md`); también se puede servir en la
  red local de la finca con `npm.cmd run prod`. Ambas usan la misma base de Supabase.

### Entorno Windows / cómo correr
- Shell PowerShell con **ejecución de scripts bloqueada**: NO usar `npm`/`npx` directo,
  usar **`npm.cmd`** y **`npx.cmd`**.
- Scripts (`package.json`): `dev`, `build`, `start`, `prod` / `prod:build` / `prod:start`
  (versión "en uso" en el puerto 3000, compilada en `.next-produccion`), `db:push`,
  `db:studio` y `clave` (cambia la contraseña). En `scripts/` del repo solo quedan
  `produccion.mjs` y `cambiar-clave.mjs`.
- **Scripts auxiliares solo en local (2026-10-12)**: los de datos de prueba
  (`sembrar-prueba.mjs`, `sembrar-realista.mjs`, `leche-luna.mjs`), vaciar la base
  (`limpiar.mjs`), probar la conexión, regenerar el favicon y el asistente de Supabase se
  sacaron del repositorio (están en `.gitignore`); siguen en el equipo de desarrollo. Los que
  borran datos piden `--confirmar` y muestran el servidor 5 s antes de empezar.
- **Importante:** no correr `build` mientras `dev` está activo (ambos usan `.next` y chocan).
  Flujo seguro para verificar: parar dev → `Remove-Item -Recurse -Force .next` → `build`.
- A veces un `node` queda huérfano ocupando el puerto 3000; si el server abre en 3001 o el
  curl se cuelga, matar node: `Get-Process node | Stop-Process -Force` y rearrancar.
- La terminal de este entorno hace eco raro de los comandos y a veces el exit code sale -1
  aunque el comando funcione; verificar por archivos/efectos, no por el eco.

---

## 3. Modelo de datos (prisma/schema.prisma)

Base: **PostgreSQL en Supabase**. Los "enums" se guardan como `String`; los valores válidos
se controlan en `src/lib/validar.ts`.

- **Animal**: arete (único), nombre?, sexo ("MACHO"/"HEMBRA"), raza?, fechaNacimiento?,
  fotoUrl? (JPEG base64, máx. 600 px), fotoMiniatura? (JPEG base64, 160 px), descripcion?,
  estado ("ACTIVO"/"VENDIDO"/"MUERTO"), **modulo** ("ENGORDE"/"LECHERIA"/"REPRODUCTOR",
  por defecto ENGORDE; un animal no cambia de módulo), codigo? (del reproductor),
  fechaBaja?/motivoBaja? (solo vendidos/muertos), padreId?/madreId? (auto-relación) **o**
  padreExterno?/madreExterno? (texto). Índices en padreId, madreId, sexo+estado y modulo+estado.
- **Monta**: vaca, toro (o pajilla), fecha, notas?, inseminacion (bool, pajilla en vez de
  monta natural), prenezConfirmada (bool) + fechaConfirmacion? (palpación, B1).
- **Parto**: vaca, toro?, fecha, descripcion?, criaSana?, necesitoAyuda?, pesoNacimientoKg?
  (B4), crias (relación `Cria`).
- **Cria**: vincula Parto con el Animal cría (onDelete Cascade desde Parto).
- **RegistroLeche**: vaca, fecha, cantidad (litros de **un ordeño**), turno? ("MANANA"/"TARDE";
  los registros viejos sin turno son el total del día), notas?. El total del día es la suma.
- **RegistroPeso**: animal, fecha, pesoKg, notas?.
- **EtapaTernero**: animal, etapa ("LACTANCIA"/"DESARROLLO"/"ENGORDE"; "DESTETE" solo en
  datos antiguos), fechaInicio, fechaFin?, notas?.
- **IntentoLogin**: ip, fallos, hasta? — bloqueo por intentos fallidos de login (ver `docs/11-seguridad.md`).

---

## 4. Reglas de negocio clave (ver doc 02 para el detalle)

- **Módulos**: Engorde (crías de la finca, machos y hembras), Lechería (vacas compradas) y
  Reproductores (toro de la finca y pajillas con código). Un animal no cambia de módulo.
- **Monta ≠ parto**, pero el ciclo se estima **desde la monta**; la preñez se puede confirmar
  por palpación y anotarse en la monta (B1). Embarazo = **9 meses**.
- **Ciclo de la vaca** contado desde la última monta (constantes en `src/lib/fechas.ts`):
  - mes 0–7: **ordeño** · mes 7–9: **secado** · mes 9: **parto** estimado.
  - El estado "posparto/lista" se calcula desde el **parto real** (opción 2), no desde la estimación.
  - **40 días** de posparto tras el parto → luego **lista para montar**.
- **Etapas del ternero**: 3, en orden lactancia (3-4 m) → desarrollo (8 m) → engorde (4 m).
  Las duraciones son de referencia; las fechas se registran a mano. El animal deja de ser
  ternero al **cerrar el engorde** (fechaFin). "Destete" solo existe en datos antiguos.
- **Leche**: litros; cada registro es **un ordeño** (mañana o tarde) y el total del día es la
  suma. Normalmente se mide una vez por semana.
- Genealogía **derivada** de padre/madre; nunca duplicada. Progenitores pueden ser externos (texto).
- **Eliminar** un animal es para corregir un registro equivocado (si murió o se vendió se cambia
  el estado). Borra todo lo vinculado: sus eventos, las montas donde fue el toro y su vínculo como
  cría (el parto de la vaca se conserva); sus hijos registrados quedan sin ese padre/madre.

### Preguntas al dueño (doc 07): **B1–B11 respondidas el 2026-10-07**. Entre otras: tiempos del
ciclo fijos para toda la finca (B11), peso mensual (B8), del progenitor externo solo el nombre
(B9) y hermanos = comparten padre **o** madre (B10).

---

## 5. Lógica derivada (src/lib/)

- `fechas.ts`: constantes del ciclo (MESES_EMBARAZO=9, MESES_ORDENIO=7, DIAS_POSPARTO=40;
  el secado son los meses 7–9), helpers (`sumarMeses`, `sumarDias`, `diffDias`,
  `calcularEdad`, `hoyLocalISO`). **`formatearFecha` formatea en UTC**
  (se corrigió un bug de zona horaria que mostraba 1 día menos).
- `estado.ts`: `etapaActualTernero`, `cicloVaca`, `situacionReproductivaVaca` (devuelve
  estado + partoEstimado), estados ORDENIO/SECADO/POR_PARIR/POSPARTO/LISTA_MONTAR y sus
  etiquetas (`ESTADO_REPRO_LABEL`).
- `genealogia.ts`: ascendencia, árbol, hijos y hermanos derivados; `listarAnimales`.
- `alertas.ts`: `cargarVacasConCiclo(modulo?)` (hembras activas + montas/partos, tres
  consultas en paralelo, `cache` por petición), `calcularPendientes` → avisos de Inicio
  (ORDENIO, SECADO_PROXIMO, POR_PARIR, LISTA_MONTAR) con ventana de **20 días**
  (`VENTANA_DIAS`), y `calcularEventosCalendario` (hitos futuros sin ventana).
- `modulos.ts`: conteos por módulo (`conteosModulo`; `conteosTodosModulos` con un solo
  `groupBy` para Inicio), desglose de engorde por etapa y de lechería por estado reproductivo.
- `leche.ts`: suma los ordeños por día, gráfica y resumen por vaca (`puntosVaca`,
  `resumenVaca`) y producción del hato por semanas o meses (`produccionHato`).
- `fotos.ts`: `procesarFoto` (sharp: re-codifica a JPEG, quita EXIF/GPS, corrige orientación
  y genera la miniatura de 160 px).
- `tipos.ts`: etiquetas (SEXO_LABEL, ESTADO_LABEL, MODULO_LABEL, ETAPA_LABEL) y `ETAPAS_ORDEN`.
- `validar.ts` / `sesion.ts` / `api-cliente.ts`: validación de la API, sesión y `llamarApi`
  (fetch desde el cliente que nunca lanza; sin conexión devuelve un error legible).

---

## 6. Funcionalidad implementada (toda verificada con build + pruebas)

- **CRUD de animales**: alta (`/animales/nuevo`), edición (`/animales/[id]/editar`),
  eliminación (con reglas de integridad), ficha (`/animales/[id]`).
- **Ficha del animal** en pestañas: **Info** (datos, padres/abuelos, hijos/hermanos),
  **Registrar** (formularios según su módulo), **Historial** (eventos editables), **Peso**
  (engorde) o **Leche** (lechería) con gráfica, y **Árbol** genealógico. Badges de situación
  (etapa o estado reproductivo) y "Parto estimado: fecha".
- **Módulos**: páginas `/engorde`, `/lecheria` y `/reproductores` con sus conteos (engorde:
  machos/hembras y por etapa; lechería: por estado reproductivo), lista y botón para agregar
  un animal ya asignado al módulo. Bajas por módulo (`/engorde/bajas`, …) y global (`/animales/bajas`).
- **Eventos**: monta (natural o inseminación con pajilla; preñez confirmada por palpación),
  parto (con varias crías y datos del nacimiento), leche (un ordeño por turno), peso, etapa.
  Todos se pueden **editar** (inline en el historial) y **eliminar**. En engorde, el cambio de
  etapa es de un toque (`POST /api/etapas/cambiar`: cierra la actual y abre la nueva hoy).
- **Producción de leche** (`/leche`): litros por día del hato por semanas o meses y tabla por
  vaca (promedio de 30 días y último registro).
- **Listas**: Todos los animales, por módulo y Dados de baja (Familias existe pero está oculta
  en el menú). Columna de foto (miniatura), situación.
- **Buscador** por arete/nombre (`?q=`) y **filtro** desplegable por estado, etapa y **raza**
  (razas generadas dinámicamente). Parámetros vía URL (`?filtro=` y `?q=`).
- **Inicio**: total de animales activos, conteo por módulo y **panel de pendientes** (qué atender).
- **Calendario**: hitos futuros del ciclo de cada vaca (secado, parto estimado, lista para montar).
- **Exportar a CSV**: botón en las listas → `/api/exportar?sexo=&modulo=&estado=ACTIVOS|BAJAS`
  (con BOM para Excel). **Imprimir / guardar en PDF** la ficha.
- **Respaldo** (`/respaldo`): descargar todos los datos en un JSON y restaurarlos.
- **Foto del animal**: el navegador la reduce (máx 600 px, JPEG) y la envía por
  `PATCH /api/animales/[id]`; el **servidor la re-codifica con sharp** (`src/lib/fotos.ts`:
  quita EXIF/GPS, valida que sea una imagen real) y guarda `fotoUrl` + `fotoMiniatura`
  (160 px), que es la que usan listas y encabezados.
- **Modo oscuro**: toggle sol/luna, preferencia en localStorage + preferencia del sistema,
  script anti-parpadeo en el layout. Variantes `dark:` en toda la UI.
- **Identidad**: logo del toro (`public/logo.png`) en la navegación; favicon recortado con fondo
  blanco (`public/favicon.png`).

### API (rutas en src/app/api/)
- `animales` (GET lista con ?sexo/?estado/?modulo/?q, POST crear)
- `animales/[id]` (GET, PUT editar, PATCH foto, DELETE con reglas de integridad)
- `montas`, `partos`, `leche`, `pesos`, `etapas` (POST) y cada `[id]` (PUT/DELETE)
- `leche` POST: un ordeño, cantidad 0–1000 L, turno opcional MANANA/TARDE; **409** si ya hay
  un ordeño de ese turno ese día para la vaca.
- `etapas/cambiar` (POST: cierra la etapa abierta y abre la nueva con fecha de hoy)
- `exportar` (GET CSV, ?sexo=&modulo=&estado=ACTIVOS|BAJAS)
- `respaldo` (GET descarga JSON, POST restaura)
- `sesion` (POST login, DELETE cerrar sesión)

Contrato detallado en `.kiro/steering/api.md`.

---

## 7. Diseño / UI

- **Navegación** → `src/components/Navegacion.tsx` (rediseño mobile-first 2026-10-08):
  - Menú: Inicio, Engorde, Lechería, Producción de leche (`/leche`), Reproductores, Todos los
    animales, Dados de baja, Calendario y Respaldo. Familias está oculta. Ya no existen
    `/toros` ni `/vacas`.
  - Móvil: barra superior (logo + tema) y **barra inferior** (Inicio, Engorde, botón central
    "+" para agregar, Lechería, Más). "Más" abre una hoja inferior con el resto de secciones
    y Cerrar sesión. La barra inferior se oculta mientras se escribe.
  - Escritorio (`lg:`): sidebar fijo a la izquierda con el menú completo.
- Ficha del animal: la foto vive en el encabezado (tocarla para cambiarla), acciones en una
  fila, y las 5 pestañas caben a lo ancho en 390 px.
- **Reparto del trabajo**: Kiro hace el frontend y Claude Code el backend. Reglas y contrato
  de la API en `.kiro/steering/`; pedidos del frontend al backend en `docs/12-pedidos-backend.md`.
  El layout (`src/app/layout.tsx`) usa `<Navegacion/>` y el main con `lg:pl-60`.
- Componentes UI reutilizables en `src/components/ui.tsx`: `Card`, `SectionTitle`, `Badge`,
  `EstadoBadge`, `SexoBadge`, `AnimalLink`, `PageHeader`, `BotonPrimario`, `Vacio`.
- **Respaldo del diseño anterior** (encabezado horizontal) congelado en la carpeta hermana
  `c:\Users\dpaniagua\Desktop\AppGanado-respaldo-encabezado` (sin node_modules/.next).
  Si se quiere volver, se restaura desde ahí y se corre `npm.cmd install`.

---

## 8. Estado de los datos

- Solo hay **datos de prueba** (el dueño todavía no carga datos reales). La base de `.env` es
  la de **producción** (la misma que usa Vercel): lo que se haga en local afecta a la app publicada.
- Hay dos juegos: el pequeño de `sembrar-prueba.mjs` (aretes T-, P-, L-, E-) y un hato realista
  de ~2 años de `sembrar-realista.mjs` (96 animales, aretes 3001+). El animal **2324 "Tuerta"**
  se cargó a mano: puede ser real.
- **Antes del uso real**: descargar un respaldo, vaciar la base (`node scripts/limpiar.mjs
  --confirmar`, local) y cargar los animales reales. Los scripts de prueba no están en el repo.

---

## 9. Lo que podría venir después (ideas discutidas, no hechas)

- Registro de leche en lote (varias vacas de un día).
- Mover las fotos a Supabase Storage si la base crece mucho (ver `docs/10-supabase.md`).

Ya hechos (antes estaban en esta lista): respaldo JSON de toda la base, gráficas de peso y
leche, migración a Postgres (Supabase) y despliegue en Vercel, y respuestas B1–B11.

---

## 10. Cómo retomar en un chat nuevo

1. Leer este archivo y, si hace falta más detalle de reglas, los docs `02` y `07`.
2. El código vive en `src/` (app, components, lib). El modelo en `prisma/schema.prisma`.
3. Para probar: `npm.cmd run dev` (parar antes cualquier node huérfano; no hacer build con dev activo).
4. Mantener el principio del proyecto: no inventar reglas de negocio; preguntar y registrar pendientes.
