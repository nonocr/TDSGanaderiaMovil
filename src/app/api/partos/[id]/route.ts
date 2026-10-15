import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ruta, leerJson, idObligatorio, id as idOpcional, fecha, texto, LARGO, type ConId } from "@/lib/validar";
import { validarCrias, leerCriaIds } from "@/lib/crias";

// PUT /api/partos/[id] -> editar un parto (fecha, descripcion, toro y crías).
// Los campos no enviados (undefined) no se tocan; si no existe -> 404.
// `crias` (array de { criaId }) reemplaza la lista completa de crías del parto.
export const PUT = ruta(async (req: NextRequest, { params }: ConId) => {
  const id = idObligatorio((await params).id, "Parto");
  const body = await leerJson(req);
  const datos = {
    fecha: fecha(body.fecha, "Fecha") ?? undefined,
    toroId: body.toroId !== undefined ? idOpcional(body.toroId, "Toro") : undefined,
    descripcion:
      body.descripcion !== undefined ? texto(body.descripcion, "Descripción", LARGO.notas) : undefined,
  };

  if (body.crias === undefined) {
    const parto = await prisma.parto.update({ where: { id }, data: datos });
    return NextResponse.json(parto);
  }

  const criaIds = leerCriaIds(body.crias, (v) => idOpcional(v, "Cría"));
  const actual = await prisma.parto.findUnique({
    where: { id },
    select: { vacaId: true, crias: { select: { criaId: true } } },
  });
  if (!actual) return NextResponse.json({ error: "Parto no encontrado." }, { status: 404 });
  await validarCrias(actual.vacaId, criaIds, id);

  const antes = actual.crias.map((c) => c.criaId);
  const quitadas = antes.filter((c) => !criaIds.includes(c));
  const nuevas = criaIds.filter((c) => !antes.includes(c));

  const [parto] = await prisma.$transaction([
    prisma.parto.update({ where: { id }, data: datos }),
    prisma.cria.deleteMany({ where: { partoId: id, criaId: { in: quitadas } } }),
    prisma.cria.createMany({ data: nuevas.map((criaId) => ({ partoId: id, criaId })) }),
    // La cría quitada ya no es de esta vaca (se marcó por error): queda sin madre registrada.
    prisma.animal.updateMany({ where: { id: { in: quitadas }, madreId: actual.vacaId }, data: { madreId: null } }),
    // La cría agregada tiene a esta vaca como madre (igual que al registrar el parto).
    prisma.animal.updateMany({
      where: { id: { in: nuevas }, madreId: null },
      data: { madreId: actual.vacaId, madreExterno: null },
    }),
  ]);
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
