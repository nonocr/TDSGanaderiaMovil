import Link from "next/link";
import { Card, SectionTitle } from "@/components/ui";
import type { Icono } from "@/components/iconos";

// Una celda de conteo: icono, número grande y etiqueta. Si trae `href`, es un enlace
// (p. ej. a la lista filtrada); si no, es una celda estática.
export type Celda = {
  clave: string;
  valor: number;
  etiqueta: string;
  Icono: Icono;
  acento: string; // clases de color del recuadro del icono
  href?: string;
};

// Tarjetas superiores de totales (total / machos / hembras u otras).
// La rejilla se adapta al número de celdas (1, 2 o 3).
export function TotalesPrincipales({ celdas }: { celdas: Celda[] }) {
  const cols = celdas.length === 1 ? "grid-cols-1" : celdas.length === 2 ? "grid-cols-2" : "grid-cols-3";
  return (
    <div className={`grid gap-2.5 sm:gap-4 ${cols}`}>
      {celdas.map((c) => {
        const interior = (
          <>
            <div className={`grid h-10 w-10 place-items-center rounded-xl ${c.acento}`}>
              <c.Icono className="h-5 w-5" />
            </div>
            <div className="text-2xl font-bold leading-none text-stone-900 dark:text-stone-100">
              {c.valor}
            </div>
            <div className="text-xs leading-tight text-stone-500 dark:text-stone-400">{c.etiqueta}</div>
          </>
        );
        const clases =
          "flex flex-col items-center gap-1.5 rounded-xl border border-stone-200/80 bg-white p-3 text-center shadow-card dark:border-stone-800 dark:bg-stone-900";
        return c.href ? (
          <Link
            key={c.clave}
            href={c.href}
            className={clases + " transition-colors hover:border-marca-300 hover:bg-marca-50/40 dark:hover:border-marca-700 dark:hover:bg-stone-800/60"}
          >
            {interior}
          </Link>
        ) : (
          <div key={c.clave} className={clases}>
            {interior}
          </div>
        );
      })}
    </div>
  );
}

// Tarjeta con un desglose en rejilla (por etapa o por estado reproductivo).
// `columnas` fija el número de columnas (por defecto 3, que reparte 6 celdas en 2 filas).
export function DesgloseGrid({
  titulo,
  celdas,
  nota,
  columnas = 3,
}: {
  titulo: string;
  celdas: Celda[];
  nota?: string;
  columnas?: 2 | 3 | 4;
}) {
  const gridCols =
    columnas === 2 ? "grid-cols-2" : columnas === 4 ? "grid-cols-2 sm:grid-cols-4" : "grid-cols-2 sm:grid-cols-3";
  return (
    <Card>
      <SectionTitle>{titulo}</SectionTitle>
      {/* Celdas medianas: icono a la izquierda; número y, debajo, la etiqueta (así no se corta
          en móvil con 2 columnas). Más pequeñas que las tarjetas de totales de arriba. */}
      <div className={`grid gap-2.5 ${gridCols}`}>
        {celdas.map((c) => {
          const interior = (
            <>
              <div className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg ${c.acento}`}>
                <c.Icono className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <div className="text-xl font-bold leading-none text-stone-900 dark:text-stone-100">
                  {c.valor}
                </div>
                <div className="mt-1 text-xs leading-tight text-stone-500 sm:text-[13px] dark:text-stone-400">
                  {c.etiqueta}
                </div>
              </div>
            </>
          );
          const clases =
            "flex items-center gap-2.5 rounded-lg border border-stone-200/80 px-3 py-2.5 dark:border-stone-800";
          return c.href ? (
            <Link
              key={c.clave}
              href={c.href}
              className={clases + " transition-colors hover:border-marca-300 hover:bg-marca-50/40 dark:hover:border-marca-700 dark:hover:bg-stone-800/60"}
            >
              {interior}
            </Link>
          ) : (
            <div key={c.clave} className={clases}>
              {interior}
            </div>
          );
        })}
      </div>
      {nota && (
        <p className="mt-3 border-t border-stone-100 pt-2.5 text-xs text-stone-400 dark:border-stone-800 dark:text-stone-500">
          {nota}
        </p>
      )}
    </Card>
  );
}
