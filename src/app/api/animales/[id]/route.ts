import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import {
  ruta, leerJson, idObligatorio, datosAnimal, ErrorValidacion, MB, ANIMAL_SIN_FOTO, type ConId,
  mensajeAreteRepetido,
} from "@/lib/validar";
import { procesarFoto } from "@/lib/fotos";
import { etiquetaArete } from "@/lib/tipos";
import { validarReproductor } from "@/lib/crias";

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
  // Un animal "sin arete" no manda arete (datosAnimal conserva/genera el interno), pero sí el sexo.
  if (body.esPajilla !== true) {
    if (body.sinArete !== true && !body.arete) {
      throw new ErrorValidacion("El arete es obligatorio.");
    }
    if (!body.sexo) throw new ErrorValidacion("El sexo es obligatorio.");
  }
  const datos = datosAnimal(body);

  // Un animal no puede ser su propio progenitor.
  if (datos.padreId === id || datos.madreId === id) {
    throw new ErrorValidacion("Un animal no puede ser su propio padre o madre.");
  }

  // Si es cría de un parto registrado, su madre es la vaca de ese parto: no se puede cambiar
  // por otra (ni quitar) sin antes eliminar ese parto.
  const [comoCria, actual] = await Promise.all([
    prisma.cria.findFirst({
      where: { criaId: id },
      select: {
        parto: {
          select: { vaca: { select: { id: true, arete: true, sinArete: true, areteCenasa: true, nombre: true } } },
        },
      },
    }),
    prisma.animal.findUnique({
      where: { id },
      select: { padreId: true, modulo: true, _count: { select: { partosComoVaca: true } } },
    }),
  ]);
  if (!actual) return NextResponse.json({ error: "Animal no encontrado." }, { status: 404 });

  // Novilla / Vaca: solo hembras de lechería, y una hembra que ya parió no puede ser novilla.
  if (datos.categoria) {
    if ((datos.modulo ?? actual.modulo) !== "LECHERIA" || datos.sexo !== "HEMBRA") {
      throw new ErrorValidacion("La categoría Novilla / Vaca solo aplica a hembras de lechería.");
    }
    const partos = actual._count.partosComoVaca;
    if (datos.categoria === "NOVILLA" && partos > 0) {
      throw new ErrorValidacion(
        `No puede ser novilla: ya tiene ${partos} parto${partos === 1 ? "" : "s"} registrado${partos === 1 ? "" : "s"}.`,
        409
      );
    }
  }
  // Un padre nuevo debe ser reproductor; el que ya tenía se conserva aunque no lo sea.
  await validarReproductor(datos.padreId, "El padre", actual.padreId);

  const madreParto = comoCria?.parto.vaca;
  if (madreParto && datos.madreId !== madreParto.id) {
    const ident = madreParto.nombre
      ? `${madreParto.nombre} (${etiquetaArete(madreParto)})`
      : etiquetaArete(madreParto);
    throw new ErrorValidacion(
      `Este animal está registrado como cría de un parto de ${ident}: esa es su madre. ` +
        "Para cambiarla, elimina primero ese parto.",
      409
    );
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
// Eliminar es para corregir un registro equivocado (si murió o se fue, se cambia el estado),
// así que se borra junto con todo lo vinculado a él, sin bloquear.
export const DELETE = ruta(async (_req: NextRequest, { params }: ConId) => {
  const id = idObligatorio((await params).id, "Animal");
  const existe = await prisma.animal.count({ where: { id } });
  if (!existe) {
    return NextResponse.json({ error: "Animal no encontrado." }, { status: 404 });
  }

  // Sus propios eventos (montas, partos, leche, peso, etapas, palpaciones, cambios de estado)
  // se borran en cascada manual
  // (las filas Cria de sus partos caen por onDelete: Cascade). Además:
  // - Sus hijos registrados se conservan, pero quedan sin ese padre/madre.
  // - Si era la única cría de un parto, se borra el parto; si el parto tiene más crías
  //   (gemelos), se conserva y solo se quita su vínculo.
  // - Las montas donde era el toro se borran (el toro es obligatorio en la monta).
  // - En los partos de otras vacas donde era el toro solo se quita el toro (es opcional).
  await prisma.$transaction([
    prisma.animal.updateMany({ where: { padreId: id }, data: { padreId: null } }),
    prisma.animal.updateMany({ where: { madreId: id }, data: { madreId: null } }),
    prisma.parto.deleteMany({ where: { crias: { some: { criaId: id }, every: { criaId: id } } } }),
    prisma.cria.deleteMany({ where: { criaId: id } }),
    prisma.monta.deleteMany({ where: { toroId: id } }),
    prisma.parto.updateMany({ where: { toroId: id }, data: { toroId: null } }),
    prisma.monta.deleteMany({ where: { vacaId: id } }),
    prisma.parto.deleteMany({ where: { vacaId: id } }),
    prisma.registroLeche.deleteMany({ where: { vacaId: id } }),
    prisma.registroPeso.deleteMany({ where: { animalId: id } }),
    prisma.etapaTernero.deleteMany({ where: { animalId: id } }),
    prisma.palpacion.deleteMany({ where: { vacaId: id } }),
    prisma.cambioEstadoReproductivo.deleteMany({ where: { vacaId: id } }),
    prisma.animal.delete({ where: { id } }),
  ]);

  return NextResponse.json({ ok: true });
});
