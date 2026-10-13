# TDS Ganadería — Cómo funciona todo el proyecto

Aplicación web para gestionar el ganado de la **Finca Tierra de Sueños**: animales, genealogía, peso, leche, montas, partos y etapas. Pensada para usarse sobre todo **desde el celular, en el campo**, por una familia. Interfaz en español.

---

## 1. En una frase

Es una **página web** (no una app de celular que se instala) que corre en internet, guarda los datos en una **base de datos en la nube** y se ve bien en el teléfono. Entras con una contraseña y registras tu ganado organizado en tres módulos: **Engorde, Lechería y Reproductores**.

---

## 2. El lenguaje y por qué

Todo está escrito en **TypeScript**, que es **JavaScript con "tipos"**. JavaScript es el lenguaje que entienden los navegadores; TypeScript le añade una red de seguridad: avisa de errores *antes* de publicar (por ejemplo, si intentas usar un dato que no existe). Por eso en cada cambio corremos `tsc` (el verificador de tipos): si pasa, hay menos sorpresas en producción.

El mismo lenguaje se usa tanto en lo que ve el usuario (navegador) como en el servidor. Eso simplifica: un solo lenguaje para todo.

---

## 3. Las tecnologías principales (qué hace cada una y por qué)

| Tecnología | Qué es | Para qué se usa aquí | Por qué se eligió |
|---|---|---|---|
| **Next.js 15** | El "framework" (el esqueleto) de la app, basado en React | Define las páginas, las rutas (`/engorde`, `/lecheria`…), la API y el renderizado | Hace casi todo: páginas + servidor + API en un solo proyecto. Se despliega fácil en Vercel |
| **React 19** | Librería para construir interfaces | Todo lo visual: botones, formularios, listas, fichas | Es el estándar de la industria; permite componentes reutilizables |
| **TypeScript** | JavaScript con tipos | Todo el código | Detecta errores antes de publicar |
| **Tailwind CSS 3** | Sistema de estilos por "clases" | Todo el diseño visual (colores, espaciados, modo oscuro) | Rápido de escribir y mantener; coherencia visual |
| **Prisma** | "ORM": traductor entre el código y la base de datos | Leer y guardar animales, montas, leche, etc. sin escribir SQL a mano | Seguro y cómodo; el modelo de datos queda en un solo archivo |
| **PostgreSQL (en Supabase)** | La base de datos | Guarda TODA la información de forma permanente | Base profesional, en la nube, con copias de seguridad |
| **Recharts** | Librería de gráficas | Las gráficas de peso y de leche | Integra bien con React |
| **sharp** | Procesador de imágenes | Redimensionar y limpiar las fotos de los animales en el servidor | Rápido y quita metadatos (privacidad) |
| **Vercel** | El hosting (dónde vive la web) | Publica la app en internet | Hecho por los creadores de Next.js; despliega solo con cada cambio en Git |

---

## 4. Cómo encaja todo (el flujo completo)

Cuando abres la app en el celular pasa esto:

1. **El navegador** pide una página a **Vercel** (el servidor).
2. **Next.js** arma esa página en el servidor. Si la página necesita datos (por ejemplo, la lista de animales de engorde), usa **Prisma** para preguntarle a la base de datos **PostgreSQL** en **Supabase**.
3. La base responde, Next.js arma el HTML ya con los datos y te lo manda. Por eso la primera vista aparece "llena", sin pantallas en blanco.
4. Lo interactivo (abrir un formulario, cambiar de pestaña, registrar un ordeño) lo maneja **React** en tu navegador. Cuando guardas algo, el navegador llama a la **API** de la propia app, que valida y guarda con Prisma.

En resumen: **navegador (React) ⇄ servidor (Next.js + API) ⇄ Prisma ⇄ base de datos (Supabase)**.

---

## 5. Estructura del proyecto (las carpetas)

```
AppGanado/
├─ prisma/
│  └─ schema.prisma        → el "molde" de la base de datos (qué se guarda)
├─ src/
│  ├─ app/                 → las PÁGINAS y la API (Next.js App Router)
│  │  ├─ page.tsx          → Inicio
│  │  ├─ engorde/          → módulo Engorde (+ /bajas)
│  │  ├─ lecheria/         → módulo Lechería (+ /bajas)
│  │  ├─ reproductores/    → módulo Reproductores (+ /bajas)
│  │  ├─ leche/            → gráfica de producción del hato
│  │  ├─ animales/         → lista, alta, edición y FICHA de cada animal
│  │  ├─ calendario/       → eventos del ciclo por mes
│  │  ├─ respaldo/         → exportar/importar todos los datos
│  │  ├─ login/            → entrada con contraseña
│  │  └─ api/              → el "backend": endpoints que leen/guardan datos
│  ├─ components/          → piezas visuales reutilizables (botones, gráficas, menú…)
│  ├─ lib/                 → la LÓGICA del negocio (fechas, estados, cálculos)
│  └─ middleware.ts        → el "portero": seguridad en cada petición
├─ scripts/                → utilidades (sembrar datos de prueba, cambiar clave…)
├─ docs/                   → documentación del proyecto y reglas de negocio
└─ public/                 → imágenes fijas (logo, favicon)
```

La idea clave: **`app/` = páginas y API**, **`components/` = piezas visuales**, **`lib/` = reglas y cálculos**, **`prisma/` = cómo se guardan los datos**.

---

## 6. La base de datos (qué se guarda)

Definida en `prisma/schema.prisma`. Las "tablas" principales:

- **Animal**: el registro central. Guarda arete (único), nombre, sexo, raza, fecha de nacimiento, foto, estado (activo/vendido/muerto), **módulo** (engorde/lechería/reproductor), **código** (para reproductores), y quiénes son su padre y su madre (pueden ser de la finca o "externos" escritos a mano).
- **Monta**: una cubrición de una vaca por un toro. Guarda fecha, si fue por **inseminación (pajilla)** y si se confirmó la preñez.
- **Parto**: un nacimiento. Puede producir varias crías; guarda si la cría nació sana, si necesitó ayuda y el peso al nacer.
- **Cría**: enlaza un parto con cada animal-cría que nació de él.
- **RegistroLeche**: **un ordeño** (mañana o tarde). Guarda fecha, turno y litros. El total del día = suma de sus ordeños.
- **RegistroPeso**: un pesaje (fecha + kilos).
- **EtapaTernero**: la etapa de engorde de un animal (lactancia → desarrollo → engorde), con fecha de inicio y fin.
- **IntentoLogin**: controla intentos fallidos de contraseña (seguridad).

Un principio importante del proyecto: **no se inventan reglas de negocio**. Lo que no está confirmado por el dueño se marca como pendiente, no se asume.

---

## 7. Los tres módulos (el corazón de la app)

Cada animal pertenece a **un módulo y no se mueve** entre ellos:

- **Engorde**: todas las crías de la finca (para carne), sin importar el sexo. Se les lleva **peso** y **etapa**.
- **Lechería**: las vacas de leche (se compran, no nacen en la finca). Se les registran **montas, partos y leche**, y la app deriva su **estado reproductivo** (en ordeño, secado, por parir, posparto, lista para montar).
- **Reproductores**: el toro de la finca y las pajillas (semen) externas. Tienen un **código**.

El **Inicio** muestra el total global y cuántos hay en cada módulo, más los pendientes del mes.

---

## 8. La lógica del negocio (`src/lib/`)

Aquí vive el "cerebro", separado de lo visual:

- **`fechas.ts`**: cálculos de fechas (edad, formateo, sumar meses/días) y las constantes del ciclo (embarazo ~9 meses, ordeño ~7, posparto ~40 días). Incluye `hoyLocalISO()` para usar el día local y evitar desfases de zona horaria.
- **`estado.ts`**: deriva el **estado reproductivo** de una vaca a partir de sus montas y partos, y la **etapa actual** de un animal de engorde. "Derivado" = no se guarda, se calcula al momento.
- **`alertas.ts`**: calcula los **pendientes** (qué atender) y los eventos del **calendario** a partir del ciclo de cada vaca.
- **`genealogia.ts`**: arma padres, abuelos, hijos, hermanos y el árbol genealógico. Lee la parentela **una sola vez** y la recorre en memoria (rápido).
- **`leche.ts`**: agrupa los ordeños **por día** y calcula la producción por vaca y del hato (por semana o mes).
- **`modulos.ts`**: cuenta animales por módulo y arma los desgloses (por etapa / por estado reproductivo).
- **`tipos.ts`** y **`validar.ts`**: etiquetas en español y validación de todo lo que llega del navegador antes de tocar la base.

---

## 9. La API (`src/app/api/`) — el backend

Son los "endpoints" que el navegador llama para leer o guardar. Cada uno valida los datos y responde errores claros en español. Ejemplos: `/api/animales`, `/api/montas`, `/api/leche`, `/api/pesos`, `/api/partos`, `/api/etapas`, `/api/respaldo`, `/api/sesion`.

Regla de seguridad: toda petición que **modifica** datos debe venir de la propia app (protección contra CSRF), y casi todo requiere **sesión** iniciada.

---

## 10. Seguridad (`middleware.ts` + login)

- Un **"portero" (middleware)** se ejecuta en cada petición: si no hay sesión válida, te manda al login; si una petición que cambia datos no viene de la propia app, la rechaza.
- La **sesión** es una cookie `HttpOnly` (el navegador la guarda pero el código no la puede leer, más seguro).
- La **contraseña** es compartida y se guarda **cifrada** (hash scrypt), nunca en texto plano.
- Hay control de **intentos fallidos** para frenar ataques de adivinar la clave.

---

## 11. Diseño mobile-first

Está pensado **primero para el teléfono** (390 px de ancho) y luego se amplía para pantallas grandes:
- En móvil hay una **barra inferior** al alcance del pulgar; en escritorio, un menú lateral.
- Áreas táctiles grandes (mínimo ~44 px), campos que no provocan zoom en iPhone, modo oscuro en toda la app.
- Las gráficas y tablas se adaptan al ancho del teléfono.

---

## 12. Cómo se publica (despliegue)

- El código vive en **GitHub**. Cada vez que se sube un cambio (commit + push), **Vercel** reconstruye y publica la app sola.
- Los datos viven aparte, en **Supabase**, así que un nuevo despliegue no borra información.
- Para desarrollo local hay comandos (`npm run dev`), pero la versión "de verdad" es la de Vercel.

---

## 13. Reparto del trabajo (cómo se construyó)

Dos asistentes trabajan sobre el mismo proyecto, con fronteras claras:
- **Kiro**: el **frontend** — páginas, componentes, estilos, gráficas, lógica de presentación.
- **Claude Code**: el **backend** — modelo de datos, API, seguridad, scripts.

Cuando el frontend necesita algo del backend, se anota en `docs/12-pedidos-backend.md` en vez de implementarlo a ciegas. Así los cambios quedan coordinados y documentados.

---

## 14. Resumen para recordar

- **Lenguaje**: TypeScript (JavaScript con tipos), en navegador y servidor.
- **Framework**: Next.js 15 (React 19) → páginas + API en un solo lugar.
- **Datos**: Prisma habla con PostgreSQL en Supabase.
- **Estilos**: Tailwind CSS, mobile-first y modo oscuro.
- **Gráficas**: Recharts. **Fotos**: sharp.
- **Hosting**: Vercel (publica solo con cada cambio en GitHub).
- **Organización**: tres módulos (Engorde, Lechería, Reproductores), lógica de negocio aislada en `src/lib`, seguridad por middleware + login con contraseña cifrada.
- **Filosofía**: no inventar reglas de negocio; lo no confirmado se deja pendiente.
