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
