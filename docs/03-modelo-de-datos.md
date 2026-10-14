# 03 — Modelo de datos (conceptual)

> Modelo **conceptual**: entidades, atributos y relaciones. SIN tecnología, SIN base de
> datos concreta, SIN decisiones de implementación. Lo marcado como *(pendiente)* no
> está confirmado. Ver `07-preguntas-pendientes.md`.

---

## 1. Visión general de entidades

```text
Animal ──(padre/madre)──> Animal        (genealogía, auto-relación)
Animal ──< Evento                        (un animal tiene muchos eventos)

Eventos especializados:
  - Nacimiento
  - Monta        (relaciona Vaca + Toro)
  - Parto        (relaciona Vaca + Cría(s))
  - Ordeño / RegistroLeche
  - RegistroPeso
  - CambioEtapa  (lactancia / desarrollo / engorde)
  - Secado
```

> Decisión pendiente de diseño: si cada tipo de evento es una entidad propia o si hay una
> entidad `Evento` genérica con subtipos. Se decide en la fase de diseño técnico, no ahora.

---

## 2. Entidad: Animal

### Datos básicos / permanentes
| Atributo | Notas |
|---|---|
| arete | Identificador principal, **único**. Si el animal no tiene arete (`sin_arete`), guarda un valor interno `S/N-…` que no se muestra. |
| arete_cenasa | Arete oficial de CENASA (trazabilidad). Opcional, no único. Obligatorio si `sin_arete`. |
| sin_arete | Sí/no: el animal no tiene arete de la finca; se identifica por el de CENASA. |
| foto | Imagen del animal. |
| sexo | Macho / hembra. Usado para filtros y clasificación. |
| raza | — |
| fecha_nacimiento | — |
| descripcion / notas | Texto libre. |
| estado | Ver sección 3. |
| modulo | Engorde / lechería / reproductor. Un animal no cambia de módulo. |
| codigo | Código del reproductor (toro o pajilla). Opcional. |
| es_pajilla | Sí/no (solo reproductores): pajilla en vez de toro físico. Su arete = su código. |
| fecha_baja / motivo_baja | Solo si está vendido o muerto. Opcionales. |
| padre | Referencia a Animal **o** progenitor externo (ver sección 4). |
| madre | Referencia a Animal **o** progenitor externo (ver sección 4). |

### Derivados (NO se almacenan como campos, se calculan)
- Abuelos, bisabuelos y antepasados → desde padre/madre.
- Hijos y descendientes → desde animales que lo referencian como padre/madre.
- Hermanos → animales que comparten progenitor(es) (padre **o** madre, incluye medios hermanos — B10).
- Edad → desde fecha_nacimiento.

---

## 3. Estado del animal

Valores considerados hasta ahora (de requisitos previos):

- **De permanencia:** activo, vendido, muerto.
- **De manejo/producción:** dando leche, seco, (etapas de ternero: lactancia, desarrollo, engorde).

> *(pendiente)* Definir si "permanencia" y "manejo/producción" son **dos dimensiones de
> estado separadas** (una vaca puede estar `activo` + `dando leche` a la vez) o una sola
> lista. Conceptualmente parecen dos ejes distintos; a confirmar en diseño.

Regla fija: cambiar el estado **nunca** borra el historial.

---

## 4. Progenitores: registrado vs externo

Cada vínculo de padre/madre debe soportar dos formas:

```text
Padre/Madre:
  ├── Registrado  → referencia a un Animal existente (por arete)
  └── Externo     → información textual (p. ej. "Toro de otra finca")
```

- No se debe obligar a crear un animal falso para registrar genealogía incompleta.
- Del progenitor externo se guarda **solo el nombre** (B9, respondida el 2026-10-07).

---

## 5. Entidad: Monta
| Atributo | Notas |
|---|---|
| vaca | Referencia a Animal (hembra). |
| toro | Referencia a Animal (macho). |
| fecha | Obligatoria. |
| inseminacion | Sí/no: fue con pajilla en vez de monta natural. |
| prenez_confirmada / fecha_confirmacion | Confirmación por palpación (B1). Opcional. |

Permite consultar: ¿qué toro montó a esta vaca? / ¿qué vacas ha montado este toro?
**No** implica preñez ni parto (regla A7).

---

## 6. Entidad: Parto
| Atributo | Notas |
|---|---|
| vaca | Referencia a Animal (madre). |
| fecha | Obligatoria. |
| descripcion | Nota libre opcional. |
| cria_sana / necesito_ayuda / peso_nacimiento | Datos del nacimiento (B4). Opcionales. |
| crias | Una o varias referencias a Animal (regla A8). |
| toro / padre | Opcional; normalmente el de la monta (B3). |

---

## 7. Entidad: RegistroLeche (producción)
| Atributo | Notas |
|---|---|
| vaca | Referencia a Animal. |
| fecha | Obligatoria. |
| cantidad | Litros de **un ordeño** (B7; actualización 2026-10-12). |
| turno | Mañana / tarde. Opcional (registros viejos sin turno = total del día). El total del día es la suma. |

Histórico: no se sobrescribe (regla A13).

---

## 8. Entidad: RegistroPeso
| Atributo | Notas |
|---|---|
| animal | Referencia a Animal. |
| fecha | Obligatoria. |
| peso | — |

Histórico para ver evolución (regla A14).

---

## 9. Etapas del ternero
| Atributo | Notas |
|---|---|
| animal | Referencia a Animal (ternero). |
| etapa | lactancia / desarrollo / engorde ("destete" solo en datos antiguos). |
| fecha_inicio | — |
| fecha_fin | Puede estar vacía si es la etapa actual. |

Duraciones de referencia (B6): lactancia 3-4 meses, desarrollo 8, engorde 4. No se imponen:
las fechas se registran a mano.

---

## 10. Período reproductivo / productivo de la vaca

Para soportar el ciclo (A9–A12) hace falta poder ubicar a la vaca en el tiempo:

```text
monta → [ordeño ~7m] → [secado ~2m] → parto → [~40 días] → nueva monta
```

- Decidido (A18): el ciclo **se deriva** de los eventos sueltos (monta más reciente y parto
  real posterior); no hay una entidad "ciclo".
- Esto afecta directamente al cálculo de alertas (ver `06-alertas.md`).

---

## 11. Nota de alcance

Este modelo es intencionalmente conceptual. No se eligen tipos de datos, claves,
índices ni motor de almacenamiento hasta llegar al punto 8 del plan (arquitectura técnica).
