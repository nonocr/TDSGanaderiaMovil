import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ruta, leerJson, idObligatorio, fecha, numero, texto, opcion, TURNOS, LARGO, type ConId } from "@/lib/validar";

// PUT /api/leche/[id] -> editar un ordeño (fecha, cantidad, turno, notas).
// Una sola consulta: los campos no enviados (undefined) no se tocan; si no existe -> 404.
export const PUT = ruta(async (req: NextRequest, { params }: ConId) => {
  const id = idObligatorio((await params).id, "Registro");
  const body = await leerJson(req);
  const reg = await prisma.registroLeche.update({
    where: { id },
    data: {
      fecha: fecha(body.fecha, "Fecha") ?? undefined,
      cantidad: numero(body.cantidad, "Cantidad", 0, 1000) ?? undefined,
      turno: body.turno !== undefined ? (body.turno ? opcion(body.turno, TURNOS, "Turno") : null) : undefined,
      notas: body.notas !== undefined ? texto(body.notas, "Notas", LARGO.notas) : undefined,
    },
  });
  return NextResponse.json(reg);
});

// DELETE /api/leche/[id] -> eliminar un registro de leche (si no existe -> 404)
export const DELETE = ruta(async (_req: NextRequest, { params }: ConId) => {
  const id = idObligatorio((await params).id, "Registro");
  await prisma.registroLeche.delete({ where: { id } });
  return NextResponse.json({ ok: true });
});
