# 01 — Glosario del dominio

> Vocabulario común del proyecto. Si un término cambia de significado, se actualiza aquí
> y se registra en la bitácora (`08-bitacora-de-cambios.md`).

---

## Animales

- **Ganado** (hato): el conjunto de animales de la finca. En la app el término visible es "ganado".
- **Animal**: unidad principal del sistema. Tiene una ficha individual y un historial.
- **Arete**: identificador principal y único de cada animal (número de arete).
- **Toro**: animal macho reproductor. Puede participar como padre.
- **Vaca**: animal hembra. Puede tener montas, partos y producción de leche.
- **Ternero**: animal que aún no ha completado sus tres etapas (lactancia, desarrollo, engorde). Deja de ser ternero al cerrar el engorde.
- **Módulo**: grupo de la finca al que pertenece cada animal (`Animal.modulo`). Hay tres:
  **Engorde** (crías nacidas en la finca, machos y hembras, para carne), **Lechería** (vacas
  de leche; se compran, no nacen en la finca) y **Reproductores** (el toro de la finca y las
  pajillas externas). Un animal pertenece a uno solo y **no cambia de módulo**.
- **Reproductor**: animal del módulo Reproductores: el toro de la finca o una pajilla
  externa, identificada con un **código** (`Animal.codigo`).

> Nota: la distinción toro/vaca/ternero no implica que todos los animales tengan las
> mismas operaciones disponibles. Ver `03-modelo-de-datos.md`.

## Datos del animal

- **Datos básicos / permanentes**: información que no es un evento (arete, sexo, raza,
  fecha de nacimiento, foto, descripción, padre, madre).
- **Estado**: situación del animal (p. ej. activo, vendido, muerto; dando leche, seco…).
  Un cambio de estado nunca borra el historial.
- **Historial**: secuencia de eventos con fecha que le han ocurrido al animal.

## Genealogía y familia

- **Padre / Madre**: progenitores directos. Pueden ser animales registrados o **externos**.
- **Progenitor externo**: padre o madre que NO está registrado en el sistema (p. ej. un
  toro de otra finca). Se registra como información externa, sin crear un animal falso.
- **Genealogía derivada**: abuelos, bisabuelos y demás antepasados que se **deducen** de
  las relaciones padre/madre ya registradas; no se capturan a mano en cada animal.
- **Descendencia**: hijos y demás descendientes derivados de las relaciones registradas.
- **Hermanos**: animales que comparten padre **o** madre (incluye medios hermanos; B10, respondida el 2026-10-07).

## Reproducción

- **Monta**: evento en que un toro monta a una vaca, con fecha. **No implica preñez ni parto.**
- **Inseminación / pajilla**: la vaca se preña con una **pajilla** (dosis de semen de un toro
  externo, comprada) en vez de monta natural. Se registra como una monta marcada como
  inseminación (`Monta.inseminacion`), con la pajilla como reproductor. En la interfaz se
  habla de "pajilla", no de "semen".
- **Preñez confirmada**: la preñez se confirma por **palpación** y se anota en la monta
  (casilla + fecha de confirmación; B1).
- **Parto**: evento en que una vaca pare una o más crías, con fecha.
- **Ciclo reproductivo**: secuencia monta → ordeño → secado → parto → nueva monta. Ver `02-reglas-de-negocio.md`.

> **Importante:** Monta ≠ parto. La preñez se confirma por palpación y se anota en la monta;
> el ciclo (ordeño, secado, parto estimado) se calcula desde la monta.

## Producción y crecimiento

- **Ordeño**: período/actividad de extracción de leche de una vaca.
- **Turno de ordeño**: la vaca se ordeña dos veces al día, **mañana** y **tarde**. Cada
  registro de leche es un ordeño con su turno; el total del día es la suma de ambos.
- **Producción de leche**: registros históricos de litros por vaca, fecha y turno.
- **Secado**: período en que la vaca se deja de ordeñar antes del parto para que se recupere.
- **Peso**: registro histórico del peso de un animal en una fecha dada.

## Etapas del ternero

Tres etapas, en orden: **lactancia → desarrollo → engorde** (B6, 2026-10-07).

- **Lactancia**: período de lactancia del ternero (~3-4 meses).
- **Desarrollo**: etapa posterior a la lactancia (~8 meses).
- **Engorde**: última etapa (~4 meses, según tamaño/peso). Al cerrarla, el animal deja de ser ternero.

> Las duraciones son solo de referencia; las fechas se registran a mano. "Destete" ya no es
> una etapa: solo aparece en datos antiguos.

## Eventos y alertas

- **Evento**: hecho con fecha que forma parte del historial de un animal (nacimiento,
  monta, parto, ordeño, peso, cambios de etapa, secado, etc.). **Todo evento tiene fecha.**
- **Alerta**: aviso derivado de una regla de negocio (p. ej. "la vaca ya puede volver a
  ser montada ~40 días tras el parto").
