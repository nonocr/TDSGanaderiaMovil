# 07 — Preguntas al dueño (RESPONDIDAS)

> Decisiones de negocio que debía tomar el dueño, no Kiro. **Todas respondidas el
> 2026-10-07.** Cada una tiene un ID estable para referenciarla desde otros documentos.

---

## Reproducción

| ID | Pregunta | Respuesta |
|---|---|---|
| B1 | ¿Cómo se confirma que una vaca quedó preñada? | **Por palpación**, que confirma la fecha. La app permite marcar en la monta "preñez confirmada por palpación" con su fecha. Se sigue asumiendo embarazo de ~9 meses para las estimaciones. |
| B2 | ¿Se registran montas que no resultaron? | **No.** Solo interesa la monta que lleva a parto. No se guardan intentos fallidos. |
| B3 | ¿Cómo se sabe qué toro fue el padre? | **Solo hay un toro o semen** por monta, así que el padre es claro. El toro del parto es opcional pero normalmente es el de la monta. |

## Partos

| ID | Pregunta | Respuesta |
|---|---|---|
| B4 | ¿Qué datos del parto se guardan? | **Si la cría nació sana, si necesitó ayuda, y el peso al nacer.** Más una nota libre opcional. Se guardan en el parto (para gemelos, aplican a la cría principal). |
| B5 | ¿Qué se registra con gemelos / varias crías? | **Cada cría es un animal por separado** (con su arete). El parto puede vincular varias crías. |

## Terneros

| ID | Pregunta | Respuesta |
|---|---|---|
| B6 | Etapas del ternero y sus duraciones | **Tres etapas**: Lactancia (3 a 4 meses) → Desarrollo (8 meses) → Engorde (4 meses, depende del tamaño/peso). Se eliminó "Destete" como etapa. Las fechas se registran a mano; las duraciones son solo de referencia. |

## Leche

| ID | Pregunta | Respuesta |
|---|---|---|
| B7 | Unidad y frecuencia de la leche | **Litros.** Se anota el **total del día** (los dos ordeños sumados), normalmente **una vez por semana**. Actualización (2026-10-12): la app registra cada ordeño por separado (turno mañana/tarde); el total del día es la suma. |

## Peso

| ID | Pregunta | Respuesta |
|---|---|---|
| B8 | ¿Cuándo se pesa? | **Una vez al mes** (pesaje periódico). |

## Animales externos

| ID | Pregunta | Respuesta |
|---|---|---|
| B9 | Datos de un padre/madre de otra finca | **Solo el nombre.** No hace falta raza ni finca de origen. |

## Genealogía

| ID | Pregunta | Respuesta |
|---|---|---|
| B10 | Criterio de "hermanos" | **Medios hermanos (opción b):** son hermanos si comparten el padre **o** la madre (basta uno de los dos). |

## Ciclo / tiempos

| ID | Pregunta | Respuesta |
|---|---|---|
| B11 | ¿Los tiempos del ciclo varían por animal/raza? | **Son fijos** para toda la finca; no cambian por raza. (ordeño ~7 meses, secado ~2 meses, posparto ~40 días, embarazo ~9 meses). |

---

## Resumen de cambios aplicados en la app (2026-10-07)

- **B1** — Monta: casilla "preñez confirmada por palpación" + fecha. Se muestra en el historial.
- **B4** — Parto: campos "nació sana", "necesitó ayuda" y "peso al nacer". Se muestran en el historial.
- **B6** — Etapas reducidas a 3 (Lactancia, Desarrollo, Engorde) con duraciones de referencia visibles.
- **B7** — Leche en litros, con nota de que es el total del día y suele registrarse semanal.
  Actualización (2026-10-12): la app registra cada ordeño por separado (turno mañana/tarde); el total del día es la suma.
- **B2, B3, B5, B8, B9, B10, B11** — confirmaban el comportamiento que ya tenía la app; sin cambios de código.

---

## Pendientes NUEVAS (posteriores al 2026-10-07)

> Estas sí están **abiertas**: surgieron de cambios posteriores y requieren una decisión del dueño.
> No se resuelven inventando; mientras tanto el comportamiento actual se deja como está.

| ID | Pregunta | Estado |
|---|---|---|
| B12 | **¿"Lactancia" o "Destete" para la primera etapa de engorde?** Desde el 2026-10-16 la etapa de engorde se calcula por edad y devuelve **DESTETE** (< 4 meses) → DESARROLLO → ENGORDE (`etapaPorEdad` en `src/lib/estado.ts`). Pero la validación y los datos antiguos aún aceptan **LACTANCIA** como etapa manual (`ETAPAS` en `src/lib/validar.ts`), y la etiqueta "Lactancia" sigue existiendo. Resultado: un animal viejo con etapa manual "LACTANCIA" se muestra como "Destete" al calcularse por edad. **Falta confirmar con el dueño** si la primera etapa debe llamarse Lactancia o Destete, para unificar el nombre en cálculo, validación y etiquetas. Mientras tanto no se cambia el comportamiento (las etapas manuales viejas se conservan como historial). |
