import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { validarCrias, leerCriaIds } from "@/lib/crias";
import {
  ruta, leerJson, idObligatorio, id, fechaObligatoria, numero, texto, triestado, LARGO,
} from "@/lib/validar";

// POST /api/partos -> registrar parto. Puede traer varias crias.
// Cada cria es un Animal (existente o a crear). El toro/padre es opcional (B3).
// `id` opcional: lo genera el teléfono para los registros hechos sin señal (src/lib/cola-offline.ts).
// Si ese id ya existe, el envío anterior sí llegó: se devuelve el parto sin duplicarlo.
export const POST = ruta(async (req: NextRequest) => {
  const body = await leerJson(req);
  const idCliente = id(body.id, "Identificador");
  if (idCliente) {
    const ya = await prisma.parto.findUnique({ where: { id: idCliente }, include: { crias: true } });
    if (ya) return NextResponse.json(ya, { status: 200 });
  }

  // crias: array de { criaId } (animales ya registrados). La creacion de nuevas
  // crias se hace primero desde el alta de animales y luego se vinculan aqui.
  const criaIds = body.crias === undefined ? [] : leerCriaIds(body.crias, (v) => id(v, "Cría"));
  const vacaId = idObligatorio(body.vacaId, "La vaca");
  await validarCrias(vacaId, criaIds);

  const [parto] = await prisma.$transaction([
    prisma.parto.create({
      data: {
        ...(idCliente ? { id: idCliente } : {}),
        vacaId,
        toroId: id(body.toroId, "Toro"),
        fecha: fechaObligatoria(body.fecha, "La fecha"),
        descripcion: texto(body.descripcion, "Descripción", LARGO.notas),
        criaSana: triestado(body.criaSana),
        necesitoAyuda: triestado(body.necesitoAyuda),
        pesoNacimientoKg: numero(body.pesoNacimientoKg, "Peso al nacer", 0, 200),
        crias: {
          create: criaIds.map((criaId) => ({ criaId })),
        },
      },
      include: { crias: true },
    }),
    // La cría parida por esta vaca la tiene como madre: si aún no tenía madre, se completa.
    prisma.animal.updateMany({
      where: { id: { in: criaIds }, madreId: null },
      data: { madreId: vacaId, madreExterno: null },
    }),
  ]);

  return NextResponse.json(parto, { status: 201 });
});
