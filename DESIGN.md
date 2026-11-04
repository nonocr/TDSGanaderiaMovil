---
name: TDS Ganadería
description: Registro del ganado de la Finca Tierra de Sueños, hecho para el celular en el corral.
colors:
  marca-verde: "#4b7a3f"
  marca-hondo: "#3b6132"
  marca-tierra: "#2f4e28"
  marca-brote: "#5e9142"
  marca-claro: "#7fae60"
  marca-niebla: "#e4efdb"
  marca-rocio: "#f4f8f1"
  superficie: "#ffffff"
  piedra-fondo: "#f5f5f4"
  piedra-borde: "#d6d3d1"
  piedra-minimo: "#78716c"
  piedra-secundario: "#57534e"
  piedra-etiqueta: "#44403c"
  piedra-texto: "#292524"
  piedra-tinta: "#1c1917"
  piedra-noche: "#0c0a09"
  tono-azul: "#075985"
  tono-azul-fondo: "#f0f9ff"
  tono-ambar: "#92400e"
  tono-ambar-fondo: "#fffbeb"
  tono-rojo: "#b91c1c"
  tono-rojo-fondo: "#fef2f2"
  peligro: "#dc2626"
typography:
  titulo-pagina:
    fontFamily: "ui-sans-serif, system-ui, sans-serif, \"Apple Color Emoji\", \"Segoe UI Emoji\", \"Segoe UI Symbol\", \"Noto Color Emoji\""
    fontSize: "1.5rem"
    fontWeight: 700
    lineHeight: "2rem"
    letterSpacing: "-0.025em"
  cifra:
    fontFamily: "ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 700
    lineHeight: 1
    letterSpacing: "-0.025em"
    fontFeature: "\"tnum\""
  titulo-seccion:
    fontFamily: "ui-sans-serif, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 600
    lineHeight: "1.5rem"
  nombre-fila:
    fontFamily: "ui-sans-serif, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 600
    lineHeight: "1.5rem"
  cuerpo:
    fontFamily: "ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: "1.25rem"
    fontFeature: "\"tnum\""
  etiqueta:
    fontFamily: "ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 500
    lineHeight: "1rem"
  etiqueta-nav:
    fontFamily: "ui-sans-serif, system-ui, sans-serif"
    fontSize: "11px"
    fontWeight: 500
    lineHeight: "1rem"
rounded:
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "24px"
  full: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "20px"
  2xl: "24px"
  3xl: "32px"
components:
  button-primary:
    backgroundColor: "{colors.marca-verde}"
    textColor: "{colors.superficie}"
    typography: "{typography.cuerpo}"
    rounded: "{rounded.md}"
    padding: "0 16px"
    height: "44px"
  button-primary-hover:
    backgroundColor: "{colors.marca-hondo}"
  button-primary-active:
    backgroundColor: "{colors.marca-tierra}"
  button-secondary:
    backgroundColor: "{colors.superficie}"
    textColor: "{colors.piedra-etiqueta}"
    rounded: "{rounded.md}"
    padding: "0 16px"
    height: "44px"
  button-danger:
    backgroundColor: "{colors.peligro}"
    textColor: "{colors.superficie}"
    rounded: "{rounded.md}"
    padding: "0 16px"
    height: "44px"
  button-danger-soft:
    backgroundColor: "{colors.superficie}"
    textColor: "{colors.tono-rojo}"
    rounded: "{rounded.md}"
    padding: "0 16px"
    height: "44px"
  button-ghost:
    textColor: "{colors.piedra-secundario}"
    rounded: "{rounded.md}"
    padding: "0 16px"
    height: "44px"
  button-ghost-brand:
    textColor: "{colors.marca-hondo}"
    rounded: "{rounded.md}"
    padding: "0 16px"
    height: "44px"
  button-icon:
    textColor: "{colors.piedra-secundario}"
    rounded: "{rounded.md}"
    size: "44px"
  card:
    backgroundColor: "{colors.superficie}"
    rounded: "{rounded.lg}"
    padding: "16px"
  input:
    backgroundColor: "{colors.superficie}"
    textColor: "{colors.piedra-tinta}"
    typography: "{typography.cuerpo}"
    rounded: "{rounded.md}"
    padding: "8px 12px"
    height: "44px"
  badge-neutral:
    backgroundColor: "{colors.piedra-fondo}"
    textColor: "{colors.piedra-etiqueta}"
    typography: "{typography.etiqueta}"
    rounded: "{rounded.full}"
    padding: "2px 10px"
  badge-verde:
    backgroundColor: "{colors.marca-rocio}"
    textColor: "{colors.marca-tierra}"
    rounded: "{rounded.full}"
    padding: "2px 10px"
  badge-azul:
    backgroundColor: "{colors.tono-azul-fondo}"
    textColor: "{colors.tono-azul}"
    rounded: "{rounded.full}"
    padding: "2px 10px"
  badge-ambar:
    backgroundColor: "{colors.tono-ambar-fondo}"
    textColor: "{colors.tono-ambar}"
    rounded: "{rounded.full}"
    padding: "2px 10px"
  badge-rojo:
    backgroundColor: "{colors.tono-rojo-fondo}"
    textColor: "{colors.tono-rojo}"
    rounded: "{rounded.full}"
    padding: "2px 10px"
  option-pill:
    backgroundColor: "{colors.superficie}"
    textColor: "{colors.piedra-etiqueta}"
    rounded: "{rounded.md}"
    padding: "0 14px"
    height: "44px"
  option-pill-checked:
    backgroundColor: "{colors.marca-rocio}"
    textColor: "{colors.marca-tierra}"
  tab-active:
    backgroundColor: "{colors.marca-verde}"
    textColor: "{colors.superficie}"
    rounded: "{rounded.md}"
    height: "44px"
  nav-item-active:
    backgroundColor: "{colors.marca-niebla}"
    textColor: "{colors.marca-tierra}"
    rounded: "{rounded.md}"
    padding: "10px 12px"
  fab-agregar:
    backgroundColor: "{colors.marca-verde}"
    textColor: "{colors.superficie}"
    rounded: "{rounded.full}"
    size: "56px"
  toast:
    backgroundColor: "{colors.piedra-tinta}"
    textColor: "{colors.superficie}"
    typography: "{typography.cuerpo}"
    rounded: "{rounded.lg}"
    padding: "12px 6px 12px 16px"
  dialog:
    backgroundColor: "{colors.superficie}"
    rounded: "{rounded.xl}"
    padding: "20px"
---

# Design System: TDS Ganadería

> **Procedencia.** Este sistema se documentó a partir del código ya construido. Es una "evolución profunda", aprobada por el dueño, del mundo visual que ya tenía la app, y se hizo directamente en el código: **no hubo tirada de conceptos ni seed** (`<!-- SEED -->`). Las revisiones futuras no deben buscar una referencia seed; la autoridad es el código citado abajo (`src/components/ui.tsx`, `src/components/Dialogos.tsx`, `src/app/globals.css`, `tailwind.config.ts`).

## Overview

**Creative North Star: "La libreta del corral"**

TDS Ganadería se ve como una libreta de campo bien llevada: hojas blancas sobre una mesa de piedra clara, un solo verde de finca para lo que se toca y lo que está listo, y un puñado de colores que significan siempre lo mismo. Está pensada para usarse de pie, con una mano, al sol o al amanecer en el ordeño. Por eso la densidad es media: filas de 56 a 60 px, áreas táctiles de 44 px como mínimo y texto de 14 px con cifras de ancho fijo para que los conteos, kilos y litros no "bailen".

La profundidad es discreta y funcional. Las superficies en reposo llevan una sombra suave tintada de piedra y un filo de 1 px casi invisible; las barras de navegación se separan con una línea de 1 px y fondo translúcido; solo lo que de verdad flota encima de la página (la hoja "Más", el diálogo de confirmación y el aviso flotante) lleva una sombra larga. El movimiento sigue la misma lógica: una sola escala de duraciones, curvas suaves de salida, y cerrar siempre es más rápido que abrir. Todo tiene su versión con movimiento reducido.

El sistema existe en claro y en oscuro (clase `dark` en `<html>`). En oscuro, las hojas pasan a piedra muy oscura, pierden la sombra y conservan solo el filo claro translúcido. Al imprimir, todo vuelve a claro.

**Key Characteristics:**
- Un solo acento de marca (verde finca) para acciones, lo activo y "listo"; el resto es piedra.
- El color tiene un solo significado en toda la app (verde, azul, ámbar, rojo, neutro).
- Una superficie, muchas filas: las listas van en un bloque con divisores finos, no en tarjetas sueltas.
- Táctil primero: 44 px mínimos, barra inferior al alcance del pulgar con botón central de agregar.
- Cifras tabulares en todo el documento; títulos equilibrados (`text-wrap: balance`).
- Movimiento corto, con salida más rápida que la entrada y guarda de movimiento reducido.

## Colors

Un verde de finca, apagado y terroso, sobre neutros cálidos de piedra (Tailwind `stone`), más tres tonos semánticos y el neutro, que nunca se usan como decoración.

### Primary
- **Verde Finca** (marca-verde, `marca-600`): botón principal, botón central de agregar, pastilla de la pestaña activa, contorno de foco del teclado, `accent-color` de los controles nativos y cursor de texto. También es el color de la barra del sistema en claro (`themeColor`).
- **Verde Hondo** (marca-hondo, `marca-700`): hover del botón principal, texto de enlaces y acciones discretas de marca ("Calendario", "Todos los animales", "Cancelar"), icono de la sección activa.
- **Verde Tierra** (marca-tierra, `marca-800`): estado presionado del botón principal; texto de las insignias verdes y de la pestaña activa de la barra inferior.
- **Verde Brote** (marca-brote, `marca-500`): borde del campo enfocado (con anillo de 3 px al 20 %), punto de las insignias verdes, anillo de la opción elegida.
- **Verde Claro** (marca-claro, `marca-400`): en oscuro sustituye al hondo para enlaces, foco y cursor.
- **Niebla Verde** (marca-niebla, `marca-100`) y **Rocío** (marca-rocio, `marca-50`): fondos de lo activo en la navegación, de las insignias y avisos verdes, y de la opción de radio elegida.

La escala completa `marca-50…950` vive en `tailwind.config.ts`; en oscuro los fondos verdes usan `marca-950` y los textos `marca-300`/`marca-400`.

### Secondary
Tonos semánticos. Cada uno tiene fondo claro (`-50`), texto oscuro (`-700`/`-800`), anillo (`-200`) y punto (`-500`); en oscuro, fondo `-950` y texto `-300`. Los recuadros de icono de los conteos (`ACENTO`) usan el fondo `-100` y texto `-700`.
- **Azul Ordeño** (tono-azul, `sky-800` sobre `sky-50`): en curso / informativo. Vacas en ordeño, registros por enviar, avisos informativos.
- **Ámbar Atención** (tono-ambar, `amber-800` sobre `amber-50`): se acerca, hay que atender. Secado próximo, por parir, sin señal.
- **Rojo Vencido** (tono-rojo, `red-700` sobre `red-50`; peligro `red-600` en botones llenos): vencido, problema o borrar. Parto atrasado, animal muerto, errores, acciones destructivas.

### Neutral
- **Hoja** (superficie, blanco): tarjetas, tablas, barras superior e inferior (al 95 % con desenfoque), hojas y diálogos.
- **Piedra Clara** (piedra-fondo, `stone-100`): fondo de la página, divisores finos dentro de las superficies, recuadros de icono neutros, insignia neutra.
- **Piedra Borde** (piedra-borde, `stone-300`): borde de los campos y anillo del botón secundario y de las opciones.
- **Piedra Mínimo** (piedra-minimo, `stone-500`): el texto secundario más claro permitido en modo claro (fechas, notas, conteos, placeholders).
- **Piedra Secundario** (piedra-secundario, `stone-600`): subtítulos, etiquetas de módulo, botones discretos, pestañas inactivas.
- **Piedra Etiqueta** (piedra-etiqueta, `stone-700`): etiquetas de campo, botón secundario, insignia neutra, opciones de radio.
- **Piedra Texto** (piedra-texto, `stone-800`): texto del cuerpo.
- **Piedra Tinta** (piedra-tinta, `stone-900`): títulos y nombres; en oscuro, la superficie de las hojas; fondo del aviso flotante en claro.
- **Piedra Noche** (piedra-noche, `stone-950`): fondo de la página en oscuro.

### Named Rules
**La regla de un solo significado.** Cada tono significa una sola cosa en toda la app: verde = listo/activo/bien, azul = en curso, ámbar = se acerca, rojo = vencido/problema/borrar, neutro = dato sin urgencia. Los estados reproductivos se colorean siempre con la misma tabla (`TONO_REPRO`: ordeño azul, secado neutro, por parir ámbar, lista para montar verde) en listas, ficha, lechería e inicio.

**La regla del dato neutro.** Sexo, módulo, raza, etapa de engorde y categoría son datos, no estados: van en neutro y se distinguen con icono dibujado y texto. Los recuadros de icono de los módulos en Inicio son piedra, no verde.

**La regla del color que no va solo.** Ningún estado se comunica solo con color: las insignias llevan punto y texto; los avisos llevan icono (check, alerta, info) y `role="alert"`/`"status"`.

**La regla del contraste mínimo.** El texto secundario nunca es más claro que `stone-500` en claro ni que `stone-400` en oscuro. Los tonos más tenues quedan solo para iconos decorativos (flechas de fila, marcador sin foto).

## Typography

**Display Font:** pila del sistema (Tailwind `sans` por defecto: `ui-sans-serif, system-ui, sans-serif`, más las fuentes de emoji)
**Body Font:** la misma pila del sistema
**Label/Mono Font:** no hay fuente mono distinta

**Character:** una sola familia, la del teléfono, en pesos 400 a 700. La jerarquía se hace con tamaño y peso, no con contraste de familias. Es el estado actual del código: no se carga ninguna fuente web.

### Hierarchy
- **Título de página** (700, 24 px / 32 px; desde `sm` 28 px / 36 px; tracking −0.025em): el `h1` de `PageHeader`, uno por pantalla, con subtítulo de 14 px en piedra secundario debajo.
- **Cifra** (700, 24 px, interlineado 1, tracking −0.025em): los conteos de módulos y totales; en los desgloses baja a 20 px.
- **Título de sección** (600, 16 px / 24 px): el `h2` de `SectionTitle` dentro de una tarjeta, con el conteo opcional a su lado en 14 px / 500 en piedra mínimo. Títulos de hojas y diálogos usan el mismo estilo.
- **Nombre de fila** (600, 16 px): nombre o arete del animal en listas y pendientes; el arete secundario va al lado en 400 y piedra mínimo.
- **Cuerpo** (400, 14 px / 20 px): casi todo el texto, botones (500), campos y tablas. Párrafos con `text-wrap: pretty` y ancho `max-w-prose`/`max-w-md`.
- **Etiqueta** (500, 12 px / 16 px): insignias, cabeceras de tabla, encabezados de grupo del menú lateral, notas al pie de tarjeta.
- **Etiqueta de navegación** (500, 11 px): texto bajo los iconos de la barra inferior y de las pestañas de la ficha en móvil.

### Named Rules
**La regla de las cifras quietas.** `font-variant-numeric: tabular-nums` está en `body`: todos los números de la app tienen el mismo ancho. No se quita en ningún componente.

**La regla del caso normal.** Títulos de página, de sección, de grupo y botones van en mayúscula inicial normal, nunca en versalitas ni todo en mayúsculas con espaciado.

**La regla de los 16 px en el campo.** En pantallas de hasta 640 px, `input`, `select` y `textarea` van a 16 px para que iOS no haga zoom; en escritorio vuelven a 14 px.

## Layout

Mobile-first con tres puntos de cambio de Tailwind: `sm` 640 px (tabla en vez de lista, filas en vez de columnas centradas), `md` 768 px (columnas extra de tabla) y `lg` 1024 px (aparece la barra lateral fija de 240 px y desaparecen la barra superior y la inferior).

- **Contenedor:** `main` centrado con ancho máximo de 72 rem (`max-w-6xl`) y márgenes laterales de 16 / 24 / 32 px (móvil / `sm` / `lg`). En móvil deja 96 px abajo más la zona segura para la barra inferior. Las barras respetan `env(safe-area-inset-*)`.
- **Ritmo:** base de 4 px. Dentro de una tarjeta: relleno de 16 px (20 px desde `sm`), 12 px bajo el título de sección, 12 px de relleno vertical por fila de pendientes. Entre bloques de página: 20 px (24 px en `lg`). Encabezado de página con 20 px debajo (24 px desde `sm`).
- **Inicio:** en móvil, el bloque de módulos (tres columnas compactas) arriba y los pendientes debajo, a la vista sin desplazar; en `lg`, rejilla `1fr + 19rem` con los pendientes a la izquierda y los módulos en columna a la derecha.
- **Listas:** en móvil, una sola superficie con filas-enlace de 60 px separadas por divisores de 1 px; desde `sm`, la misma superficie contiene una tabla con cabecera en `stone-50`.
- **Barras pegadas:** la barra superior móvil mide 56 px; la barra de pestañas de la ficha se pega bajo ella (y arriba del todo en `lg`).
- La barra inferior se esconde (`translate-y-full`) mientras hay un campo enfocado, para no tapar el teclado de Android.

### Named Rules
**Una superficie, muchas filas.** Una lista, un desglose o un grupo de conteos es UNA superficie dividida en filas o columnas por líneas de 1 px (`stone-100` / `stone-800`), no una tarjeta por elemento ni tarjetas dentro de tarjetas. Dentro de un formulario, los grupos de campos usan un recuadro tonal hundido (`stone-50` con filo de 6 %), no otra tarjeta con sombra.

**La regla del pulgar.** Lo diario está abajo en móvil: Inicio, Engorde, Agregar (centro), Lechería y Más. Lo que no cabe vive en la hoja "Más".

## Elevation & Depth

Híbrido: sombras suaves tintadas de piedra (`rgb(28 25 23)`) más un filo de 1 px. En claro, toda superficie en reposo combina la sombra de reposo con un anillo de `stone-900` al 6 %; en oscuro, la sombra se quita y queda solo un anillo blanco al 8 % sobre `stone-900`. Las barras de navegación (superior, inferior, lateral y de pestañas en móvil) no usan sombra difusa sino una línea de 1 px hecha con sombra (`0 1px 0` al 7 %, blanca al 7 % en oscuro) y fondo al 95 % con desenfoque.

### Shadow Vocabulary
- **Reposo** (`box-shadow: 0 1px 2px 0 rgb(28 25 23 / 0.05), 0 2px 8px -2px rgb(28 25 23 / 0.07)`): tarjetas, filas-tarjeta, tablas, botón secundario, barra de pestañas desde `sm`.
- **Flotante** (`box-shadow: 0 -1px 0 0 rgb(28 25 23 / 0.04), 0 12px 32px -8px rgb(28 25 23 / 0.28)`): hoja "Más", diálogo de confirmación, aviso flotante.
- **Botón** (`box-shadow: 0 1px 2px 0 rgb(28 25 23 / 0.12), inset 0 1px 0 0 rgb(255 255 255 / 0.12)`): relieve mínimo de los botones llenos (primario, peligro) y de la pastilla de pestaña activa.
- **Botón central** (`box-shadow: 0 6px 16px -4px rgb(39 63 34 / 0.55)`): solo el botón redondo de agregar de la barra inferior, tintado de verde y con un anillo de 4 px del color del fondo que lo recorta de la barra.

### Named Rules
**La regla de lo que flota.** La sombra flotante es solo para lo que va encima de la página (hojas, diálogos, avisos). Nada en el flujo normal ni las barras fijas la usan.

**La regla del oscuro plano.** En oscuro no hay sombras de reposo: la separación la da el filo claro translúcido y el salto de `stone-950` a `stone-900`.

## Shapes

Esquinas generosas y consistentes, sin bordes gruesos.
- **12 px** (`rounded-xl`): botones, campos, opciones de radio, avisos en línea, pestañas, ítems de navegación, recuadros de icono de 40 px, miniaturas de foto de 44 px.
- **16 px** (`rounded-2xl`): tarjetas y superficies, ítems de la hoja "Más", el aviso flotante, el recuadro del estado vacío, grupos de formulario, barra de pestañas desde `sm`.
- **24 px** (`rounded-3xl`): diálogos y la parte superior de la hoja "Más".
- **8 px** (`rounded-lg`): recuadros de icono de 36 px en desgloses y miniaturas de la tabla.
- **Píldora** (`rounded-full`): insignias, el indicador activo de la barra inferior (56 × 28 px), el botón central de agregar, el asa de la hoja y los avatares de logo.
- Los bordes se hacen con anillos de 1 px (`ring`, a menudo `inset`), no con `border`, salvo en campos de formulario y divisores. Las fotos llevan un contorno interior de 1 px negro al 10 % (blanco al 10 % en oscuro).

## Components

### Buttons
Firmes y táctiles: responden al toque encogiéndose a 0.96 en 150 ms (salvo con movimiento reducido).
- **Shape:** esquina de 12 px; alto mínimo 44 px en móvil y 40 px desde `sm`; relleno lateral 16 px; texto 14 px / 500; icono a 18 px con 8 px de separación. Tamaño `sm`: 36 px de alto, 12 px de relleno.
- **Primary:** fondo Verde Finca, texto blanco, sombra de botón; hover Verde Hondo, presionado Verde Tierra.
- **Secundario:** fondo blanco, texto piedra etiqueta, anillo interior `stone-300` y sombra de reposo; hover `stone-50`. En oscuro, `stone-800` con anillo `stone-700` y sin sombra.
- **Peligro:** fondo `red-600`, texto blanco (hover `red-700`). **Peligro suave:** blanco con texto `red-700` y anillo `red-200`.
- **Discreto / Marca discreto / Peligro discreto:** sin fondo; texto piedra secundario, Verde Hondo o `red-700`, con fondo tenue del mismo tono al pasar o tocar. No se suman clases `text-*` a "discreto": para otro color se usa la variante propia.
- **Solo icono:** 44 × 44 px, variante discreta por defecto, siempre con `aria-label`.
- **Carga:** `BotonEnviar` muestra un spinner de borde y "Guardando…", con `aria-busy`; deshabilitado al 55 % de opacidad.
- **Foco:** contorno de 2 px Verde Finca separado 2 px (Verde Claro en oscuro), solo con teclado (`:focus-visible`).

### Chips
- **Insignias (`Badge`):** píldora, 12 px / 500, relleno 2 × 10 px, anillo interior de 1 px del tono; punto opcional de 6 px. Neutra: `stone-100` con texto piedra etiqueta. Los estados de animal solo se marcan cuando no son "activo".
- **Opciones de radio (pastilla):** 44 px, esquina de 12 px, blanco con anillo `stone-300`; elegida, fondo Rocío, texto `marca-900` y anillo Verde Brote. El círculo nativo queda dentro, teñido por `accent-color`.

### Cards / Containers
- **Corner Style:** 16 px.
- **Background:** blanco (`stone-900` en oscuro).
- **Shadow Strategy:** sombra de reposo + filo de 6 % (ver Elevation & Depth).
- **Border:** ninguno; solo el anillo de 1 px.
- **Internal Padding:** 16 px, 20 px desde `sm`. Las superficies con filas internas usan `overflow-hidden` y relleno por fila (12–16 px).
- **Estado vacío (`Vacio`):** centrado, recuadro de icono de 48 px en piedra, mensaje de 14 px y, si hay, un botón principal.

### Inputs / Fields
- **Style:** borde de 1 px `stone-300`, fondo blanco, esquina de 12 px, alto 44 px (40 px desde `sm`), relleno 8 × 12 px, sombra interior muy leve; placeholder `stone-500`. En oscuro, `stone-800` con borde `stone-700`.
- **Focus:** borde Verde Brote y anillo de 3 px Verde Brote al 20 %; sin contorno del navegador.
- **Hover / Disabled:** hover borde `stone-400`; deshabilitado fondo `stone-100` y texto `stone-500`.
- **Etiqueta:** 14 px / 500 piedra etiqueta, campo 4 px debajo.
- **Fecha:** el icono de calendario se tiñe de verde de marca y tiene área de toque propia.

### Avisos
- **En línea (`AvisoError` / `AvisoExito` / `AvisoInfo`):** esquina de 12 px, relleno 10 × 12 px, fondo `-50` del tono, texto `-800`/`-900`, anillo `-200`, icono de 18 px.
- **Flotante (`avisar()`):** caja invertida (piedra tinta con texto blanco en claro; `stone-100` con texto oscuro en oscuro), esquina de 16 px, sombra flotante, máximo 448 px, encima de la barra inferior; el icono lleva el tono (rojo, verde, azul). Se cierra solo: 7 s el error, 3.5 s el éxito, 5 s la información.
- **Diálogo de confirmación (`confirmar()`):** hoja blanca de esquina 24 px, máximo 448 px, abajo en móvil y centrada desde `sm`; recuadro redondo de icono verde (o rojo si es peligro); "Cancelar" primero en el DOM y con el foco; en móvil los botones se apilan con la acción arriba. Fondo `stone-950` al 50 %.

### Navigation
- **Barra superior (móvil):** 56 px, blanca al 95 % con desenfoque y línea inferior; logo redondo de 32 px, "Tierra de Sueños" en 15 px / 700 con "Ganadería" en Verde Hondo; a la derecha, lupa (abre la búsqueda a pantalla completa) y cambio de tema.
- **Barra inferior (móvil):** cinco posiciones; cada pestaña es una columna de 56 px con icono de 22 px dentro de una píldora de 56 × 28 px y etiqueta de 11 px. Activa: píldora Niebla Verde y texto Verde Tierra. En el centro, el botón redondo de agregar de 56 px, levantado 20 px.
- **Hoja "Más":** sube desde abajo, esquina superior de 24 px, asa de 40 × 4 px; ítems de 48 px en 16 px / 500 con recuadro de icono de 36 px y flecha; "Cerrar sesión" al final en rojo.
- **Barra lateral (`lg`):** 240 px, blanca con línea derecha de 1 px; logo, búsqueda, y grupos "Ganado", "Consultas", "Datos" con encabezado de 12 px / 500 en piedra mínimo. Ítems de 14 px / 500, esquina de 12 px; activo con fondo Niebla Verde al 80 %, texto `marca-900` e icono Verde Hondo.
- Todos los ítems activos llevan `aria-current="page"`.

### Pestañas de la ficha
Barra pegajosa con hasta cinco pestañas (Info, Registrar, Historial, Peso/Leche, Árbol). Una sola pastilla Verde Finca con sombra de botón se desliza bajo la pestaña activa (posición y ancho medidos por JS, transición CSS de 250 ms); la primera colocación y los cambios de tamaño no se animan. En móvil, icono sobre etiqueta de 11 px a lo ancho; desde `sm`, fila con icono de 16 px y texto de 14 px dentro de una superficie de 16 px de esquina. Teclado con flechas, Inicio y Fin. El panel nuevo aparece con un fundido de 4 px.

### Movimiento
Una sola escala de tokens en `:root` (ver sidecar): 150 ms para cerrar, 250 ms para abrir y para las pestañas, 350 ms para la llegada del aviso; curva `cubic-bezier(0.22, 1, 0.36, 1)`. El estado lo pone `usePresencia` con `data-estado="abierto"`; las clases `.t-fondo`, `.t-hoja`, `.t-modal`, `.t-pantalla`, `.t-toast`, `.t-tabs-pill` y `.t-aparecer` hacen la transición. Todo panel modal usa `useModalAccesible`: foco atrapado, Escape cierra (solo el de arriba de la pila), scroll del fondo bloqueado y foco devuelto al abridor.

## Do's and Don'ts

### Do:
- **Do** usar `claseSuperficie` / `Card` para toda superficie, y `claseBoton(variante)` / `claseBotonIcono` para todo botón o enlace con forma de botón.
- **Do** colorear estados con `Badge tono=…` y `TONO_REPRO`, siempre con punto o icono además del color.
- **Do** mantener 44 px de área táctil mínima en móvil (botones, filas, campos, opciones, enlace "Volver").
- **Do** agrupar listas y conteos en una sola superficie con divisores de 1 px `stone-100` (`stone-800` en oscuro).
- **Do** usar `confirmar()` y `avisar()` de `Dialogos.tsx` para preguntas y avisos.
- **Do** dar a cada nueva transición de superficie su clase `.t-*` con `data-estado`, los tokens `--duration-*`/`--ease-smooth-out`, una salida más rápida que la entrada y su guarda de `prefers-reduced-motion`.
- **Do** escribir cada clase de modo oscuro junto a la de claro (superficie `stone-900`, sin sombra, filo blanco al 8 %).
- **Do** marcar con `no-print` la navegación y las acciones, y comprobar que la vista imprime en claro.

### Don't:
- **Don't** usar `window.confirm()` ni `window.alert()`: dentro del APK salen sin marca y sin modo oscuro.
- **Don't** dar color a sexo, módulo, raza, etapa o categoría; van en neutro con icono y texto.
- **Don't** usar un tono semántico para decorar ni con un significado distinto al de la tabla de tonos.
- **Don't** usar texto secundario más claro que `stone-500` en claro o `stone-400` en oscuro.
- **Don't** poner tarjetas con sombra dentro de otras tarjetas, ni una tarjeta por fila en listas.
- **Don't** usar la sombra flotante en elementos del flujo normal de la página ni en las barras fijas.
- **Don't** poner títulos, encabezados de grupo ni botones en mayúsculas con espaciado.
- **Don't** usar caracteres como iconos (♂, ♀, ✓, ×): los iconos son SVG dibujados de `src/components/iconos`.
