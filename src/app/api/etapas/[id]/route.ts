import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  ruta, leerJson, idObligatorio, opcion, fecha, texto, ETAPAS, LARGO, ErrorValidacion, type ConId,
} from "@/lib/validar";

// PUT /api/etapas/[id] -> editar una etapa (p. ej. agregar la fecha de fin).
export const PUT = ruta(async (req: NextRequest, { params }: ConId) => {
  const id = idObligatorio((await params).id, "Etapa");
  const body = await leerJson(req);
  const existe = await prisma.etapaTernero.findUnique({ where: { id } });
  if (!existe) {
    return NextResponse.json({ error: "Etapa no encontrada." }, { status: 404 });
  }

  // La etapa a usar: la enviada o la existente.
  const etapa = opcion(body.etapa ?? existe.etapa, ETAPAS, "Etapa");
  const fechaInicio = fecha(body.fechaInicio, "Fecha de inicio") ?? existe.fechaInicio;
  // Sin `fechaFin` en el body se conserva la actual; `null` o "" la quitan (reabre la etapa).
  const fechaFin = body.fechaFin !== undefined ? fecha(body.fechaFin, "Fecha de finalización") : existe.fechaFin;

  if (fechaFin && fechaFin < fechaInicio) {
    throw new ErrorValidacion("La fecha de finalización no puede ser anterior a la de inicio.");
  }

  const actualizada = await prisma.etapaTernero.update({
    where: { id },
    data: {
      etapa,
      fechaInicio,
      fechaFin,
      notas: body.notas !== undefined ? texto(body.notas, "Notas", LARGO.notas) : existe.notas,
    },
  });

  return NextResponse.json(actualizada);
});

// DELETE /api/etapas/[id] -> eliminar un registro de etapa (si no existe -> 404)
export const DELETE = ruta(async (_req: NextRequest, { params }: ConId) => {
  const id = idObligatorio((await params).id, "Etapa");
  await prisma.etapaTernero.delete({ where: { id } });
  return NextResponse.json({ ok: true });
});
