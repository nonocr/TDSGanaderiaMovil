import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  ruta, leerJson, idObligatorio, id, texto, textoObligatorio, fecha, fechaObligatoria,
  numero, numeroObligatorio, opcion, SEXOS, ESTADOS, ETAPAS, MODULOS, TURNOS, CATEGORIAS, LARGO, MB,
  ErrorValidacion,
} from "@/lib/validar";
import { ESTADOS_REPRO } from "@/lib/estado";
import { procesarFoto } from "@/lib/fotos";

// Versión del formato de respaldo. Si en el futuro cambia la estructura, se puede
// usar para migrar respaldos viejos.
const VERSION_RESPALDO = 1;

// Tamaño máximo de un respaldo (las fotos van en base64 dentro del JSON).
const RESPALDO_MAX = 80 * MB;

// --- GET /api/respaldo -> descarga TODOS los datos en un archivo JSON ---
export const GET = ruta(async () => {
  const [animales, montas, partos, crias, registrosLeche, registrosPeso, etapas, palpaciones, cambiosEstado] =
    await Promise.all([
      prisma.animal.findMany(),
      prisma.monta.findMany(),
      prisma.parto.findMany(),
      prisma.cria.findMany(),
      prisma.registroLeche.findMany(),
      prisma.registroPeso.findMany(),
      prisma.etapaTernero.findMany(),
      prisma.palpacion.findMany(),
      prisma.cambioEstadoReproductivo.findMany(),
    ]);

  const respaldo = {
    version: VERSION_RESPALDO,
    generadoEl: new Date().toISOString(),
    datos: { animales, montas, partos, crias, registrosLeche, registrosPeso, etapas, palpaciones, cambiosEstado },
  };

  const fechaHoy = new Date().toISOString().slice(0, 10);
  return new NextResponse(JSON.stringify(respaldo, null, 2), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="respaldo-ganaderia-${fechaHoy}.json"`,
      "Cache-Control": "no-store",
    },
  });
});

// Lista de registros de una sección del respaldo; cada uno debe ser un objeto.
function lista(v: unknown, seccion: string): Record<string, any>[] {
  if (v === undefined) return [];
  if (!Array.isArray(v) || v.some((x) => !x || typeof x !== "object")) {
    throw new ErrorValidacion(`El respaldo tiene la sección "${seccion}" dañada.`);
  }
  return v;
}

const creado = (v: unknown) => fecha(v, "createdAt") ?? new Date();
const FOTO_VALIDA = /^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/]+=*$/;

// --- POST /api/respaldo -> RESTAURA desde un archivo de respaldo (reemplaza todo) ---
export const POST = ruta(async (req: NextRequest) => {
  const b = await leerJson(req, RESPALDO_MAX);
  const d = b.datos as Record<string, unknown> | undefined;
  if (!d || typeof d !== "object") {
    throw new ErrorValidacion("El archivo no tiene el formato de un respaldo de esta app.");
  }

  // 1) Validar TODO antes de tocar la base. Si algo falla, no se modifica nada.
  const animalesRaw = lista(d.animales, "animales");
  const animales = animalesRaw.map((a) => {
    const foto = a.fotoUrl ?? null;
    const miniatura = a.fotoMiniatura ?? null;
    for (const f of [foto, miniatura]) {
      if (f !== null && (typeof f !== "string" || !FOTO_VALIDA.test(f))) {
        throw new ErrorValidacion(`El animal ${String(a.arete)} tiene una foto inválida.`);
      }
    }
    return {
      id: idObligatorio(a.id, "id"),
      arete: textoObligatorio(a.arete, "Arete", LARGO.corto),
      nombre: texto(a.nombre, "Nombre"),
      sexo: opcion(a.sexo, SEXOS, "Sexo"),
      raza: texto(a.raza, "Raza", LARGO.corto),
      fechaNacimiento: fecha(a.fechaNacimiento, "Fecha de nacimiento"),
      fotoUrl: foto as string | null,
      fotoMiniatura: miniatura as string | null,
      descripcion: texto(a.descripcion, "Descripción", LARGO.notas),
      estado: a.estado ? opcion(a.estado, ESTADOS, "Estado") : "ACTIVO",
      // Respaldos anteriores a los módulos no traen `modulo`: van a ENGORDE (el default).
      modulo: a.modulo ? opcion(a.modulo, MODULOS, "Módulo") : "ENGORDE",
      codigo: texto(a.codigo, "Código", LARGO.corto),
      // Arete oficial de SENASA (opcional). Respaldos viejos sin el campo = null.
      areteCenasa: texto(a.areteCenasa, "Arete SENASA", LARGO.corto),
      // Animal sin arete físico (se identifica por el de SENASA). Respaldos viejos = false.
      sinArete: a.sinArete === true,
      // Novilla / Vaca. Respaldos viejos sin el campo = null.
      categoria: a.categoria ? opcion(a.categoria, CATEGORIAS, "Categoría") : null,
      // Respaldos anteriores a las pajillas no lo traen: son toros/animales físicos.
      esPajilla: a.esPajilla === true,
      fechaBaja: fecha(a.fechaBaja, "Fecha de baja"),
      motivoBaja: texto(a.motivoBaja, "Motivo de baja", LARGO.notas),
      padreExterno: texto(a.padreExterno, "Padre externo"),
      madreExterno: texto(a.madreExterno, "Madre externa"),
      createdAt: creado(a.createdAt),
      updatedAt: fecha(a.updatedAt, "updatedAt") ?? new Date(),
    };
  });
  // Respaldos anteriores a las miniaturas: se generan ahora (también re-codifica la foto).
  await Promise.all(
    animales
      .filter((a) => a.fotoUrl && !a.fotoMiniatura)
      .map(async (a) => {
        const p = await procesarFoto(a.fotoUrl!);
        a.fotoUrl = p.foto;
        a.fotoMiniatura = p.miniatura;
      })
  );

  const vinculos = animalesRaw
    .map((a) => ({ id: a.id as string, padreId: id(a.padreId, "Padre"), madreId: id(a.madreId, "Madre") }))
    .filter((v) => v.padreId || v.madreId);

  const montas = lista(d.montas, "montas").map((m) => ({
    id: idObligatorio(m.id, "id"),
    vacaId: idObligatorio(m.vacaId, "Vaca"),
    toroId: idObligatorio(m.toroId, "Toro"),
    fecha: fechaObligatoria(m.fecha, "Fecha"),
    notas: texto(m.notas, "Notas", LARGO.notas),
    prenezConfirmada: Boolean(m.prenezConfirmada),
    fechaConfirmacion: fecha(m.fechaConfirmacion, "Fecha de confirmación"),
    inseminacion: m.inseminacion === true,
    createdAt: creado(m.createdAt),
  }));
  const partos = lista(d.partos, "partos").map((p) => ({
    id: idObligatorio(p.id, "id"),
    vacaId: idObligatorio(p.vacaId, "Vaca"),
    toroId: id(p.toroId, "Toro"),
    fecha: fechaObligatoria(p.fecha, "Fecha"),
    descripcion: texto(p.descripcion, "Descripción", LARGO.notas),
    criaSana: typeof p.criaSana === "boolean" ? p.criaSana : null,
    necesitoAyuda: typeof p.necesitoAyuda === "boolean" ? p.necesitoAyuda : null,
    pesoNacimientoKg: numero(p.pesoNacimientoKg, "Peso al nacer", 0, 200),
    createdAt: creado(p.createdAt),
  }));
  const crias = lista(d.crias, "crias").map((c) => ({
    id: idObligatorio(c.id, "id"),
    partoId: idObligatorio(c.partoId, "Parto"),
    criaId: idObligatorio(c.criaId, "Cría"),
  }));
  const registrosLeche = lista(d.registrosLeche, "registrosLeche").map((r) => ({
    id: idObligatorio(r.id, "id"),
    vacaId: idObligatorio(r.vacaId, "Vaca"),
    fecha: fechaObligatoria(r.fecha, "Fecha"),
    // 0–10000: los respaldos viejos guardaban el total del día, no un ordeño.
    cantidad: numeroObligatorio(r.cantidad, "Cantidad", 0, 10000),
    turno: r.turno ? opcion(r.turno, TURNOS, "Turno") : null,
    notas: texto(r.notas, "Notas", LARGO.notas),
    createdAt: creado(r.createdAt),
  }));
  const registrosPeso = lista(d.registrosPeso, "registrosPeso").map((r) => ({
    id: idObligatorio(r.id, "id"),
    animalId: idObligatorio(r.animalId, "Animal"),
    fecha: fechaObligatoria(r.fecha, "Fecha"),
    pesoKg: numeroObligatorio(r.pesoKg, "Peso", 0, 3000),
    notas: texto(r.notas, "Notas", LARGO.notas),
    createdAt: creado(r.createdAt),
  }));
  const etapas = lista(d.etapas, "etapas").map((e) => ({
    id: idObligatorio(e.id, "id"),
    animalId: idObligatorio(e.animalId, "Animal"),
    etapa: opcion(e.etapa, ETAPAS, "Etapa"),
    fechaInicio: fechaObligatoria(e.fechaInicio, "Fecha de inicio"),
    fechaFin: fecha(e.fechaFin, "Fecha de fin"),
    notas: texto(e.notas, "Notas", LARGO.notas),
    createdAt: creado(e.createdAt),
  }));
  // Respaldos anteriores a estas secciones no las traen: quedan vacías.
  const palpaciones = lista(d.palpaciones, "palpaciones").map((p) => ({
    id: idObligatorio(p.id, "id"),
    vacaId: idObligatorio(p.vacaId, "Vaca"),
    fecha: fechaObligatoria(p.fecha, "Fecha"),
    notas: texto(p.notas, "Notas", LARGO.notas),
    createdAt: creado(p.createdAt),
  }));
  const cambiosEstado = lista(d.cambiosEstado, "cambiosEstado").map((c) => ({
    id: idObligatorio(c.id, "id"),
    vacaId: idObligatorio(c.vacaId, "Vaca"),
    fecha: fechaObligatoria(c.fecha, "Fecha"),
    estadoAnterior: c.estadoAnterior ? opcion(c.estadoAnterior, ESTADOS_REPRO, "Estado anterior") : null,
    estadoNuevo: c.estadoNuevo ? opcion(c.estadoNuevo, ESTADOS_REPRO, "Estado nuevo") : null,
    descripcion: texto(c.descripcion, "Descripción", LARGO.notas),
  }));

  try {
    await prisma.$transaction(
      async (tx) => {
        // 2) Borrar todo lo existente (orden: dependientes primero).
        await tx.cria.deleteMany();
        await tx.parto.deleteMany();
        await tx.monta.deleteMany();
        await tx.registroLeche.deleteMany();
        await tx.registroPeso.deleteMany();
        await tx.etapaTernero.deleteMany();
        await tx.palpacion.deleteMany();
        await tx.cambioEstadoReproductivo.deleteMany();
        await tx.animal.deleteMany();

        // 3) Insertar animales SIN sus vínculos de padre/madre (para no romper FK).
        // Se usa createMany (un solo INSERT por tabla): con la base remota en Supabase,
        // un INSERT por fila puede agotar el timeout de la transacción.
        await tx.animal.createMany({ data: animales });

        // 4) Enlazar padre/madre ahora que todos los animales existen.
        for (const v of vinculos) {
          await tx.animal.update({
            where: { id: v.id },
            data: { padreId: v.padreId, madreId: v.madreId },
          });
        }

        // 5) Insertar los eventos.
        await tx.monta.createMany({ data: montas });
        await tx.parto.createMany({ data: partos });
        await tx.cria.createMany({ data: crias });
        await tx.registroLeche.createMany({ data: registrosLeche });
        await tx.registroPeso.createMany({ data: registrosPeso });
        await tx.etapaTernero.createMany({ data: etapas });
        await tx.palpacion.createMany({ data: palpaciones });
        await tx.cambioEstadoReproductivo.createMany({ data: cambiosEstado });
      },
      { timeout: 60000 }
    );
  } catch (e) {
    console.error(e);
    throw new ErrorValidacion(
      "No se pudo restaurar el respaldo (datos inconsistentes o error de conexión). No se modificaron tus datos.",
      500
    );
  }

  const total = await prisma.animal.count();
  return NextResponse.json({ ok: true, animales: total });
});
