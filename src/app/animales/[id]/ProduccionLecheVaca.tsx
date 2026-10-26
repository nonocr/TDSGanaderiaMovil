import { Card, SectionTitle } from "@/components/ui";
import { GraficaLecheDiferida } from "@/components/GraficaLecheDiferida";
import { puntosVaca, resumenVaca } from "@/lib/leche";
import { formatearFecha } from "@/lib/fechas";

// Pestaña "Leche" de la ficha de una vaca de lechería: resumen + gráfica de litros/día.
export function ProduccionLecheVaca({ registros }: { registros: { fecha: Date; cantidad: number }[] }) {
  const r = resumenVaca(registros);
  // Cada registro es UN ordeño: el promedio se saca de los totales por DÍA (lo que pinta la
  // gráfica), no de los registros sueltos (daría más o menos la mitad).
  const puntos = puntosVaca(registros);
  const promedioGeneral =
    puntos.length > 0 ? Math.round((puntos.reduce((s, p) => s + p.litros, 0) / puntos.length) * 10) / 10 : null;

  return (
    <Card className="print-evitar-corte">
      <SectionTitle>Producción de leche</SectionTitle>
      {r.registros === 0 ? (
        <p className="text-sm text-stone-500 dark:text-stone-400">
          Aún no hay leche registrada. Anota cada ordeño (mañana y tarde) en la pestaña Registrar → Leche
          para ver aquí la evolución; la app suma los litros de cada día.
        </p>
      ) : (
        <>
          <dl className="mb-3 flex flex-wrap gap-x-5 gap-y-1 text-sm">
            <div className="flex gap-1.5">
              <dt className="text-stone-500 dark:text-stone-400">Último:</dt>
              <dd className="font-semibold text-stone-800 dark:text-stone-100">
                {r.ultimo!.litros} L{" "}
                <span className="font-normal text-stone-500 dark:text-stone-400">({formatearFecha(r.ultimo!.fecha)})</span>
              </dd>
            </div>
            <div className="flex gap-1.5">
              <dt className="text-stone-500 dark:text-stone-400">Promedio 30 días:</dt>
              <dd className="font-semibold text-stone-800 dark:text-stone-100">
                {r.promedio30 !== null ? `${r.promedio30} L/día` : "—"}
              </dd>
            </div>
            <div className="flex gap-1.5">
              <dt className="text-stone-500 dark:text-stone-400">Máximo:</dt>
              <dd className="font-semibold text-stone-800 dark:text-stone-100">{r.maximo} L</dd>
            </div>
            <div className="text-stone-500 dark:text-stone-400">({r.registros} {r.registros === 1 ? "día medido" : "días medidos"})</div>
          </dl>
          {/* La línea de promedio ahora va DENTRO de la gráfica (ReferenceLine). */}
          <GraficaLecheDiferida puntos={puntos} promedio={promedioGeneral} />
          <p className="mt-2 text-xs text-stone-500 dark:text-stone-400">
            Litros por día: el total de los dos ordeños de ese día.
          </p>
        </>
      )}
    </Card>
  );
}
