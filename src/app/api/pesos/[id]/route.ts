import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ruta, leerJson, idObligatorio, fecha, numero, texto, LARGO, type ConId } from "@/lib/validar";

// PUT /api/pesos/[id] -> editar un registro de peso (fecha, peso, notas).
// Una sola consulta: los campos no enviados (undefined) no se tocan; si no existe -> 404.
export const PUT = ruta(async (req: NextRequest, { params }: ConId) => {
  const id = idObligatorio((await params).id, "Registro");
  const body = await leerJson(req);
  const reg = await prisma.registroPeso.update({
    where: { id },
    data: {
      fecha: fecha(body.fecha, "Fecha") ?? undefined,
      pesoKg: numero(body.pesoKg, "Peso", 0, 3000) ?? undefined,
      notas: body.notas !== undefined ? texto(body.notas, "Notas", LARGO.notas) : undefined,
    },
  });
  return NextResponse.json(reg);
});

// DELETE /api/pesos/[id] -> eliminar un registro de peso (si no existe -> 404)
export const DELETE = ruta(async (_req: NextRequest, { params }: ConId) => {
  const id = idObligatorio((await params).id, "Registro");
  await prisma.registroPeso.delete({ where: { id } });
  return NextResponse.json({ ok: true });
});
