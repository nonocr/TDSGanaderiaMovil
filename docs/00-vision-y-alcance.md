# 00 — Visión y alcance

> Documento vivo. Fase actual del proyecto: **levantamiento y organización de requisitos**.
> Todavía NO se implementa código. Primero se entiende el negocio.
> **Actualización:** la app ya está construida y en uso; el estado actual está en
> `09-estado-del-proyecto.md`. Este documento se conserva como visión original.

---

## 1. Qué es este proyecto

Una aplicación para gestionar el ganado de la familia. No es una simple lista de
animales: es un **registro digital del ganado** que conserva el historial completo de
cada animal (genealogía, reproducción, crecimiento, producción de leche y estado
actual).

La información y las reglas del negocio vienen principalmente del papá del dueño del
proyecto, que es quien conoce el manejo real del ganado.

## 2. Objetivo

Poder responder, en cualquier momento, preguntas como:

- ¿Qué animales tenemos actualmente? ¿Cuál es su arete, sexo, raza y fecha de nacimiento?
- ¿Quiénes son los padres, abuelos y bisabuelos de un animal? ¿Quiénes son sus hijos y hermanos?
- ¿Qué toro montó a una vaca y cuándo? ¿Cuándo parió? ¿Cuántos partos ha tenido y qué crías tuvo?
- ¿Cuánto pesa un animal y cómo ha evolucionado su peso?
- ¿Cuánta leche produce una vaca (con historial, no solo el último dato)?
- ¿En qué etapa está un ternero (lactancia, desarrollo o engorde)? ¿Qué vacas están dando leche o secas?
- ¿Qué animales necesitan atención próximamente (alertas)?

La app debe conservar **el historial**, no solamente el estado actual.

## 3. Filosofía del proyecto (regla de oro)

**La aplicación se adapta al manejo real de nuestro ganado, no al revés.**

Primero se entiende "¿cómo manejamos nosotros los animales?" y después eso se
convierte en software.

> Cuando una suposición común de software/ganadería contradiga lo que se haya
> especificado explícitamente en este proyecto, **prevalece lo especificado por nosotros**.

## 4. Orden de prioridades del proyecto

1. Comprender el negocio.
2. Definir los datos.
3. Definir las relaciones entre ellos.
4. Definir las reglas del ganado.
5. Definir los eventos e historial.
6. Definir las alertas.
7. Diseñar la experiencia de usuario.
8. Elegir / confirmar arquitectura técnica.
9. Implementar.

No se invierte tiempo en el punto 9 mientras los puntos anteriores sigan cambiando.
El punto 9 **sí va a ocurrir** (probablemente construyendo junto con Claude Code);
simplemente todavía no es el momento.

## 5. Rol de Kiro en esta fase

Kiro actúa como **analista y arquitecto del dominio**, no como generador de código.

Cuando llegue información nueva del papá, Kiro debe:

1. Identificar qué requisito nuevo apareció.
2. Relacionarlo con los requisitos existentes.
3. Detectar contradicciones.
4. Detectar información duplicada.
5. Identificar reglas ambiguas.
6. Separar hechos confirmados de decisiones pendientes.
7. Actualizar la comprensión del dominio (estos documentos).
8. Solo cuando el dueño lo indique, pasar al diseño técnico y a la implementación.

Kiro **no toma decisiones de negocio**. Si falta información para una decisión
importante, pregunta y la deja registrada en `07-preguntas-pendientes.md`.

## 6. Lo que NO debe hacerse todavía

- Inventar requisitos.
- Inventar reglas ganaderas.
- Inventar períodos o duraciones que no hayan sido proporcionados.
- Decidir automáticamente cómo funciona el embarazo / la preñez.
- Asumir que una monta siempre termina en parto.
- Asumir que todos los animales tienen los mismos eventos.
- Duplicar información genealógica.
- Crear una arquitectura enorme antes de comprender el dominio.
- Crear pantallas solo porque existe una idea general de la app.

Toda ambigüedad importante se registra como **pregunta pendiente**.

## 7. Estado del documento

| Campo | Valor |
|---|---|
| Fase | Construcción (antes: levantamiento de requisitos) |
| Implementación | En curso; ver `09-estado-del-proyecto.md` |
| Fuente de verdad del negocio | El papá del dueño del proyecto |
| Herramientas previstas de construcción | Kiro + Claude Code |
