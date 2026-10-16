import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  ruta, leerJson, idObligatorio, id as idOpcional, fecha, texto, LARGO, ErrorValidacion, type ConId,
} from "@/lib/validar";
import {
  validarCrias, leerCriaIds, leerCriasNuevas, validarAretesNuevos, crearCriasNuevas, validarReproductor,
} from "@/lib/crias";

// PUT /api/partos/[id] -> editar un parto (fecha, descripcion, toro y crías).
// Los campos no enviados (undefined) no se tocan; si no existe -> 404.
// `crias` (array de { criaId }) reemplaza la lista completa de crías ya registradas del parto.
// `criasNuevas` (como en POST) agrega crías que se crean aquí como animales nuevos.
// Un toro nuevo debe ser reproductor; el que ya tenía se acepta aunque no lo sea.
export const PUT = ruta(async (req: NextRequest, { params }: ConId) => {
  const id = idObligatorio((await params).id, "Parto");
  const body = await leerJson(req);
  const datos = {
    fecha: fecha(body.fecha, "Fecha") ?? undefined,
    toroId: body.toroId !== undefined ? idOpcional(body.toroId, "Toro") : undefined,
    descripcion:
      body.descripcion !== undefined ? texto(body.descripcion, "Descripción", LARGO.notas) : undefined,
  };
  const criaIds = body.crias === undefined ? undefined : leerCriaIds(body.crias, (v) => idOpcional(v, "Cría"));
  const criasNuevas = leerCriasNuevas(body.criasNuevas);

  const actual = await prisma.parto.findUnique({
    where: { id },
    select: { vacaId: true, toroId: true, fecha: true, crias: { select: { criaId: true } } },
  });
  if (!actual) return NextResponse.json({ error: "Parto no encontrado." }, { status: 404 });

  const antes = actual.crias.map((c) => c.criaId);
  const finales = criaIds ?? antes;
  if (finales.length + criasNuevas.length > 10) throw new ErrorValidacion("Demasiadas crías en un parto.");
  await Promise.all([
    criaIds ? validarCrias(actual.vacaId, criaIds, id) : undefined,
    validarReproductor(datos.toroId, "El toro / padre", actual.toroId),
    validarAretesNuevos(criasNuevas),
  ]);

  const quitadas = antes.filter((c) => !finales.includes(c));
  const nuevas = finales.filter((c) => !antes.includes(c));

  const parto = await prisma.$transaction(async (tx) => {
    // Las crías nuevas nacen el día del parto (el editado, si cambió) y su padre es el toro final.
    const idsCreadas = await crearCriasNuevas(tx, criasNuevas, {
      vacaId: actual.vacaId,
      toroId: datos.toroId !== undefined ? datos.toroId : actual.toroId,
      fecha: datos.fecha ?? actual.fecha,
    });
    const editado = await tx.parto.update({ where: { id }, data: datos });
    await tx.cria.deleteMany({ where: { partoId: id, criaId: { in: quitadas } } });
    await tx.cria.createMany({ data: [...nuevas, ...idsCreadas].map((criaId) => ({ partoId: id, criaId })) });
    // La cría quitada ya no es de esta vaca (se marcó por error): queda sin madre registrada.
    await tx.animal.updateMany({ where: { id: { in: quitadas }, madreId: actual.vacaId }, data: { madreId: null } });
    // La cría agregada tiene a esta vaca como madre (igual que al registrar el parto).
    await tx.animal.updateMany({
      where: { id: { in: nuevas }, madreId: null },
      data: { madreId: actual.vacaId, madreExterno: null },
    });
    return editado;
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
