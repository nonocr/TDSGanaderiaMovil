import { prisma } from "@/lib/prisma";

// Producción de leche. Cada RegistroLeche es UN ordeño (turno MANANA/TARDE) de una vaca; los
// registros viejos sin turno son el total del día. Todo se calcula en litros/DÍA sumando los
// ordeños de la misma jornada. Normalmente se mide una vez por semana.

// Punto de una gráfica de leche (serializable: se pasa a un componente de cliente).
export type PuntoLeche = {
  clave: string; // única y ordenable (ISO o "2026-W40")
  etiqueta: string; // eje X
  titulo: string; // tooltip
  litros: number;
  detalle?: string; // tooltip, línea extra
};

const MS_DIA = 24 * 60 * 60 * 1000;
const redondear = (n: number) => Math.round(n * 10) / 10;
const fmt = (d: Date, o: Intl.DateTimeFormatOptions) => d.toLocaleDateString("es-MX", { ...o, timeZone: "UTC" });

// Clave de día (YYYY-MM-DD en UTC) para agrupar los ordeños de una misma jornada.
const claveDia = (d: Date) => d.toISOString().slice(0, 10);

// Agrupa ordeños por DÍA sumando los litros (mañana + tarde). Devuelve un total por día,
// ordenado cronológicamente. Cada RegistroLeche es un ordeño; el día es la suma.
type RegistroMin = { fecha: Date; cantidad: number };
function totalesPorDia(registros: RegistroMin[]): { fecha: Date; litros: number }[] {
  const porDia = new Map<string, { fecha: Date; litros: number }>();
  for (const r of registros) {
    const k = claveDia(r.fecha);
    const prev = porDia.get(k);
    if (prev) prev.litros += r.cantidad;
    else porDia.set(k, { fecha: r.fecha, litros: r.cantidad });
  }
  return [...porDia.values()]
    .map((d) => ({ fecha: d.fecha, litros: redondear(d.litros) }))
    .sort((a, b) => a.fecha.getTime() - b.fecha.getTime());
}

// --- Una vaca -----------------------------------------------------------------

export function puntosVaca(registros: RegistroMin[]): PuntoLeche[] {
  // Un punto por DÍA (mañana + tarde sumados), no por ordeño.
  return totalesPorDia(registros).map((d) => ({
    clave: d.fecha.toISOString(),
    etiqueta: fmt(d.fecha, { day: "numeric", month: "short" }),
    titulo: fmt(d.fecha, { day: "numeric", month: "long", year: "numeric" }),
    litros: d.litros,
  }));
}

export type ResumenVaca = {
  ultimo: { litros: number; fecha: Date } | null;
  promedio30: number | null; // promedio de los TOTALES DIARIOS de los últimos 30 días
  maximo: number | null; // mejor día
  registros: number; // nº de días con registro
};

export function resumenVaca(registros: RegistroMin[], hoy = new Date()): ResumenVaca {
  const dias = totalesPorDia(registros);
  if (dias.length === 0) return { ultimo: null, promedio30: null, maximo: null, registros: 0 };
  const ultimo = dias[dias.length - 1]; // ya vienen ordenados por fecha
  const recientes = dias.filter((d) => hoy.getTime() - d.fecha.getTime() <= 30 * MS_DIA);
  return {
    ultimo: { litros: ultimo.litros, fecha: ultimo.fecha },
    promedio30: recientes.length
      ? redondear(recientes.reduce((s, d) => s + d.litros, 0) / recientes.length)
      : null,
    maximo: Math.max(...dias.map((d) => d.litros)),
    registros: dias.length,
  };
}

// --- Todo el hato -------------------------------------------------------------

export type Vista = "semanas" | "meses";
const PERIODOS: Record<Vista, number> = { semanas: 16, meses: 12 };

// Inicio del periodo que contiene `d` (lunes de la semana o día 1 del mes), en UTC.
function inicioPeriodo(d: Date, vista: Vista): Date {
  if (vista === "meses") return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1));
  const dia = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const desdeLunes = (dia.getUTCDay() + 6) % 7;
  return new Date(dia.getTime() - desdeLunes * MS_DIA);
}

function anterior(inicio: Date, vista: Vista): Date {
  if (vista === "meses") return new Date(Date.UTC(inicio.getUTCFullYear(), inicio.getUTCMonth() - 1, 1));
  return new Date(inicio.getTime() - 7 * MS_DIA);
}

function etiquetas(inicio: Date, vista: Vista): { etiqueta: string; titulo: string } {
  if (vista === "meses") {
    const t = fmt(inicio, { month: "long", year: "numeric" });
    return { etiqueta: fmt(inicio, { month: "short" }), titulo: t.charAt(0).toUpperCase() + t.slice(1) };
  }
  return {
    etiqueta: fmt(inicio, { day: "numeric", month: "short" }),
    titulo: `Semana del ${fmt(inicio, { day: "numeric", month: "long", year: "numeric" })}`,
  };
}

export type FilaVaca = {
  id: string;
  arete: string;
  nombre: string | null;
  resumen: ResumenVaca;
};

// Producción del hato de lechería por semana o por mes.
// Como cada vaca se mide en días distintos, sumar los registros de un día no sirve. Para cada
// periodo se promedia cada vaca (litros/día) y se suman esos promedios: "litros por día del
// hato" estimados con las vacas que se midieron en ese periodo.
export async function produccionHato(vista: Vista, hoy = new Date()) {
  let inicio = inicioPeriodo(hoy, vista);
  const periodos: Date[] = [inicio];
  for (let i = 1; i < PERIODOS[vista]; i++) periodos.unshift((inicio = anterior(inicio, vista)));
  const desde = periodos[0];
  // Para el promedio de 30 días de la tabla también hace falta ese tramo.
  const desdeConsulta = new Date(Math.min(desde.getTime(), hoy.getTime() - 30 * MS_DIA));

  const [registros, vacas, ultimos] = await Promise.all([
    prisma.registroLeche.findMany({
      where: { fecha: { gte: desdeConsulta }, vaca: { modulo: "LECHERIA" } },
      select: { vacaId: true, fecha: true, cantidad: true },
    }),
    prisma.animal.findMany({
      where: { modulo: "LECHERIA", estado: "ACTIVO" },
      select: { id: true, arete: true, nombre: true },
      orderBy: { arete: "asc" },
    }),
    // Fecha del último registro de cada vaca activa, aunque sea anterior al rango de la gráfica.
    // groupBy + _max se resuelve en la base (un `distinct` de Prisma 5 leería todo el histórico).
    prisma.registroLeche.groupBy({
      by: ["vacaId"],
      where: { vaca: { modulo: "LECHERIA", estado: "ACTIVO" } },
      _max: { fecha: true },
    }),
  ]);

  // Cada registro es un ORDEÑO. Para "litros/día" por vaca en un periodo: primero se suman
  // los ordeños del mismo día (clave vaca+día), y luego se promedian esos totales diarios.
  // periodo -> (vaca+día) -> litros del día
  const porPeriodo = new Map<number, Map<string, number>>(periodos.map((p) => [p.getTime(), new Map()]));
  for (const r of registros) {
    const grupo = porPeriodo.get(inicioPeriodo(r.fecha, vista).getTime());
    if (!grupo) continue;
    const k = `${r.vacaId}|${claveDia(r.fecha)}`;
    grupo.set(k, (grupo.get(k) ?? 0) + r.cantidad);
  }

  const puntos: PuntoLeche[] = periodos.map((p) => {
    const grupo = porPeriodo.get(p.getTime())!;
    // Agrupar los totales diarios por vaca para promediar los días de cada una.
    const diasPorVaca = new Map<string, number[]>();
    for (const [k, litrosDia] of grupo) {
      const vacaId = k.slice(0, k.indexOf("|"));
      const dias = diasPorVaca.get(vacaId);
      if (dias) dias.push(litrosDia);
      else diasPorVaca.set(vacaId, [litrosDia]);
    }
    const promedios = [...diasPorVaca.values()].map((dias) => dias.reduce((s, x) => s + x, 0) / dias.length);
    const litros = redondear(promedios.reduce((s, x) => s + x, 0));
    const n = promedios.length;
    return {
      clave: p.toISOString(),
      ...etiquetas(p, vista),
      litros,
      detalle: n ? `${n} ${n === 1 ? "vaca medida" : "vacas medidas"} · ${redondear(litros / n)} L por vaca` : "Sin registros",
    };
  });

  // El último registro puede ser anterior al rango consultado: entonces se traen TODOS los
  // ordeños de ese día (mañana + tarde) para que "último" sea el total del día.
  const fuera = ultimos
    .map((u) => ({ vacaId: u.vacaId, fecha: u._max.fecha }))
    .filter((u): u is { vacaId: string; fecha: Date } => u.fecha !== null && u.fecha < desdeConsulta);
  const extra = fuera.length
    ? await prisma.registroLeche.findMany({
        where: {
          OR: fuera.map((u) => {
            const dia = new Date(`${claveDia(u.fecha)}T00:00:00.000Z`);
            return { vacaId: u.vacaId, fecha: { gte: dia, lt: new Date(dia.getTime() + MS_DIA) } };
          }),
        },
        select: { vacaId: true, fecha: true, cantidad: true },
      })
    : [];

  const filas: FilaVaca[] = vacas.map((v) => {
    const propios = [...registros, ...extra].filter((r) => r.vacaId === v.id);
    return { ...v, resumen: resumenVaca(propios, hoy) };
  });
  // Primero las que más producen (últimos 30 días); al final las que no tienen registros.
  filas.sort((a, b) => (b.resumen.promedio30 ?? -1) - (a.resumen.promedio30 ?? -1));

  return { puntos, filas };
}
