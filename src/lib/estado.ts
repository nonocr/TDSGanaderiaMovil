// Estado DERIVADO de un animal (no se almacena): etapa de ternero y estado reproductivo
// de la vaca. Toda la logica de tiempos usa las constantes de fechas.ts (A18).
import {
  MESES_ORDENIO,
  MESES_EMBARAZO,
  DIAS_POSPARTO,
  sumarMeses,
  sumarDias,
} from "@/lib/fechas";

// --- Etapa actual del ternero -----------------------------------------------
// Es la ultima etapa (por fechaInicio) que NO tiene fecha de fin.
export type EtapaMin = { etapa: string; fechaInicio: Date; fechaFin: Date | null };

export function etapaActualTernero(etapas: EtapaMin[]): string | null {
  const abiertas = etapas
    .filter((e) => !e.fechaFin)
    .sort((a, b) => b.fechaInicio.getTime() - a.fechaInicio.getTime());
  return abiertas.length > 0 ? abiertas[0].etapa : null;
}

// --- Estado reproductivo de la vaca (A18, opcion 2) -------------------------
// Codigos usados tambien como valores de filtro.
export type EstadoReproductivo =
  | "ORDENIO"
  | "SECADO"
  | "POR_PARIR"
  | "POSPARTO"
  | "LISTA_MONTAR"
  | null;

export const ESTADO_REPRO_LABEL: Record<string, string> = {
  ORDENIO: "En ordeño",
  SECADO: "En secado",
  POR_PARIR: "Por parir",
  POSPARTO: "Posparto",
  LISTA_MONTAR: "Lista para montar",
};

type MontaMin = { fecha: Date };
type PartoMin = { fecha: Date };

// Ciclo actual de una vaca: su monta MÁS RECIENTE y, si ya parió, el parto más reciente
// posterior (o igual) a esa monta. Base de estado reproductivo, pendientes y calendario.
export function cicloVaca<M extends MontaMin, P extends PartoMin>(
  montas: M[],
  partos: P[]
): { ultimaMonta: M; partoDelCiclo: P | undefined } | null {
  if (montas.length === 0) return null;
  const ultimaMonta = montas.reduce((a, b) => (b.fecha > a.fecha ? b : a));
  const partoDelCiclo = partos
    .filter((p) => p.fecha.getTime() >= ultimaMonta.fecha.getTime())
    .reduce<P | undefined>((a, b) => (!a || b.fecha > a.fecha ? b : a), undefined);
  return { ultimaMonta, partoDelCiclo };
}

export type SituacionVaca = {
  estado: EstadoReproductivo;
  // Fecha estimada de parto (monta + 9 meses). Solo relevante mientras no hay parto.
  partoEstimado: Date | null;
};

// Calcula el estado reproductivo (opcion 2):
// - ordeño/secado/por-parir se derivan de la MONTA mas reciente;
// - posparto/lista se derivan del PARTO real posterior a esa monta.
// hoy es inyectable para pruebas.
export function situacionReproductivaVaca(
  montas: MontaMin[],
  partos: PartoMin[],
  hoy: Date = new Date()
): SituacionVaca {
  const ciclo = cicloVaca(montas, partos);
  if (!ciclo) return { estado: null, partoEstimado: null };
  const { ultimaMonta, partoDelCiclo } = ciclo;

  // Con parto real: posparto 40 dias, luego lista para montar. No hay parto estimado.
  if (partoDelCiclo) {
    const finPosparto = sumarDias(partoDelCiclo.fecha, DIAS_POSPARTO);
    return {
      estado: hoy < finPosparto ? "POSPARTO" : "LISTA_MONTAR",
      partoEstimado: null,
    };
  }

  // Sin parto aun: ubicar en el ciclo desde la monta. Parto estimado = monta + 9 meses.
  const inicioSecado = sumarMeses(ultimaMonta.fecha, MESES_ORDENIO); // mes 7
  const partoEstimado = sumarMeses(ultimaMonta.fecha, MESES_EMBARAZO); // mes 9

  let estado: EstadoReproductivo;
  if (hoy < inicioSecado) estado = "ORDENIO";
  else if (hoy < partoEstimado) estado = "SECADO";
  else estado = "POR_PARIR";

  return { estado, partoEstimado };
}

export function etiquetaEstadoRepro(estado: EstadoReproductivo): string | null {
  if (!estado) return null;
  return ESTADO_REPRO_LABEL[estado] ?? estado;
}
