# 04 — Eventos e historial

> Principio central del proyecto: cada animal es **animal + historial**. El estado actual
> no reemplaza lo que le ha pasado al animal durante su vida.

---

## 1. Principio: estado actual ≠ historial

- **Estado actual:** qué está pasando ahora (p. ej. "dando leche").
- **Historial:** todo lo que le ha pasado al animal, en orden, con fechas.

Ejemplo:

```text
Historial de una vaca:
- 2024  Parto
- 2024  Ordeño
- 2025  Secado
- 2025  Parto
- 2025  Ordeño
- 2026  Secado
- 2026  Parto

Estado actual: Dando leche
```

Cambiar el estado **no borra** ninguno de esos eventos.

---

## 2. Regla universal de los eventos

**Todo evento tiene una fecha.** El objetivo es poder reconstruir la historia completa
del animal a partir de sus eventos.

---

## 3. Catálogo de eventos identificados

> Lista actual. Puede crecer. Cada entrada indica a qué animal aplica y qué datos lleva
> (los datos pendientes se marcan).

| Evento | Aplica a | Datos mínimos | Pendientes |
|---|---|---|---|
| Nacimiento | Todos | fecha | — |
| Monta | Vaca (+ toro o pajilla) | vaca, toro, fecha (+ inseminación, preñez confirmada por palpación — B1) | — |
| Parto | Vaca | vaca, fecha, descripción, cría(s) (+ cría sana, necesitó ayuda, peso al nacer — B4) | — |
| Ordeño | Vaca | vaca, fecha | derivado del ciclo (A18) |
| Registro de leche | Vaca | vaca, fecha, turno (mañana/tarde), litros de ese ordeño | — (B7; un registro por ordeño desde 2026-10-12) |
| Peso | Todos | animal, fecha, peso | — (mensual, B8) |
| Etapa: lactancia | Ternero | animal, fecha inicio (fin opcional) | — (~3-4 meses, B6) |
| Etapa: desarrollo | Ternero | animal, fecha inicio (fin opcional) | — (~8 meses, B6) |
| Etapa: engorde | Ternero | animal, fecha inicio (fin opcional) | — (~4 meses, B6) |
| Secado | Vaca | derivado: monta + 7 meses | — (tiempos fijos, B11) |
| (otros) | — | — | por definir |

---

## 4. Relación entre eventos y el ciclo reproductivo

Los eventos de reproducción no están aislados: encajan en el ciclo descrito en
`02-reglas-de-negocio.md` (A9–A12).

```text
Monta ──> Ordeño (~7m desde la monta) ──> Secado (~2m) ──> Parto ──> (~40 días) ──> nueva Monta
```

- La **monta** es el punto de arranque del ciclo (no el parto).
- El **secado** son los ~2 meses posteriores al ordeño (meses 7–9 desde la monta), antes del parto.
- El **parto** dispara el conteo de ~40 días para la siguiente monta.

> Decidido (A18): el ciclo se deduce de los eventos sueltos (monta más reciente y parto real);
> no hay un "ciclo" explícito. Ver `src/lib/estado.ts` y `06-alertas.md`.

---

## 5. Qué permite el historial

- Ver la línea de tiempo de un animal.
- Contar cuántos partos ha tenido una vaca y qué crías tuvo.
- Ver la evolución del peso.
- Ver el historial de producción de leche (sin perder registros anteriores).
- Reconstruir en qué etapa estuvo un ternero y cuándo.

---

## 6. Lo que NO se asume sobre eventos

- Que una monta genere un parto (A7).
- Que todos los animales tengan los mismos eventos (A4).
- Que el animal avance de etapa solo: las duraciones de B6 son de referencia (A15).
- ~~Que las aproximaciones (~7m, ~2m, ~40d) sean fijas para todos los animales (B11).~~
  Respondida el 2026-10-07: son fijas para toda la finca.
