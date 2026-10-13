import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { listarAnimales } from "@/lib/genealogia";
import { ANIMAL_SIN_FOTO } from "@/lib/validar";
import { Card } from "@/components/ui";
import { FormularioAnimal } from "@/components/FormularioAnimal";

export const dynamic = "force-dynamic";

export default async function EditarAnimalPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  // Dos consultas en paralelo y sin la foto: toros y vacas salen de la misma lista.
  const [animal, todos] = await Promise.all([
    prisma.animal.findUnique({ where: { id }, select: ANIMAL_SIN_FOTO }),
    listarAnimales(),
  ]);

  if (!animal) notFound();

  const sinSexo = ({ id, arete, nombre }: (typeof todos)[number]) => ({ id, arete, nombre });
  const machos = todos.filter((a) => a.sexo === "MACHO").map(sinSexo);
  const hembras = todos.filter((a) => a.sexo === "HEMBRA").map(sinSexo);

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-stone-800 dark:text-stone-100">
          Editar {animal.nombre ? `${animal.nombre} ` : ""}#{animal.arete}
        </h1>
        <Link href={`/animales/${animal.id}`} className="text-sm text-marca-700 hover:underline dark:text-marca-400">
          ← Volver a la ficha
        </Link>
      </div>
      <Card>
        <FormularioAnimal
          machos={machos}
          hembras={hembras}
          valores={{
            id: animal.id,
            arete: animal.arete,
            nombre: animal.nombre,
            sexo: animal.sexo,
            raza: animal.raza,
            fechaNacimiento: animal.fechaNacimiento?.toISOString() ?? null,
            descripcion: animal.descripcion,
            estado: animal.estado,
            modulo: animal.modulo,
            codigo: animal.codigo,
            esPajilla: animal.esPajilla,
            fechaBaja: animal.fechaBaja?.toISOString() ?? null,
            motivoBaja: animal.motivoBaja,
            padreId: animal.padreId,
            madreId: animal.madreId,
            padreExterno: animal.padreExterno,
            madreExterno: animal.madreExterno,
          }}
        />
      </Card>
    </div>
  );
}
