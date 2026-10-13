# 06 — Alertas

> Las alertas se derivan de reglas de negocio reales de manejo. Las reglas de cálculo que
> aparecen aquí usan las aproximaciones proporcionadas por el papá; el dueño confirmó el
> 2026-10-07 que los tiempos son fijos para toda la finca (B11).

---

## 1. Principio

Una alerta avisa de una situación de manejo que se aproxima o que ya ocurre, calculada a
partir de fechas **reales** de eventos registrados.

---

## 2. Alertas identificadas

### Alerta 1 — Nueva monta tras el parto
- **Regla:** ~40 días después del parto, la vaca ya puede volver a ser montada.
- **Cálculo:** `fecha_parto + ~40 días`.
- **Ejemplo:**
  ```text
  Parto:   10 de enero
  +40 días: ~19 de febrero
  → Avisar: "la vaca puede volver a ser montada".
  ```
- **Fuente de la fecha:** fecha real del parto registrado.

### Alerta 2 — Entrada en secado
- **Regla:** avisar cuando una vaca se aproxime al período en que debe entrar en secado.
- **Contexto del ciclo:** el ordeño empieza en la monta y dura ~7 meses; después viene el
  secado de ~2 meses (meses 7–9 desde la monta), que termina con el parto estimado (mes 9).
- **Cálculo (A18):** `fecha_monta_más_reciente + 7 meses` = inicio del secado.
  Constantes en `src/lib/fechas.ts`; aviso en `src/lib/alertas.ts`.

---

## 3. Estado de validación

| Alerta | Base de cálculo | Estado |
|---|---|---|
| Nueva monta tras parto | fecha del parto + 40 días | Implementada; tiempos fijos para toda la finca (B11) |
| Entrada en secado | monta más reciente + 7 meses (A18) | Implementada |

En la app (`src/lib/alertas.ts`) también se avisa de **vaca recién montada (entra en
ordeño)** y de **parto estimado** (monta + 9 meses, sin parto registrado). Los avisos se
muestran en Inicio cuando faltan **20 días o menos** o ya se cumplieron (`VENTANA_DIAS = 20`);
el Calendario lista los hitos futuros sin esa ventana.

---

## 4. Pendientes relacionados con alertas

- ~~*(B11)* Si ~40 días y ~2 meses son fijos o varían por animal.~~ Resuelto (2026-10-07): son fijos.
- ~~Con cuánta anticipación avisar.~~ Implementado: ventana de 20 días.
- Si hay más alertas que el papá maneje y que todavía no se han capturado. *(por preguntar)*
- Cómo se "cierra" o se marca como atendida una alerta. *(decisión futura, no inventar)*

> Ninguna de estas reglas de alerta debe resolverse inventando una solución. Se validan con
> el papá y se registran los cambios en `08-bitacora-de-cambios.md`.
