import Link from "next/link";
import { Card, SectionTitle, PageHeader, AnimalLink, Vacio } from "@/components/ui";
import { GraficaLecheDiferida } from "@/components/GraficaLecheDiferida";
import { IconoLeche } from "@/components/iconos";
import { produccionHato, type Vista } from "@/lib/leche";
import { formatearFecha } from "@/lib/fechas";

export const dynamic = "force-dynamic";

const VISTAS: { id: Vista; label: string }[] = [
  { id: "semanas", label: "Últimas 16 semanas" },
  { id: "meses", label: "Últimos 12 meses" },
];

export default async function LechePage({ searchParams }: { searchParams: Promise<{ vista?: string }> }) {
  const { vista: v } = await searchParams;
  const vista: Vista = v === "meses" ? "meses" : "semanas";
  const { puntos, filas } = await produccionHato(vista);

  const actual = puntos[puntos.length - 1];
  const hayDatos = puntos.some((p) => p.litros > 0);

  return (
    <div className="space-y-6">
      <PageHeader
        titulo="Producción de leche"
        subtitulo="Litros por día de las vacas de lechería (se suman los ordeños de mañana y tarde de cada día)."
      />

      <Card>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <SectionTitle>Litros por día del hato</SectionTitle>
          <div role="group" aria-label="Agrupar producción por" className="flex gap-1 rounded-lg bg-stone-100 p-1 dark:bg-stone-800">
            {VISTAS.map((x) => (
              <Link
                key={x.id}
                href={`/leche?vista=${x.id}`}
                aria-current={vista === x.id ? "true" : undefined}
                className={
                  "rounded-md px-3 py-1.5 text-xs font-medium transition-colors " +
                  (vista === x.id
                    ? "bg-white text-stone-800 shadow-sm dark:bg-stone-700 dark:text-stone-100"
                    : "text-stone-500 hover:text-stone-700 dark:text-stone-400 dark:hover:text-stone-200")
                }
              >
                {x.label}
              </Link>
            ))}
          </div>
        </div>

        {hayDatos ? (
          <>
            <p className="mb-3 text-sm text-stone-500 dark:text-stone-400">
              {vista === "semanas" ? "Esta semana" : "Este mes"}:{" "}
              <span className="font-semibold text-stone-800 dark:text-stone-100">{actual.litros} L/día</span>
              {actual.detalle && <span className="text-stone-500 dark:text-stone-400"> · {actual.detalle}</span>}
            </p>
            <GraficaLecheDiferida puntos={puntos} tipo="barras" />
            <p className="mt-2 text-xs text-stone-500 dark:text-stone-400">
              Cada barra suma el promedio diario de cada vaca medida en ese periodo. Si alguna vaca no
              se midió, ese periodo sale más bajo (ver &quot;vacas medidas&quot; al tocar la barra).
            </p>
          </>
        ) : (
          <Vacio
            icono={<IconoLeche className="h-6 w-6" />}
            mensaje="Aún no hay leche registrada en este periodo. Se anota desde la ficha de cada vaca: Registrar → Leche."
            accionHref="/lecheria"
            accionLabel="Ir a Lechería"
          />
        )}
      </Card>

      {filas.length > 0 && (
        <Card>
          <SectionTitle>Por vaca</SectionTitle>
          <div className="-mx-4 overflow-x-auto sm:mx-0">
            {/* En móvil (360 px) los encabezados largos obligaban a desplazar la tabla de lado y
                cortaban la última columna: se abrevian y las celdas pueden partirse en dos líneas. */}
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-stone-200 text-left text-xs uppercase tracking-wider text-stone-500 dark:border-stone-800 dark:text-stone-400">
                  <th className="px-4 py-2 font-medium sm:pl-0">Vaca</th>
                  <th className="px-2 py-2 text-right font-medium">
                    <span className="sm:hidden">Prom. 30 d</span>
                    <span className="hidden sm:inline">Promedio 30 días</span>
                  </th>
                  <th className="px-4 py-2 text-right font-medium sm:pr-0">
                    <span className="sm:hidden">Último</span>
                    <span className="hidden sm:inline">Último registro</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
                {filas.map((f) => (
                  <tr key={f.id}>
                    <td className="px-4 py-2.5 sm:pl-0">
                      <AnimalLink animal={f} />
                    </td>
                    <td className="px-2 py-2.5 text-right font-semibold text-stone-800 dark:text-stone-100">
                      {f.resumen.promedio30 !== null ? `${f.resumen.promedio30} L` : "—"}
                    </td>
                    <td className="px-4 py-2.5 text-right text-stone-500 sm:pr-0 dark:text-stone-400">
                      {f.resumen.ultimo
                        ? `${f.resumen.ultimo.litros} L · ${formatearFecha(f.resumen.ultimo.fecha)}`
                        : "Sin registros"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
