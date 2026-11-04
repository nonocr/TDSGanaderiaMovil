import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { listarAnimales, opcionesToro } from "@/lib/genealogia";
import { ANIMAL_SIN_FOTO } from "@/lib/validar";
import { Card, EnlaceVolver, PageHeader } from "@/components/ui";
import { FormularioAnimal } from "@/components/FormularioAnimal";
import { etiquetaArete } from "@/lib/tipos";

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

  const sinSexo = ({ id, arete, nombre, sinArete, areteCenasa }: (typeof todos)[number]) =>
    ({ id, arete, nombre, sinArete, areteCenasa });
  // Padre: solo reproductores; el que ya tenga se conserva en la lista aunque no lo sea.
  const machos = opcionesToro(todos, [animal.padreId]);
  const hembras = todos.filter((a) => a.sexo === "HEMBRA").map(sinSexo);

  return (
    <div className="mx-auto max-w-2xl">
      <EnlaceVolver href={`/animales/${animal.id}`}>Volver a la ficha</EnlaceVolver>
      <PageHeader titulo={`Editar ${animal.nombre ? `${animal.nombre} ` : ""}${etiquetaArete(animal)}`} />
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
            areteCenasa: animal.areteCenasa,
            sinArete: animal.sinArete,
            esPajilla: animal.esPajilla,
            categoria: animal.categoria,
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
