import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { etiquetaArete } from "@/lib/tipos";
import { ErrorValidacion, datosAnimal } from "@/lib/validar";

// El toro/padre de un parto, de una monta o de un animal debe ser un REPRODUCTOR (toro o pajilla
// del módulo Reproductores), según el módulo guardado del animal, no su nombre.
// `actual`: el que ya tenía el registro. Se acepta aunque no sea reproductor, para no romper
// relaciones registradas antes de esta regla al editar otros datos.
export async function validarReproductor(toroId: string | null | undefined, campo: string, actual?: string | null) {
  if (!toroId || toroId === actual) return;
  const toro = await prisma.animal.findUnique({ where: { id: toroId }, select: { modulo: true } });
  if (!toro) throw new ErrorValidacion(`${campo}: el animal no existe.`, 404);
  if (toro.modulo !== "REPRODUCTOR") {
    throw new ErrorValidacion(`${campo} debe ser un reproductor (toro o pajilla del módulo Reproductores).`);
  }
}

// --- Crías NUEVAS registradas desde el parto ---------------------------------
// Cada una se crea como un Animal de Engorde (donde van las crías de la finca), nacido el día del
// parto, con la vaca como madre y el toro del parto (si se indicó) como padre.
export type CriaNueva = ReturnType<typeof datosAnimal>;

// Lee `body.criasNuevas` (array de { arete, sinArete, areteCenasa, nombre, sexo, raza }).
export function leerCriasNuevas(v: unknown): CriaNueva[] {
  if (v === undefined || v === null) return [];
  if (!Array.isArray(v)) throw new ErrorValidacion("Crías nuevas: formato inválido.");
  if (v.length > 10) throw new ErrorValidacion("Demasiadas crías en un parto.");
  const crias = v.map((c, i) => {
    if (!c || typeof c !== "object") throw new ErrorValidacion("Crías nuevas: formato inválido.");
    const b = c as Record<string, unknown>;
    const cual = `Cría nueva${v.length > 1 ? ` ${i + 1}` : ""}`;
    if (b.sinArete !== true && !b.arete) throw new ErrorValidacion(`${cual}: el arete es obligatorio.`);
    if (!b.sexo) throw new ErrorValidacion(`${cual}: el sexo es obligatorio.`);
    return datosAnimal({
      arete: b.arete,
      sinArete: b.sinArete === true,
      areteCenasa: b.areteCenasa,
      nombre: b.nombre,
      sexo: b.sexo,
      raza: b.raza,
      modulo: "ENGORDE",
    });
  });
  const aretes = crias.filter((c) => !c.sinArete).map((c) => c.arete);
  const repetido = aretes.find((a, i) => aretes.indexOf(a) !== i);
  if (repetido) throw new ErrorValidacion(`Dos crías nuevas tienen el mismo arete (${repetido}).`);
  return crias;
}

// Antes de abrir la transacción: un arete que ya existe -> 409 con un mensaje claro.
export async function validarAretesNuevos(crias: CriaNueva[]) {
  const aretes = crias.filter((c) => !c.sinArete).map((c) => c.arete);
  if (aretes.length === 0) return;
  const ya = await prisma.animal.findFirst({ where: { arete: { in: aretes } }, select: { arete: true } });
  if (ya) throw new ErrorValidacion(`Ya existe un animal con el arete ${ya.arete}.`, 409);
}

// Crea las crías nuevas dentro de la transacción del parto y devuelve sus ids.
export async function crearCriasNuevas(
  tx: Prisma.TransactionClient,
  crias: CriaNueva[],
  parto: { vacaId: string; toroId: string | null; fecha: Date }
): Promise<string[]> {
  const ids: string[] = [];
  for (const c of crias) {
    const animal = await tx.animal.create({
      data: {
        ...c,
        estado: "ACTIVO",
        modulo: "ENGORDE",
        categoria: null,
        fechaNacimiento: parto.fecha,
        madreId: parto.vacaId,
        madreExterno: null,
        padreId: parto.toroId,
        padreExterno: null,
      },
      select: { id: true },
    });
    ids.push(animal.id);
  }
  return ids;
}

// La vaca que pare deja de ser novilla. Solo hembras de lechería; sin categoría (registros
// anteriores) también pasa a VACA, porque ya parió. Idempotente: editar el parto no repite nada.
export function novillaAVaca(tx: Prisma.TransactionClient, vacaId: string) {
  return tx.animal.updateMany({
    where: { id: vacaId, modulo: "LECHERIA", sexo: "HEMBRA", OR: [{ categoria: null }, { categoria: "NOVILLA" }] },
    data: { categoria: "VACA" },
  });
}

// Una cría tiene UNA sola madre: no puede estar en otro parto (de esta u otra vaca) ni ser hija
// registrada de otra vaca. -> 409 con el nombre de la cría y de la otra madre.
// `partoId`: al editar un parto, sus propias crías no cuentan como "ya vinculadas".
export async function validarCrias(vacaId: string, criaIds: string[], partoId?: string) {
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
      where: { criaId: { in: criaIds }, ...(partoId ? { NOT: { partoId } } : {}) },
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

// Lee `body.crias` (array de { criaId }) -> ids únicos. Máximo 10 por parto.
export function leerCriaIds(crias: unknown, idValido: (v: unknown) => string | null): string[] {
  if (!Array.isArray(crias)) throw new ErrorValidacion("Crías: formato inválido.");
  if (crias.length > 10) throw new ErrorValidacion("Demasiadas crías en un parto.");
  return [
    ...new Set(
      crias.map((c) => idValido((c as { criaId?: unknown } | null)?.criaId)).filter((c): c is string => c !== null)
    ),
  ];
}
