import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ruta, leerJson, idObligatorio, id as idOpcional, fecha, texto, LARGO, type ConId } from "@/lib/validar";

// PUT /api/partos/[id] -> editar un parto (fecha, descripcion, toro).
// Las crias no se editan aqui (es un cambio estructural; se maneja por separado).
// Una sola consulta: los campos no enviados (undefined) no se tocan; si no existe -> 404.
export const PUT = ruta(async (req: NextRequest, { params }: ConId) => {
  const id = idObligatorio((await params).id, "Parto");
  const body = await leerJson(req);
  const parto = await prisma.parto.update({
    where: { id },
    data: {
      fecha: fecha(body.fecha, "Fecha") ?? undefined,
      toroId: body.toroId !== undefined ? idOpcional(body.toroId, "Toro") : undefined,
      descripcion:
        body.descripcion !== undefined ? texto(body.descripcion, "Descripción", LARGO.notas) : undefined,
    },
  });
  return NextResponse.json(parto);
});

// DELETE /api/partos/[id] -> eliminar un parto (si no existe -> 404).
// Las filas Cria vinculadas se borran en cascada (onDelete: Cascade en el esquema).
// NO se eliminan los animales cria: siguen existiendo como animales registrados.
export const DELETE = ruta(async (_req: NextRequest, { params }: ConId) => {
  const id = idObligatorio((await params).id, "Parto");
  await prisma.parto.delete({ where: { id } });
  return NextResponse.json({ ok: true });
});
