import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ruta, leerJson, idObligatorio, id as idOpcional, fecha, texto, LARGO, type ConId } from "@/lib/validar";
import { validarReproductor } from "@/lib/crias";

// PUT /api/montas/[id] -> editar una monta (fecha, toro, notas, inseminación, preñez).
// Los campos no enviados (undefined) no se tocan; si no existe -> 404.
// Un toro nuevo debe ser reproductor; el que ya tenía se acepta aunque no lo sea.
export const PUT = ruta(async (req: NextRequest, { params }: ConId) => {
  const id = idObligatorio((await params).id, "Monta");
  const body = await leerJson(req);
  const toroId = idOpcional(body.toroId, "Toro");
  if (toroId) {
    const actual = await prisma.monta.findUnique({ where: { id }, select: { toroId: true } });
    if (!actual) return NextResponse.json({ error: "Monta no encontrada." }, { status: 404 });
    await validarReproductor(toroId, "El toro", actual.toroId);
  }
  // Preñez confirmada por palpación (campos históricos: la app ya no los envía; la palpación se
  // registra aparte). Se siguen aceptando por compatibilidad. Desmarcarla borra su fecha.
  const prenez = body.prenezConfirmada !== undefined ? body.prenezConfirmada === true : undefined;
  const monta = await prisma.monta.update({
    where: { id },
    data: {
      fecha: fecha(body.fecha, "Fecha") ?? undefined,
      toroId: toroId ?? undefined,
      vacaId: idOpcional(body.vacaId, "Vaca") ?? undefined,
      notas: body.notas !== undefined ? texto(body.notas, "Notas", LARGO.notas) : undefined,
      inseminacion: body.inseminacion !== undefined ? body.inseminacion === true : undefined,
      prenezConfirmada: prenez,
      fechaConfirmacion:
        prenez === false ? null
        : body.fechaConfirmacion !== undefined ? fecha(body.fechaConfirmacion, "Fecha de confirmación")
        : undefined,
    },
  });
  return NextResponse.json(monta);
});

// DELETE /api/montas/[id] -> eliminar una monta (si no existe -> 404)
export const DELETE = ruta(async (_req: NextRequest, { params }: ConId) => {
  const id = idObligatorio((await params).id, "Monta");
  await prisma.monta.delete({ where: { id } });
  return NextResponse.json({ ok: true });
});
