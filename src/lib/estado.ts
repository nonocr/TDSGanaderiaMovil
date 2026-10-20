// Estado DERIVADO de un animal (no se almacena): etapa de ternero y estado reproductivo
// de la vaca. Toda la logica de tiempos usa las constantes de fechas.ts (A18).
import {
  MESES_ORDENIO,
  MESES_EMBARAZO,
  DIAS_POSPARTO,
  sumarMeses,
  sumarDias,
} from "@/lib/fechas";

// --- Etapa actual del ternero (registro manual, histórico) ------------------
// Es la ultima etapa (por fechaInicio) que NO tiene fecha de fin. Desde 2026-10-16 solo se usa
// fuera de Engorde (en Engorde la etapa sale de la edad: etapaPorEdad).
export type EtapaMin = { etapa: string; fechaInicio: Date; fechaFin: Date | null };

export function etapaActualTernero(etapas: EtapaMin[]): string | null {
  const abiertas = etapas
    .filter((e) => !e.fechaFin)
    .sort((a, b) => b.fechaInicio.getTime() - a.fechaInicio.getTime());
  return abiertas.length > 0 ? abiertas[0].etapa : null;
}

// --- Etapa de engorde por EDAD ---------------------------------------------
// Se calcula siempre desde la fecha de nacimiento (no se guarda): cambia sola con el tiempo.
//   Destete:    desde el nacimiento hasta antes de cumplir 4 meses.
//   Desarrollo: desde los 4 meses hasta antes de cumplir 16 (un año después del destete).
//   Engorde:    desde los 16 meses.
// Meses de calendario cumplidos (no días aproximados). Sin fecha de nacimiento válida -> null.
export const MESES_FIN_DESTETE = 4;
export const MESES_FIN_DESARROLLO = 16;
export type EtapaEdad = "DESTETE" | "DESARROLLO" | "ENGORDE";

// Meses completos entre el nacimiento y `hoy` (en UTC, como se guardan las fechas).
// Se cumple el mes el mismo día del mes que el nacimiento.
export function mesesCumplidos(nacimiento: Date, hoy: Date): number {
  let meses =
    (hoy.getUTCFullYear() - nacimiento.getUTCFullYear()) * 12 + (hoy.getUTCMonth() - nacimiento.getUTCMonth());
  if (hoy.getUTCDate() < nacimiento.getUTCDate()) meses -= 1;
  return meses;
}

// Día en que se cumplen `meses` desde el nacimiento (mismo criterio que mesesCumplidos): el mismo
// día del mes; si ese mes no tiene ese día (p. ej. 31), el 1 del mes siguiente.
export function fechaCumpleMeses(nacimiento: Date, meses: number): Date {
  const mes = nacimiento.getUTCMonth() + meses;
  const d = new Date(Date.UTC(nacimiento.getUTCFullYear(), mes, nacimiento.getUTCDate()));
  const esperado = ((mes % 12) + 12) % 12;
  return d.getUTCMonth() === esperado ? d : new Date(Date.UTC(nacimiento.getUTCFullYear(), mes + 1, 1));
}

// Inicio de cada etapa por edad (ISO), para mostrar la línea de tiempo. null sin nacimiento.
export function iniciosEtapasEdad(nacimiento: Date | null): Record<EtapaEdad, string> | null {
  if (!nacimiento || isNaN(nacimiento.getTime())) return null;
  return {
    DESTETE: nacimiento.toISOString(),
    DESARROLLO: fechaCumpleMeses(nacimiento, MESES_FIN_DESTETE).toISOString(),
    ENGORDE: fechaCumpleMeses(nacimiento, MESES_FIN_DESARROLLO).toISOString(),
  };
}

export function etapaPorEdad(
  nacimiento: Date | string | null | undefined,
  hoy: Date = new Date()
): EtapaEdad | null {
  if (!nacimiento) return null;
  const n = typeof nacimiento === "string" ? new Date(nacimiento) : nacimiento;
  if (isNaN(n.getTime()) || n.getTime() > hoy.getTime()) return null;
  const meses = mesesCumplidos(n, hoy);
  if (meses < MESES_FIN_DESTETE) return "DESTETE";
  if (meses < MESES_FIN_DESARROLLO) return "DESARROLLO";
  return "ENGORDE";
}

// Etapa que se muestra de un animal: en Engorde, la de su edad; en otros módulos, la última
// etapa manual abierta (comportamiento anterior, sin cambios).
export function etapaDeAnimal(
  a: { modulo: string; fechaNacimiento: Date | null },
  etapasManuales: EtapaMin[],
  hoy: Date = new Date()
): string | null {
  return a.modulo === "ENGORDE" ? etapaPorEdad(a.fechaNacimiento, hoy) : etapaActualTernero(etapasManuales);
}

// --- Estado reproductivo de la vaca (A18, opcion 2) -------------------------
// Codigos usados tambien como valores de filtro.
export type EstadoReproductivo =
  | "ORDENIO"
  | "SECADO"
  | "POR_PARIR"
  | "LISTA_MONTAR"
  | null;

export const ESTADO_REPRO_LABEL: Record<string, string> = {
  ORDENIO: "En ordeño",
  SECADO: "En secado",
  POR_PARIR: "Por parir",
  LISTA_MONTAR: "Lista para montar",
};

// Estados que se pueden fijar a mano (CambioEstadoReproductivo.estadoNuevo).
export const ESTADOS_REPRO = ["ORDENIO", "SECADO", "POR_PARIR", "LISTA_MONTAR"] as const;

// createdAt: cuándo se REGISTRÓ (lo usa el estado manual; ver estadoManualVigente).
type MontaMin = { fecha: Date; createdAt?: Date };
type PartoMin = { fecha: Date; createdAt?: Date };

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
  // true si el estado lo fijó alguien a mano (CambioEstadoReproductivo) y sigue vigente.
  manual?: boolean;
  // Tras parir, la vaca queda EN ORDEÑO y, pasados 40 días, además "lista para montar": por eso es
  // un indicador aparte del estado (se muestran los dos: "En ordeño · Lista para montar").
  listaParaMontar: boolean;
};

// --- Estado reproductivo MANUAL ----------------------------------------------
// Un cambio manual manda sobre el cálculo automático hasta que se REGISTRE una monta o un parto
// después de él (decisión del dueño, 2026-10-16); entonces vuelve el cálculo automático, que no
// cambia. Un cambio con estadoNuevo = null es "volver a automático".
// Se compara con `createdAt` (cuándo se anotó) porque las montas/partos se guardan con el día a
// medianoche y el cambio con la hora exacta: una monta anotada hoy, después del cambio, lo cierra.
export type CambioManualMin = { fecha: Date; estadoNuevo: string | null };

export function estadoManualVigente(
  cambios: CambioManualMin[],
  montas: MontaMin[],
  partos: PartoMin[]
): EstadoReproductivo | undefined {
  if (cambios.length === 0) return undefined;
  const ultimo = cambios.reduce((a, b) => (b.fecha > a.fecha ? b : a));
  if (!ultimo.estadoNuevo) return undefined;
  const registradoDespues = (e: MontaMin | PartoMin) => (e.createdAt ?? e.fecha).getTime() > ultimo.fecha.getTime();
  if (montas.some(registradoDespues) || partos.some(registradoDespues)) return undefined;
  return ultimo.estadoNuevo as EstadoReproductivo;
}

// Calcula el estado reproductivo (opcion 2):
// - ordeño/secado/por-parir se derivan de la MONTA mas reciente;
// - posparto/lista se derivan del PARTO real posterior a esa monta.
// Si hay un cambio manual vigente (`cambios`), ese estado manda (ver estadoManualVigente); el
// parto estimado solo se muestra si el estado manual es de vaca preñada.
// hoy es inyectable para pruebas.
export function situacionReproductivaVaca(
  montas: MontaMin[],
  partos: PartoMin[],
  hoy: Date = new Date(),
  cambios: CambioManualMin[] = []
): SituacionVaca {
  const auto = situacionAutomatica(montas, partos, hoy);
  const manual = estadoManualVigente(cambios, montas, partos);
  if (manual === undefined) return auto;
  const prenada = manual === "ORDENIO" || manual === "SECADO" || manual === "POR_PARIR";
  // Un estado manual es un valor único; "lista para montar" solo si así se fijó a mano.
  return {
    estado: manual,
    partoEstimado: prenada ? auto.partoEstimado : null,
    manual: true,
    listaParaMontar: manual === "LISTA_MONTAR",
  };
}

function situacionAutomatica(montas: MontaMin[], partos: PartoMin[], hoy: Date): SituacionVaca {
  const ciclo = cicloVaca(montas, partos);
  if (!ciclo) return { estado: null, partoEstimado: null, listaParaMontar: false };
  const { ultimaMonta, partoDelCiclo } = ciclo;

  // Con parto real: la vaca vuelve a ORDEÑO (hasta la próxima monta/secado del siguiente ciclo) y,
  // pasados 40 días del parto, además queda "lista para montar". Se muestran los dos. No hay parto
  // estimado hasta que se registre una nueva monta.
  if (partoDelCiclo) {
    const listaDesde = sumarDias(partoDelCiclo.fecha, DIAS_POSPARTO);
    return {
      estado: "ORDENIO",
      partoEstimado: null,
      listaParaMontar: hoy >= listaDesde,
    };
  }

  // Sin parto aun: ubicar en el ciclo desde la monta. Parto estimado = monta + 9 meses.
  const inicioSecado = sumarMeses(ultimaMonta.fecha, MESES_ORDENIO); // mes 7
  const partoEstimado = sumarMeses(ultimaMonta.fecha, MESES_EMBARAZO); // mes 9

  let estado: EstadoReproductivo;
  if (hoy < inicioSecado) estado = "ORDENIO";
  else if (hoy < partoEstimado) estado = "SECADO";
  else estado = "POR_PARIR";

  return { estado, partoEstimado, listaParaMontar: false };
}

export function etiquetaEstadoRepro(estado: EstadoReproductivo): string | null {
  if (!estado) return null;
  return ESTADO_REPRO_LABEL[estado] ?? estado;
}
