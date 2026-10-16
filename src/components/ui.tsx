import Link from "next/link";
import { SEXO_LABEL, ESTADO_LABEL, etiquetaArete } from "@/lib/tipos";

export function Card({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-xl border border-stone-200/80 bg-white p-4 shadow-card sm:p-5 dark:border-stone-800 dark:bg-stone-900 ${className}`}
    >
      {children}
    </div>
  );
}

export function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-stone-500 dark:text-stone-400">
      <span className="h-3.5 w-1 rounded-full bg-marca-500" />
      {children}
    </h2>
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
    <div className="flex flex-col items-center justify-center gap-3 py-10 text-center">
      <div className="grid h-12 w-12 place-items-center rounded-full bg-stone-100 text-stone-400 dark:bg-stone-800 dark:text-stone-500">
        {icono}
      </div>
      <p className="max-w-sm text-sm text-stone-500 dark:text-stone-400">{mensaje}</p>
      {accionHref && accionLabel && (
        <Link
          href={accionHref}
          className="mt-1 inline-flex items-center gap-1.5 rounded-lg bg-marca-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-marca-700"
        >
          {accionLabel}
        </Link>
      )}
    </div>
  );
}

type Tono = "neutral" | "verde" | "rojo" | "ambar" | "azul";

export function Badge({
  children,
  tono = "neutral",
  punto = false,
}: {
  children: React.ReactNode;
  tono?: Tono;
  punto?: boolean;
}) {
  const tonos: Record<Tono, string> = {
    neutral: "bg-stone-100 text-stone-600 ring-stone-200 dark:bg-stone-800 dark:text-stone-300 dark:ring-stone-700",
    verde: "bg-marca-100 text-marca-800 ring-marca-200 dark:bg-marca-950 dark:text-marca-300 dark:ring-marca-800",
    rojo: "bg-red-100 text-red-700 ring-red-200 dark:bg-red-950 dark:text-red-300 dark:ring-red-900",
    ambar: "bg-amber-100 text-amber-800 ring-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:ring-amber-900",
    azul: "bg-sky-100 text-sky-700 ring-sky-200 dark:bg-sky-950 dark:text-sky-300 dark:ring-sky-900",
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
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${tonos[tono]}`}
    >
      {punto && <span className={`h-1.5 w-1.5 rounded-full ${puntos[tono]}`} />}
      {children}
    </span>
  );
}

export function EstadoBadge({ estado }: { estado: string }) {
  const tono = estado === "ACTIVO" ? "verde" : estado === "MUERTO" ? "rojo" : "neutral";
  return <Badge tono={tono} punto>{ESTADO_LABEL[estado] ?? estado}</Badge>;
}

export function SexoBadge({ sexo }: { sexo: string }) {
  return <Badge tono={sexo === "MACHO" ? "azul" : "ambar"}>{SEXO_LABEL[sexo] ?? sexo}</Badge>;
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
      className="font-medium text-marca-700 decoration-marca-300 underline-offset-2 hover:underline dark:text-marca-400"
    >
      {animal.nombre ? `${animal.nombre} (${ident})` : ident}
    </Link>
  );
}

// Encabezado de página reutilizable: título a la izquierda, acciones a la derecha.
export function PageHeader({
  titulo,
  subtitulo,
  children,
}: {
  titulo: string;
  subtitulo?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3 border-b border-stone-200 pb-4 sm:mb-6 dark:border-stone-800">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-stone-900 dark:text-stone-100">{titulo}</h1>
        {subtitulo && <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">{subtitulo}</p>}
      </div>
      {children && <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">{children}</div>}
    </div>
  );
}

// Botón de acción primaria con estilo de marca (como enlace).
// `icono` opcional a la izquierda; `className` para ajustes puntuales (p. ej. altura táctil).
export function BotonPrimario({
  href,
  children,
  icono,
  className = "",
}: {
  href: string;
  children: React.ReactNode;
  icono?: React.ReactNode;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={`inline-flex items-center justify-center gap-1.5 rounded-lg bg-marca-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-marca-700 active:bg-marca-800 ${className}`}
    >
      {icono}
      {children}
    </Link>
  );
}

// --- Estilos de formulario compartidos -------------------------------------
// Clases reutilizables para inputs/selects/textarea y sus etiquetas, para no repetir la misma
// cadena de Tailwind en cada formulario (FormularioAnimal, FormulariosEventos, etc.).
// En móvil, globals.css fuerza 16px en los inputs para evitar el zoom de iOS.
export const claseCampo =
  "mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm outline-none focus:border-marca-500 focus:ring-2 focus:ring-marca-200 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-100 dark:placeholder:text-stone-500";
export const claseEtiqueta = "block text-sm font-medium text-stone-600 dark:text-stone-400";
// Botón primario de formulario (área táctil ≥44px). Para enlaces usar <BotonPrimario>.
export const claseBotonPrimario =
  "inline-flex min-h-11 items-center justify-center rounded-lg bg-marca-600 px-4 text-sm font-medium text-white shadow-sm hover:bg-marca-700 disabled:opacity-50";
