// Pendientes / avisos derivados del ciclo reproductivo (A18) y fechas reales.
// NO se inventan reglas: todo sale de montas/partos registrados y las constantes de fechas.ts.
import { cache } from "react";
import { prisma } from "@/lib/prisma";
import {
  MESES_ORDENIO,
  MESES_EMBARAZO,
  DIAS_POSPARTO,
  sumarMeses,
  sumarDias,
  diffDias,
} from "@/lib/fechas";
import { cicloVaca } from "@/lib/estado";

export type TipoPendiente =
  | "ORDENIO" // recién montada: entra en ordeño (el ordeño cuenta desde la monta, A18)
  | "SECADO_PROXIMO" // la vaca entra en secado pronto
  | "POR_PARIR" // ya llegó/está por llegar la fecha estimada de parto, sin parto registrado
  | "LISTA_MONTAR"; // pasaron los 40 días desde el parto (sigue en ordeño y ya se puede montar)

export type Pendiente = {
  tipo: TipoPendiente;
  animalId: string;
  arete: string;
  sinArete: boolean;
  areteCenasa: string | null;
  nombre: string | null;
  fecha: string; // ISO, fecha objetivo del aviso
  diasRestantes: number; // negativo si ya pasó
  mensaje: string;
};

// Ventana de anticipación: mostramos avisos que caen dentro de los próximos N días
// o que ya se cumplieron (días negativos).
const VENTANA_DIAS = 20;

export type VacaConCiclo = {
  id: string;
  arete: string;
  sinArete: boolean;
  areteCenasa: string | null;
  nombre: string | null;
  modulo: string;
  // createdAt: lo usa el estado manual (ver estadoManualVigente); los avisos solo usan la fecha.
  montasComoVaca: { fecha: Date; createdAt: Date }[];
  partosComoVaca: { fecha: Date; createdAt: Date }[];
};

// Carga TODAS las hembras activas (de cualquier módulo) con las fechas de sus montas y partos.
// Tres consultas EN PARALELO (en vez de encadenadas). Se memoiza con `cache` SIN argumentos, para
// que una sola lectura sirva a toda la petición; el filtro por módulo se hace en memoria
// (`cargarVacasConCiclo`). Antes se llamaba con/sin módulo y `cache` repetía las 3 consultas por
// tener argumentos distintos.
const cargarTodasLasVacas = cache(async (): Promise<VacaConCiclo[]> => {
  const where = { sexo: "HEMBRA", estado: "ACTIVO" };
  const [vacas, montas, partos] = await Promise.all([
    prisma.animal.findMany({ where, select: { id: true, arete: true, sinArete: true, areteCenasa: true, nombre: true, modulo: true } }),
    prisma.monta.findMany({ where: { vaca: where }, select: { vacaId: true, fecha: true, createdAt: true } }),
    prisma.parto.findMany({ where: { vaca: where }, select: { vacaId: true, fecha: true, createdAt: true } }),
  ]);
  const porVaca = new Map<string, VacaConCiclo>(
    vacas.map((v) => [v.id, { ...v, montasComoVaca: [], partosComoVaca: [] }])
  );
  for (const m of montas) porVaca.get(m.vacaId)?.montasComoVaca.push({ fecha: m.fecha, createdAt: m.createdAt });
  for (const p of partos) porVaca.get(p.vacaId)?.partosComoVaca.push({ fecha: p.fecha, createdAt: p.createdAt });
  return [...porVaca.values()];
});

// Hembras activas con su ciclo, de un módulo o de todos. Reutiliza la carga única y filtra en
// memoria. Pendientes y calendario usan TODAS (no perder un aviso si se registró una monta fuera
// de lechería); el desglose de la página de Lechería usa solo "LECHERIA".
export async function cargarVacasConCiclo(modulo?: string): Promise<VacaConCiclo[]> {
  const todas = await cargarTodasLasVacas();
  return modulo ? todas.filter((v) => v.modulo === modulo) : todas;
}

export async function calcularPendientes(hoy: Date = new Date()): Promise<Pendiente[]> {
  const vacas = await cargarVacasConCiclo();

  const pendientes: Pendiente[] = [];

  for (const v of vacas) {
    const ciclo = cicloVaca(v.montasComoVaca, v.partosComoVaca);
    if (!ciclo) continue;
    const { ultimaMonta, partoDelCiclo } = ciclo;

    if (partoDelCiclo) {
      // Hay parto: aviso de "lista para montar" a los 40 días.
      const objetivo = sumarDias(partoDelCiclo.fecha, DIAS_POSPARTO);
      const dias = diffDias(hoy, objetivo);
      if (dias <= VENTANA_DIAS) {
        pendientes.push({
          tipo: "LISTA_MONTAR",
          animalId: v.id,
          arete: v.arete,
          sinArete: v.sinArete,
          areteCenasa: v.areteCenasa,
          nombre: v.nombre,
          fecha: objetivo.toISOString(),
          diasRestantes: dias,
          mensaje:
            dias > 0
              ? `Lista para montar en ${dias} día(s).`
              : `Lista para montar (desde hace ${Math.abs(dias)} día(s)).`,
        });
      }
      continue;
    }

    // Sin parto aún: ubicar en el ciclo (ordeño -> secado -> por parir).
    const inicioSecado = sumarMeses(ultimaMonta.fecha, MESES_ORDENIO); // mes 7
    const partoEstimado = sumarMeses(ultimaMonta.fecha, MESES_EMBARAZO); // mes 9

    const diasSecado = diffDias(hoy, inicioSecado);
    const diasParto = diffDias(hoy, partoEstimado);
    const diasDesdeMonta = diffDias(ultimaMonta.fecha, hoy); // positivo: cuántos días lleva montada

    if (diasParto <= VENTANA_DIAS) {
      // Cerca o pasada la fecha estimada de parto.
      pendientes.push({
        tipo: "POR_PARIR",
        animalId: v.id,
        arete: v.arete,
        sinArete: v.sinArete,
        areteCenasa: v.areteCenasa,
        nombre: v.nombre,
        fecha: partoEstimado.toISOString(),
        diasRestantes: diasParto,
        mensaje:
          diasParto > 0
            ? `Parto estimado en ${diasParto} día(s).`
            : `Parto estimado vencido hace ${Math.abs(diasParto)} día(s); registra el parto.`,
      });
    } else if (diasSecado <= VENTANA_DIAS) {
      // Aún no toca el parto, pero el secado está cerca o en curso.
      pendientes.push({
        tipo: "SECADO_PROXIMO",
        animalId: v.id,
        arete: v.arete,
        sinArete: v.sinArete,
        areteCenasa: v.areteCenasa,
        nombre: v.nombre,
        fecha: inicioSecado.toISOString(),
        diasRestantes: diasSecado,
        mensaje:
          diasSecado > 0
            ? `Entra en secado en ${diasSecado} día(s).`
            : `En secado (desde hace ${Math.abs(diasSecado)} día(s)).`,
      });
    } else if (diasDesdeMonta >= 0 && diasDesdeMonta <= VENTANA_DIAS) {
      // Recién montada: entra en ordeño (el ordeño cuenta desde la monta).
      pendientes.push({
        tipo: "ORDENIO",
        animalId: v.id,
        arete: v.arete,
        sinArete: v.sinArete,
        areteCenasa: v.areteCenasa,
        nombre: v.nombre,
        fecha: ultimaMonta.fecha.toISOString(),
        diasRestantes: -diasDesdeMonta, // 0 hoy, negativo si ya pasaron días
        mensaje:
          diasDesdeMonta === 0
            ? "Montada hoy; entra en ordeño."
            : `En ordeño (montada hace ${diasDesdeMonta} día(s)).`,
      });
    }
  }

  // Orden: lo más urgente primero (menos días restantes).
  pendientes.sort((a, b) => a.diasRestantes - b.diasRestantes);
  return pendientes;
}

export const PENDIENTE_LABEL: Record<TipoPendiente, string> = {
  ORDENIO: "Ordeño",
  SECADO_PROXIMO: "Secado",
  POR_PARIR: "Parto",
  LISTA_MONTAR: "Monta",
};

// --- Calendario: eventos del ciclo con fecha, SIN ventana de anticipación -----
// A diferencia de calcularPendientes (que solo muestra lo cercano), aquí se listan
// todos los hitos futuros del ciclo de cada vaca para poder planear por mes.

export type TipoEventoCalendario = "SECADO" | "POR_PARIR" | "LISTA_MONTAR";

export type EventoCalendario = {
  tipo: TipoEventoCalendario;
  animalId: string;
  arete: string;
  sinArete: boolean;
  areteCenasa: string | null;
  nombre: string | null;
  fecha: string; // ISO, fecha del hito
};

export const EVENTO_CAL_LABEL: Record<TipoEventoCalendario, string> = {
  SECADO: "Entra en secado",
  POR_PARIR: "Parto estimado",
  LISTA_MONTAR: "Lista para montar",
};

export async function calcularEventosCalendario(
  hoy: Date = new Date()
): Promise<EventoCalendario[]> {
  const vacas = await cargarVacasConCiclo();

  const eventos: EventoCalendario[] = [];
  // Solo nos interesan hitos desde el inicio del mes actual en adelante.
  const inicioMes = new Date(Date.UTC(hoy.getUTCFullYear(), hoy.getUTCMonth(), 1)); // fechas en UTC

  const agregar = (
    tipo: TipoEventoCalendario,
    v: VacaConCiclo,
    fecha: Date
  ) => {
    if (fecha.getTime() < inicioMes.getTime()) return; // ya pasó: no lo mostramos
    eventos.push({
      tipo,
      animalId: v.id,
      arete: v.arete,
      sinArete: v.sinArete,
      areteCenasa: v.areteCenasa,
      nombre: v.nombre,
      fecha: fecha.toISOString(),
    });
  };

  for (const v of vacas) {
    const ciclo = cicloVaca(v.montasComoVaca, v.partosComoVaca);
    if (!ciclo) continue;
    const { ultimaMonta, partoDelCiclo } = ciclo;

    if (partoDelCiclo) {
      // Ya parió: el hito futuro es "lista para montar" a los 40 días.
      agregar("LISTA_MONTAR", v, sumarDias(partoDelCiclo.fecha, DIAS_POSPARTO));
    } else {
      // Sin parto aún: secado (mes 7) y parto estimado (mes 9).
      agregar("SECADO", v, sumarMeses(ultimaMonta.fecha, MESES_ORDENIO));
      agregar("POR_PARIR", v, sumarMeses(ultimaMonta.fecha, MESES_EMBARAZO));
    }
  }

  eventos.sort((a, b) => a.fecha.localeCompare(b.fecha));
  return eventos;
}
