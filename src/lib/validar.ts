import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";

// Validación de entradas de la API. Todo lo que llega del navegador se revisa aquí
// antes de tocar la base: tipos, valores permitidos, rangos y tamaños.

export const SEXOS = ["MACHO", "HEMBRA"] as const;
export const ESTADOS = ["ACTIVO", "VENDIDO", "MUERTO"] as const;
// Etapas de engorde. La primera es DESTETE (decisión del dueño 2026-10-16; antes existía también
// "LACTANCIA", eliminada: no había datos con ese valor).
export const ETAPAS = ["DESTETE", "DESARROLLO", "ENGORDE"] as const;
// Módulos de la finca. Un animal pertenece a uno y no se mueve entre ellos.
export const MODULOS = ["ENGORDE", "LECHERIA", "REPRODUCTOR"] as const;
// Turnos de ordeño (cada registro de leche es un ordeño).
export const TURNOS = ["MANANA", "TARDE"] as const;
// Categoría de una hembra de lechería.
export const CATEGORIAS = ["NOVILLA", "VACA"] as const;

// Límites de tamaño del cuerpo de la petición.
export const KB = 1024;
export const MB = 1024 * KB;

// Longitudes máximas de texto.
export const LARGO = { corto: 60, medio: 120, notas: 2000 } as const;

// Error de datos inválidos: se responde con 400 y el mensaje se muestra al usuario.
export class ErrorValidacion extends Error {
  constructor(mensaje: string, public status = 400) {
    super(mensaje);
  }
}

// Lee el cuerpo JSON con un límite de tamaño. Debe ser un objeto.
export async function leerJson(req: NextRequest, maxBytes = 100 * KB): Promise<Record<string, unknown>> {
  const declarado = Number(req.headers.get("content-length") ?? 0);
  if (declarado > maxBytes) throw new ErrorValidacion("Los datos enviados son demasiado grandes.", 413);

  const texto = await req.text();
  if (Buffer.byteLength(texto) > maxBytes) {
    throw new ErrorValidacion("Los datos enviados son demasiado grandes.", 413);
  }
  let cuerpo: unknown;
  try {
    cuerpo = JSON.parse(texto);
  } catch {
    throw new ErrorValidacion("Los datos enviados no son válidos.");
  }
  if (!cuerpo || typeof cuerpo !== "object" || Array.isArray(cuerpo)) {
    throw new ErrorValidacion("Los datos enviados no son válidos.");
  }
  return cuerpo as Record<string, unknown>;
}

// Texto opcional: recorta espacios; vacío -> null.
export function texto(v: unknown, campo: string, max: number = LARGO.medio): string | null {
  if (v === undefined || v === null) return null;
  if (typeof v !== "string" && typeof v !== "number") throw new ErrorValidacion(`${campo}: valor inválido.`);
  const s = String(v).trim();
  if (s.length > max) throw new ErrorValidacion(`${campo}: máximo ${max} caracteres.`);
  return s || null;
}

export function textoObligatorio(v: unknown, campo: string, max: number = LARGO.medio): string {
  const s = texto(v, campo, max);
  if (!s) throw new ErrorValidacion(`${campo} es obligatorio.`);
  return s;
}

// Identificador de registro (cuid). Opcional: vacío -> null.
export function id(v: unknown, campo: string): string | null {
  if (v === undefined || v === null || v === "") return null;
  if (typeof v !== "string" || !/^[A-Za-z0-9_-]{1,64}$/.test(v)) {
    throw new ErrorValidacion(`${campo}: identificador inválido.`);
  }
  return v;
}

export function idObligatorio(v: unknown, campo: string): string {
  const r = id(v, campo);
  if (!r) throw new ErrorValidacion(`${campo} es obligatorio.`);
  return r;
}

// Fecha opcional. Acepta "YYYY-MM-DD" o ISO. Rango razonable para evitar basura.
export function fecha(v: unknown, campo: string): Date | null {
  if (v === undefined || v === null || v === "") return null;
  if (typeof v !== "string" && typeof v !== "number") throw new ErrorValidacion(`${campo}: fecha inválida.`);
  const d = new Date(v);
  if (isNaN(d.getTime())) throw new ErrorValidacion(`${campo}: fecha inválida.`);
  const anio = d.getUTCFullYear();
  if (anio < 1950 || anio > 2100) throw new ErrorValidacion(`${campo}: fecha fuera de rango.`);
  return d;
}

export function fechaObligatoria(v: unknown, campo: string): Date {
  const d = fecha(v, campo);
  if (!d) throw new ErrorValidacion(`${campo} es obligatoria.`);
  return d;
}

// Número opcional dentro de un rango.
export function numero(v: unknown, campo: string, min: number, max: number): number | null {
  if (v === undefined || v === null || v === "") return null;
  const n = typeof v === "number" ? v : typeof v === "string" ? Number(v) : NaN;
  if (!Number.isFinite(n)) throw new ErrorValidacion(`${campo}: número inválido.`);
  if (n < min || n > max) throw new ErrorValidacion(`${campo}: debe estar entre ${min} y ${max}.`);
  return n;
}

export function numeroObligatorio(v: unknown, campo: string, min: number, max: number): number {
  const n = numero(v, campo, min, max);
  if (n === null) throw new ErrorValidacion(`${campo} es obligatorio.`);
  return n;
}

// Valor de una lista cerrada (los "enums" guardados como String).
export function opcion<T extends string>(v: unknown, lista: readonly T[], campo: string): T {
  if (typeof v !== "string" || !(lista as readonly string[]).includes(v)) {
    throw new ErrorValidacion(`${campo}: valor no permitido.`);
  }
  return v as T;
}

// "si"/"no"/true/false -> boolean; vacío -> null.
export function triestado(v: unknown): boolean | null {
  if (v === "si" || v === true) return true;
  if (v === "no" || v === false) return false;
  return null;
}

// Prefijo del arete INTERNO que se genera cuando un animal no tiene arete físico (sinArete).
// Ese valor nunca se le muestra al usuario (en pantalla se usa el arete de SENASA); solo existe
// porque la columna `arete` es obligatoria y única.
export const PREFIJO_SIN_ARETE = "S/N-";

// ¿Es un arete interno autogenerado (de un animal sin arete)?
export function esAreteInterno(arete: string | null | undefined): boolean {
  return typeof arete === "string" && arete.startsWith(PREFIJO_SIN_ARETE);
}

// Un arete escrito a mano (o el código de una pajilla, que se guarda como arete) no puede usar el
// prefijo reservado: el animal pasaría por "sin arete" en la UI y en el CSV, y al editarlo se
// conservaría como interno.
function sinPrefijoReservado(valor: string, campo: string): string {
  if (valor.toUpperCase().startsWith(PREFIJO_SIN_ARETE)) {
    throw new ErrorValidacion(`${campo} no puede empezar con "${PREFIJO_SIN_ARETE}" (uso interno).`);
  }
  return valor;
}

// Genera un arete interno único para un animal sin arete físico.
function nuevoAreteInterno(): string {
  return PREFIJO_SIN_ARETE + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

// Campos de alta y edición de un animal, ya validados.
export function datosAnimal(body: Record<string, unknown>) {
  const estado = body.estado ? opcion(body.estado, ESTADOS, "Estado") : "ACTIVO";
  // Datos de baja solo aplican si el animal está Vendido o Muerto.
  const esBaja = estado === "VENDIDO" || estado === "MUERTO";
  // Módulo: si no viene se deja undefined -> en el alta Prisma pone el default (ENGORDE,
  // donde van todas las crías) y en la edición se conserva el módulo actual.
  const modulo = body.modulo ? opcion(body.modulo, MODULOS, "Módulo") : undefined;
  const padreId = id(body.padreId, "Padre");
  const madreId = id(body.madreId, "Madre");
  const codigo = texto(body.codigo, "Código", LARGO.corto);
  // Arete oficial de SENASA (opcional, cualquier módulo). No es único ni obligatorio.
  const areteCenasa = texto(body.areteCenasa, "Arete SENASA", LARGO.corto);
  const esPajilla = body.esPajilla === true;
  // El animal no tiene arete físico: se identifica por el arete de SENASA.
  const sinArete = body.sinArete === true;
  // Novilla / Vaca (solo hembras de lechería; lo revisa la ruta). Si no viene, no se toca.
  const categoria =
    body.categoria === undefined ? undefined : body.categoria ? opcion(body.categoria, CATEGORIAS, "Categoría") : null;

  // PAJILLA (semen): no tiene arete propio ni más datos; solo se captura el código. Como el
  // arete es obligatorio y único, se usa el código como arete. Se fuerza sexo=MACHO y se
  // ignoran nombre/raza/fecha/padres/foto (una pajilla no es un animal físico).
  if (esPajilla) {
    if (!codigo) throw new ErrorValidacion("El código de la pajilla es obligatorio.");
    const cod = sinPrefijoReservado(codigo, "El código");
    return {
      arete: cod,
      nombre: null,
      sexo: "MACHO" as const,
      raza: null,
      fechaNacimiento: null,
      descripcion: texto(body.descripcion, "Descripción", LARGO.notas),
      estado,
      modulo: "REPRODUCTOR" as const,
      codigo: cod,
      // Arete oficial de SENASA (opcional): si no se captura, queda null.
      areteCenasa,
      sinArete: false,
      esPajilla: true,
      categoria: null,
      fechaBaja: esBaja ? fecha(body.fechaBaja, "Fecha de baja") : null,
      motivoBaja: esBaja ? texto(body.motivoBaja, "Motivo de baja", LARGO.notas) : null,
      padreId: null,
      madreId: null,
      padreExterno: null,
      madreExterno: null,
    };
  }

  // Arete: normalmente obligatorio y único. Si el animal NO tiene arete físico (sinArete), se
  // identifica por el de SENASA (que pasa a ser obligatorio) y se guarda un arete interno único.
  // Al editar un animal que ya era sin arete, se conserva su arete interno (el body lo reenvía).
  let arete: string;
  if (sinArete) {
    if (!areteCenasa) {
      throw new ErrorValidacion("Si el animal no tiene arete, el arete de SENASA es obligatorio.");
    }
    arete = esAreteInterno(body.arete as string) ? (body.arete as string) : nuevoAreteInterno();
  } else {
    arete = sinPrefijoReservado(textoObligatorio(body.arete, "El arete", LARGO.corto), "El arete");
  }

  return {
    arete,
    nombre: texto(body.nombre, "Nombre"),
    sexo: opcion(body.sexo, SEXOS, "Sexo"),
    raza: texto(body.raza, "Raza", LARGO.corto),
    fechaNacimiento: fecha(body.fechaNacimiento, "Fecha de nacimiento"),
    descripcion: texto(body.descripcion, "Descripción", LARGO.notas),
    estado,
    modulo,
    // Código del reproductor (opcional). Solo tiene sentido en el módulo REPRODUCTOR.
    codigo,
    // Arete oficial de SENASA (opcional, cualquier módulo).
    areteCenasa,
    sinArete,
    esPajilla: false,
    categoria,
    fechaBaja: esBaja ? fecha(body.fechaBaja, "Fecha de baja") : null,
    motivoBaja: esBaja ? texto(body.motivoBaja, "Motivo de baja", LARGO.notas) : null,
    // Progenitores: registrado (id) o externo (texto). Nunca ambos para el mismo lado.
    padreId,
    madreId,
    padreExterno: padreId ? null : texto(body.padreExterno, "Padre externo"),
    madreExterno: madreId ? null : texto(body.madreExterno, "Madre externa"),
  };
}

// Mensaje cuando el arete ya existe (P2002). En una pajilla el arete es su código, que también
// puede chocar con el arete de un animal físico.
export function mensajeAreteRepetido(datos: { arete: string; esPajilla: boolean }): string {
  return datos.esPajilla
    ? `El código ${datos.arete} ya está en uso (otra pajilla o el arete de un animal).`
    : `Ya existe un animal con el arete ${datos.arete}.`;
}

// Columnas de Animal que devuelve la API: todo menos la foto completa (`fotoUrl`, puede pesar
// cientos de KB); la miniatura sí va.
export const ANIMAL_SIN_FOTO = {
  id: true,
  arete: true,
  nombre: true,
  sexo: true,
  raza: true,
  fechaNacimiento: true,
  fotoMiniatura: true,
  descripcion: true,
  estado: true,
  modulo: true,
  codigo: true,
  areteCenasa: true,
  sinArete: true,
  esPajilla: true,
  categoria: true,
  fechaBaja: true,
  motivoBaja: true,
  padreId: true,
  madreId: true,
  padreExterno: true,
  madreExterno: true,
  createdAt: true,
  updatedAt: true,
} as const;

// Convierte cualquier error en una respuesta segura (sin detalles internos).
export function respuestaError(e: unknown): NextResponse {
  if (e instanceof ErrorValidacion) {
    return NextResponse.json({ error: e.message }, { status: e.status });
  }
  if (e instanceof Prisma.PrismaClientKnownRequestError) {
    if (e.code === "P2002") {
      return NextResponse.json({ error: "Ya existe un registro con ese valor." }, { status: 409 });
    }
    if (e.code === "P2003") {
      return NextResponse.json({ error: "Uno de los animales indicados no existe." }, { status: 400 });
    }
    if (e.code === "P2025") {
      return NextResponse.json({ error: "Registro no encontrado." }, { status: 404 });
    }
  }
  console.error(e);
  return NextResponse.json({ error: "Error interno. Intenta de nuevo." }, { status: 500 });
}

// Envuelve un handler de ruta para que cualquier error pase por respuestaError.
export function ruta<C>(fn: (req: NextRequest, ctx: C) => Promise<Response>) {
  return async (req: NextRequest, ctx: C): Promise<Response> => {
    try {
      return await fn(req, ctx);
    } catch (e) {
      return respuestaError(e);
    }
  };
}

export type ConId = { params: Promise<{ id: string }> };
