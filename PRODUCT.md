# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

(Web mobile-first. En Android se instala como APK de Capacitor que abre la misma web; en iPhone,
"Agregar a pantalla de inicio". El contenedor nativo no cambia el lenguaje de diseño: sigue siendo web.)

## Users

Una familia que maneja el ganado de la Finca Tierra de Sueños. La usan **sobre todo desde el
celular, en el campo**: de pie, a veces con una mano, con sol directo o al amanecer en el ordeño,
y a veces sin señal. La fuente de verdad del negocio es el papá del dueño del proyecto, que es
quien conoce el manejo real del ganado. Todos entran con una contraseña compartida.

## Product Purpose

Registro digital del ganado que conserva el **historial completo** de cada animal (genealogía,
reproducción, crecimiento, producción de leche y estado actual), no solo el estado de hoy. El
éxito es poder responder en cualquier momento: qué animales hay, quiénes son sus padres e hijos,
qué toro montó a qué vaca y cuándo parió, cuánto pesa y cuánta leche da, en qué etapa está y qué
animales necesitan atención pronto.

## Positioning

Se adapta al manejo real de este ganado, no al revés: tres módulos fijos (Engorde, Lechería,
Reproductores) donde cada animal pertenece a uno solo, el estado reproductivo de las vacas se
deriva del ciclo (montas, partos, 40 días para quedar lista para montar) y la etapa de engorde se
calcula por la edad. Cuando una suposición común de ganadería contradice lo especificado por la
familia, prevalece lo especificado.

## Operating Context

- Registro rápido en el corral: ordeños (mañana/tarde), pesos, montas e inseminaciones,
  palpaciones, partos con sus crías, cambios de etapa.
- Revisión diaria de "pendientes del mes" (secados, partos por venir, vacas listas para montar).
- Consulta de la ficha de un animal: datos, familia, árbol genealógico, historial y gráficas.
- Modo sin conexión: se ven las páginas ya visitadas y los registros quedan en cola hasta volver
  la señal.
- La ficha se imprime o se guarda en PDF; los datos se exportan a CSV y se respaldan en JSON.

## Capabilities and Constraints

- Next.js 15 (App Router) + React 19 + Tailwind 3 + Recharts 2.15.4. No agregar dependencias sin
  aprobación del dueño.
- Interfaz en español. Fechas en UTC (`formatearFecha`).
- Reparto: Kiro lleva el frontend y Claude Code el backend; los cambios de un área en la otra se
  avisan en `docs/12-pedidos-backend.md`.
- Regla de oro: no inventar reglas de negocio; lo no definido se registra en
  `docs/07-preguntas-pendientes.md`.
- La base de `.env` es la de producción: probar sin escribir datos.

## Brand Commitments

- Nombre: "TDS Ganadería · Finca Tierra de Sueños".
- Logo de la finca (`public/logo.png`), icono de la app (`public/iconos/`), fotos de fondo de la
  finca (`public/FondoTDS2.jpeg`, `public/fondoTDS.jpg`).
- Verde de marca `marca-*` (`tailwind.config.ts`, base `#4b7a3f`) y modo claro/oscuro.
- Voz: español sencillo y directo, con el vocabulario de la finca (arete, SENASA, pajilla, ordeño,
  secado, destete…).

## Evidence on Hand

Datos reales de la finca en la base de producción; documentación de negocio en `docs/`. No hay
testimonios, métricas ni contenido de marketing: no inventarlos.

## Product Principles

1. El campo manda: lo que se hace a diario se resuelve en pocos toques, con una mano y al sol.
2. El historial es el producto: nada se pierde; lo derivado (estado, etapa) siempre se explica.
3. No inventar: lo que el negocio no definió se muestra como pendiente, no se asume.
4. Funciona sin señal: cada acción dice si quedó guardada o en cola.

## Accessibility & Inclusion

Contraste WCAG AA (texto secundario `stone-500` en claro y `stone-400` en oscuro como mínimo),
áreas táctiles de 44 px, inputs de 16 px en móvil (sin zoom de iOS), `prefers-reduced-motion`,
navegación por teclado en escritorio.
