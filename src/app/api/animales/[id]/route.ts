import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import {
  ruta, leerJson, idObligatorio, datosAnimal, ErrorValidacion, MB, ANIMAL_SIN_FOTO, type ConId,
  mensajeAreteRepetido,
} from "@/lib/validar";
import { procesarFoto } from "@/lib/fotos";

// Fotos: solo JPEG/PNG/WebP en base64 (sin SVG, que puede llevar código).
const FOTO_VALIDA = /^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/]+=*$/;
const FOTO_MAX = 3_000_000; // ~3 MB en base64 para no inflar la base de datos.

// GET /api/animales/[id] -> un animal
export const GET = ruta(async (_req: NextRequest, { params }: ConId) => {
  const id = idObligatorio((await params).id, "Animal");
  const animal = await prisma.animal.findUnique({ where: { id }, select: ANIMAL_SIN_FOTO });
  if (!animal) {
    return NextResponse.json({ error: "Animal no encontrado." }, { status: 404 });
  }
  return NextResponse.json(animal);
});

// PUT /api/animales/[id] -> editar datos basicos y genealogia
export const PUT = ruta(async (req: NextRequest, { params }: ConId) => {
  const id = idObligatorio((await params).id, "Animal");
  const body = await leerJson(req);

  // Una pajilla solo trae el código (datosAnimal lo usa como arete y fija el sexo).
  if (body.esPajilla !== true && (!body.arete || !body.sexo)) {
    throw new ErrorValidacion("El arete y el sexo son obligatorios.");
  }
  const datos = datosAnimal(body);

  // Un animal no puede ser su propio progenitor.
  if (datos.padreId === id || datos.madreId === id) {
    throw new ErrorValidacion("Un animal no puede ser su propio padre o madre.");
  }

  // Una sola consulta: si no existe -> 404 (P2025); si el arete choca con otro -> 409.
  // Si vuelve a Activo, datosAnimal ya limpia los datos de baja.
  try {
    const actualizado = await prisma.animal.update({ where: { id }, data: datos, select: ANIMAL_SIN_FOTO });
    return NextResponse.json(actualizado);
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      throw new ErrorValidacion(mensajeAreteRepetido(datos), 409);
    }
    throw e;
  }
});

// PATCH /api/animales/[id] -> actualizar solo la foto (data URL base64 o null para quitarla).
export const PATCH = ruta(async (req: NextRequest, { params }: ConId) => {
  const id = idObligatorio((await params).id, "Animal");
  const body = await leerJson(req, 4 * MB);

  if (!("fotoUrl" in body)) {
    throw new ErrorValidacion("Falta el campo fotoUrl.");
  }

  const foto = body.fotoUrl;
  if (foto !== null) {
    if (typeof foto !== "string") throw new ErrorValidacion("La foto debe ser una imagen válida.");
    if (foto.length > FOTO_MAX) {
      throw new ErrorValidacion("La imagen es demasiado grande. Intenta con una más pequeña.", 413);
    }
    if (!FOTO_VALIDA.test(foto)) {
      throw new ErrorValidacion("La foto debe ser una imagen JPEG, PNG o WebP.");
    }
  }

  // Re-codificada en el servidor (sin metadatos/GPS) + miniatura para listas.
  const procesada = foto === null ? null : await procesarFoto(foto);

  // Si el animal no existe, update falla con P2025 -> 404.
  const actualizado = await prisma.animal.update({
    where: { id },
    data: { fotoUrl: procesada?.foto ?? null, fotoMiniatura: procesada?.miniatura ?? null },
    select: { id: true, fotoMiniatura: true },
  });
  return NextResponse.json(actualizado);
});

// DELETE /api/animales/[id] -> eliminar animal.
// Regla de integridad (docs/05): no se elimina si rompe la genealogia.
export const DELETE = ruta(async (_req: NextRequest, { params }: ConId) => {
  const id = idObligatorio((await params).id, "Animal");
  // Cuatro consultas en paralelo (un `include` las encadenaría).
  const [existe, numHijos, comoCria, montasComoToro] = await Promise.all([
    prisma.animal.count({ where: { id } }),
    prisma.animal.count({ where: { OR: [{ padreId: id }, { madreId: id }] } }),
    prisma.cria.count({ where: { criaId: id } }),
    prisma.monta.count({ where: { toroId: id } }),
  ]);
  if (!existe) {
    return NextResponse.json({ error: "Animal no encontrado." }, { status: 404 });
  }

  if (numHijos > 0) {
    throw new ErrorValidacion(
      `No se puede eliminar: este animal es padre/madre de ${numHijos} animal(es) registrado(s). ` +
        "Su genealogía se perdería. Si ya no está en el hato, cámbialo a 'Vendido' o 'Muerto'.",
      409
    );
  }

  if (comoCria > 0) {
    throw new ErrorValidacion(
      "No se puede eliminar: este animal está vinculado como cría en un parto registrado. " +
        "Elimina primero ese vínculo o el parto.",
      409
    );
  }

  // Las montas son historial de las vacas (el toro es obligatorio): borrarlas lo perdería.
  if (montasComoToro > 0) {
    throw new ErrorValidacion(
      `No se puede eliminar: es el toro de ${montasComoToro} monta(s) registrada(s) y se perdería ` +
        "el historial de esas vacas. Si ya no está en el hato, cámbialo a 'Vendido' o 'Muerto'.",
      409
    );
  }

  // Sin descendencia ni vinculo como cria: se puede borrar.
  // Sus propios eventos (montas, partos, leche, peso, etapas) se borran en cascada manual
  // (las filas Cria de sus partos caen por onDelete: Cascade). En los partos de OTRAS vacas
  // donde figura como toro solo se quita el toro (es opcional): el parto se conserva.
  await prisma.$transaction([
    prisma.parto.updateMany({ where: { toroId: id }, data: { toroId: null } }),
    prisma.monta.deleteMany({ where: { vacaId: id } }),
    prisma.parto.deleteMany({ where: { vacaId: id } }),
    prisma.registroLeche.deleteMany({ where: { vacaId: id } }),
    prisma.registroPeso.deleteMany({ where: { animalId: id } }),
    prisma.etapaTernero.deleteMany({ where: { animalId: id } }),
    prisma.animal.delete({ where: { id } }),
  ]);

  return NextResponse.json({ ok: true });
});
