import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ruta, leerJson, id, idObligatorio, fechaObligatoria, numeroObligatorio, texto, LARGO } from "@/lib/validar";

// POST /api/pesos -> registro historico de peso (animal + fecha + peso).
// `id` opcional: lo genera el teléfono para los registros hechos sin señal (src/lib/cola-offline.ts).
// Si ese id ya existe, el envío anterior sí llegó: se devuelve el registro sin duplicarlo.
export const POST = ruta(async (req: NextRequest) => {
  const body = await leerJson(req);
  const idCliente = id(body.id, "Identificador");
  if (idCliente) {
    const ya = await prisma.registroPeso.findUnique({ where: { id: idCliente } });
    if (ya) return NextResponse.json(ya, { status: 200 });
  }
  const reg = await prisma.registroPeso.create({
    data: {
      ...(idCliente ? { id: idCliente } : {}),
      animalId: idObligatorio(body.animalId, "El animal"),
      fecha: fechaObligatoria(body.fecha, "La fecha"),
      pesoKg: numeroObligatorio(body.pesoKg, "El peso", 0, 3000),
      notas: texto(body.notas, "Notas", LARGO.notas),
    },
  });
  return NextResponse.json(reg, { status: 201 });
});
