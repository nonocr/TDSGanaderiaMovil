import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ruta, leerJson, id, idObligatorio, fechaObligatoria, numeroObligatorio, texto, opcion, TURNOS, LARGO, ErrorValidacion } from "@/lib/validar";

const MS_DIA = 24 * 60 * 60 * 1000;

// POST /api/leche -> registro de UN ordeño (vaca + fecha + turno + litros de ese ordeño).
// `id` opcional: lo genera el teléfono para los registros hechos sin señal (src/lib/cola-offline.ts).
// Si ese id ya existe, el envío anterior sí llegó: se devuelve el registro sin duplicarlo.
export const POST = ruta(async (req: NextRequest) => {
  const body = await leerJson(req);
  const idCliente = id(body.id, "Identificador");
  if (idCliente) {
    const ya = await prisma.registroLeche.findUnique({ where: { id: idCliente } });
    if (ya) return NextResponse.json(ya, { status: 200 });
  }
  const vacaId = idObligatorio(body.vacaId, "La vaca");
  const fecha = fechaObligatoria(body.fecha, "La fecha");
  // Turno del ordeño (opcional). Si viene, debe ser MANANA o TARDE.
  const turno = body.turno ? opcion(body.turno, TURNOS, "Turno") : null;

  // Un solo ordeño de cada turno por vaca y día (evita duplicados por doble envío).
  if (turno) {
    const dia = new Date(Date.UTC(fecha.getUTCFullYear(), fecha.getUTCMonth(), fecha.getUTCDate()));
    const repetido = await prisma.registroLeche.findFirst({
      where: { vacaId, turno, fecha: { gte: dia, lt: new Date(dia.getTime() + MS_DIA) } },
      select: { id: true },
    });
    if (repetido) {
      const nombre = turno === "MANANA" ? "de la mañana" : "de la tarde";
      throw new ErrorValidacion(`Ya hay un ordeño ${nombre} registrado ese día para esta vaca.`, 409);
    }
  }

  const reg = await prisma.registroLeche.create({
    data: {
      ...(idCliente ? { id: idCliente } : {}),
      vacaId,
      fecha,
      cantidad: numeroObligatorio(body.cantidad, "La cantidad", 0, 1000),
      turno,
      notas: texto(body.notas, "Notas", LARGO.notas),
    },
  });
  return NextResponse.json(reg, { status: 201 });
});
