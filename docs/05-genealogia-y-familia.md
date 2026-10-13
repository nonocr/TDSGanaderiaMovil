# 05 — Genealogía y familia

> Una de las partes más importantes del proyecto. Regla central: la genealogía es
> **derivada** de las relaciones padre/madre registradas, nunca duplicada a mano.

---

## 1. Registro base

Al registrar un animal se puede indicar:

- **Padre**
- **Madre**

Padre y madre pueden ser animales que **ya existen** en el sistema (referenciados por arete)
o **progenitores externos** (ver sección 4).

**No** se registran manualmente abuelos, bisabuelos, etc. en cada animal.

---

## 2. Genealogía derivada (ascendencia)

A partir de padre/madre, el sistema deduce los antepasados.

Ejemplo:

```text
Animal X
├── Padre: Toro A
└── Madre: Vaca B
```

Si Toro A ya tiene padres registrados:

```text
Toro A
├── Padre: Toro C
└── Madre: Vaca D
```

Entonces se deduce automáticamente:

```text
Animal X
└── Padre: Toro A
    ├── Padre (abuelo): Toro C
    └── Madre (abuela): Vaca D
```

La ascendencia se arma recorriendo las relaciones ya existentes, hasta donde haya datos.

---

## 3. Relaciones familiares que se pueden mostrar

Todas derivan de los vínculos padre/madre:

- Padre
- Madre
- Hijos
- Hermanos
- Abuelos
- Bisabuelos
- Otros antepasados disponibles
- Otros descendientes disponibles

### Hijos (descendencia)
Si `Toro A + Vaca B → Animal X`, entonces:
- Animal X es hijo de Toro A y de Vaca B.
- Toro A es padre de Animal X; Vaca B es madre de Animal X.

### Hermanos
Si `Toro A + Vaca B → Animal X` y `Toro A + Vaca B → Animal Y`, entonces X e Y son hermanos.

> *(B10, respondida el 2026-10-07)* Basta con compartir **padre o madre**: los medios
> hermanos también cuentan como hermanos.

---

## 4. Progenitores externos

Puede haber animales cuyo padre o madre **no esté registrado** (p. ej. un toro de otra finca).

- El vínculo padre/madre debe soportar:
  - **Animal registrado** → ej. `Padre → Toro #025`.
  - **Externo** → ej. `Padre → "Toro de otra finca / no registrado"`.
- No se debe obligar a crear un animal falso solo para completar la genealogía.
- Cuando el progenitor es externo, la relación queda como información externa / texto
  (forma exacta por definir).

> *(B9, respondida el 2026-10-07)* Del progenitor externo se guarda **solo el nombre**
> (`padreExterno` / `madreExterno`).

---

## 5. Consultas de descendencia

Debe poder consultarse, por ejemplo:

- "Mostrar todos los hijos del Toro #001."
- "Qué crías tuvo determinada vaca."
- Relaciones familiares derivadas en general.

---

## 6. Reglas y no-suposiciones

- La genealogía **no se duplica**: siempre se deriva de padre/madre.
- Un animal vendido o muerto **sigue existiendo** como nodo genealógico (regla A2):
  un toro vendido puede seguir siendo padre de muchos animales.
- No se asume parentesco que no provenga de relaciones padre/madre registradas (o de un
  parto registrado que vincule madre/crías).
