import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { etiquetaArete } from "@/lib/tipos";
import {
  ruta, leerJson, idObligatorio, id, fechaObligatoria, numero, texto, triestado,
  LARGO, ErrorValidacion,
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
  if (body.crias !== undefined && !Array.isArray(body.crias)) {
    throw new ErrorValidacion("Crías: formato inválido.");
  }
  const crias = (body.crias as unknown[] | undefined) ?? [];
  if (crias.length > 10) throw new ErrorValidacion("Demasiadas crías en un parto.");
  const criaIds = [
    ...new Set(
      crias
        .map((c) => id((c as { criaId?: unknown } | null)?.criaId, "Cría"))
        .filter((c): c is string => c !== null)
    ),
  ];
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

// Una cría tiene UNA sola madre: no puede estar en otro parto (de esta u otra vaca) ni ser hija
// registrada de otra vaca. -> 409 con el nombre de la cría y de la otra madre.
async function validarCrias(vacaId: string, criaIds: string[]) {
  if (criaIds.length === 0) return;
  if (criaIds.includes(vacaId)) throw new ErrorValidacion("Una vaca no puede ser su propia cría.");

  const [animales, enParto] = await Promise.all([
    prisma.animal.findMany({
      where: { id: { in: criaIds } },
      select: {
        id: true, arete: true, sinArete: true, areteCenasa: true, nombre: true, madreExterno: true,
        madre: { select: { id: true, arete: true, sinArete: true, areteCenasa: true, nombre: true } },
      },
    }),
    prisma.cria.findMany({
      where: { criaId: { in: criaIds } },
      select: {
        criaId: true,
        parto: { select: { vaca: { select: { arete: true, sinArete: true, areteCenasa: true, nombre: true } } } },
      },
    }),
  ]);
  if (animales.length !== criaIds.length) throw new ErrorValidacion("Alguna cría no existe.", 404);

  const nombre = (a: { arete: string; sinArete: boolean; areteCenasa: string | null; nombre: string | null }) =>
    a.nombre ? `${a.nombre} (${etiquetaArete(a)})` : etiquetaArete(a);
  const porId = new Map(animales.map((a) => [a.id, a]));

  const yaVinculada = enParto[0];
  if (yaVinculada) {
    throw new ErrorValidacion(
      `${nombre(porId.get(yaVinculada.criaId)!)} ya está registrada como cría de un parto de ` +
        `${nombre(yaVinculada.parto.vaca)}.`,
      409
    );
  }
  for (const a of animales) {
    if (a.madre && a.madre.id !== vacaId) {
      throw new ErrorValidacion(`${nombre(a)} ya es hija de ${nombre(a.madre)}.`, 409);
    }
    if (!a.madre && a.madreExterno) {
      throw new ErrorValidacion(`${nombre(a)} tiene como madre a "${a.madreExterno}" (externa).`, 409);
    }
  }
}
