import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { terminoBusqueda } from "@/lib/tipos";
import {
  ruta, leerJson, texto, opcion, datosAnimal, SEXOS, ESTADOS, MODULOS, LARGO, ErrorValidacion,
  ANIMAL_SIN_FOTO, mensajeAreteRepetido,
} from "@/lib/validar";

// GET /api/animales?sexo=MACHO&estado=ACTIVO&modulo=ENGORDE&q=texto
export const GET = ruta(async (req: NextRequest) => {
  const { searchParams } = new URL(req.url);
  const sexo = searchParams.get("sexo") ? opcion(searchParams.get("sexo"), SEXOS, "Sexo") : null;
  const estado = searchParams.get("estado") ? opcion(searchParams.get("estado"), ESTADOS, "Estado") : null;
  const modulo = searchParams.get("modulo") ? opcion(searchParams.get("modulo"), MODULOS, "Módulo") : null;
  const qCrudo = texto(searchParams.get("q"), "Búsqueda", LARGO.corto);
  const q = terminoBusqueda(qCrudo);
  // Solo se escribió un prefijo ("CENASA", "#"): nada que buscar todavía.
  if (qCrudo && !q) return NextResponse.json([]);

  const animales = await prisma.animal.findMany({
    where: {
      ...(sexo ? { sexo } : {}),
      ...(estado ? { estado } : {}),
      ...(modulo ? { modulo } : {}),
      ...(q
        ? {
            OR: [
              // En Postgres `contains` distingue mayúsculas; SQLite no lo hacía.
              // El arete interno de un animal sin arete (S/N-…) no se busca: se busca por CENASA.
              { arete: { contains: q, mode: "insensitive" }, sinArete: false },
              { areteCenasa: { contains: q, mode: "insensitive" } },
              { nombre: { contains: q, mode: "insensitive" } },
              { raza: { contains: q, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    orderBy: { arete: "asc" },
    select: ANIMAL_SIN_FOTO,
  });
  return NextResponse.json(animales);
});

// POST /api/animales  -> crear animal
export const POST = ruta(async (req: NextRequest) => {
  const body = await leerJson(req);
  // Una pajilla solo trae el código (datosAnimal lo usa como arete y fija el sexo).
  // Un animal "sin arete" no manda arete (datosAnimal genera uno interno), pero sí el sexo.
  if (body.esPajilla !== true) {
    if (body.sinArete !== true && !body.arete) {
      throw new ErrorValidacion("El arete es obligatorio.");
    }
    if (!body.sexo) throw new ErrorValidacion("El sexo es obligatorio.");
  }
  const datos = datosAnimal(body);

  // Una sola consulta: el arete es único en la base; si ya existe, falla con P2002.
  try {
    const animal = await prisma.animal.create({ data: datos, select: ANIMAL_SIN_FOTO });
    return NextResponse.json(animal, { status: 201 });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      throw new ErrorValidacion(mensajeAreteRepetido(datos), 409);
    }
    throw e;
  }
});
