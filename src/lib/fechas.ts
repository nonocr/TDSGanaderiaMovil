// Utilidades de fecha. Los tiempos del ciclo (7 meses de ordeño, 9 de embarazo, 40 días de
// posparto) vienen de docs/02-reglas-de-negocio.md (A18, B11 confirmados). Se centralizan aquí
// para poder ajustarlos en un solo lugar.
//
// Todas las fechas se guardan a medianoche UTC (solo importa el día): la aritmética se hace en
// UTC para que el resultado no dependa de la zona horaria del servidor (Vercel = UTC, la app
// local de la finca = UTC-6).

// Tiempos del ciclo de la vaca (A18). Contados desde la MONTA salvo DIAS_POSPARTO.
export const MESES_EMBARAZO = 9; // embarazo total: monta -> parto estimado
export const MESES_ORDENIO = 7; // 0..7 meses desde la monta = en ordeño
export const DIAS_POSPARTO = 40; // dias de posparto tras el parto real (A12)
// Secado = meses MESES_ORDENIO..MESES_EMBARAZO (7 a 9) desde la monta.

export function sumarDias(fecha: Date, dias: number): Date {
  const d = new Date(fecha);
  d.setUTCDate(d.getUTCDate() + dias);
  return d;
}

export function sumarMeses(fecha: Date, meses: number): Date {
  const d = new Date(fecha);
  d.setUTCMonth(d.getUTCMonth() + meses);
  return d;
}

export function formatearFecha(fecha: Date | string | null | undefined): string {
  if (!fecha) return "—";
  const d = typeof fecha === "string" ? new Date(fecha) : fecha;
  if (isNaN(d.getTime())) return "—";
  // Las fechas se guardan como medianoche UTC (solo importa el dia). Formateamos en UTC
  // para que el dia mostrado coincida con el capturado, sin desfase por zona horaria.
  return d.toLocaleDateString("es-MX", {
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

// Día de HOY según la zona horaria del dispositivo, como "YYYY-MM-DD".
// Se usa para las fechas por defecto de los formularios: con `toISOString()` (UTC), en la
// finca (UTC-6) a partir de las 18:00 el día saltaba al siguiente. Esto usa el día local.
export function hoyLocalISO(): string {
  const d = new Date();
  const mes = String(d.getMonth() + 1).padStart(2, "0");
  const dia = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mes}-${dia}`;
}

// Diferencia en dias (b - a). Positivo si b es posterior a a.
export function diffDias(a: Date, b: Date): number {
  const ms = b.getTime() - a.getTime();
  return Math.round(ms / (1000 * 60 * 60 * 24));
}

// Edad legible a partir de la fecha de nacimiento. Si se da `hasta` (p.ej. fecha de
// baja), calcula la edad a esa fecha; si no, a hoy. Devuelve "—" si no hay nacimiento.
// Formato: "2 años 3 meses", "5 meses", "12 días".
export function calcularEdad(
  nacimiento: Date | string | null | undefined,
  hasta?: Date | string | null
): string {
  if (!nacimiento) return "—";
  const ini = typeof nacimiento === "string" ? new Date(nacimiento) : nacimiento;
  if (isNaN(ini.getTime())) return "—";
  const fin = hasta ? (typeof hasta === "string" ? new Date(hasta) : hasta) : new Date();
  if (isNaN(fin.getTime()) || fin.getTime() < ini.getTime()) return "—";

  // UTC en todo el cálculo: las fechas se guardan a medianoche UTC (igual que mesesCumplidos y el
  // resto del dominio). Con getters locales, en la finca (UTC-6) una fecha a medianoche UTC se lee
  // como las 18:00 del día anterior y podía dar un día/mes de menos en el borde.
  let anios = fin.getUTCFullYear() - ini.getUTCFullYear();
  let meses = fin.getUTCMonth() - ini.getUTCMonth();
  const dias = fin.getUTCDate() - ini.getUTCDate();

  if (dias < 0) meses -= 1;
  if (meses < 0) {
    anios -= 1;
    meses += 12;
  }

  const parteAnios = anios > 0 ? `${anios} año${anios === 1 ? "" : "s"}` : "";
  const parteMeses = meses > 0 ? `${meses} mes${meses === 1 ? "" : "es"}` : "";

  if (anios > 0) return [parteAnios, parteMeses].filter(Boolean).join(" ");
  if (meses > 0) return parteMeses;

  // Menos de un mes: mostrar días.
  const d = diffDias(ini, fin);
  if (d <= 0) return "Recién nacido";
  return `${d} día${d === 1 ? "" : "s"}`;
}
