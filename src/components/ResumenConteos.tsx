import Link from "next/link";
import { SectionTitle, claseSuperficie } from "@/components/ui";
import { IconoFlecha, type Icono } from "@/components/iconos";

// Una celda de conteo: icono, número grande y etiqueta. Si trae `href`, es un enlace
// (p. ej. a la lista filtrada); si no, es una celda estática.
export type Celda = {
  clave: string;
  valor: number;
  etiqueta: string;
  Icono: Icono;
  acento: string; // clases de color del recuadro del icono (ACENTO en ui.tsx)
  href?: string;
};

const claseEnlaceCelda =
  "transition-colors hover:bg-stone-50 active:bg-stone-100 dark:hover:bg-stone-800/60 dark:active:bg-stone-800";

// Totales del módulo (total / machos / hembras): UNA superficie dividida en columnas, no una
// tarjeta por número. Con una sola celda, la fila es horizontal (icono, etiqueta, número).
export function TotalesPrincipales({ celdas }: { celdas: Celda[] }) {
  if (celdas.length === 1) {
    const c = celdas[0];
    const interior = (
      <>
        <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${c.acento}`}>
          <c.Icono className="h-5 w-5" />
        </span>
        <span className="flex-1 text-sm font-medium text-stone-600 dark:text-stone-400">{c.etiqueta}</span>
        <span className="text-2xl font-bold leading-none tracking-tight text-stone-900 dark:text-stone-50">{c.valor}</span>
      </>
    );
    const clases = `${claseSuperficie} flex items-center gap-3 px-4 py-3.5`;
    return c.href ? (
      <Link href={c.href} className={`${clases} ${claseEnlaceCelda}`}>
        {interior}
      </Link>
    ) : (
      <div className={clases}>{interior}</div>
    );
  }

  const cols = celdas.length === 2 ? "grid-cols-2" : "grid-cols-3";
  return (
    <ul className={`${claseSuperficie} grid overflow-hidden ${cols} divide-x divide-stone-100 dark:divide-stone-800`}>
      {celdas.map((c) => {
        const interior = (
          <>
            <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${c.acento}`}>
              <c.Icono className="h-5 w-5" />
            </span>
            <span className="text-2xl font-bold leading-none tracking-tight text-stone-900 sm:order-last sm:ml-auto dark:text-stone-50">
              {c.valor}
            </span>
            <span className="text-xs font-medium leading-tight text-stone-600 sm:text-sm dark:text-stone-400">{c.etiqueta}</span>
          </>
        );
        // Móvil: columna centrada. Desde tableta: fila (icono, etiqueta, número a la derecha).
        const clases = "flex h-full flex-col items-center gap-1.5 px-2 py-4 text-center sm:flex-row sm:gap-3 sm:px-4 sm:text-left";
        return (
          <li key={c.clave}>
            {c.href ? (
              <Link href={c.href} className={`${clases} ${claseEnlaceCelda}`}>
                {interior}
              </Link>
            ) : (
              <div className={clases}>{interior}</div>
            )}
          </li>
        );
      })}
    </ul>
  );
}

// Tarjeta con un desglose (por etapa o por estado reproductivo). Celdas planas, sin tarjetas
// dentro de la tarjeta: en móvil, filas (icono, etiqueta y número a la derecha) separadas por
// líneas finas; desde tableta, una sola fila con una columna por celda.
export function DesgloseGrid({
  titulo,
  celdas,
  nota,
}: {
  titulo: string;
  celdas: Celda[];
  nota?: string;
}) {
  // Clases completas (Tailwind no ve las que se arman con texto variable).
  const columnas: Record<number, string> = {
    2: "sm:grid-cols-2",
    3: "sm:grid-cols-3",
    4: "sm:grid-cols-4",
    5: "sm:grid-cols-5",
  };
  return (
    <div className={`${claseSuperficie} overflow-hidden`}>
      <div className="px-4 pt-4 sm:px-5 sm:pt-5">
        <SectionTitle>{titulo}</SectionTitle>
      </div>
      <ul
        className={`grid grid-cols-1 divide-y divide-stone-100 border-y border-stone-100 sm:divide-x sm:divide-y-0 dark:divide-stone-800 dark:border-stone-800 ${columnas[celdas.length] ?? "sm:grid-cols-3"}`}
      >
        {celdas.map((c) => {
          const interior = (
            <>
              <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg ${c.acento}`}>
                <c.Icono className="h-5 w-5" />
              </span>
              <span className="min-w-0 flex-1 text-sm text-stone-700 sm:order-last sm:flex-none sm:text-[13px] sm:leading-tight dark:text-stone-300">
                {c.etiqueta}
              </span>
              <span className="text-xl font-bold leading-none text-stone-900 dark:text-stone-50">{c.valor}</span>
              {c.href && <IconoFlecha className="h-4 w-4 shrink-0 text-stone-400 sm:hidden dark:text-stone-500" />}
            </>
          );
          const clases =
            "flex h-full min-h-14 items-center gap-3 px-4 py-2.5 sm:flex-col sm:items-start sm:gap-2 sm:px-4 sm:py-4";
          return (
            <li key={c.clave}>
              {c.href ? (
                <Link
                  href={c.href}
                  className={`${clases} transition-colors duration-150 hover:bg-stone-50 active:bg-stone-100 dark:hover:bg-stone-800/60 dark:active:bg-stone-800`}
                >
                  {interior}
                </Link>
              ) : (
                <div className={clases}>{interior}</div>
              )}
            </li>
          );
        })}
      </ul>
      {nota && (
        <p className="px-4 py-3 text-xs text-stone-500 sm:px-5 dark:text-stone-400">{nota}</p>
      )}
    </div>
  );
}
