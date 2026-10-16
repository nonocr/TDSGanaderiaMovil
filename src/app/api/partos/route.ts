import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  validarCrias, leerCriaIds, leerCriasNuevas, validarAretesNuevos, crearCriasNuevas, novillaAVaca,
  validarReproductor,
} from "@/lib/crias";
import {
  ruta, leerJson, idObligatorio, id, fechaObligatoria, numero, texto, triestado, LARGO, ErrorValidacion,
} from "@/lib/validar";

// POST /api/partos -> registrar parto. Puede traer varias crias.
// - `crias`: array de { criaId } -> animales ya registrados que se vinculan.
// - `criasNuevas`: array de { arete, sinArete, areteCenasa, nombre, sexo, raza } -> se crean aquí
//   mismo como animales de Engorde (madre = la vaca, padre = el toro, nacimiento = fecha del parto).
// El toro/padre es opcional (B3) y, si viene, debe ser un reproductor.
// `id` opcional: lo genera el teléfono para los registros hechos sin señal (src/lib/cola-offline.ts).
// Si ese id ya existe, el envío anterior sí llegó: se devuelve el parto sin duplicarlo (ni sus crías).
export const POST = ruta(async (req: NextRequest) => {
  const body = await leerJson(req);
  const idCliente = id(body.id, "Identificador");
  if (idCliente) {
    const ya = await prisma.parto.findUnique({ where: { id: idCliente }, include: { crias: true } });
    if (ya) return NextResponse.json(ya, { status: 200 });
  }

  const criaIds = body.crias === undefined ? [] : leerCriaIds(body.crias, (v) => id(v, "Cría"));
  const criasNuevas = leerCriasNuevas(body.criasNuevas);
  if (criaIds.length + criasNuevas.length > 10) throw new ErrorValidacion("Demasiadas crías en un parto.");
  const vacaId = idObligatorio(body.vacaId, "La vaca");
  const toroId = id(body.toroId, "Toro");
  const fecha = fechaObligatoria(body.fecha, "La fecha");
  const datosParto = {
    descripcion: texto(body.descripcion, "Descripción", LARGO.notas),
    criaSana: triestado(body.criaSana),
    necesitoAyuda: triestado(body.necesitoAyuda),
    pesoNacimientoKg: numero(body.pesoNacimientoKg, "Peso al nacer", 0, 200),
  };
  await Promise.all([
    validarCrias(vacaId, criaIds),
    validarReproductor(toroId, "El toro / padre"),
    validarAretesNuevos(criasNuevas),
  ]);

  const parto = await prisma.$transaction(async (tx) => {
    const idsNuevas = await crearCriasNuevas(tx, criasNuevas, { vacaId, toroId, fecha });
    const creado = await tx.parto.create({
      data: {
        ...(idCliente ? { id: idCliente } : {}),
        vacaId,
        toroId,
        fecha,
        ...datosParto,
        crias: {
          create: [...criaIds, ...idsNuevas].map((criaId) => ({ criaId })),
        },
      },
      include: { crias: true },
    });
    // La cría parida por esta vaca la tiene como madre: si aún no tenía madre, se completa.
    await tx.animal.updateMany({
      where: { id: { in: criaIds }, madreId: null },
      data: { madreId: vacaId, madreExterno: null },
    });
    // Primer parto de una novilla: pasa a vaca.
    await novillaAVaca(tx, vacaId);
    return creado;
  });

  return NextResponse.json(parto, { status: 201 });
});
