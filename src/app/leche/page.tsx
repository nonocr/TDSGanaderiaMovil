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
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-stone-900 dark:text-stone-50">Litros por día del hato</h2>
            {hayDatos && (
              <p className="mt-1 flex flex-wrap items-baseline gap-x-2 text-sm text-stone-600 dark:text-stone-400">
                <span>{vista === "semanas" ? "Esta semana" : "Este mes"}</span>
                <span className="text-2xl font-bold tracking-tight text-stone-900 dark:text-stone-50">
                  {actual.litros}
                  <span className="ml-1 text-sm font-medium text-stone-500 dark:text-stone-400">L/día</span>
                </span>
                {actual.detalle && <span className="text-stone-500 dark:text-stone-400">{actual.detalle}</span>}
              </p>
            )}
          </div>
          <div role="group" aria-label="Agrupar producción por" className="flex w-full gap-1 rounded-xl bg-stone-100 p-1 sm:w-auto dark:bg-stone-800">
            {VISTAS.map((x) => (
              <Link
                key={x.id}
                href={`/leche?vista=${x.id}`}
                aria-current={vista === x.id ? "true" : undefined}
                className={
                  "flex min-h-10 flex-1 items-center justify-center whitespace-nowrap rounded-lg px-3 text-sm font-medium transition-[background-color,color,box-shadow] duration-150 sm:flex-none " +
                  (vista === x.id
                    ? "bg-white text-stone-900 shadow-card dark:bg-stone-600 dark:text-white"
                    : "text-stone-600 hover:text-stone-900 dark:text-stone-300 dark:hover:text-white")
                }
              >
                {x.label}
              </Link>
            ))}
          </div>
        </div>

        {hayDatos ? (
          <>
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

      {/* La tabla por vaca solo si alguna vaca tiene registros: si no, quince filas de "Sin
          registros" debajo del aviso de vacío no dicen nada nuevo. */}
      {filas.some((f) => f.resumen.ultimo) && (
        <Card>
          <SectionTitle>Por vaca</SectionTitle>
          <div className="-mx-4 overflow-x-auto sm:mx-0">
            {/* En móvil (360 px) los encabezados largos obligaban a desplazar la tabla de lado y
                cortaban la última columna: se abrevian y las celdas pueden partirse en dos líneas. */}
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-stone-200 text-left text-xs font-medium text-stone-500 dark:border-stone-800 dark:text-stone-400">
                  <th scope="col" className="px-4 py-2 font-medium sm:pl-0">Vaca</th>
                  <th scope="col" className="whitespace-nowrap px-2 py-2 text-right font-medium">
                    <span className="sm:hidden">Prom. 30 d</span>
                    <span className="hidden sm:inline">Promedio 30 días</span>
                  </th>
                  <th scope="col" className="px-4 py-2 text-right font-medium sm:pr-0">
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
                    <td className="px-2 py-2.5 text-right font-semibold text-stone-900 dark:text-stone-50">
                      {f.resumen.promedio30 !== null ? `${f.resumen.promedio30} L` : "—"}
                    </td>
                    <td className="px-4 py-2.5 text-right text-stone-500 sm:pr-0 dark:text-stone-400">
                      {f.resumen.ultimo
                        ? `${f.resumen.ultimo.litros} L · ${formatearFecha(f.resumen.ultimo.fecha)}`
                        : <span className="whitespace-nowrap">Sin registros</span>}
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
