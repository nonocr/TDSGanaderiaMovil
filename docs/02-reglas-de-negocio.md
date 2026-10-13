# 02 — Reglas de negocio

> Dos secciones: **CONFIRMADO** (dicho explícitamente por nosotros) y **PENDIENTE**
> (requiere validación con el papá). Nada en PENDIENTE debe tratarse como definitivo.
> Las duraciones usan "~" (aproximado) tal como fueron proporcionadas.

---

## A. Reglas CONFIRMADAS

### A1. Animal + historial
- Cada animal tiene una ficha individual.
- La ficha distingue **datos básicos/permanentes** de **historial** (eventos con fecha).
- Un animal puede tener muchos eventos a lo largo de su vida.
- **Todo evento conserva su fecha.**

### A2. Nunca borrar historial
- Un cambio de estado no elimina el historial.
- Un animal que deja de estar activo (vendido, muerto) **no desaparece**: su historial
  y sus relaciones genealógicas siguen siendo relevantes.
- Ejemplo: un toro vendido puede seguir siendo el padre de varios animales registrados.

### A3. Identificación
- El identificador principal y único de cada animal es su **número de arete**.

### A4. Operaciones según tipo de animal
- No todos los animales tienen las mismas operaciones.
  - Vaca: montas, partos, producción de leche.
  - Toro: participa como padre en reproducciones.
  - Ternero: seguimiento de crecimiento y etapas.
- El sexo debe poder usarse para filtrar y clasificar.

### A5. Genealogía derivada
- Al registrar un animal se puede registrar **padre** y **madre**.
- Padre/madre pueden ser animales ya existentes en el sistema.
- Abuelos, bisabuelos, etc. **no se capturan a mano**: se deducen de las relaciones
  padre/madre registradas.

### A6. Progenitores externos
- El padre o la madre puede NO estar registrado en el sistema.
- Debe poder registrarse como información externa (texto) **sin crear un animal falso**.

### A7. Monta ≠ parto
- La monta es un evento (vaca + toro + fecha).
- El parto es otro evento.
- **No se asume que una monta termine en parto.**
- No existe todavía un sistema definido de embarazo/preñez. **No inventarlo.**
  Actualización (B1, 2026-10-07): la preñez se confirma por **palpación** y se anota en la
  monta (casilla + fecha); el ciclo se sigue estimando desde la monta.

### A8. Partos
- El parto es un evento histórico: vaca + fecha + descripción + cría(s).
- Un parto puede producir **más de una cría** (p. ej. gemelos).
- Las crías quedan relacionadas con la madre y, cuando se conozca, con el padre.

### A9. Ciclo reproductivo de la vaca
Secuencia proporcionada por el papá:

```text
MONTA
  ↓  ~7 meses de ordeño        (se cuentan DESDE la monta)
  ↓  ~2 meses de secado        (últimos ~2 de esos meses)
PARTO
  ↓  ~40 días
nueva MONTA posible
  ↓
(nuevo ciclo)
```

**Corrección clave:** los ~7 meses de ordeño **NO** se cuentan después del parto.
Se cuentan desde la monta. El parto ocurre al final del período de secado.

### A10. Ordeño
- Tras la monta, la vaca entra en período de ordeño de **~7 meses**.
- El sistema debe poder conocer: inicio del período, fin estimado y cuándo comienza el secado.
- No agregar reglas adicionales de ordeño todavía.

### A11. Secado
- Tras ~7 meses de ordeño, viene el secado de **~2 meses**.
- Finalidad (según el papá): que la vaca se recupere antes de parir.
- El sistema debe poder representar que una vaca está **seca** y conservar cuándo empezó.
- Se quiere una alerta asociada a este proceso.

### A12. Nueva monta tras parto
- **~40 días después del parto** la vaca ya puede volver a ser montada.
- El sistema debe calcular esa fecha a partir de la fecha **real** del parto y avisar.

### A18. Estado reproductivo DERIVADO de la vaca (definición 2026-10-06)
- Los tiempos del ciclo son **fijos** (confirmado por el papá), así que el estado se
  **deriva automáticamente** de los eventos. Si luego varían por animal, se cambia a captura.
- **Embarazo: 9 meses** desde la monta. Se asume que una monta resulta en preñez (ver B1).
- **Enfoque (opción 2):** ordeño y secado se calculan desde la **monta**; el posparto arranca
  desde el **parto real registrado**, no desde la estimación.

Cálculo, contando **desde la monta más reciente**:
- mes 0 a 7 → **En ordeño**.
- mes 7 a 9 → **En secado** (los 2 meses finales antes del parto).
- mes 9 en adelante **sin parto registrado** → **Por parir** (espera el parto real).

Cuando hay un **parto** posterior a esa monta:
- desde el parto hasta +40 días → **Posparto**.
- después de +40 días → **Lista para montar** (regla A12).

Sin montas registradas → **sin estado reproductivo**.

- **Fecha estimada de parto** = monta + 9 meses. Se muestra en la vaca (útil sobre todo
  en ordeño/secado/por parir) como aviso; NO adelanta el estado (el posparto depende del
  parto real).
- Duraciones (7 y 9 meses, 40 días) centralizadas en `src/lib/fechas.ts`.

### A13. Producción de leche
- Se registra por: vaca + fecha + cantidad.
- Actualización (2026-10-12): la app registra cada ordeño por separado (turno mañana/tarde); el total del día es la suma.
- Se conservan **registros históricos**, no un acumulado que se sobrescribe.

### A14. Peso
- Se registra por: animal + fecha + peso.
- Se conserva el historial para ver la evolución del crecimiento.

### A15. Etapas del ternero
- **Tres etapas**, en este orden: **lactancia → desarrollo → engorde**.
  (Confirmado por el dueño el 2026-10-07; antes se contemplaba "destete" como etapa, se eliminó.)
- **Duraciones de referencia** (no se calculan solas, son orientativas):
  lactancia **3-4 meses**, desarrollo **8 meses**, engorde **4 meses** (según tamaño/peso).
- La última etapa es **engorde**.
- Cada etapa puede tener fecha de inicio, fecha de fin y estado actual.
- Se puede registrar una etapa solo con fecha de inicio y **editarla después** para
  agregar la fecha de fin.
- Las fechas se registran a mano; la app no avanza de etapa automáticamente.

### A17. Fin de la condición de "ternero"
- Un animal **deja de ser ternero al terminar sus etapas**, es decir, cuando la
  etapa de **engorde** tiene fecha de fin registrada. (Confirmado por el papá el 2026-10-06.)
- No depende de edad ni de tiempo transcurrido, sino de completar el ciclo de etapas.

### A16. Estado actual vs historial
- "Qué está pasando ahora" (estado) es distinto de "qué le ha pasado en toda su vida" (historial).
- Ambos coexisten; el estado no reemplaza al historial.

---

## B. Reglas antes pendientes — TODAS RESPONDIDAS (2026-10-07)

> El dueño respondió las B1–B11. Detalle completo en `07-preguntas-pendientes.md`.
> Resumen:

- **B1 (preñez):** se confirma por **palpación** (con fecha). Se registra en la monta.
- **B2 (montas sin resultado):** **no** se registran intentos fallidos.
- **B3 (toro del parto):** solo hay **un toro/semen** por monta; el padre es claro.
- **B4 (datos del parto):** cría sana (sí/no), necesitó ayuda (sí/no), peso al nacer.
- **B5 (gemelos):** cada cría es un animal aparte.
- **B6 (etapas):** lactancia (3-4 m) → desarrollo (8 m) → engorde (4 m). Sin "destete".
- **B7 (leche):** litros, total del día (2 ordeños), normalmente semanal.
  Actualización (2026-10-12): la app registra cada ordeño por separado (turno mañana/tarde); el total del día es la suma.
- **B8 (peso):** una vez al mes.
- **B9 (progenitor externo):** solo el nombre.
- **B10 (hermanos):** comparten padre **o** madre (medios hermanos).
- **B11 (tiempos del ciclo):** fijos para toda la finca; no varían por raza.
