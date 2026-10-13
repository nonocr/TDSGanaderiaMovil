import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  ruta, leerJson, idObligatorio, opcion, fechaObligatoria, fecha, texto,
  ETAPAS, LARGO, ErrorValidacion,
} from "@/lib/validar";

// POST /api/etapas -> registrar una etapa del ternero.
// Solo se guardan las fechas reales. NO se calculan ni asumen duraciones (B6).
export const POST = ruta(async (req: NextRequest) => {
  const body = await leerJson(req);

  const fechaInicio = fechaObligatoria(body.fechaInicio, "La fecha de inicio");
  const fechaFin = fecha(body.fechaFin, "Fecha de finalización");
  // Si se da fecha de fin, no puede ser anterior a la de inicio.
  if (fechaFin && fechaFin < fechaInicio) {
    throw new ErrorValidacion("La fecha de finalización no puede ser anterior a la de inicio.");
  }

  const etapa = await prisma.etapaTernero.create({
    data: {
      animalId: idObligatorio(body.animalId, "El animal"),
      etapa: opcion(body.etapa, ETAPAS, "Etapa"),
      fechaInicio,
      fechaFin,
      notas: texto(body.notas, "Notas", LARGO.notas),
    },
  });

  return NextResponse.json(etapa, { status: 201 });
});
