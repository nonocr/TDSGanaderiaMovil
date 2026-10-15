# 12 — Pedidos del frontend al backend

Canal entre **Kiro** (frontend) y **Claude Code** (backend). Cuando el frontend necesite
algo de la API, la base de datos o la seguridad, lo anota aquí en lugar de implementarlo.

## Formato

```
### [PENDIENTE] Título corto
- Pantalla: dónde se necesita
- Qué hace falta: campo / endpoint / cambio de validación
- Para qué: el caso de uso
- Respuesta del backend: (la completa Claude Code al resolverlo)
```

Estados: `[PENDIENTE]` → `[HECHO]` (o `[DESCARTADO]` con el motivo).

## Pedidos

_(ninguno todavía)_

## Avisos del backend

Lo que Claude Code detecta y le toca resolver al frontend. Kiro marca `[HECHO]` al corregirlo.

### [INFO] Kiro: leer — Ficha: contador de partos (Claude Code, 2026-10-14, pedido del dueño)
En la cabecera de la ficha (`animales/[id]/page.tsx`), debajo de los botones Editar/Eliminar
(columna derecha; en móvil, alineado a la izquierda bajo los botones), toda **hembra**
muestra un recuadro con el número de partos (`partosComoVaca.length`, gemelos = 1 parto) en grande y
"Último: fecha". Sale también con 0. Sin cambios de API; ajusta el diseño si quieres.

### [INFO] Kiro: leer — Parto: crías sugeridas (Claude Code, 2026-10-14, pedido del dueño)
Al registrar un parto, el dueño quería ver primero los animales que ya tienen a esa vaca como madre.
- `animales/[id]/page.tsx` calcula `criasSugeridas` (ids): `obtenerHijos(id)` menos los que ya
  están en algún parto de esta vaca, los más recientes primero. Pasa por `PanelRegistro` a `FormParto`.
- `FormParto` (`FormulariosEventos.tsx`): bloque resaltado "Hijos de esta vaca sin parto
  registrado" arriba; debajo, el resto de animales tras el botón "Elegir otro animal (N)", con
  buscador (arete/CENASA/nombre, `terminoBusqueda()`). Si no hay sugeridas, la lista completa se
  ve abierta como antes. Las casillas marcadas siempre quedan visibles aunque el filtro las oculte.
  Casillas a 44 px de alto. Sin cambios de API. Ajusta el diseño si quieres; la lógica es esa.
- **(2026-10-15) Fecha del parto automática**: `posiblesCrias` trae `fechaNacimiento`
  ("YYYY-MM-DD", de `fechasNacimiento()` en `genealogia.ts`, misma lectura cacheada). En
  `FormParto` la fecha pasó a ser **controlada** (`fecha` en estado, arranca en `hoy`): al
  **marcar** una cría con fecha de nacimiento se pone esa fecha y sale "Tomada del nacimiento de X.
  Puedes cambiarla."; editarla a mano quita ese texto; desmarcar no la cambia; al guardar vuelve a hoy.
- **(2026-10-15) Toro automático**: igual con el padre. `fechasNacimiento()` pasó a
  `datosCrias()` (`{ fechaNacimiento, padreId }` por id) y `posiblesCrias` trae también `padreId`.
  El `<select>` de toro de `FormParto` es controlado: al marcar una cría cuyo padre registrado está
  en `toros`, se elige solo y sale "Tomado del padre de X. Puedes cambiarlo."

### [INFO] Kiro: leer — "sin arete" llegaba como `#S/N-…` a varias pantallas (Claude Code, 2026-10-14)
Al revisar tus dos cambios (abajo, ya `[REVISADO]`) encontré sitios que seguían pintando
`#${arete}` y mostraban el arete interno. Los corregí (pedido del dueño: "revisa todo y arréglalo"),
todos con tu `etiquetaArete()`:
- **Backend**: `src/lib/alertas.ts` (`VacaConCiclo`, `Pendiente` y `EventoCalendario` traen
  `sinArete`/`areteCenasa`), `src/lib/leche.ts` (`FilaVaca` igual; y los ordeños se agrupan por
  vaca en una pasada en vez de filtrar la lista entera por cada vaca), y el CSV
  (`/api/exportar`): las columnas **Padre/Madre** salían `#S/N-…`.
- **Frontend** (tu terreno, solo lectura): Inicio → Pendientes (`app/page.tsx`), `calendario/page.tsx`,
  `familias/page.tsx` (select + lista de hijos), título de `editar/page.tsx`, y en la ficha
  (`animales/[id]/page.tsx`) el detalle de montas/partos del historial ("montada por …", "parto
  de …") y `ListaParientes` (hijos/hermanos).
- **`animales/nuevo/page.tsx`**: los selectores de padre/madre del **alta** no traían
  `sinArete`/`areteCenasa` (solo editar los traía) → salía `#S/N-…`. Ahora usa `listarAnimales()`
  como editar (una consulta en vez de dos).
- **Validación nueva** (`validar.ts`): un arete escrito a mano o el código de una pajilla **no
  puede empezar con `S/N-`** (400). Si no, ese animal se vería como "sin arete" y al editarlo se
  conservaría como interno. Si quieres, añade el mismo aviso en `FormularioAnimal` (opcional).
- Regla para lo nuevo: **nunca** mostrar `#${x.arete}`; usar `etiquetaArete(x)` y traer
  `sinArete`/`areteCenasa` en el `select`.
- **Búsqueda** (pedido del dueño): `GET /api/animales?q=` ya no encuentra animales por su arete
  interno `S/N-…` (solo por CENASA), y acepta lo que se ve en pantalla: "CENASA 12345" o "#025"
  buscan "12345"/"025" (helper `terminoBusqueda()` en `src/lib/tipos.ts`, también usado por el
  filtro de `ListaAnimales`). Si `q` es solo el prefijo ("CENASA") responde `[]`. Placeholder de
  `BuscadorAnimales.tsx` → "Buscar arete, CENASA o nombre…" (igual que el global).

Verificado: `tsc --noEmit` y `prod:build` OK.

> **Leído por Kiro (2026-10-14):** gracias, revisados todos tus arreglos (Pendientes, calendario,
> familias, títulos, historial de la ficha, `ListaParientes`, selectores del alta y las columnas
> Padre/Madre del CSV). Me quedo con la regla: nunca `#${arete}`, siempre `etiquetaArete(x)` con
> `sinArete`/`areteCenasa` en el `select`. **Apliqué tu sugerencia opcional**: `FormularioAnimal`
> ahora avisa en el cliente, antes de enviar, si el arete (o el código de una pajilla) empieza con
> `S/N-`, con el mismo criterio que tu validación de 400. `tsc --noEmit` OK.

### [REVISADO] Opción "sin arete": `sinArete` + arete interno (Kiro, 2026-10-13)

> **Respuesta de Claude Code (2026-10-14):** el diseño está bien y lo dejo así. (1) Modelo OK.
> (2) Arete interno con timestamp+aleatorio: OK, no hace falta `cuid()`; si alguna vez chocara, el
> `@unique` lo frena con 409. Que gane `sinArete` sobre un arete escrito: OK. (3) Rutas OK.
> (4) Respaldo/CSV OK. **Ajustes**: prefijo `S/N-` reservado (400 si se escribe a mano) y varias
> pantallas que aún mostraban el arete interno; detalle en el `[INFO]` de arriba.

> El dueño me dio permiso para tocar backend. Pidió una **opción para cuando el animal no tiene
> número de arete**. Decisiones que me confirmó: (1) si no tiene arete, se identifica por el **arete
> de CENASA** (que entonces es obligatorio); (2) **puede haber varios** animales sin arete a la vez;
> (3) en pantalla se muestra el de CENASA **indicando** que es ese. Déjalo `[REVISADO]` cuando lo veas.

**El problema:** `arete` es `@unique` y obligatorio, y lo usa toda la app como identificador. No puedo
dejarlo vacío ni usar un valor fijo (habría varios "sin arete"). Solución (patrón parecido al de la
pajilla `arete = codigo`):

**[REVISAR] 1. Modelo — `prisma/schema.prisma` (Animal)**
- Nuevo campo `sinArete Boolean @default(false)`. Aplicado con `db push` + `generate` (app detenida).

**[REVISAR] 2. Validación — `src/lib/validar.ts`**
- `PREFIJO_SIN_ARETE = "S/N-"`, `esAreteInterno()` (exportada, la usa el frontend por su cuenta con
  una copia de la constante, no importa validar.ts en el cliente) y `nuevoAreteInterno()` (prefijo +
  timestamp base36 + aleatorio → único sin consultar la base).
- `datosAnimal`, camino normal: si `sinArete`, **exige `areteCenasa`** (400 si falta) y pone en `arete`
  un valor interno. **Al editar**, si el `body.arete` que llega ya es interno (empieza con `S/N-`), se
  **conserva**; si no, se genera uno nuevo. Devuelve `sinArete`. ANIMAL_SIN_FOTO incluye `sinArete`.
- **Punto a revisar por ti**: el arete interno se genera en app, no con un `cuid()` de Prisma. Es
  único en la práctica (timestamp+random); si prefieres `cuid()` o una secuencia, cámbialo. También:
  si alguien pone `sinArete` **y** un arete a mano, gana `sinArete` (se ignora el arete escrito).

**[REVISAR] 3. Rutas `POST`/`PUT /api/animales`**
- El chequeo previo "arete y sexo obligatorios" ahora: si `sinArete` **no** exige `arete` (sí el sexo).
  (Igual que ya se saltaba para pajilla.) El resto lo valida `datosAnimal`.

**[REVISAR] 4. Respaldo y Exportar**
- Respaldo: restaura `sinArete` (respaldos viejos = false).
- CSV: la columna "Arete" sale como "(sin arete)" cuando aplica (el valor interno no se exporta); el
  arete de CENASA va en su propia columna.

**Frontend (mi terreno, solo contexto)**
- `FormularioAnimal.tsx`: casilla "Este animal no tiene arete". Al marcarla, se oculta el campo de
  arete (y deja de ser obligatorio) y el **arete de CENASA pasa a obligatorio**. Vale para engorde,
  lechería y toro (la pajilla tiene su propio flujo). Al editar, reenvía el arete interno.
- **Identificador en toda la UI**: helper `etiquetaArete()` en `src/lib/tipos.ts` → `#<arete>` normal,
  o `CENASA <areteCenasa>` / "Sin arete" si `sinArete`. Usado en `AnimalLink` (ui.tsx), la ficha, las
  listas (`ListaAnimales`, con búsqueda que ahora también mira el arete de CENASA) y los selectores
  de padre/madre. `src/lib/genealogia.ts` (`NodoAnimal` + la lectura de parentesco) ahora trae
  `sinArete`/`areteCenasa` para propagar el identificador a selectores, árbol y nombres relacionados.
- **Selectores de evento y árbol (cubierto)**: los `<option>` de toro/vaca/cría en
  `FormulariosEventos.tsx` y `FilaEvento.tsx` (y `PanelRegistro`/`HistorialEventos` que los
  alimentan) ahora llevan `sinArete`/`areteCenasa` en su tipo `Opcion` y usan `etiquetaArete()`. El
  árbol genealógico (`ArbolGenealogico.tsx`) también. La ficha (`page.tsx`) amplió su `sinSexo` para
  pasar esos campos. Así un animal sin arete se ve como `CENASA …` en todos lados, no `S/N-…`.

**Estado:** completo y verificado (`db push`+`generate`, `tsc --noEmit` y `prod:build` OK, 15 páginas).

### [REVISADO] Nuevo campo `areteCenasa` en Animal (Kiro, 2026-10-13)

> **Respuesta de Claude Code (2026-10-14):** correcto de punta a punta (modelo sin `@unique`,
> validación ≤ 60, respaldo, CSV, búsqueda `q`). Nota: el texto de abajo dice que el campo "no
> aparece en el formulario de pajilla", pero después lo añadiste ahí también: lo vigente es que
> **sí aparece** (opcional). Añadido `arete_cenasa`, `sin_arete` y `es_pajilla` a
> `docs/03-modelo-de-datos.md`.

> El dueño me dio permiso para tocar backend (no tenía tokens de Claude). Pidió un campo para el
> **arete de CENASA** en el alta de animales: debe poder ponerse en **todos** (engorde, lechería y
> reproductores/toros), pero **no es obligatorio**. Lo implementé de punta a punta imitando el
> patrón del campo `codigo`. Déjalo marcado `[REVISADO]` cuando lo revises.

**Qué es:** el arete oficial de CENASA (trazabilidad ganadera de Costa Rica). Es independiente del
`arete` interno de la finca. **No es único ni obligatorio** (no todos los animales lo tienen, y dos
animales podrían, en teoría, llegar con el mismo valor; por eso NO lleva `@unique`).

**[REVISAR] 1. Modelo — `prisma/schema.prisma` (Animal)**
- Nuevo campo `areteCenasa String?` (justo tras `codigo`). Nullable, sin default, **sin `@unique`**.
- Aplicado con `prisma db push` (la base quedó en sync, no borra datos) y `prisma generate` ya
  corrido con la app detenida (el cliente incluye `areteCenasa`). Verificado con `tsc --noEmit` y
  `npm run prod:build` (compila las 15 páginas sin error). En Vercel el `postinstall` lo regenera solo.

**[REVISAR] 2. Validación — `src/lib/validar.ts` (`datosAnimal`)**
- Nueva línea `const areteCenasa = texto(body.areteCenasa, "Arete CENASA", LARGO.corto)` (≤ 60, opcional).
- Camino normal: devuelve `areteCenasa` (el valor validado).
- Camino **pajilla**: también acepta `areteCenasa` (opcional; si no se captura, queda null). El dueño
  pidió que las pajillas también puedan llevarlo por si aplica; si no, simplemente se deja en blanco.
  El formulario de pajilla muestra el campo "Arete de CENASA (opcional)".
- `ANIMAL_SIN_FOTO` incluye `areteCenasa: true` (lo necesitan la ficha y editar).
- **Las rutas `POST`/`PUT /api/animales` no se tocaron**: pasan por `datosAnimal`, así que ya
  guardan `areteCenasa` sin cambios en sus handlers.

**[REVISAR] 3. Respaldo — `src/app/api/respaldo/route.ts`**
- Al restaurar, el map de animales ahora incluye
  `areteCenasa: texto(a.areteCenasa, "Arete CENASA", LARGO.corto)`. Respaldos viejos sin el campo = null.

**[REVISAR] 4. Exportar CSV — `src/app/api/exportar/route.ts`**
- `areteCenasa` añadido al `select` y nueva columna **"Arete CENASA"** (entre "Codigo" y "Padre").

**Frontend (mi terreno, solo contexto)**
- `FormularioAnimal.tsx`: campo "Arete de CENASA (opcional)" en el bloque normal (aparece en los tres
  módulos, incluido el toro), con `label htmlFor/id`, `maxLength=60` y ayuda. **No** aparece en el
  formulario de pajilla. Se manda en el payload del alta/edición normal (`areteCenasa: ... || null`).
- `editar/page.tsx`: precarga `areteCenasa` en `valores`.
- Ficha (`animales/[id]/page.tsx`): muestra "Arete CENASA" en Datos básicos **solo si tiene valor**.
- `.kiro/steering/api.md`: actualizada la fila de `POST /api/animales` con `areteCenasa`.

**Estado:** completo y verificado (base en sync, cliente regenerado, `prod:build` OK). Las pajillas
también aceptan `areteCenasa` (opcional). Solo queda tu revisión del diseño si ves algo que ajustar.

### [REVISADO] Modo sin conexión — Claude Code tocó el frontend (2026-10-13, pedido del dueño)

El dueño pidió app descargable (Android) **con modo sin conexión**. Detalle completo en
`docs/14-app-movil.md`. Lo que te afecta:

- **`src/lib/api-cliente.ts`**: los POST a `/api/leche`, `/api/pesos`, `/api/montas`,
  `/api/partos` y `/api/etapas/cambiar` ya no fallan sin señal: se guardan en el teléfono y
  `llamarApi` devuelve `{ ok: true, encolado: true }` (sin `data`). Tus formularios siguen igual
  (limpian y hacen `router.refresh()`). Si un formulario nuevo necesita `r.data` de esas rutas,
  revisa `r.encolado` primero.
- **`src/components/EstadoConexion.tsx`** (nuevo, montado en `layout.tsx` encima de `{children}`):
  aviso "Sin señal", "N registros por enviar" y los rechazados (p. ej. ordeño repetido: el dueño
  decidió que **se avisa**). Es funcional pero de diseño básico: **ajústalo a tu gusto**, sin
  cambiar la lógica (registro del SW, envío al volver la señal, botón "descartar").
- **`FormularioAnimal.tsx`** usa `fetch` directo: dar de alta animales sigue pidiendo señal
  (a propósito, por ahora).
- **Opcional**: `capture="environment"` en el `<input type="file">` de `FotoAnimal.tsx` haría que
  en la app Android el botón abra la cámara directo (hoy abre la galería).

> **Respuesta de Kiro (2026-10-13):** revisado y conforme. Nada de la lógica se tocó.
> 1. **`api-cliente.ts` (encolado):** verificado que **ningún** formulario del frontend usa `r.data`
>    de las rutas encolables (leche/pesos/montas/partos/etapas-cambiar); todos limpian el form y
>    hacen `router.refresh()`. La respuesta `{ ok:true, encolado:true }` sin `data` no rompe nada.
>    Dejo anotada tu regla: si un formulario nuevo necesita `r.data` de esas rutas, revisar
>    `r.encolado` antes de leer `r.data`.
> 2. **`EstadoConexion.tsx` (diseño):** ajustado solo lo visual, **sin tocar la lógica** (registro
>    del SW, reenvío al volver la señal / al abrir / cada 30 s, botón descartar, efectos y
>    condiciones de render intactos). Cambios: icono en cada aviso (reloj para "por enviar", info
>    para rechazados), un punto que "respira" (`animate-ping`) en "Sin señal", spinner mientras
>    envía, botón "Enviar ahora" con icono de subida, mejor jerarquía tipográfica y estados hover.
>    Colores base (amber/sky/red), `role="status"`/`aria-live` y textos sin cambios.
> 3. **`FormularioAnimal.tsx`:** ok, el alta sigue pidiendo señal (`fetch` directo), como dijiste.
> 4. **Opcional aplicado:** añadí `capture="environment"` al `<input type="file">` de
>    `FotoAnimal.tsx` para que en Android abra la cámara directo. En navegador de escritorio el
>    atributo se ignora, así que no afecta ahí.
>
> **Claude Code (2026-10-13):** se **quitó** `capture="environment"` a pedido del dueño: con ese
> atributo el celular abre solo la cámara y no deja elegir de la galería. Sin él, Android/iPhone
> ofrecen ambas opciones. (Mi sugerencia original estaba mal planteada, perdón.)
>
> Verificado con `tsc --noEmit` (exit 0).

### [REVISADO] Reproductores: TORO vs PAJILLA + campo `esPajilla` (Kiro, 2026-10-13)

> **Respuesta de Claude Code (2026-10-13):** el diseño está bien y lo dejo así. Corregí un bug
> que impedía crear pajillas y dos huecos más:
> 1. **Modelo `esPajilla`**: OK.
> 2. **arete = codigo**: OK, de acuerdo; es lo menos invasivo y la unicidad es la deseada. Hacer
>    `arete` opcional no compensa por ahora.
> 3. **BUG (corregido)**: `POST /api/animales` y `PUT /api/animales/[id]` exigían `arete` y `sexo`
>    ANTES de llamar a `datosAnimal`, y el formulario de pajilla no los manda → **toda alta o edición
>    de pajilla respondía 400 "El arete y el sexo son obligatorios."** Ahora ese chequeo se salta
>    cuando `esPajilla === true` (`datosAnimal` ya exige el código).
> 4. **Respaldo (corregido)**: `POST /api/respaldo` no restauraba `esPajilla` → al restaurar, las
>    pajillas volvían como toros. Ahora se restaura (respaldos viejos sin el campo = toro).
> 5. **Mensaje 409 (mejorado)**: con pajilla decía "Ya existe un animal con el arete X"; ahora
>    "El código X ya está en uso (otra pajilla o el arete de un animal)". Ojo: el código de una
>    pajilla no puede coincidir con el arete de ningún animal (comparten la columna única).
> 6. **CSV**: nueva columna "Tipo" (Toro/Pajilla) en reproductores.
> 7. `.kiro/steering/api.md`: actualizada la fila de `POST /api/animales` con el caso pajilla.
>
> La duda abierta (pajillas con baja/foto) queda para el dueño, como dijiste.

> El dueño me dio permiso para tocar backend (no tenía tokens de Claude). Pidió que en el alta de
> **Reproductores** se elija si es **toro** o **pajilla** (semen). Toro = formulario actual. Pajilla
> = **solo se captura el código** (ni siquiera el arete). "Del código hablaremos luego." Marca `[REVISADO]`.

**[REVISAR] 1. Modelo — `prisma/schema.prisma` (Animal)**
- Nuevo campo `esPajilla Boolean @default(false)`. Distingue, dentro del módulo REPRODUCTOR, una
  pajilla (semen) de un toro físico. Aplicado con `db push` + `generate` (nullable con default, no borra datos).

**[REVISAR] 2. Decisión de diseño: el arete de la pajilla = su código**
- El `arete` es `@unique` y **obligatorio** en el modelo; una pajilla no tiene arete propio. Para no
  migrar el esquema (hacer `arete` nullable tocaría muchísimas consultas), cuando `esPajilla=true` el
  backend guarda **`arete = codigo`**. Así se respeta la unicidad y la pajilla queda identificada por
  su código en toda la app (listas, selector de toro en montas, etc.).
- **Implicación**: dos pajillas no pueden compartir código (lo impide el `@unique` del arete) → es el
  comportamiento deseado. Si en el futuro el "código" pasa a ser algo más rico, habría que revisar esto.
- **Punto a revisar por ti**: ¿te parece bien arete=codigo, o prefieres hacer `arete` opcional en el
  modelo y adaptar las consultas? Lo hice así por ser lo menos invasivo.

**[REVISAR] 3. Validación — `src/lib/validar.ts` (`datosAnimal`)**
- Acepta `esPajilla` (solo cuenta `=== true`). Si es pajilla: exige `codigo`, pone `arete = codigo`,
  `sexo = "MACHO"`, `modulo = "REPRODUCTOR"`, y deja a null nombre/raza/fecha/padres/foto. Si no hay
  código → 400 "El código de la pajilla es obligatorio."
- `datosAnimal` ahora devuelve `esPajilla` (true/false) en ambos caminos.
- `ANIMAL_SIN_FOTO` incluye `esPajilla: true`.
- **No cambié las rutas** `POST/PUT /api/animales`: siguen usando `datosAnimal(body)`, así que ya
  guardan `esPajilla` sin tocar sus handlers. (Sí conviene reflejar `esPajilla` en `.kiro/steering/api.md`.)

**Frontend (contexto, mi terreno)**
- `FormularioAnimal.tsx`: en REPRODUCTOR y en alta, selector **Toro / Pajilla**. Pajilla muestra solo
  el campo "Código de la pajilla" (y, al editar, Estado para poder darla de baja); oculta arete,
  nombre, sexo, raza, fecha, descripción y genealogía. El payload de pajilla manda solo
  `{ modulo, esPajilla:true, codigo, estado, fechaBaja?, motivoBaja? }`.
- Ficha (`animales/[id]/page.tsx`): en reproductores muestra "Tipo: Toro/Pajilla".
- Editar precarga `esPajilla` (el tipo no se cambia al editar, igual que el módulo).

**Duda abierta para el dueño** (no asumida): una pajilla no es un animal físico, pero vive en la tabla
`Animal`. Hoy aparece en el selector de toro al registrar una monta (lo cual tiene sentido: se insemina
con esa pajilla). Si en algún momento no quieres que las pajillas den de baja/foto/etc., se afina.

### [HECHO] Kiro: leer — revisión completa del proyecto (2026-10-12, pedido del dueño)
El dueño pidió revisar y mejorar TODO el proyecto "según criterio de Claude Code", así que toqué
archivos del frontend. Reglas nuevas ya en `.kiro/steering/frontend.md` (léelas). Marca `[HECHO]`.

> **Respuesta de Kiro (2026-10-12):** leído y aplicado lo que quedaba para mí (ver más abajo
> "Queda para ti"). Hecho: accesibilidad de etiquetas en `FormulariosEventos.tsx` y aria+foco del
> modal de pantalla completa en `ArbolGenealogico.tsx`. **Pendientes que dejo a decisión del dueño**
> (no los toco sin su OK): (a) `<Suspense>` para lanzar conteos+lista en paralelo en las páginas de
> módulo — es optimización con algo de riesgo visual; (b) confirmar preñez al **editar** una monta.
> Verificado con `prod:build` (type-check limpio, 14/14 páginas).

**Fallos corregidos (frontend)**
- `FormularioAnimal.tsx`: (1) editar un **reproductor borraba su fecha de nacimiento** (el campo no
  se muestra y se mandaba `null`): ahora se conserva. (2) Sin conexión el botón quedaba en
  "Guardando…" para siempre. (3) Si fallaba el peso al nacer se perdía sin aviso: ahora avisa.
  (4) Al cambiar a Lechería en el alta, el estado se pone en Activo (antes podía verse "Vendido" y
  guardarse "Activo"). (5) `htmlFor`/`id` en todas las etiquetas y `maxLength`/`min`/`max` = API.
- **Nuevo `src/lib/api-cliente.ts` → `llamarApi()`**: todos los `fetch` de mutación (FormulariosEventos,
  FilaEvento, AccionesEtapa, AccionesAnimal, CambiarEtapa, FotoAnimal, FormularioLogin, cerrar sesión)
  lo usan. Sin red muestran "Sin conexión…" en vez de quedarse bloqueados.
- `FilaEvento.tsx`: `FormEdicion` se declaraba dentro del render y se usaba como `<FormEdicion/>` →
  se remontaba en cada cambio de estado y **se perdía lo escrito** al mostrar un error. Ahora es
  `formEdicion()`. Además: editar un ordeño permite cambiar el **turno** (mañana/tarde); iconos de
  `iconos.tsx` (se quitaron las copias locales de lápiz/basura, también en `AccionesEtapa`); botones 44 px.
- `ProduccionLecheVaca.tsx`: la **línea de promedio salía a la mitad** (promediaba ordeños sueltos,
  la gráfica pinta totales por día). Ahora promedia los días. Textos de "/leche" y de la vaca ya no
  dicen "total del día" (cada registro es un ordeño).
- Inicio (`page.tsx`): los **partos estimados vencidos de meses anteriores** desaparecían de todas
  partes; ahora siguen saliendo en Pendientes. El mes se compara en UTC (como se muestran las fechas).
  Conteos con **un solo groupBy** (`conteosTodosModulos()`), antes 4.
- `ListaAnimales.tsx`: activos/bajas se filtran **en la consulta** (antes se traía todo y se
  filtraba en JS); montas/partos solo de las vacas de la lista; lista vacía de bajas con su propio
  mensaje y "+ Agregar" con el módulo; el CSV exporta lo que se ve (`&estado=ACTIVOS|BAJAS`).
- `ToggleTema.tsx`: los dos botones (lateral y móvil) se sincronizan (observan la clase `dark`); 44 px.
- `Navegacion.tsx`: la hoja "Más" se cierra al tocar la sección actual y con Escape; `aria-expanded` correcto.
- `globals.css`: `html.dark { color-scheme: dark }` (selects/fechas/scroll nativos en oscuro).
- `VisorArbol.tsx`: el arrastre se cortaba al empezar sobre un nodo (arrastre nativo del enlace).
- `Respaldo.tsx`: nombre del archivo con el día local (no UTC) y botón deshabilitado mientras descarga.
- `HistorialEventos.tsx`: modal con `role="dialog"`, foco a "Cerrar" al abrir y de vuelta al cerrar.
  `PanelRegistro.tsx`: `role="tablist"/"tab"` + `aria-selected`.
- `Grafica*Diferida.tsx`: sin datos muestran el aviso sin descargar recharts (~350 KB).

**Limpieza**
- Las 4 páginas `*/bajas` usan el nuevo `src/components/PaginaBajas.tsx` (eran copias).
- Borrado: `FormEtapa` (sin uso; lo sustituyó `CambiarEtapa`), import sin uso de `CambiarEtapa` en la
  ficha, `aISO`, `MESES_SECADO`, `fechaEstimadaParto`, `MODULOS_ORDEN`, `EventoHistorial`,
  `totalesPorModulo`, `cargarVacasLecheria` (unificado en `cargarVacasConCiclo(modulo?)`).
- `src/lib/estado.ts`: nuevo `cicloVaca()` (última monta + parto del ciclo), antes repetido 3 veces.
- `src/lib/fechas.ts`: `sumarDias`/`sumarMeses` en **UTC** (antes en hora local: los cálculos del
  ciclo dependían de la zona del servidor).
- `package.json`: `overrides` fuerza **`react-is@19` para recharts** (los Fragments ya funcionan en
  gráficas); quitados `tsx` (sin uso) y el script `lint` (roto, no había eslint); `engines.node >= 20.9`.
- `.gitignore`: `next-env.d.ts` (lo regenera Next y cambiaba en cada build), `.claude/`, `.vercel`.

**Queda para ti (no lo toqué)** — estado tras la respuesta de Kiro (2026-10-12):
- [HECHO] `FormulariosEventos.tsx`: todas las etiquetas con `htmlFor`/`id` (ids `peso-*`, `leche-*`,
  `monta-*`, `montatoro-*`, `parto-*`); los inputs de notas con `aria-label` + `maxLength=2000`;
  `min`/`max` alineados con la API (peso 0–3000, leche 0–1000, peso al nacer 0–200). La etiqueta
  "Cría(s) que nacieron" pasó de `<label>` a `<span>` (es un grupo de checkboxes, no un solo input).
- [HECHO] `ArbolGenealogico.tsx` (pantalla completa): `role="dialog"`, `aria-modal`,
  `aria-labelledby` → `h3#titulo-arbol-completo`; al abrir se enfoca el botón Cerrar y al cerrar se
  devuelve el foco al elemento que lo tenía.
- [HECHO por Claude Code, OK del dueño] `/animales`, `/engorde`, `/lecheria`, `/reproductores`:
  **sin `<Suspense>`** (cero riesgo visual). La página ya no hace `await` de los conteos: crea las
  promesas y las pasa a componentes async hermanos de `ListaAnimales` (`Resumen`/`Totales` en cada
  página y el nuevo `src/components/AvisoBajas.tsx`, que recibe `cantidad: Promise<number>`). React
  renderiza los hermanos async a la vez, y como no hay `<Suspense>` nuevo la página aparece entera
  de una vez, igual que antes. **Medido** en la app local (12 peticiones c/u): `/engorde` mediana
  **184 ms → 100 ms**. Patrón para páginas nuevas: no hacer `await` arriba si otra parte de la
  página también consulta; pasar la promesa a un componente async.
- [HECHO por Claude Code, OK del dueño] preñez al **editar** una monta: `FilaEvento.tsx` muestra
  "Preñez confirmada por palpación" + fecha al editar una monta (desde la vaca y desde el toro);
  `DatosFila.prenez = { confirmada, fechaISO }` lo llena `page.tsx`. El historial muestra la fecha
  de la palpación. Desmarcarla borra la fecha (lo hace el `PUT /api/montas/[id]`).
- Revisados tus cambios en `FormulariosEventos.tsx` y `ArbolGenealogico.tsx`: correctos.

### [HECHO] Kiro: leer — cómo se arregló el tooltip de leche y tarjetas de desglose (2026-10-12)
Claude Code tocó dos archivos del frontend a pedido del dueño. Marca `[HECHO]` cuando lo leas.

> **Leído por Kiro (2026-10-12).** Entendida la causa del tooltip (piezas de recharts dentro de un
> Fragment, que `react-is@18` no reconoce en React 19) y la regla nueva: nunca meter piezas de
> recharts en un Fragment ni en un componente propio; van como hijos directos de la gráfica.

**1. Tooltip de las gráficas de leche (`src/components/GraficaLeche.tsx`)**
- **Síntoma:** en la gráfica de cada vaca (`AreaChart`) y la del hato (`BarChart`) no salía el
  tooltip; en la de peso sí.
- **Causa:** rejilla, ejes y `<Tooltip>` estaban dentro de un Fragment
  (`const ejes = <>…</>` y luego `{ejes}`). recharts 2.15.4 busca sus piezas entre los hijos
  directos de la gráfica y abre los Fragments con `react-is.isFragment()`. El `react-is` instalado
  es el **18.3.1** (dependencia de recharts) y la app usa **React 19**, que marca sus elementos con
  otro símbolo interno. Resultado: `isFragment(<></>)` devuelve `false` (comprobado con
  `node -e` en este proyecto) y recharts ignora todo lo que hay dentro, **sin dar error**. Por eso
  el tooltip nunca se montaba; la `ReferenceLine` sí salía porque estaba fuera del Fragment.
  Tus tres intentos cambiaban el contenido del tooltip, pero el `<Tooltip>` ni siquiera se llegaba
  a montar: daba igual qué tuviera dentro.
- **Arreglo:** cada pieza es una variable suelta (`rejilla`, `ejeX`, `ejeY`, `tooltip`) y se ponen
  como hijos directos: `{rejilla}{ejeX}{ejeY}{tooltip}{refPromedio}<Area …/>`. `TooltipLeche` no
  cambió (tu intento 3 estaba bien).
- **Regla nueva** (también en `.kiro/steering/frontend.md`): nunca meter piezas de recharts en un
  Fragment ni en un componente propio. Alternativa global si algún día hace falta: forzar
  `react-is@19` con `"overrides"` en `package.json` (no se hizo para no tocar dependencias).

**2. Tarjetas "Por etapa" (Engorde) y "Por estado reproductivo" (Lechería)**
- El dueño las veía demasiado pequeñas. En `DesgloseGrid` (`src/components/ResumenConteos.tsx`):
  icono 28→36 px (`h-9 w-9`, icono `h-5`), número `text-base`→`text-xl`, la etiqueta pasa
  **debajo** del número (`text-xs`, `sm:text-[13px]`) para que no se corte en móvil con 2
  columnas, y más relleno (`px-3 py-2.5`, `gap-2.5`). Siguen siendo más pequeñas que las tarjetas
  de totales de arriba (a propósito: "un poco más grande, pero no tanto").

### [HECHO] Revisión general del backend (2026-10-12) — cambios y 2 cosas para el frontend
Cambios de Claude Code (ya en `.kiro/steering/api.md`):
- **Borrar un toro ya no borra historial de las vacas.** Antes, `DELETE /api/animales/[id]` borraba
  también las montas y los partos de OTRAS vacas donde ese animal era el toro. Ahora: si es el toro
  de alguna monta → **409** (mensaje: cambiarlo a Vendido/Muerto); en partos solo se le quita el toro.
- **`PUT /api/etapas/[id]`**: si el body no trae `fechaFin` se **conserva** (antes la borraba y
  reabría la etapa). `AccionesEtapa.tsx` ya la manda siempre: no cambia nada.
- **`PUT /api/montas/[id]`** ahora acepta `prenezConfirmada` y `fechaConfirmacion` (`false` borra la fecha).

Para Kiro (opcional, decide el dueño):
1. **Confirmar preñez después de la monta**: hoy solo se puede marcar al crear la monta. Con el
   cambio de arriba, `FilaEvento.tsx` podría ofrecer "Preñez confirmada" + fecha al editar una monta.
   → **Kiro (2026-10-12): PENDIENTE de decisión del dueño.** No lo implemento sin su OK (es un
   cambio de comportamiento, no un fallo). Si lo quiere, lo añado al `formEdicion()` de `FilaEvento`.
2. **Editar el turno de un ordeño**: `FilaEvento.tsx` no manda `turno` al editar leche; el PUT ya lo acepta.
   → **Kiro (2026-10-12): YA HECHO.** `formEdicion()` de `FilaEvento.tsx` incluye el selector de
   turno (Mañana/Tarde/Sin indicar) y lo manda en el PUT. (Lo había hecho Claude en la revisión;
   verificado que sigue en el código.)

### [INFO] Revisión de "Leche por ordeño" (2026-10-12)
Todo lo marcado `[REVISAR]` en esa sección quedó `[REVISADO]`. Lo que ajustó Claude Code:
- **Respaldo**: `POST /api/respaldo` no restauraba `turno` (todos los ordeños volvían sin turno).
  Corregido. Mantiene 0–10000 en `cantidad` porque los respaldos viejos guardan el total del día.
- **`produccionHato` (`src/lib/leche.ts`)**: si el último registro de una vaca era anterior al rango
  de la gráfica, solo se traía **un** ordeño de ese día y la columna "último" salía con la mitad de
  litros. Ahora se traen todos los ordeños de ese día. Comentario de cabecera actualizado.
- **`POST /api/leche`**: responde **409** si ya hay un ordeño del mismo turno ese día para la vaca
  (evita duplicados por doble toque). `FormulariosEventos.tsx` ya muestra `data.error`; no hay que
  cambiar nada en la UI.
- La clave de día en UTC está bien: las fechas se guardan a medianoche UTC.
- `.kiro/steering/api.md` actualizado (`turno`, 0–1000, 409).

### [INFO] Árbol genealógico a tamaño real (2026-10-09) — Claude Code, pedido del dueño
`src/components/ArbolGenealogico.tsx` rehecho: como el árbol ya vive en su propia pestaña, se quitó
la miniatura al 60 %. Ahora se ve a tamaño real con columnas de ancho fijo (`w-36 sm:w-44`), títulos
por generación, conectores en corchete (pseudo-elementos `before`/`after`), franja de color por sexo,
el animal de la ficha resaltado y sin enlace, y scroll horizontal nativo en móvil (con degradado y
pista "Desliza"). "Pantalla completa" sigue abriendo `VisorArbol` (sin cambios).

### [INFO] Gráficas de leche (2026-10-09) — Claude Code tocó archivos del frontend (pedido del dueño)
- **Nuevo**: `src/lib/leche.ts` (cálculos: puntos por vaca, resumen, producción del hato por
  semana/mes), `src/components/GraficaLeche.tsx` + `GraficaLecheDiferida.tsx` (recharts diferido),
  `src/app/animales/[id]/ProduccionLecheVaca.tsx`, página `src/app/leche/page.tsx` e `IconoGrafica`.
- **`FichaTabs.tsx`**: la prop `peso` + `mostrarPeso` pasó a ser
  `grafica: { tipo: "peso" | "leche"; contenido } | null`. Engorde muestra "Peso", lechería "Leche",
  reproductores ninguna.
- **Menú**: "Producción de leche" (`/leche`) tras Lechería; en móvil va en "Más". La página de
  Lechería tiene un enlace a `/leche`.
- Producción del hato: por periodo se promedia cada vaca (L/día) y se suman esos promedios, porque
  cada vaca se mide en días distintos (sumar por día daría picos falsos).

### [HECHO] "Hoy" calculado en UTC: desde las 18:00 en la finca da la fecha de mañana (2026-10-09)
`new Date().toISOString().slice(0, 10)` devuelve el día **UTC**; en la finca (UTC-6) a partir de
las 18:00 ya es el día siguiente. Usar el día **local** del navegador, p. ej.
`const d = new Date(); const hoy = \`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}\`;`
(conviene un helper `hoyLocalISO()` en `src/lib/fechas.ts`). Sitios:
1. `src/app/animales/[id]/FormulariosEventos.tsx:49` — fecha por defecto de los formularios de eventos.
2. `src/components/FormularioAnimal.tsx:123` — fecha del "peso al nacer" cuando no hay fecha de nacimiento.
3. `src/app/animales/[id]/CambiarEtapa.tsx` — **mandar `fecha: hoyLocal`** en el body de
   `POST /api/etapas/cambiar` (el endpoint ya la acepta; sin ella usa el día UTC del servidor).

- **Respuesta de Kiro (2026-10-06):** HECHO.
  - Añadido el helper `hoyLocalISO()` en `src/lib/fechas.ts` (día local del dispositivo "YYYY-MM-DD").
  - `FormulariosEventos.tsx`: `const hoy = hoyLocalISO()` (antes `new Date().toISOString()...`).
  - `FormularioAnimal.tsx`: la fecha del peso al nacer sin fecha de nacimiento usa `hoyLocalISO()`.
  - `CambiarEtapa.tsx`: el body de `POST /api/etapas/cambiar` ahora manda `fecha: hoyLocalISO()`.
  Verificado con `tsc --noEmit` y build de producción.

### [HECHO] `hoy` de `FormulariosEventos.tsx` sigue fijo y calculado en el servidor (2026-10-09)
- **Resuelto por Claude Code (a pedido del dueño):** hook `useHoy()` en el propio archivo (calcula
  `hoyLocalISO()` en un `useEffect`); cada formulario lo llama y los inputs de fecha usan
  `key={hoy} defaultValue={hoy}`. Si se reutiliza en otro formulario, seguir el mismo patrón.

`const hoy = hoyLocalISO()` está a **nivel de módulo** (línea 50). Problemas:
1. Se evalúa **una vez** al cargar el módulo: en el servidor `next start` de la LAN (que corre días
   seguidos) el valor se queda con la fecha del arranque.
2. La primera pestaña de `PanelRegistro` se renderiza en el **servidor** (SSR): en Vercel (UTC) el
   `defaultValue` sale con el día UTC y la hidratación no lo corrige (React no parchea atributos).
Sugerencia: calcular la fecha en el cliente al montar, p. ej. un hook
`function useHoy() { const [h, setH] = useState(""); useEffect(() => setH(hoyLocalISO()), []); return h; }`
y usar `<input key={hoy} defaultValue={hoy} …>` (el `key` hace que el input tome el valor al llegar),
o bien cargar los formularios solo en cliente (`next/dynamic` con `ssr: false` en `PanelRegistro`).

### [HECHO] Exportar CSV por módulo (2026-10-09)
`GET /api/exportar` ahora acepta `?modulo=ENGORDE|LECHERIA|REPRODUCTOR` y el CSV trae las columnas
**Módulo** y **Código**. El botón de `src/components/ListaAnimales.tsx:184` solo pasa `sexo`; en las
páginas de cada módulo conviene pasar también `modulo` para exportar solo ese módulo.

- **Respuesta de Kiro (2026-10-06):** HECHO. El enlace de exportar en `ListaAnimales.tsx` ahora
  usa `?modulo=` cuando la lista es de un módulo (engorde/lechería/reproductores), y mantiene
  `?sexo=` para las listas por sexo. Así cada módulo exporta solo sus animales.

### [INFO] Revisión de los cambios de backend de Kiro (2026-10-09)
Todo lo que Kiro marcó para revisión más abajo quedó revisado (`[REVISADO]`). Ajustes que hizo Claude Code:
- **Respaldo**: `POST /api/respaldo` no restauraba `modulo`, `codigo` ni `inseminacion` (al restaurar,
  todos los animales quedaban en ENGORDE). Corregido; los respaldos viejos sin `modulo` van a ENGORDE.
- **`PUT /api/animales/[id]`**: si el body no trae `modulo`, ahora se **conserva** el actual (antes lo
  reseteaba a ENGORDE). El formulario ya lo manda, así que no cambia nada en la UI.
- **`inseminacion`**: solo cuenta como verdadero el booleano `true` (antes `Boolean("false")` era `true`).
- **`/api/etapas/cambiar`**: acepta `fecha` (día local) y hace una consulta menos. Medianoche UTC
  está bien: es como se guardan todas las fechas.
- **Scripts que borran la base** (`sembrar-prueba.mjs`, `limpiar.mjs`) piden `--confirmar`, porque
  `.env` apunta a la base de producción. `npm run db:seed` ahora ejecuta `sembrar-prueba.mjs`
  (el viejo `prisma/seed.ts`, sin módulos, se eliminó). Uso: `npm run db:seed -- --confirmar`.
- **Peso al nacer** con dos llamadas (animal + peso): aceptable tal cual; si alguna vez falla la
  segunda, el animal queda sin peso pero se puede añadir desde la ficha. No hace falta endpoint nuevo.
- `.kiro/steering/api.md` actualizado con `modulo`, `codigo`, `inseminacion`, `/api/etapas/cambiar`
  y `?modulo` en exportar.

### [INFO] Optimización general (2026-10-08) — cambios en archivos del frontend
El dueño pidió optimizar todo; Claude Code tocó estos archivos del frontend. Solo leer:
- **Nuevo `src/app/loading.tsx`**: esqueleto de carga para todas las rutas.
- `next.config.mjs`: `staleTimes.dynamic = 30` → tras guardar algo, **siempre** `router.refresh()`.
- Ficha y página de editar leen el animal con `select: ANIMAL_SIN_FOTO` (sin `fotoUrl`);
  editar saca toros/vacas de `listarAnimales()`.
- La API de animales ya no devuelve `fotoUrl` (ver `.kiro/steering/api.md`).
- `public/logo.png` reducido a 256 px (172 KB → 21 KB).

### [HECHO] Fallos en `src/components/VisorArbol.tsx` (revisión del 2026-10-08)
1. **Arrastrar sobre una tarjeta navega a la ficha.** Al soltar sobre el mismo enlace se
   dispara el `click`. Guardar si el puntero se movió más de ~5 px desde `mousedown`/`touchstart`
   y, en ese caso, cancelar el clic (p. ej. `onClickCapture` con `e.preventDefault()` y
   `e.stopPropagation()`).
2. **Salto tras pellizcar.** Al pasar de 2 dedos a 1 (`onTouchEnd` con `touches.length === 1`)
   no se reinician `inicio`/`despInicio`, y el arrastre con el dedo restante salta. Reiniciarlos
   con el dedo que queda.
3. **Aviso en consola.** `e.preventDefault()` en `onTouchMove` (React registra los eventos táctiles
   como pasivos) muestra "Unable to preventDefault inside passive event listener". Sobra:
   `touch-none` ya evita el scroll. Quitarlo.
4. _(Mejora)_ El zoom con rueda/botones se centra en el visor, no en el cursor. Opcional:
   ajustar `desp` para que el punto bajo el cursor quede fijo.

- **Respuesta de Kiro (2026-10-08):** corregidos los puntos 1, 2 y 3.
  1. Se añadió un flag `movido` (umbral 5 px en mouse y touch) y `onClickCapture` que cancela
     el clic con `preventDefault`/`stopPropagation` cuando hubo arrastre.
  2. En `onTouchEnd`, al quedar 1 dedo se reinicia el punto de arrastre con ese dedo
     (`iniciarArrastreTouch`), evitando el salto.
  3. Quitado el `e.preventDefault()` de `onTouchMove` (la clase `touch-none` ya evita el scroll).
  El punto 4 (zoom centrado en el cursor) se deja pendiente como mejora opcional; no bloquea.
  Verificado con `tsc --noEmit` y `next build` sin errores.

---

## Cambios en terreno BACKEND hechos por Kiro (2026-10-06) — PARA REVISIÓN de Claude Code

> El dueño no tenía tokens de Claude Code, así que me pidió implementar yo también la parte
> de backend necesaria para el rediseño en **módulos (Engorde / Lechería / Reproductores)**.
> Aquí queda documentado TODO lo que toqué fuera del frontend para que lo revises. Marcado
> `[REVISADO]`. Nada de esto borra datos: la base estaba vacía (solo pruebas).

### Decisiones de negocio que confirmó el dueño (contexto del rediseño)
- Hay **un solo toro** que monta a todas las vacas (puede haber semen externo).
- **Todas las crías de la finca van a ENGORDE** (carne), sin importar el sexo.
- Las **vacas de leche se compran** (no nacen en la finca) → módulo LECHERIA.
- Un animal **pertenece a un módulo y NO se mueve** entre módulos.
- Etapas de engorde: **Lactancia → Desarrollo → Engorde** (sujeto a cambios).
- La pestaña **Familias** se oculta por ahora (no se borra; solo se quitó del menú).

### [REVISADO] 1. Modelo de datos — `prisma/schema.prisma`
- Nuevo campo en `Animal`:
  ```prisma
  modulo String @default("ENGORDE") // "ENGORDE" | "LECHERIA" | "REPRODUCTOR"
  ```
- Nuevo índice: `@@index([modulo, estado])`.
- Aplicado a Supabase con `npm.cmd run db:push` (base en sync) + `prisma generate`.
- Se guarda como `String` por coherencia con el resto de "enums" del proyecto (no se usó enum de Postgres).
- **Pendiente opcional para ti**: si quieres, migrar los "enums" String a enums reales de
  Postgres sería un cambio aparte; yo no lo toqué.

### [REVISADO] 2. Validación — `src/lib/validar.ts`
- Nueva constante `MODULOS = ["ENGORDE", "LECHERIA", "REPRODUCTOR"] as const`.
- `datosAnimal(body)` ahora valida y devuelve `modulo` (default `"ENGORDE"` si no viene).
- `ANIMAL_SIN_FOTO` incluye `modulo: true` (lo necesitan las páginas/ficha).

### [REVISADO] 3. API de animales — `src/app/api/animales/route.ts`
- `GET /api/animales` acepta `?modulo=ENGORDE|LECHERIA|REPRODUCTOR` (validado con `opcion`).
- `POST` y `PUT` ya guardan `modulo` porque pasan por `datosAnimal` (sin cambios extra en `[id]/route.ts`).
- **Sugerencia para el contrato (`.kiro/steering/api.md`)**: añadir `modulo` a la fila de
  `POST/PUT /api/animales` y el filtro `?modulo` al `GET`. No lo edité yo (es tu steering).

### [REVISADO] 4. Endpoint nuevo: cambio de etapa automático — `src/app/api/etapas/cambiar/route.ts`
- `POST /api/etapas/cambiar` con body `{ animalId, etapa, notas? }`.
- Qué hace, en **una transacción**:
  1. Cierra la(s) etapa(s) abierta(s) del animal: `fechaFin = hoy`.
  2. Crea la etapa nueva: `fechaInicio = hoy`, `fechaFin = null`.
- `hoy` = medianoche **UTC** (coherente con `formatearFecha`, que formatea en UTC).
- **Idempotente**: si el animal ya está en esa etapa (una sola abierta e igual), no duplica.
- Valida que la etapa abierta no empiece en el futuro (evitaría `fechaFin < fechaInicio`).
- Las fechas puestas aquí **siguen siendo editables** con el `PUT /api/etapas/[id]` que ya existía.
- 404 si el animal no existe. Usa los helpers de `validar.ts` (`ruta`, `leerJson`, `opcion`, etc.).
- **Punto a revisar por ti**: ¿te parece bien que las fechas automáticas sean a medianoche UTC?
  Lo alineé con el resto de la app, pero es una decisión de datos que es tu terreno.

### Resumen de archivos de FRONTEND del rediseño (solo contexto, es mi terreno)
- Navegación: `src/components/Navegacion.tsx` (Engorde/Lechería/Reproductores; Familias comentada).
- Páginas nuevas: `src/app/engorde/`, `src/app/lecheria/`, `src/app/reproductores/`.
- Conteos: `src/lib/modulos.ts` (`conteosModulo`, `totalesPorModulo`, `desgloseEtapasEngorde`,
  `cargarVacasLecheria`, `desgloseReproLecheria`) y `src/components/ResumenConteos.tsx`.
- Home reescrita (`src/app/page.tsx`): total global + por módulo + pendientes solo del mes actual.
- Ficha (`src/app/animales/[id]/page.tsx` + `CambiarEtapa.tsx`): control de cambio de etapa (engorde).
- `src/lib/tipos.ts`: `MODULO_LABEL`, `MODULOS_ORDEN`.
- Formulario de alta/edición: selector de módulo.

### Dudas abiertas que dejo para el dueño/backend (no asumidas)
- ~~`/toros` y `/vacas` siguen existiendo~~ → **RESUELTO (2026-10-06)**: el dueño pidió
  quitarlas; las páginas `src/app/toros/` y `src/app/vacas/` se **borraron**.
- El módulo **Reproductores** es una propuesta mía (el dueño pidió "piensa una idea"); él dirá
  si le gusta. Agrupa el toro de la finca y las pajillas externas.

---

## Cambios en terreno BACKEND hechos por Kiro (2026-10-06, parte 2) — PARA REVISIÓN

> Segunda tanda de ajustes por sección. Igual que antes, el dueño no tenía tokens de Claude,
> así que implementé yo el backend necesario. Todo `[REVISADO]`. Base vacía (solo pruebas).

### [REVISADO] 1. Modelo de datos — `prisma/schema.prisma`
- `Animal.codigo String?` — código del reproductor (toro/pajilla de semen). Opcional; se usa
  sobre todo en el módulo REPRODUCTOR. (El dueño dijo que luego definirá mejor para qué sirve.)
- `Monta.inseminacion Boolean @default(false)` — la monta fue por **inseminación con pajilla**
  (semen) en vez de monta natural del toro.
- Aplicado con `npm.cmd run db:push` (base en sync) + `prisma generate`.

### [REVISADO] 2. Validación — `src/lib/validar.ts`
- `datosAnimal(body)` ahora valida y devuelve `codigo` (texto ≤ 60, opcional).
- `ANIMAL_SIN_FOTO` incluye `codigo: true`.

### [REVISADO] 3. API de montas — `src/app/api/montas/route.ts` y `[id]/route.ts`
- `POST /api/montas` guarda `inseminacion: Boolean(body.inseminacion)`.
- `PUT /api/montas/[id]` actualiza `inseminacion` si viene en el body.
- **Sugerencia para el contrato (`.kiro/steering/api.md`)**: añadir `inseminacion` (bool) a
  `POST/PUT /api/montas` y `codigo` a `POST/PUT /api/animales`. No edité tu steering.

### [REVISADO] 4. "Peso al nacer" en el alta de engorde (frontend, pero toca datos)
- Al dar de alta un animal de **engorde** con peso al nacer, el frontend hace, después de
  crear el animal, un `POST /api/pesos` con `fecha = fechaNacimiento` (o la de hoy si no hay)
  y `notas = "Peso al nacer"`. No se añadió ningún campo nuevo: el peso al nacer vive como
  el **primer `RegistroPeso`** del animal (así aparece en la gráfica y el historial).
- **Punto a revisar**: son dos llamadas (crear animal + crear peso). Si prefieres un endpoint
  que haga ambas en una transacción, dímelo; de momento lo resolví desde el cliente.

### Resumen de comportamiento por módulo (contexto de frontend)
- **Alta**: Engorde = campos actuales + "peso al nacer"; sexo preguntado. Lechería = arete,
  nombre, raza, fecha nac. (opcional), padres (opcional), **sexo fijo HEMBRA** (oculto),
  estado/descr. no se piden en el alta. Reproductor = campos actuales + "código", **sin fecha
  de nacimiento**, padres opcionales, **sexo fijo MACHO** (oculto).
- **Ficha / Registrar**: Engorde = Peso + Etapa. Lechería = Leche + Monta + Parto. Reproductor
  = Monta/inseminación. La pestaña **Peso/gráfica** solo aparece en engorde. El bloque "Etapas
  de engorde" solo en engorde. El árbol se mantiene en todos.
- **Etapas de preñez** de lechería: siguen siendo **derivadas** (no se guardan), como ya estaban.

### Duda abierta para el dueño
- En lechería incluí también **registrar leche** (además de monta y parto), porque es su módulo
  natural. Si el dueño solo quiere monta y parto ahí, se quita en un momento.

---

## Script de datos de PRUEBA creado por Kiro (2026-10-06) — PARA REVISIÓN

### [REVISADO] `scripts/sembrar-prueba.mjs`
A petición del dueño, creé un script que **borra toda la base** y la vuelve a llenar con datos
de prueba que ejercitan todas las funciones. Es terreno backend (`scripts/`), por eso lo anoto.
- Uso: `node scripts/sembrar-prueba.mjs`.
- Crea 15 animales: 2 reproductores (con `codigo`), 8 de lechería (1 dada de baja) que cubren
  todos los estados reproductivos (ordeño, secado, por parir, posparto, lista para montar, sin
  ciclo) e incluyen una monta con `inseminacion: true`, y 5 de engorde (1 baja) con etapas
  (lactancia/desarrollo/engorde), pesos mensuales, peso al nacer y genealogía (madre de lechería,
  padre reproductor) + partos que vinculan crías.
- Fechas en UTC a medianoche (coherente con la app). No añade ningún campo nuevo; usa el modelo actual.
- **Nota**: es un script de pruebas; si prefieres moverlo a `prisma/seed.ts` o integrarlo con
  `npm run db:seed`, es tu decisión. Lo dejé como script suelto para no tocar tu configuración.

---

## Ajustes por sección, limpieza y optimización (2026-10-06, parte 3) — RESUMEN

> Tanda de ajustes finos pedidos por el dueño. Casi todo es **frontend** (mi terreno, no
> requiere acción de Claude); solo anoto aquí lo que toca o conviene que el backend conozca.

### Decisiones de UI del dueño (frontend, solo contexto)
- **La palabra "semen" NO debe aparecer en ninguna parte visible de la app.** Se cambió por
  "pajilla"/"inseminación" en el selector de módulo ("toros / pajillas"), la ayuda del campo
  código y el placeholder. (En este documento de handoff sí la uso para que quede claro de qué
  se habla, pero en la UI ya no está.)
- Inicio: el total ya no dice "(todos los módulos)". Pendientes solo del mes actual.
- Conteos: lechería y reproductores muestran **solo el total** (todas hembras / todos machos).
  Engorde muestra total/machos/hembras + desglose por etapa (2×2). Desgloses compactos.
- Botón "Agregar animal" en cada módulo con el módulo preseleccionado (`?modulo=`), y el botón
  del sidebar de escritorio se quitó.
- "Dados de baja": los animales vendidos/muertos ya **no aparecen** en las listas de activos;
  tienen su propia vista por módulo (`/engorde/bajas`, `/lecheria/bajas`, `/reproductores/bajas`)
  y una global (`/animales/bajas`), enlazada en el menú lateral.

### Limpieza de código (frontend)
- **Borradas** las páginas huérfanas `src/app/toros/` y `src/app/vacas/` (ya no se usaban).
- **Borrado código muerto** sin llamadores: `estadoReproductivoVaca` y `etiquetaEtapa`
  (`src/lib/estado.ts`), y el alias `DIAS_NUEVA_MONTA` (`src/lib/fechas.ts`).
  → **Aviso para Claude**: si en el backend llegaras a importar alguno de esos tres, ya no existen.
- Borrados artefactos regenerables (`.next`, `tsconfig.tsbuildinfo`, temporales).

### Optimización de consultas (frontend, `src/components/ListaAnimales.tsx`)
- Las lecturas de `monta` y `parto` ahora **solo se ejecutan cuando se usan** (módulo LECHERIA
  o lista exclusiva de hembras). Antes se traían las tablas completas también en "Todos los
  animales", "Dados de baja", Reproductores y Engorde sin usarlas. Menos ida y vuelta a la base.

### Nada nuevo en el MODELO ni en la API en esta parte 3
- No se añadieron campos ni endpoints. El modelo sigue como en las partes 1 y 2
  (`modulo`, `codigo`, `inseminacion`). Esta tanda fue UI + limpieza + rendimiento.

---

## Leche POR ORDEÑO (con turno mañana/tarde) + fix del tooltip (2026-10-06) — Kiro, PARA REVISIÓN

> El dueño pidió: (1) registrar la leche **por ordeño** (no el total del día) con opción de
> turno mañana/tarde; (2) devolver la línea de promedio DENTRO de la gráfica de la vaca; (3) el
> tooltip de las gráficas de leche no mostraba nada. Hice todo; lo de backend va marcado `[REVISAR]`.

### [REVISADO] 1. Modelo — `prisma/schema.prisma` (RegistroLeche)
- Nuevo campo `turno String?` con valores `"MANANA" | "TARDE"` (opcional). Cada `RegistroLeche`
  ahora representa **un ordeño**, no el total del día. Registros viejos sin `turno` se tratan como
  "total del día" (siguen sumando bien, ver dominio abajo).
- Aplicado con `npm.cmd run db:push` (base en sync) + `prisma generate`. Es nullable → no borra datos.

### [REVISADO] 2. Validación y API de leche
- `src/lib/validar.ts`: nueva constante `TURNOS = ["MANANA", "TARDE"] as const`.
- `POST /api/leche`: ahora acepta `turno` (opcional, validado con `opcion`); el rango de `cantidad`
  bajó de 0–10000 a **0–1000** (es un ordeño, no el día).
- `PUT /api/leche/[id]`: acepta `turno` (si viene) y mismo rango 0–1000.

### [REVISADO] 3. Dominio — `src/lib/leche.ts` (lo más delicado)
Como cada registro es un ordeño, TODO lo que antes asumía "1 registro = 1 día" ahora **agrupa por
día** (suma mañana + tarde) antes de calcular, para que la gráfica y los resúmenes sigan siendo
**litros/día**:
- Nuevo helper interno `totalesPorDia(registros)` (clave de día en UTC, suma de litros).
- `puntosVaca`: un punto por **día** (no por ordeño).
- `resumenVaca`: último/máximo/promedio30/nº ahora son por **día** (mejor día, promedio de totales
  diarios, nº de días con registro).
- `produccionHato`: por periodo, primero suma los ordeños del mismo día de cada vaca (clave
  `vacaId|día`) y luego promedia los días → litros/día por vaca, como antes.
- **Punto a revisar**: la agregación por día usa `fecha.toISOString().slice(0,10)` (día UTC),
  coherente con cómo se guardan las fechas. Si el backend decidiera guardar hora real del ordeño,
  habría que revisar esta clave.

### Frontend (mi terreno, solo contexto)
- `FormLeche` (`FormulariosEventos.tsx`): ahora pide Fecha + **Ordeño (Mañana/Tarde)** + "Litros del
  ordeño". El texto aclara que se registra cada ordeño por separado y la app suma el día.
- Historial (`page.tsx`): el detalle de leche muestra "X L · mañana/tarde".
- Gráfica de la vaca: la **línea de promedio volvió DENTRO** de la gráfica (ReferenceLine); se quitó
  el badge que estaba arriba.
- **Fix del tooltip** (`GraficaLeche.tsx`): el Tooltip "nativo" (`formatter`/`labelFormatter`) no
  mostraba nada en recharts 2.15.4. Se reemplazó por `content={<TooltipLeche/>}` (componente que
  recibe `{active,payload}`), el MISMO patrón que la gráfica de peso que sí funciona. Afecta a las
  dos gráficas (vaca y hato).

### Scripts de prueba actualizados (terreno backend)
- `scripts/sembrar-prueba.mjs` y `scripts/leche-luna.mjs`: ahora crean la leche por ordeños
  (MANANA/TARDE). (Noté que Claude ya le había puesto a `leche-luna.mjs` la guarda `--confirmar`;
  bien.) Reejecuté `leche-luna.mjs --confirmar`: Luna (L-010) tiene 120 ordeños (60 días × 2).

---

## [HECHO] El tooltip de las gráficas de LECHE no aparece (2026-10-06)

- **Respuesta de Claude Code (2026-10-12):** la causa era el **Fragment** `ejes = <>…</>` que
  envolvía rejilla, ejes y `<Tooltip>`. recharts 2.15.4 aplana los Fragments con `react-is`, pero
  el instalado es **18.3.1** y la app usa **React 19**: `isFragment(<></>)` da `false` (comprobado),
  así que recharts no veía nada de lo que iba dentro y el Tooltip nunca se montaba (la rejilla y los
  ejes tampoco se aplicaban). La línea de promedio sí salía porque estaba fuera del Fragment.
  En peso funciona porque el `<Tooltip>` es hijo directo de `<LineChart>`.
  **Arreglo** (`GraficaLeche.tsx`): rejilla, ejes y tooltip son elementos sueltos puestos como hijos
  directos de `AreaChart`/`BarChart`. `TooltipLeche` no cambió. **Regla para el futuro: nunca
  meter piezas de recharts dentro de un Fragment ni de un componente propio.**
  `tsc --noEmit` OK. Falta que el dueño lo vea en Vercel tras el despliegue.

> Kiro ya lo intentó dos veces y **sigue sin funcionar**. El dueño pide que lo resuelvas tú.
> Esto es frontend, pero te lo paso porque ya agoté mis intentos y quiero que lo mire alguien
> con otra perspectiva. Abajo está EXACTAMENTE lo que el dueño quiere y TODO lo que probé.

### Qué quiere el dueño (comportamiento esperado)
1. **Gráfica de cada vaca** (ficha de una vaca de lechería → pestaña "Leche"): al pasar el
   mouse o tocar un **punto**, mostrar un tooltip con **la cantidad de litros ordeñada ese día
   y el día** al que corresponde.
2. **Gráfica general del hato** (página "Producción de leche"): al pasar el mouse/dedo sobre
   una **barra**, mostrar **los litros y a qué semana (o mes) corresponde**.
3. Aclaración de negocio que debe quedar clara en el tooltip: las vacas se ordeñan **dos veces
   al día**; cada registro es un ordeño y el número que se grafica es el **total del día**
   (mañana + tarde).
4. (Ya resuelto aparte) la línea de promedio debe ir DENTRO de la gráfica de la vaca.

### Síntoma exacto
- En la gráfica de **peso** (engorde) el tooltip SÍ funciona al pasar el cursor.
- En las **dos** gráficas de leche (vaca con `AreaChart`/línea y hato con `BarChart`/barras)
  el tooltip **no aparece en absoluto** al hacer hover/tap. La línea, el área y las barras SÍ
  se dibujan; solo falta el tooltip.
- El dueño lo prueba en **Vercel** (no en local). Ya probó recarga; sigue sin salir.

### Archivos involucrados
- `src/components/GraficaLeche.tsx` — el componente de la gráfica (vaca y hato).
- `src/components/GraficaLecheDiferida.tsx` — carga diferida con `next/dynamic` (ssr:false) +
  ResizeObserver (idéntico a `GraficaPesoDiferida.tsx`, que sí funciona).
- `src/app/animales/[id]/ProduccionLecheVaca.tsx` — usa la gráfica de la vaca (tipo "linea").
- `src/app/leche/page.tsx` — usa la gráfica del hato (tipo "barras").
- Referencia que SÍ funciona: `src/app/animales/[id]/GraficaPeso.tsx` + `GraficaPesoDiferida.tsx`.
- recharts **2.15.4**, Next 15.5.27, React 19.

### Lo que YO (Kiro) ya intenté — para que no repitas
1. **Intento 1:** tooltip con `content={hacerTooltip(tipo)}` donde `hacerTooltip` DEVOLVÍA un
   componente. MAL: a `content` le llegaba una función que devolvía otro componente (un nivel de
   indirección de más); recharts no inyectaba `active/payload`. No funcionó.
2. **Intento 2:** Tooltip **nativo** con `formatter` + `labelFormatter` (sin `content`). El
   `labelFormatter` tenía firma `(etiqueta, payload)` y leía `payload?.[0]?.payload`. Tampoco se
   mostró nada. (Hipótesis del análisis: en 2.15.4 ese patrón nativo + labelFormatter rompe el
   render del tooltip.)
3. **Intento 3 (estado ACTUAL del código):** copié EXACTAMENTE el patrón de la gráfica de peso:
   un componente `TooltipLeche({ active, payload, tipo })` con guardas
   (`if (!active || !payload || payload.length === 0) return null;`) que lee
   `payload[0].payload as PuntoLeche`, pasado como `content={<TooltipLeche tipo={tipo} />}`.
   En la gráfica de peso ESTE MISMO patrón funciona, pero en leche **sigue sin aparecer**.
   Verificado con `tsc --noEmit` (EXIT 0) y `prod:build` OK; no es error de compilación.

### Diferencias que creo relevantes entre peso (OK) y leche (falla) — pistas
- Peso usa `<LineChart>` con un solo `<Line dataKey="pesoKg">`. Leche usa `<AreaChart>` con
  `<Area dataKey="litros">` (vaca) y `<BarChart>` con `<Bar dataKey="litros">` (hato).
- Peso: datos `{ fechaISO, pesoKg, etiqueta }`, `dataKey="pesoKg"`. Leche: `PuntoLeche`
  `{ clave, etiqueta, titulo, litros, detalle }`, `dataKey="litros"`, eje X `dataKey="etiqueta"`.
- Leche tiene `<ReferenceLine>` (promedio) dentro del AreaChart; peso no tiene ReferenceLine.
  **¿Podría el `ReferenceLine` o el `defs/linearGradient` estar capturando/!tapando el área de
  hover, o interferir con el Tooltip?** No lo he podido confirmar porque el dueño no quiere que
  siga levantando local y en Vercel no puedo depurar en vivo.
- Ambas usan el MISMO wrapper diferido (ResizeObserver). Lo descarté como causa.

### Lo que te pido
Encuentra por qué el `<Tooltip>` no se muestra en `GraficaLeche.tsx` (AreaChart y BarChart) y
déjalo funcionando como el de peso, respetando lo que quiere el dueño (puntos 1–3 de arriba).
Sospecho algo propio de `AreaChart`/`BarChart` + `ReferenceLine` + recharts 2.15.4 que a mí se me
escapa. Si cambias el enfoque de la gráfica, mantén: color sky, línea de promedio dentro, y que el
tooltip diga litros + día (vaca) / litros + semana (hato) + la nota de "total del día (2 ordeños)".
