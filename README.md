# Finca Tierra de Sueños · Ganadería (TDS Ganadería)

Aplicación web para llevar el registro del ganado de la finca: animales, su familia, su
peso, la producción de leche y los eventos importantes (montas, inseminaciones, partos y
etapas de crecimiento). Pensada para el día a día, sobre todo desde el celular.

## ¿Qué permite hacer?

El ganado está organizado en **tres módulos**. Cada animal pertenece a uno solo y no se mueve
entre ellos:

| Módulo | Qué contiene | Qué se registra |
| --- | --- | --- |
| **Engorde** | Todas las crías nacidas en la finca (machos y hembras), para carne | Peso (con gráfica) y etapa: lactancia → desarrollo → engorde |
| **Lechería** | Vacas de leche (se compran, no nacen en la finca) | Leche, montas/inseminaciones y partos |
| **Reproductores** | El toro de la finca y las pajillas externas (con código) | Montas e inseminaciones |

- **Inicio**: total de animales activos, conteo por módulo y pendientes del mes
  (secados, partos, vacas listas para montar…).
- **Página de cada módulo** con sus conteos (engorde: machos/hembras y por etapa; lechería:
  por estado reproductivo), lista con búsqueda y filtros, y botón para agregar un animal
  ya asignado a ese módulo.
- **Dados de baja**: los vendidos y muertos salen de las listas de activos y tienen su propia
  vista, por módulo y global.
- **Ficha de cada animal** en pestañas:
  - **Información**: datos, padres/abuelos y familia (hijos y hermanos).
  - **Registrar**: los formularios que aplican a su módulo. En engorde, el cambio de etapa
    es de un toque: cierra la anterior y abre la nueva con la fecha de hoy.
  - **Historial**: todos los eventos del animal, editables.
  - **Peso** (engorde) o **Leche** (lechería): gráfica de evolución con resumen.
  - **Árbol**: árbol genealógico visual (padres, abuelos y bisabuelos).
- **Estado reproductivo de las vacas** derivado del ciclo (en ordeño, en secado, por parir,
  posparto, lista para montar) y fecha estimada de parto.
- **Producción de leche**: litros por día del hato por semanas o meses, y tabla por vaca
  (promedio de 30 días y último registro). Cada registro es un ordeño (mañana o tarde); el
  total del día es la suma de los ordeños.
- **Calendario** con lo que viene en los próximos meses.
- **Exportar a CSV** (todo o por módulo). La ficha de un animal también se puede imprimir o
  guardar en PDF desde el diálogo de impresión del navegador o del celular.
- **Respaldo**: descargar todos los datos en un JSON y restaurarlos.
- **Modo sin conexión**: en el campo sin señal se ve la última copia de las páginas visitadas y
  se pueden registrar ordeños, pesos, montas, partos y cambios de etapa; se envían solos al volver
  la señal (ver `docs/14-app-movil.md`).
- **Modo claro / oscuro**, diseño mobile-first e iconos SVG.

## Tecnología

- [Next.js 15](https://nextjs.org/) (App Router) + React 19 + TypeScript
- [Prisma](https://www.prisma.io/) con **PostgreSQL en [Supabase](https://supabase.com/)** (ver `docs/10-supabase.md`)
- [Tailwind CSS](https://tailwindcss.com/) · [Recharts](https://recharts.org/) para las gráficas
- [sharp](https://sharp.pixelplumbing.com/) para las fotos (sin EXIF, con miniaturas)
- Acceso con una contraseña compartida y medidas de seguridad: ver `docs/11-seguridad.md`
- Despliegue en [Vercel](https://vercel.com/) (región `cle1`, junto a la base en `us-east-2`)

## Estructura del proyecto

```
src/
  app/              Páginas (inicio, engorde, lechería, reproductores, animales, calendario,
                    respaldo, login) y la API en app/api
  components/       Componentes reutilizables (navegación, listas, formularios, gráficas, iconos)
  lib/              Lógica de dominio (fechas, estado reproductivo, módulos, genealogía,
                    alertas) y validación/seguridad de la API
  middleware.ts     Sesión obligatoria y protección CSRF para todas las rutas
prisma/
  schema.prisma     Modelo de datos
  supabase-rls.sql  Activa RLS en Supabase (se ejecuta una vez por base nueva)
public/
  sw.js             Service worker: ver sin señal las páginas ya visitadas
movil/              App Android con Capacitor (contenedor que abre la web). No se despliega en
                    Vercel (.vercelignore). Ver docs/14-app-movil.md
docs/               Documentación del negocio, del modelo y decisiones del proyecto
scripts/            produccion.mjs (app "en uso" local) y cambiar-clave.mjs (contraseña)
.kiro/steering/     Contexto para Kiro (frontend), incluido el contrato de la API (api.md)
```

## Documentación (`docs/`)

| Archivo | Tema |
| --- | --- |
| `00`–`07` | Visión, glosario, reglas de negocio, modelo de datos, eventos, genealogía, alertas, preguntas pendientes |
| `08-bitacora-de-cambios.md` · `09-estado-del-proyecto.md` | Historial y estado actual |
| `10-supabase.md` | Base de datos en Supabase |
| `11-seguridad.md` | Acceso, sesión y medidas de seguridad |
| `12-pedidos-backend.md` | Canal entre frontend (Kiro) y backend (Claude Code) |
| `13-despliegue-vercel.md` | Publicación en Vercel y sus límites |
| `14-app-movil.md` | App móvil (Android con Capacitor, iPhone) y modo sin conexión |

## Notas

- El archivo **`.env`** (contraseñas de Supabase y de la app) no se sube al repositorio.
  Se crea a partir de `.env.example`.
- Supabase hace copias diarias solo en planes de pago; en el gratuito conviene descargar
  también el respaldo JSON de la app (página **Respaldo**). En Vercel el respaldo está
  limitado a 4,5 MB por petición (ver `docs/13-despliegue-vercel.md`).
- Las preguntas de negocio (unidades de leche, duración de etapas, etc.) se respondieron
  el 2026-10-07; ver `docs/07-preguntas-pendientes.md`.
