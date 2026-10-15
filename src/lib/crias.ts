import { prisma } from "@/lib/prisma";
import { etiquetaArete } from "@/lib/tipos";
import { ErrorValidacion } from "@/lib/validar";

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
