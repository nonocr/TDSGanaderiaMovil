import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ruta, leerJson, id, idObligatorio, fechaObligatoria, fecha, texto, LARGO } from "@/lib/validar";
import { validarReproductor } from "@/lib/crias";

// POST /api/montas -> registrar monta (vaca + toro + fecha). NO implica parto.
// `id` opcional: lo genera el teléfono para los registros hechos sin señal (src/lib/cola-offline.ts).
// Si ese id ya existe, el envío anterior sí llegó: se devuelve el registro sin duplicarlo.
export const POST = ruta(async (req: NextRequest) => {
  const body = await leerJson(req);
  const idCliente = id(body.id, "Identificador");
  if (idCliente) {
    const ya = await prisma.monta.findUnique({ where: { id: idCliente } });
    if (ya) return NextResponse.json(ya, { status: 200 });
  }
  // La palpación ya no se registra en la monta (tiene su propio registro, /api/palpaciones); los
  // campos de preñez se siguen aceptando por compatibilidad (registros sin señal ya encolados).
  const prenezConfirmada = Boolean(body.prenezConfirmada);
  const toroId = idObligatorio(body.toroId, "El toro");
  await validarReproductor(toroId, "El toro");
  const monta = await prisma.monta.create({
    data: {
      ...(idCliente ? { id: idCliente } : {}),
      vacaId: idObligatorio(body.vacaId, "La vaca"),
      toroId,
      fecha: fechaObligatoria(body.fecha, "La fecha"),
      notas: texto(body.notas, "Notas", LARGO.notas),
      prenezConfirmada,
      // Solo guardamos la fecha de confirmación si se marcó la preñez.
      fechaConfirmacion: prenezConfirmada ? fecha(body.fechaConfirmacion, "Fecha de confirmación") : null,
      // Inseminación con pajilla en vez de monta natural.
      inseminacion: body.inseminacion === true,
    },
  });
  return NextResponse.json(monta, { status: 201 });
});
