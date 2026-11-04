import Link from "next/link";
import {
  calcularEventosCalendario,
  EVENTO_CAL_LABEL,
  type EventoCalendario,
  type TipoEventoCalendario,
} from "@/lib/alertas";
import { Card, SectionTitle, Badge, PageHeader, Vacio } from "@/components/ui";
import { IconoCalendario, IconoFlecha } from "@/components/iconos";
import { formatearFecha } from "@/lib/fechas";
import { etiquetaArete } from "@/lib/tipos";

export const dynamic = "force-dynamic";

// Mismo significado de color que en toda la app (ui.tsx): ámbar = se acerca algo que atender,
// verde = lista. El rojo queda para lo vencido (los partos atrasados se ven en Inicio).
const TONO_EVENTO: Record<TipoEventoCalendario, "verde" | "ambar"> = {
  SECADO: "ambar",
  POR_PARIR: "ambar",
  LISTA_MONTAR: "verde",
};

// Día del mes y día de la semana (en UTC, como se guardan las fechas).
function partesFecha(iso: string) {
  const d = new Date(iso);
  return {
    dia: d.getUTCDate(),
    semana: d.toLocaleDateString("es-MX", { weekday: "short", timeZone: "UTC" }).replace(".", ""),
  };
}

// "2026-10" -> "Octubre 2026" (capitalizado).
function etiquetaMes(clave: string): string {
  const [anio, mes] = clave.split("-").map(Number);
  const d = new Date(anio, mes - 1, 1);
  const texto = d.toLocaleDateString("es-MX", { month: "long", year: "numeric" });
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

// Clave de agrupación por mes a partir del ISO, en UTC (las fechas se guardan en UTC).
function claveMes(iso: string): string {
  const d = new Date(iso);
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

export default async function CalendarioPage() {
  const eventos = await calcularEventosCalendario();

  // Agrupar por mes conservando el orden cronológico ya aplicado.
  const grupos = new Map<string, EventoCalendario[]>();
  for (const e of eventos) {
    const k = claveMes(e.fecha);
    if (!grupos.has(k)) grupos.set(k, []);
    grupos.get(k)!.push(e);
  }
  const meses = Array.from(grupos.keys());

  return (
    <div>
      <PageHeader
        titulo="Calendario"
        subtitulo="Qué viene en los próximos meses, según el ciclo de cada vaca."
      />

      {eventos.length === 0 ? (
        <Card>
          <Vacio
            icono={<IconoCalendario className="h-6 w-6" />}
            mensaje="No hay eventos próximos del ciclo. Registra montas o partos para ver aquí los secados, partos estimados y vacas que quedan listas para montar."
          />
        </Card>
      ) : (
        // En escritorio, los meses en dos columnas para no estirar las filas.
        <div className="grid gap-5 lg:grid-cols-2 lg:items-start">
          {meses.map((k) => (
            <Card key={k}>
              <SectionTitle conteo={grupos.get(k)!.length}>{etiquetaMes(k)}</SectionTitle>
              <ul className="-mx-2 divide-y divide-stone-100 dark:divide-stone-800">
                {grupos.get(k)!.map((e) => {
                  const { dia, semana } = partesFecha(e.fecha);
                  return (
                    <li key={`${e.tipo}-${e.animalId}-${e.fecha}`}>
                      <Link
                        href={`/animales/${e.animalId}`}
                        className="flex items-center gap-3 rounded-xl px-2 py-2.5 transition-colors hover:bg-stone-50 active:bg-stone-100 dark:hover:bg-stone-800/50 dark:active:bg-stone-800"
                      >
                        <time
                          dateTime={e.fecha.slice(0, 10)}
                          title={formatearFecha(e.fecha)}
                          className="grid h-12 w-12 shrink-0 place-content-center rounded-xl bg-stone-100 text-center leading-none dark:bg-stone-800"
                        >
                          <span className="text-lg font-bold text-stone-900 dark:text-stone-50">{dia}</span>
                          <span className="mt-0.5 text-[11px] font-medium capitalize text-stone-500 dark:text-stone-400">{semana}</span>
                        </time>
                        <div className="min-w-0 flex-1">
                          <span className="block truncate font-semibold text-stone-900 dark:text-stone-50">
                            {e.nombre ?? etiquetaArete(e)}
                            {e.nombre && (
                              <span className="ml-1.5 font-normal text-stone-500 dark:text-stone-400">{etiquetaArete(e)}</span>
                            )}
                          </span>
                          <span className="mt-1 block">
                            <Badge tono={TONO_EVENTO[e.tipo]} punto>
                              {EVENTO_CAL_LABEL[e.tipo]}
                            </Badge>
                          </span>
                        </div>
                        <IconoFlecha className="h-4 w-4 shrink-0 text-stone-400 dark:text-stone-600" />
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </Card>
          ))}
        </div>
      )}

      <p className="mt-6 max-w-prose text-xs text-stone-500 dark:text-stone-400">
        Fechas estimadas del ciclo: secado ~7 meses tras la monta, parto ~9 meses, y
        &quot;lista para montar&quot; ~40 días después del parto. Solo se muestran hembras activas.
      </p>
    </div>
  );
}
