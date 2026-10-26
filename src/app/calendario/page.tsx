import Link from "next/link";
import {
  calcularEventosCalendario,
  EVENTO_CAL_LABEL,
  type EventoCalendario,
  type TipoEventoCalendario,
} from "@/lib/alertas";
import { Card, SectionTitle, Badge, PageHeader, Vacio } from "@/components/ui";
import { IconoCalendario } from "@/components/iconos";
import { formatearFecha } from "@/lib/fechas";
import { etiquetaArete } from "@/lib/tipos";

export const dynamic = "force-dynamic";

const TONO_EVENTO: Record<TipoEventoCalendario, "verde" | "ambar" | "rojo"> = {
  SECADO: "ambar",
  POR_PARIR: "rojo",
  LISTA_MONTAR: "verde",
};

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
        <div className="space-y-6">
          {meses.map((k) => (
            <Card key={k}>
              <SectionTitle>{etiquetaMes(k)}</SectionTitle>
              <ul className="divide-y divide-stone-100 dark:divide-stone-800">
                {grupos.get(k)!.map((e) => (
                  <li key={`${e.tipo}-${e.animalId}-${e.fecha}`}>
                    <Link
                      href={`/animales/${e.animalId}`}
                      className="-mx-2 flex items-start justify-between gap-3 rounded-lg px-2 py-3 transition-colors hover:bg-stone-50 active:bg-stone-100 dark:hover:bg-stone-800/50 dark:active:bg-stone-800"
                    >
                      <div className="flex min-w-0 items-start gap-3">
                        <Badge tono={TONO_EVENTO[e.tipo]} punto>
                          {EVENTO_CAL_LABEL[e.tipo]}
                        </Badge>
                        <span className="min-w-0 font-medium text-stone-800 dark:text-stone-100">
                          {e.nombre ? `${e.nombre} (${etiquetaArete(e)})` : etiquetaArete(e)}
                        </span>
                      </div>
                      <span className="shrink-0 whitespace-nowrap text-xs text-stone-500 dark:text-stone-400">
                        {formatearFecha(e.fecha)}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </Card>
          ))}
        </div>
      )}

      <p className="mt-6 text-xs text-stone-500 dark:text-stone-400">
        Fechas estimadas del ciclo: secado ~7 meses tras la monta, parto ~9 meses, y
        &quot;lista para montar&quot; ~40 días después del parto. Solo se muestran hembras activas.
      </p>
    </div>
  );
}
