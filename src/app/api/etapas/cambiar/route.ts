import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  ruta, leerJson, idObligatorio, opcion, texto, fecha, ETAPAS, LARGO, ErrorValidacion,
} from "@/lib/validar";

// POST /api/etapas/cambiar { animalId, etapa, fecha?, notas? }
// -> cambiar la etapa ACTUAL de un animal, con fechas automáticas.
//
// Qué hace, en una sola transacción:
//  1. Cierra la(s) etapa(s) abierta(s) del animal poniendo su fechaFin = hoy.
//  2. Abre la etapa nueva con fechaInicio = hoy (y sin fechaFin).
//
// Las fechas que pone aquí son automáticas pero siguen siendo editables después con
// PUT /api/etapas/[id] (p. ej. para corregir el día real de inicio o fin).
//
// Idempotencia útil: si el animal ya está en la etapa pedida (misma etapa abierta),
// no hace nada y devuelve esa etapa, para que tocar el mismo botón no genere duplicados.
export const POST = ruta(async (req: NextRequest) => {
  const body = await leerJson(req);
  const animalId = idObligatorio(body.animalId, "El animal");
  const etapa = opcion(body.etapa, ETAPAS, "Etapa");
  const notas = texto(body.notas, "Notas", LARGO.notas);

  // La fecha del cambio, guardada a medianoche UTC como el resto de fechas (ver src/lib/fechas.ts).
  // El cliente debe mandar `fecha` = su día LOCAL ("YYYY-MM-DD"): el servidor corre en UTC y,
  // desde las 18:00 en la finca (UTC-6), "hoy" en UTC ya es mañana. Sin `fecha`, se usa el día UTC.
  const ahora = new Date();
  const hoy =
    fecha(body.fecha, "Fecha") ??
    new Date(Date.UTC(ahora.getUTCFullYear(), ahora.getUTCMonth(), ahora.getUTCDate()));

  // Una sola consulta: el animal (si no existe -> 404) y sus etapas abiertas (sin fechaFin).
  const animal = await prisma.animal.findUnique({
    where: { id: animalId },
    select: { etapas: { where: { fechaFin: null }, orderBy: { fechaInicio: "desc" } } },
  });
  if (!animal) {
    return NextResponse.json({ error: "Animal no encontrado." }, { status: 404 });
  }
  const abiertas = animal.etapas;

  // Si ya está en la etapa pedida, no duplicar: devolver la etapa abierta tal cual.
  const yaEnEsa = abiertas.find((e) => e.etapa === etapa);
  if (yaEnEsa && abiertas.length === 1) {
    return NextResponse.json(yaEnEsa, { status: 200 });
  }

  // La nueva etapa no puede empezar antes de la etapa abierta más reciente (evita
  // una etapa con fechaFin anterior a fechaInicio tras cerrarla hoy).
  for (const a of abiertas) {
    if (a.fechaInicio > hoy) {
      throw new ErrorValidacion(
        "La etapa actual empieza en el futuro; corrige su fecha de inicio antes de cambiar de etapa."
      );
    }
  }

  const [, nueva] = await prisma.$transaction([
    // 1. Cerrar las abiertas: fechaFin = hoy.
    prisma.etapaTernero.updateMany({
      where: { animalId, fechaFin: null },
      data: { fechaFin: hoy },
    }),
    // 2. Abrir la nueva etapa: fechaInicio = hoy, sin fechaFin.
    prisma.etapaTernero.create({
      data: { animalId, etapa, fechaInicio: hoy, fechaFin: null, notas },
    }),
  ]);

  return NextResponse.json(nueva, { status: 201 });
});
