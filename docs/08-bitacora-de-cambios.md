# 08 — Bitácora de cambios

> Registro cronológico de cada aporte de información y qué provocó en la documentación.
> Sirve para rastrear cómo evolucionó el entendimiento del dominio.
>
> Formato de cada entrada:
> - **Fecha** · **Fuente** (p. ej. "papá", "dueño", "Kiro")
> - Qué información nueva llegó
> - Qué documentos/reglas se crearon o cambiaron
> - Qué quedó pendiente

---

## 2026-10-06 · Fuente: dueño del proyecto (inicio de implementación)

**Qué llegó:** el dueño confirma que el dominio está suficientemente definido y pide
empezar a construir. Decisión: **app web** (todavía no app móvil).

**Decisiones técnicas tomadas (stack, no negocio):**
- Next.js 14 (App Router) + React + TypeScript — un solo proyecto con páginas y API.
- Prisma + SQLite (archivo `prisma/dev.db`) — cero configuración, migrable a Postgres después.
- Tailwind CSS para la UI.

**Qué se construyó (v1):**
- Esquema de datos en `prisma/schema.prisma` siguiendo `03-modelo-de-datos.md`
  (SQLite no soporta enums → los enums se modelan como `String`).
  Entidades: Animal (con padre/madre registrado o externo), Monta, Parto, Cria,
  RegistroLeche, RegistroPeso, EtapaTernero.
- Lógica de dominio: genealogía derivada (`src/lib/genealogia.ts`), alertas de nueva
  monta ~40 días tras parto (`src/lib/alertas.ts`), utilidades de fecha con las
  aproximaciones centralizadas (`src/lib/fechas.ts`).
- Páginas: Inicio (resumen + alertas), Todos, Toros, Vacas, Familias, ficha del animal
  (datos básicos, genealogía derivada, familia, historial unificado) y alta de animal.
- API: /api/animales, /api/montas, /api/partos, /api/leche, /api/pesos.
- Seed de ejemplo (`prisma/seed.ts`).

**Verificación:** `next build` compila y pasa el type-check (14 rutas). Seed ejecutado.
API `/api/animales` devuelve los datos con las relaciones correctas.

**Fidelidad al dominio (no se violó ningún pendiente):**
- Monta y parto son eventos separados; no hay preñez (A7, B1).
- El toro del parto es opcional (B3). Descripción del parto libre (B4). Varias crías por parto (B5).
- Duraciones de etapas del ternero NO codificadas (B6): solo fechas reales.
- Unidad/frecuencia de leche sin fijar (B7). Progenitor externo como texto (B9).
- Hermanos = comparten al menos un progenitor registrado (criterio provisional, B10).
- ~40 días y demás aproximaciones centralizadas en `fechas.ts` para ajustarlas (B11).

**Pendientes:** B1–B11 siguen abiertos; ninguno se resolvió inventando.

---

## 2026-10-06 · Fuente: dueño del proyecto (contexto inicial)

**Qué llegó:** documento completo de contexto del proyecto (visión, objetivo, principio
animal+historial, identificación por arete, tipos de animal, genealogía derivada,
progenitores externos, reproducción, monta ≠ parto, ciclo reproductivo con la corrección
de los ~7 meses de ordeño contados desde la monta, ordeño, secado, nueva monta ~40 días
tras el parto, producción de leche, peso, etapas del ternero, estado vs historial,
eventos, filtros, secciones de UI previstas, alertas, filosofía, qué NO hacer todavía,
preguntas pendientes, prioridades y rol de Kiro).

**Qué se creó:**
- `00-vision-y-alcance.md` — visión, filosofía, prioridades, rol de Kiro, qué no hacer.
- `01-glosario-dominio.md` — vocabulario del dominio.
- `02-reglas-de-negocio.md` — reglas CONFIRMADAS (A1–A16) y PENDIENTES (B1–B11).
- `03-modelo-de-datos.md` — modelo conceptual de entidades y relaciones.
- `04-eventos-e-historial.md` — principio estado vs historial y catálogo de eventos.
- `05-genealogia-y-familia.md` — genealogía derivada, familia y progenitores externos.
- `06-alertas.md` — alertas (nueva monta tras parto, entrada en secado).
- `07-preguntas-pendientes.md` — B1–B11 abiertas.

**Decisiones clave registradas:**
- Fase actual: levantamiento. No se implementa código todavía (por decisión del dueño).
- Monta ≠ parto; no inventar sistema de embarazo.
- Los ~7 meses de ordeño se cuentan desde la **monta**, no desde el parto.
- Genealogía siempre derivada, nunca duplicada.
- Animales vendidos/muertos no desaparecen.

**Pendientes abiertos:** B1–B11 (ver `07-preguntas-pendientes.md`).

---

<!-- Nuevas entradas van ARRIBA de esta línea, en orden cronológico inverso o al final;
     mantener consistente. Plantilla:

## AAAA-MM-DD · Fuente: ___

**Qué llegó:**

**Qué cambió:**

**Pendientes afectados:**
-->

---

## 2026-10-06 · Fuente: papá (vía dueño) — etapas del ternero

**Qué llegó:**
- Las etapas del ternero son **cuatro**, no tres. Se agrega **"desarrollo"**.
- Orden: lactancia → destete → desarrollo → engorde (la última es engorde).
  El lugar exacto de "desarrollo" se asumió entre destete y engorde; pendiente de validar.
- Un animal **deja de ser ternero al terminar sus cuatro etapas**, es decir, cuando el
  engorde tiene fecha de fin. No es por edad ni por tiempo.

**Qué pidió el dueño construir:**
- Agregar la etapa "desarrollo".
- Poder registrar una etapa solo con fecha de inicio y **editarla** después para añadir el fin.

**Qué cambió en docs:**
- `02-reglas-de-negocio.md`: A15 actualizada (4 etapas, orden, edición de fin) y nueva A17
  (fin de la condición de ternero al cerrar el engorde).
- `01-glosario-dominio.md`, `03-modelo-de-datos.md`, `04-eventos-e-historial.md`: 4 etapas.
- `07-preguntas-pendientes.md`: B6 pasa a PARCIAL (quedan sin definir duraciones y el
  criterio para avanzar de etapa).

**Qué cambió en la app:** se agregó DESARROLLO en etiquetas/orden/API/formulario, y se
añadió edición de etapas (PUT) para registrar la fecha de fin.

---

## 2026-10-06 · Fuente: dueño del proyecto — estado reproductivo y filtros

**Qué llegó:** el dueño quiere ver el estado de cada animal (etapa del ternero; en la vaca:
en ordeño / en secado / etc.) y poder filtrar las listas por etapa o estado. Indica que los
tiempos del ciclo son **fijos**, por lo que se opta por **derivar** el estado (opción A) en
vez de capturarlo a mano.

**Qué cambió en docs:**
- `02-reglas-de-negocio.md`: nueva regla **A18** (estado reproductivo derivado de la vaca).
- `07-preguntas-pendientes.md`: B11 pasa a RESPONDIDA (provisional): tiempos fijos.

**Qué cambió en la app:**
- Lógica derivada: estado reproductivo de la vaca (desde la última monta) y etapa actual
  del ternero (última etapa sin fecha de fin).
- Badges de estado/etapa en la ficha y en las listas.
- Filtros en las listas por estado reproductivo y por etapa de ternero.
- Las duraciones (~5/~7 meses, ~40 días) viven centralizadas en `src/lib/fechas.ts`.

**Salvedad:** si resulta que los tiempos varían por animal, se cambiará a estado reproductivo
explícito (opción B). El cálculo está aislado para que ese cambio sea de bajo impacto.

---

## 2026-10-06 · Fuente: papá (vía dueño) — ciclo completo de la vaca

**Qué llegó (definición completa del ciclo reproductivo):**
- Embarazo de **9 meses** desde la monta. Se asume preñez tras la monta.
- Desde la monta: 0–7 meses **en ordeño**, 7–9 meses **en secado** (recuperación), luego **parto**.
- Tras el parto: **40 días de posparto**, luego **lista para montar**.

**Decisión (opción 2):** ordeño y secado se calculan desde la monta; el posparto arranca
desde el **parto real registrado** (no desde la estimación de 9 meses). Si llega el mes 9
sin parto registrado, la vaca queda en estado **"Por parir"** hasta que se registre el parto.

**Fecha estimada de parto** = monta + 9 meses; se muestra como aviso, no adelanta el estado.

**Qué cambió en docs:**
- `02-reglas-de-negocio.md`: A18 reescrita con la definición completa.
- `07-preguntas-pendientes.md`: B1 (preñez) RESPONDIDA provisional (se asume preñez tras monta).

**Qué cambió en la app:**
- `estadoReproductivoVaca` reescrita: ORDENIO (0–7m) / SECADO (7–9m) / POR_PARIR (9m+ sin parto)
  / POSPARTO (parto +40d) / LISTA_MONTAR.
- Nueva constante MESES_EMBARAZO = 9 y util de fecha estimada de parto en `fechas.ts`.
- Se muestra la fecha estimada de parto en la ficha y en las listas.

---

## 2026-10-07 · Fuente: dueño del proyecto (respuestas B1–B11)

**Qué llegó:** el dueño respondió todas las preguntas pendientes de negocio (B1–B11).
Ver detalle en `07-preguntas-pendientes.md` (ahora marcadas como RESPONDIDAS).

**Respuestas clave:**
- **B1** — La preñez se confirma por **palpación** (con fecha).
- **B2** — No se registran montas fallidas.
- **B3** — Solo hay un toro/semen por monta.
- **B4** — Del parto se guarda: cría sana (sí/no), necesitó ayuda (sí/no), peso al nacer.
- **B5** — Cada cría es un animal aparte.
- **B6** — Etapas: **Lactancia (3-4 m) → Desarrollo (8 m) → Engorde (4 m)**. Se elimina "Destete" como etapa.
- **B7** — Leche en **litros**, total del día (2 ordeños), normalmente semanal.
- **B8** — Peso: una vez al mes.
- **B9** — Progenitor externo: solo el nombre.
- **B10** — Hermanos = medios hermanos (comparten padre O madre).
- **B11** — Tiempos del ciclo fijos; no varían por raza.

**Qué se cambió en la app:**
- `prisma/schema.prisma`: Monta +`prenezConfirmada`,`fechaConfirmacion`;
  Parto +`criaSana`,`necesitoAyuda`,`pesoNacimientoKg`. (`db:push` aplicado.)
- Formulario de monta: casilla "preñez confirmada por palpación" + fecha.
- Formulario de parto: campos de nacimiento (sana, ayuda, peso).
- Formulario de etapa: 3 etapas con duraciones de referencia (sin "Destete").
- Formulario de leche: "Litros del día" + nota (total de los 2 ordeños, semanal).
- Ficha/historial: la monta muestra "preñez confirmada"; el parto muestra los datos del nacimiento.
- `src/lib/tipos.ts`: `ETAPAS_ORDEN` = [LACTANCIA, DESARROLLO, ENGORDE] (DESTETE se conserva
  solo como etiqueta para no romper datos antiguos).

**Pendiente:** nada de las B1–B11. Las etapas (B6) podrían reajustarse si en la práctica
hace falta volver a distinguir el destete.

---

## 2026-10-13 · Fuente: dueño del proyecto — app móvil descargable

**Qué llegó:** el dueño pide que la app sea **descargable en el celular** y siga funcionando
igual. La familia usa sobre todo Android (algunos iPhone). También pide **modo sin conexión**.

**Decisiones técnicas (stack, no negocio):**
- Fase 1: APK de Android con **Capacitor** que carga la web de Vercel; en iPhone, instalación
  desde Safari (manifest). Detalle en `14-app-movil.md`.
- Fase 2 (pendiente): modo sin conexión — ver lo ya visitado y registrar sin señal con una
  cola que se envía al volver la conexión.

**Qué se cambió:** `src/app/manifest.ts`, `public/iconos/`, matcher de `src/middleware.ts`,
ícono de Apple en `layout.tsx`, carpeta `movil/`, `.vercelignore`.

**Decisión del dueño (mismo día):** si al enviar un registro hecho sin señal resulta duplicado
(p. ej. el mismo ordeño de la misma vaca y turno), **se avisa** — no se guardan los dos ni se
sobrescribe.

**Fase 2 hecha:** `public/sw.js` (ver sin señal), `src/lib/cola-offline.ts` + `api-cliente.ts`
(registrar sin señal), `src/components/EstadoConexion.tsx` (avisos), `id` opcional generado en el
teléfono en POST de leche/pesos/montas/partos (evita duplicados por reintento).


---

## 2026-10-16 · Fuente: dueño (paquete de 9 cambios)

**Qué llegó y decisiones del dueño:**
1. **Cría desde el parto:** al registrar o editar un parto se puede dar de alta la cría ahí mismo
   (Engorde, madre = la vaca, padre = el toro del parto, nacimiento = fecha del parto).
2. **Toro / padre:** los selectores solo ofrecen reproductores (`modulo = REPRODUCTOR`). La API lo
   valida; un toro ya asignado en registros viejos se conserva al editar.
3. **SENASA** (no "CENASA") en todos los textos visibles. La columna sigue llamándose `areteCenasa`.
   El buscador acepta los dos prefijos.
4. **Palpación** como registro propio (fecha + notas), modelo `Palpacion`. Se quitó de la monta;
   las palpaciones viejas anotadas en montas se conservan y se muestran.
5-6. **Historial de partos** en la ficha (foto o marcador y sexo de cada cría, cuántos machos y
   hembras) y página de detalle `/partos/[id]`.
7. **Novilla / Vaca** (`Animal.categoria`), solo hembras de lechería. Al primer parto pasa sola a
   vaca. Se marcaron como VACA las hembras de lechería que ya tenían partos.
8. **Estado reproductivo manual** (`CambioEstadoReproductivo`): manda hasta que se registre una monta
   o un parto después del cambio (decisión del dueño); luego vuelve el cálculo automático, que no
   cambió. Los avisos y el calendario siguen usando solo las fechas.
9. **Etapas de engorde por edad, para TODO Engorde** (decisión del dueño): Destete < 4 meses,
   Desarrollo < 16 meses, Engorde desde los 16. Se calcula sin guardarse. Sin fecha de nacimiento
   no se asigna etapa. Las etapas manuales viejas quedan como historial. Reemplaza A15/A17.

---

## 2026-10-16 · Fuente: dueño — revisión de calidad y optimización (Kiro)

**Qué llegó:** el dueño pidió una revisión completa de la app para encontrar qué mejorar u
optimizar, dejar el proyecto limpio y subir la versión. No hubo cambios de negocio; todo es
corrección, rendimiento, accesibilidad y consistencia. Versión del proyecto: **1.0.0 → 1.0.1**.

**Rendimiento / backend:**
- Restaurar respaldo ya no hace un `UPDATE` por animal para enlazar padre/madre (N+1 que podía
  agotar el timeout con la base en EE. UU.): se agrupan los animales con el mismo par
  (padre, madre) y se actualizan con pocos `updateMany`. `src/app/api/respaldo/route.ts`.
- Índices del listado de animales: `@@index([sexo, estado])` y `@@index([modulo, estado])` pasaron
  a incluir `arete` al final (`[sexo, estado, arete]`, `[modulo, estado, arete]`), porque el listado
  siempre ordena por `arete`; así Postgres no ordena en memoria. `prisma/schema.prisma` (db push aplicado).
- `cargarVacasConCiclo` ya no repite sus 3 consultas cuando en la misma petición se la pide con y
  sin módulo: una única carga cacheada de todas las hembras y el filtro por módulo se hace en
  memoria. `src/lib/alertas.ts`.

**Correctitud:**
- `POST /api/palpaciones` ahora exige **vaca de lechería** (antes solo "hembra"), igual que
  `/api/estado-reproductivo`. `src/app/api/palpaciones/route.ts`.
- `calcularEdad` calcula en **UTC** (antes con getters locales, podía dar un día/mes de menos en la
  finca UTC-6). Alineado con el resto del dominio. `src/lib/fechas.ts`.

**Frontend (mi terreno):**
- `FormularioAnimal.tsx` usa `llamarApi` en vez de `fetch` directo (evita el botón "Guardando…"
  colgado sin señal; era el único componente que no seguía la regla).
- `/partos/[id]` se aplanó: `Promise.all` con consultas planas en vez de `include` anidado encadenado.
- Accesibilidad de pestañas de la ficha (`FichaTabs`): `aria-controls`/`aria-labelledby` y foco por
  teclado. En `/leche` los selectores de vista (que son enlaces) pasaron a `aria-current`.
- Estilos de formulario unificados en `src/components/ui.tsx` (`claseCampo`, `claseEtiqueta`,
  `claseBotonPrimario`) y reutilizados; botones de formulario con área táctil ≥44 px.

**Pendiente nuevo:** B12 (¿la primera etapa de engorde se llama "Lactancia" o "Destete"?) en
`docs/07-preguntas-pendientes.md`. No se cambió comportamiento; espera decisión del dueño.

**Verificación:** `prisma generate`, `tsc --noEmit` y `npm run prod:build` (17/17 páginas) sin errores.

---

## 2026-10-16 · Fuente: dueño — accesibilidad, PWA y medición (Kiro)

**Qué llegó:** el dueño pidió mejoras técnicas (accesibilidad, medir el índice del listado y mejorar
la app instalable). Todo frontend/medición; no se tocó backend ni el contrato de la API.
Versión del proyecto: **1.0.1 → 1.0.2**.

**Accesibilidad:**
- Nuevo hook `src/lib/usar-modal.ts`: atrapa el foco dentro del modal (Tab/Shift+Tab no se escapan),
  cierra con Escape, bloquea el scroll del fondo y devuelve el foco al abridor. Aplicado al modal
  del historial completo (`HistorialEventos`) y al árbol a pantalla completa (`ArbolGenealogico`),
  reemplazando su lógica manual.
- Pestañas de la ficha (`FichaTabs`): navegación por teclado con flechas / Inicio / Fin, completando
  el patrón ARIA tabs (ya tenían `aria-controls`/`aria-labelledby`/tabIndex roving).

**Medición del índice del listado (`[modulo, estado, arete]`):** con `EXPLAIN ANALYZE` sobre la base
real (48 animales), Postgres **no usa** el índice: prefiere Seq Scan + Sort (~0,1 ms), igual con o
sin índice. Es lo esperado con pocas filas. El índice es correcto y **no estorba**; su beneficio es
**a futuro** (cientos/miles de animales), cuando evitará el ordenamiento en memoria. No hay nada que
cambiar hoy.

**PWA / app instalable:**
- `manifest.ts`: accesos directos (`shortcuts`) al mantener presionado el ícono — "Agregar animal",
  "Producción de leche" y "Calendario" — y `categories`.
- `layout.tsx`: color de la barra del sistema (`themeColor`) ahora se adapta a claro/oscuro.
- El service worker (modo sin conexión) no se tocó: ya estaba resuelto.

**Verificación:** `tsc --noEmit` y `npm run prod:build` (17/17 páginas) sin errores.

---

## 2026-10-16 · Fuente: dueño — decisión B12: la primera etapa se llama "Destete"

**Qué llegó:** el dueño decidió que la primera etapa de engorde se llame **"Destete"** (no
"Lactancia"), cerrando la pregunta B12. Versión del proyecto: **1.0.2 → 1.0.3**.

**Qué se cambió:** se eliminó "LACTANCIA" del código, que había quedado como resto de una definición
anterior. Se verificó que **no había ningún dato** con esa etapa (la tabla de etapas estaba vacía),
así que quitarlo es seguro y no se pierde nada.
- `src/lib/validar.ts`: `ETAPAS = ["DESTETE", "DESARROLLO", "ENGORDE"]` (antes incluía LACTANCIA).
- `src/lib/tipos.ts`: se quitó la etiqueta "Lactancia" de `ETAPA_LABEL`.
- `src/components/ListaAnimales.tsx`: el filtro por etapa ya no incluye LACTANCIA.
- `.kiro/steering/api.md`: `POST /api/etapas` acepta `DESTETE|DESARROLLO|ENGORDE`.

Las tres etapas de engorde quedan: **Destete (< 4 meses) → Desarrollo (< 16) → Engorde (desde 16)**,
calculadas por edad. Esto resuelve la contradicción con la B6 original (que en su momento había
eliminado "Destete"); la decisión vigente es esta.

**Verificación:** `tsc --noEmit` y `npm run prod:build` (17/17 páginas) sin errores.

---

## 2026-10-16 · Fuente: dueño — registrar crías sin arete ni SENASA

**Qué llegó:** al nacer, las crías no tienen número de arete (ni de SENASA) todavía, y había que
registrarlas igual. El dueño descartó usar un valor fijo como "000" (el arete es único: la segunda
cría chocaría). Decisión (opción B): permitir registrar un animal **sin arete** aunque **tampoco
tenga SENASA**; aparece como **"Sin arete"** hasta que se le ponga un número editándolo.
Versión del proyecto: **1.0.3 → 1.0.4**.

**Qué se cambió:**
- `src/lib/validar.ts`: con `sinArete`, ya **no se exige** `areteCenasa`. Se sigue guardando un arete
  interno único (`S/N-…`, invisible) para respetar la unicidad; por eso pueden coexistir muchas
  crías sin arete.
- `src/components/FormularioAnimal.tsx`: el campo "Arete de SENASA" es siempre opcional (se quitó el
  obligatorio al marcar "sin arete"); textos ajustados y la casilla ahora dice "Este animal no tiene
  arete todavía (p. ej. una cría recién nacida)".
- `etiquetaArete` (`src/lib/tipos.ts`) ya mostraba "Sin arete" cuando no hay SENASA; sin cambios.
- `.kiro/steering/api.md`: `POST /api/animales` con `sinArete` ya no exige `areteCenasa`.

Flujo para el dueño: al registrar la cría, marcar "Este animal no tiene arete todavía" y guardar
(con su nombre/madre si se quiere). Aparece como "Sin arete". Cuando consiga el número, editar el
animal y ponerle el arete real (o el de SENASA).

**Verificación:** `tsc --noEmit` y `npm run prod:build` (17/17 páginas) sin errores.

---

## 2026-10-16 · Fuente: dueño — cría sin arete también al registrarla desde el parto

**Qué llegó:** el cambio anterior (registrar sin arete ni SENASA) faltaba en el **otro** sitio donde
se da de alta una cría: el formulario de crías nuevas dentro del parto. Ahí, al marcar "no tiene
arete", todavía se **exigía** el SENASA. Versión del proyecto: **1.0.4 → 1.0.5**.

**Qué se cambió (solo frontend):**
- `src/app/animales/[id]/FormulariosEventos.tsx`, `EditorCriasNuevas`: con "no tiene arete" el campo
  SENASA pasó de obligatorio a **opcional**; la casilla ahora dice "No tiene arete todavía (aparece
  como «Sin arete»)". El payload ya mandaba `areteCenasa || null`, así que vacío llega como null.
- El backend no necesitó cambios: `leerCriasNuevas`/`datosAnimal` (`src/lib/crias.ts`,
  `src/lib/validar.ts`) ya aceptaban `sinArete` sin exigir SENASA tras el cambio de la v1.0.4.

Así, una cría recién nacida se puede registrar desde el parto sin ningún número y aparece como
"Sin arete" hasta que se le asigne editándola. Mismo comportamiento que el alta normal de animal.

**Verificación:** `tsc --noEmit` y `npm run prod:build` (17/17 páginas) sin errores.

---

## 2026-10-16 · Fuente: dueño — se elimina "Posparto"; tras parir queda En ordeño + Lista para montar

**Qué llegó:** decisión del dueño sobre el estado reproductivo tras el parto. Antes, al parir la
vaca pasaba a **"Posparto"** 40 días y luego a "Lista para montar". Ahora: **se elimina "Posparto"**;
al parir la vaca vuelve a **"En ordeño"** (hasta el próximo secado del siguiente ciclo) y, pasados
**40 días** del parto, además queda **"Lista para montar"** — se muestran **los dos a la vez**.
Versión del proyecto: **1.0.5 → 1.0.6**.

**Qué se cambió:**
- `src/lib/estado.ts`: quitado el estado `POSPARTO` (del tipo, etiquetas y de los estados manuales).
  `SituacionVaca` gana el indicador `listaParaMontar`. Con parto, el estado es `ORDENIO` y
  `listaParaMontar = hoy ≥ parto + 40 días`. "Lista para montar" es un indicador aparte del estado,
  no lo reemplaza.
- `src/lib/modulos.ts` (desglose de lechería): ya no cuenta "Posparto"; una vaca en ordeño que pasó
  los 40 días cuenta en **En ordeño** y además en **Lista para montar**.
- `src/components/ListaAnimales.tsx`: quitado el filtro "Posparto"; el filtro "Lista para montar"
  incluye a las vacas en ordeño con el indicador; la situación muestra los dos badges cuando aplica.
- Ficha (`EstadoReproductivoManual`): muestra "En ordeño · Lista para montar" cuando corresponde.
- `src/app/lecheria/page.tsx`: quitada la tarjeta "Posparto" del desglose.
- Pendientes y calendario (`src/lib/alertas.ts`) no cambiaron: ya avisaban "lista para montar" a los
  40 días (solo se ajustó un comentario).
- `docs/02-reglas-de-negocio.md` (A12, A18) actualizado.

**Verificación:** `tsc --noEmit` y `npm run prod:build` (17/17 páginas) sin errores.

---

## 2026-10-20 · Fuente: dueño — revisión de los cambios de Kiro (v1.0.1–1.0.6) (Claude Code)

**Qué llegó:** el dueño pidió revisar lo que hizo Kiro y corregir/optimizar lo que hiciera falta.
Lo demás de esas versiones se revisó y queda como está. Versión: **1.0.6 → 1.0.7**.

**Qué se cambió:**
- **Respaldos viejos con "Posparto" ya no fallan al restaurar.** `estadoAnterior` de un cambio de
  estado manual guarda el estado *calculado* en ese momento, que antes de la v1.0.6 podía ser
  `POSPARTO`; al quitarlo de `ESTADOS_REPRO`, restaurar un respaldo así daba 400. Nuevo
  `ESTADOS_REPRO_HISTORICOS` (`src/lib/estado.ts`) que usa el respaldo, y la etiqueta "Posparto" se
  conserva solo para mostrar ese historial. Fijar el estado a mano sigue sin ofrecer Posparto.
- **Restaurar respaldo: un solo UPDATE para padre/madre** (`src/app/api/respaldo/route.ts`). El
  agrupado por par (padre, madre) de la v1.0.1 casi no ahorraba: en lechería cada cría suele tener
  una madre distinta, así que seguía siendo ~un UPDATE por animal. Ahora es un `UPDATE … FROM unnest()`
  con los valores como parámetros.
- **`/partos/[id]` ya no lee todo el hato.** La v1.0.1 usaba `listarAnimales()` solo para
  identificar a la madre; ahora la madre viene con el parto (un nivel de relación, igual que el toro).

**Verificación:** `tsc --noEmit`, `npm run prod:build` sin errores; la consulta `unnest` con nulos se
probó en la base con un SELECT de solo lectura.
