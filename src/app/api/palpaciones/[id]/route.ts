import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ruta, leerJson, idObligatorio, fecha, texto, LARGO, type ConId } from "@/lib/validar";

// PUT /api/palpaciones/[id] -> editar fecha y notas. Lo no enviado no se toca; si no existe -> 404.
export const PUT = ruta(async (req: NextRequest, { params }: ConId) => {
  const id = idObligatorio((await params).id, "Palpación");
  const body = await leerJson(req);
  const palpacion = await prisma.palpacion.update({
    where: { id },
    data: {
      fecha: fecha(body.fecha, "Fecha") ?? undefined,
      notas: body.notas !== undefined ? texto(body.notas, "Notas", LARGO.notas) : undefined,
    },
  });
  return NextResponse.json(palpacion);
});

// DELETE /api/palpaciones/[id] -> eliminar una palpación (si no existe -> 404).
export const DELETE = ruta(async (_req: NextRequest, { params }: ConId) => {
  const id = idObligatorio((await params).id, "Palpación");
  await prisma.palpacion.delete({ where: { id } });
  return NextResponse.json({ ok: true });
});
