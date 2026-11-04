import Link from "next/link";
import { SEXO_LABEL, ESTADO_LABEL, etiquetaArete } from "@/lib/tipos";
import { IconoMacho, IconoHembra, IconoInfo, IconoCheck, IconoAlerta, IconoAtras } from "@/components/iconos";

// =============================================================================
// Sistema visual de TDS Ganadería (ver DESIGN.md).
//  - Superficies: blancas sobre piedra-100, con sombra suave y un filo de 1px (sin bordes
//    gruesos). En oscuro, piedra-900 con filo claro translúcido.
//  - Color con UN significado (ver "Tonos" abajo). Sexo y módulo no llevan color: se
//    distinguen con icono y texto, para que el color quede para el estado.
//  - Botones con variantes y respuesta al toque (scale 0.96).
// =============================================================================

// --- Superficies -------------------------------------------------------------

// Superficie base de tarjetas, filas-tarjeta y paneles. Exportada para los sitios que no usan
// <Card> (enlaces con forma de tarjeta, tablas).
export const claseSuperficie =
  "rounded-2xl bg-white shadow-card ring-1 ring-stone-900/[0.06] dark:bg-stone-900 dark:shadow-none dark:ring-white/[0.08]";

export function Card({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={`${claseSuperficie} p-4 sm:p-5 ${className}`}>{children}</div>;
}

// Título de sección dentro de una tarjeta. `conteo` muestra un número al lado; `accion`, un
// enlace o botón alineado a la derecha.
export function SectionTitle({
  children,
  conteo,
  accion,
}: {
  children: React.ReactNode;
  conteo?: number;
  accion?: React.ReactNode;
}) {
  return (
    <div className="mb-3 flex items-center justify-between gap-3">
      <h2 className="flex items-baseline gap-2 text-base font-semibold text-stone-900 dark:text-stone-100">
        {children}
        {conteo !== undefined && (
          <span className="text-sm font-medium text-stone-500 dark:text-stone-400">{conteo}</span>
        )}
      </h2>
      {accion}
    </div>
  );
}

// Estado vacío reutilizable: icono (componente), mensaje y (opcional) un botón de acción.
export function Vacio({
  icono,
  mensaje,
  accionHref,
  accionLabel,
}: {
  icono?: React.ReactNode;
  mensaje: string;
  accionHref?: string;
  accionLabel?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 px-2 py-10 text-center">
      {icono && (
        <div className="grid h-12 w-12 place-items-center rounded-2xl bg-stone-100 text-stone-500 dark:bg-stone-800 dark:text-stone-400">
          {icono}
        </div>
      )}
      <p className="max-w-sm text-sm text-stone-600 dark:text-stone-300">{mensaje}</p>
      {accionHref && accionLabel && (
        <Link href={accionHref} className={`${claseBoton("primario")} mt-1`}>
          {accionLabel}
        </Link>
      )}
    </div>
  );
}

// --- Tonos: el color tiene UN solo significado en toda la app ---------------------
//   verde  → listo / activo / bien        (lista para montar, activo, guardado)
//   azul   → en curso / informativo       (en ordeño, registros por enviar)
//   ambar  → se acerca, hay que atender   (secar pronto, por parir, sin señal)
//   rojo   → vencido / problema / borrar  (parto atrasado, muerto, error)
//   neutral→ dato sin urgencia            (sexo, módulo, raza, etapa, secado)
export type Tono = "neutral" | "verde" | "rojo" | "ambar" | "azul";

// Estado reproductivo de la vaca → tono. Misma tabla en listas, ficha, lechería e inicio.
export const TONO_REPRO: Record<string, Tono> = {
  ORDENIO: "azul",
  SECADO: "neutral",
  POR_PARIR: "ambar",
  LISTA_MONTAR: "verde",
};

// Recuadros de icono de las celdas de conteo (mismo significado que los tonos).
export const ACENTO: Record<Tono | "marca", string> = {
  marca: "bg-marca-100 text-marca-700 dark:bg-marca-950 dark:text-marca-300",
  verde: "bg-marca-100 text-marca-700 dark:bg-marca-950 dark:text-marca-300",
  azul: "bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300",
  ambar: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
  rojo: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300",
  neutral: "bg-stone-100 text-stone-600 dark:bg-stone-800 dark:text-stone-300",
};

export function Badge({
  children,
  tono = "neutral",
  punto = false,
  icono,
}: {
  children: React.ReactNode;
  tono?: Tono;
  punto?: boolean;
  icono?: React.ReactNode;
}) {
  const tonos: Record<Tono, string> = {
    neutral: "bg-stone-100 text-stone-700 ring-stone-200 dark:bg-stone-800 dark:text-stone-300 dark:ring-stone-700",
    verde: "bg-marca-50 text-marca-800 ring-marca-200 dark:bg-marca-950 dark:text-marca-300 dark:ring-marca-800",
    rojo: "bg-red-50 text-red-700 ring-red-200 dark:bg-red-950 dark:text-red-300 dark:ring-red-900",
    ambar: "bg-amber-50 text-amber-800 ring-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:ring-amber-900",
    azul: "bg-sky-50 text-sky-800 ring-sky-200 dark:bg-sky-950 dark:text-sky-300 dark:ring-sky-900",
  };
  const puntos: Record<Tono, string> = {
    neutral: "bg-stone-400",
    verde: "bg-marca-500",
    rojo: "bg-red-500",
    ambar: "bg-amber-500",
    azul: "bg-sky-500",
  };
  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${tonos[tono]}`}
    >
      {punto && <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${puntos[tono]}`} />}
      {icono}
      {children}
    </span>
  );
}

export function EstadoBadge({ estado }: { estado: string }) {
  const tono = estado === "ACTIVO" ? "verde" : estado === "MUERTO" ? "rojo" : "neutral";
  return <Badge tono={tono} punto>{ESTADO_LABEL[estado] ?? estado}</Badge>;
}

// El sexo es un dato, no un estado: va en neutro con su símbolo (♂/♀ dibujados).
export function SexoBadge({ sexo }: { sexo: string }) {
  const Icono = sexo === "MACHO" ? IconoMacho : IconoHembra;
  return (
    <Badge icono={<Icono className="-ml-0.5 h-3.5 w-3.5 text-stone-500 dark:text-stone-400" strokeWidth={2} />}>
      {SEXO_LABEL[sexo] ?? sexo}
    </Badge>
  );
}

export function AnimalLink({
  animal,
}: {
  animal: { id: string; arete: string; nombre: string | null; sinArete?: boolean | null; areteCenasa?: string | null };
}) {
  const ident = etiquetaArete(animal);
  return (
    <Link
      href={`/animales/${animal.id}`}
      className="rounded font-medium text-marca-700 decoration-marca-300 underline-offset-[3px] hover:underline dark:text-marca-400 dark:decoration-marca-700"
    >
      {animal.nombre ? `${animal.nombre} (${ident})` : ident}
    </Link>
  );
}

// Encabezado de página reutilizable: título a la izquierda y acciones a la derecha, en la
// misma fila (si no caben, las acciones bajan solas).
export function PageHeader({
  titulo,
  subtitulo,
  children,
}: {
  titulo: string;
  subtitulo?: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-x-4 gap-y-3 sm:mb-6">
      <div className="min-w-0 flex-1">
        <h1 className="text-2xl font-bold tracking-tight text-stone-900 sm:text-[1.75rem] sm:leading-9 dark:text-stone-50">
          {titulo}
        </h1>
        {subtitulo && <p className="mt-1 max-w-prose text-sm text-stone-600 dark:text-stone-400">{subtitulo}</p>}
      </div>
      {children && <div className="flex shrink-0 flex-wrap items-center gap-2">{children}</div>}
    </div>
  );
}

// Enlace "← Volver a …" encima del título de páginas de detalle (área táctil de 44 px).
export function EnlaceVolver({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="no-print -ml-2 mb-1 inline-flex min-h-11 items-center gap-1 rounded-xl px-2 text-sm font-medium text-stone-600 transition-colors hover:text-marca-700 active:bg-stone-200/60 dark:text-stone-400 dark:hover:text-marca-400 dark:active:bg-stone-800"
    >
      <IconoAtras className="h-4 w-4" />
      {children}
    </Link>
  );
}

// --- Botones -------------------------------------------------------------------

export type VarianteBoton =
  | "primario"
  | "secundario"
  | "peligro"
  | "peligroSuave"
  | "discreto"
  | "marcaDiscreto"
  | "peligroDiscreto";

const BOTON_BASE =
  "inline-flex select-none items-center justify-center gap-2 rounded-xl font-medium transition-[background-color,box-shadow,color,transform] duration-150 ease-out active:scale-[0.96] disabled:pointer-events-none disabled:opacity-55 motion-reduce:active:scale-100";

const BOTON_VARIANTE: Record<VarianteBoton, string> = {
  primario:
    "bg-marca-600 text-white shadow-boton hover:bg-marca-700 active:bg-marca-800",
  secundario:
    "bg-white text-stone-700 shadow-card ring-1 ring-inset ring-stone-300 hover:bg-stone-50 active:bg-stone-100 dark:bg-stone-800 dark:text-stone-100 dark:shadow-none dark:ring-stone-700 dark:hover:bg-stone-700",
  peligro: "bg-red-600 text-white shadow-boton hover:bg-red-700 active:bg-red-800",
  peligroSuave:
    "bg-white text-red-700 ring-1 ring-inset ring-red-200 hover:bg-red-50 active:bg-red-100 dark:bg-stone-800 dark:text-red-300 dark:ring-red-900/70 dark:hover:bg-red-950/60",
  discreto:
    "text-stone-600 hover:bg-stone-200/60 active:bg-stone-200 dark:text-stone-300 dark:hover:bg-stone-800 dark:active:bg-stone-700",
  // Variantes sin fondo con color propio (no sumar `text-*` a "discreto": las clases chocan y gana
  // la que Tailwind escribe después, no la última de la cadena).
  marcaDiscreto:
    "text-marca-700 hover:bg-marca-50 active:bg-marca-100 dark:text-marca-400 dark:hover:bg-marca-950/60 dark:active:bg-marca-950",
  peligroDiscreto:
    "text-red-700 hover:bg-red-50 active:bg-red-100 dark:text-red-400 dark:hover:bg-red-950/50 dark:active:bg-red-950",
};

// Clases de botón (para <button> o <Link>). Alto táctil 44 px en móvil, 40 px en escritorio.
export function claseBoton(variante: VarianteBoton = "primario", tamano: "md" | "sm" = "md"): string {
  const t = tamano === "md" ? "min-h-11 px-4 text-sm sm:min-h-10" : "min-h-9 px-3 text-sm";
  return `${BOTON_BASE} ${t} ${BOTON_VARIANTE[variante]}`;
}

// Botón cuadrado de solo icono (siempre con aria-label). 44×44 px.
export function claseBotonIcono(variante: VarianteBoton = "discreto"): string {
  return `${BOTON_BASE} h-11 w-11 shrink-0 ${BOTON_VARIANTE[variante]}`;
}

// Indicador de carga para botones y filas. Gira solo si el sistema permite movimiento.
export function Spinner({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={`inline-block shrink-0 animate-spin rounded-full border-2 border-current border-r-transparent opacity-80 motion-reduce:animate-none ${className}`}
    />
  );
}

// Botón de envío de formulario con estado de carga (spinner + texto, y aria-busy).
export function BotonEnviar({
  cargando,
  children,
  textoCargando = "Guardando…",
  variante = "primario",
  className = "",
}: {
  cargando: boolean;
  children: React.ReactNode;
  textoCargando?: string;
  variante?: VarianteBoton;
  className?: string;
}) {
  return (
    <button type="submit" disabled={cargando} aria-busy={cargando || undefined} className={`${claseBoton(variante)} ${className}`}>
      {cargando ? (
        <>
          <Spinner />
          {textoCargando}
        </>
      ) : (
        children
      )}
    </button>
  );
}

// Botón de acción primaria con estilo de marca (como enlace).
// `icono` opcional a la izquierda; `className` para ajustes puntuales.
export function BotonPrimario({
  href,
  children,
  icono,
  className = "",
  variante = "primario",
}: {
  href: string;
  children: React.ReactNode;
  icono?: React.ReactNode;
  className?: string;
  variante?: VarianteBoton;
}) {
  return (
    <Link href={href} className={`${claseBoton(variante)} ${className}`}>
      {icono}
      {children}
    </Link>
  );
}

// --- Avisos --------------------------------------------------------------------
// Mensajes de resultado de un formulario. role="alert"/"status": el lector de pantalla los anuncia
// al aparecer (el error de inmediato; el de éxito sin interrumpir). Llevan icono además del
// color: el color nunca es la única pista.

function AvisoBase({
  tono,
  role,
  children,
  className,
}: {
  tono: "rojo" | "verde" | "ambar" | "azul";
  role: "alert" | "status";
  children: React.ReactNode;
  className: string;
}) {
  const estilos = {
    rojo: "bg-red-50 text-red-800 ring-red-200 dark:bg-red-950/70 dark:text-red-200 dark:ring-red-900",
    verde: "bg-marca-50 text-marca-900 ring-marca-200 dark:bg-marca-950/70 dark:text-marca-100 dark:ring-marca-800",
    ambar: "bg-amber-50 text-amber-900 ring-amber-200 dark:bg-amber-950/70 dark:text-amber-100 dark:ring-amber-900",
    azul: "bg-sky-50 text-sky-900 ring-sky-200 dark:bg-sky-950/70 dark:text-sky-100 dark:ring-sky-900",
  }[tono];
  const Icono = tono === "verde" ? IconoCheck : tono === "rojo" ? IconoAlerta : IconoInfo;
  return (
    <div role={role} className={`flex items-start gap-2.5 rounded-xl px-3 py-2.5 text-sm ring-1 ring-inset ${estilos} ${className}`}>
      <Icono className="mt-px h-[18px] w-[18px] shrink-0" strokeWidth={2} />
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}

export function AvisoError({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <AvisoBase tono="rojo" role="alert" className={className}>{children}</AvisoBase>;
}

export function AvisoExito({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <AvisoBase tono="verde" role="status" className={className}>{children}</AvisoBase>;
}

export function AvisoInfo({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <AvisoBase tono="azul" role="status" className={className}>{children}</AvisoBase>;
}

// --- Estilos de formulario compartidos -------------------------------------
// Clases reutilizables para inputs/selects/textarea y sus etiquetas, para no repetir la misma
// cadena de Tailwind en cada formulario (FormularioAnimal, FormulariosEventos, etc.).
// En móvil, globals.css fuerza 16px en los inputs para evitar el zoom de iOS.
export const claseCampo =
  "mt-1 block min-h-11 w-full rounded-xl border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 shadow-[inset_0_1px_1px_rgb(28_25_23/0.04)] outline-none transition-[border-color,box-shadow] duration-150 placeholder:text-stone-500 hover:border-stone-400 focus:border-marca-500 focus:ring-[3px] focus:ring-marca-500/20 disabled:bg-stone-100 disabled:text-stone-500 sm:min-h-10 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-100 dark:placeholder:text-stone-400 dark:hover:border-stone-600 dark:focus:border-marca-400 dark:focus:ring-marca-400/25";
export const claseEtiqueta = "block text-sm font-medium text-stone-700 dark:text-stone-300";
// Botón primario de formulario (área táctil ≥44px). Para enlaces usar <BotonPrimario>.
export const claseBotonPrimario = claseBoton("primario");
