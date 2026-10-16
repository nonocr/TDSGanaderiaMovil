import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ruta, leerJson, idObligatorio, opcion, texto, LARGO, ErrorValidacion } from "@/lib/validar";
import { ESTADOS_REPRO, estadoManualVigente, situacionReproductivaVaca } from "@/lib/estado";

// POST /api/estado-reproductivo { vacaId, estado, descripcion? }
// -> cambia A MANO el estado reproductivo de una vaca de lechería.
//    estado = uno de ESTADOS_REPRO, o "AUTOMATICO" para volver al cálculo automático.
//
// El estado se sigue derivando de montas y partos (src/lib/estado.ts, sin cambios en los tiempos).
// El cambio manual se guarda como historial (estado anterior, nuevo, fecha automática y
// descripción) y manda hasta que se registre una monta o un parto después de él.
// El estado anterior lo calcula el servidor (no se confía en el navegador).
export const POST = ruta(async (req: NextRequest) => {
  const body = await leerJson(req);
  const vacaId = idObligatorio(body.vacaId, "La vaca");
  const pedido = opcion(body.estado, [...ESTADOS_REPRO, "AUTOMATICO"] as const, "Estado");
  const estadoNuevo = pedido === "AUTOMATICO" ? null : pedido;
  const descripcion = texto(body.descripcion, "Descripción", LARGO.notas);

  const [vaca, montas, partos, cambios] = await Promise.all([
    prisma.animal.findUnique({ where: { id: vacaId }, select: { sexo: true, modulo: true } }),
    prisma.monta.findMany({ where: { vacaId }, select: { fecha: true, createdAt: true } }),
    prisma.parto.findMany({ where: { vacaId }, select: { fecha: true, createdAt: true } }),
    prisma.cambioEstadoReproductivo.findMany({ where: { vacaId }, select: { fecha: true, estadoNuevo: true } }),
  ]);
  if (!vaca) return NextResponse.json({ error: "Animal no encontrado." }, { status: 404 });
  if (vaca.modulo !== "LECHERIA" || vaca.sexo !== "HEMBRA") {
    throw new ErrorValidacion("El estado reproductivo solo se cambia en vacas de lechería.");
  }

  const ahora = new Date();
  const actual = situacionReproductivaVaca(montas, partos, ahora, cambios);
  const hayManual = estadoManualVigente(cambios, montas, partos) !== undefined;
  if (estadoNuevo === null && !hayManual) {
    throw new ErrorValidacion("El estado ya se calcula automáticamente.");
  }
  if (estadoNuevo !== null && hayManual && actual.estado === estadoNuevo) {
    throw new ErrorValidacion("La vaca ya está en ese estado.");
  }

  const cambio = await prisma.cambioEstadoReproductivo.create({
    data: { vacaId, fecha: ahora, estadoAnterior: actual.estado, estadoNuevo, descripcion },
  });
  return NextResponse.json(cambio, { status: 201 });
});
