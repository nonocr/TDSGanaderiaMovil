import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ruta, leerJson, id, idObligatorio, fechaObligatoria, texto, LARGO, ErrorValidacion } from "@/lib/validar";

// POST /api/palpaciones -> registrar una palpación (vaca + fecha + notas opcionales).
// Es un evento propio: ya no se anota en la monta (las palpaciones viejas de las montas se conservan).
// `id` opcional: lo genera el teléfono para los registros hechos sin señal (src/lib/cola-offline.ts).
// Si ese id ya existe, el envío anterior sí llegó: se devuelve el registro sin duplicarlo.
export const POST = ruta(async (req: NextRequest) => {
  const body = await leerJson(req);
  const idCliente = id(body.id, "Identificador");
  if (idCliente) {
    const ya = await prisma.palpacion.findUnique({ where: { id: idCliente } });
    if (ya) return NextResponse.json(ya, { status: 200 });
  }
  const vacaId = idObligatorio(body.vacaId, "La vaca");
  const fecha = fechaObligatoria(body.fecha, "La fecha");
  const notas = texto(body.notas, "Notas", LARGO.notas);

  const vaca = await prisma.animal.findUnique({ where: { id: vacaId }, select: { sexo: true } });
  if (!vaca) return NextResponse.json({ error: "Animal no encontrado." }, { status: 404 });
  if (vaca.sexo !== "HEMBRA") throw new ErrorValidacion("La palpación solo se registra a hembras.");

  const palpacion = await prisma.palpacion.create({
    data: { ...(idCliente ? { id: idCliente } : {}), vacaId, fecha, notas },
  });
  return NextResponse.json(palpacion, { status: 201 });
});
