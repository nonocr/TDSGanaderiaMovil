import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { IconoFlecha, IconoFamilia, IconoAnimal } from "@/components/iconos";
import { Card, AnimalLink, PageHeader, Badge, Vacio } from "@/components/ui";

export const dynamic = "force-dynamic";

// Vista de familias: agrupa animales por sus progenitores registrados.
// La genealogia es DERIVADA de padre/madre (docs/05).
export default async function FamiliasPage() {
  // UNA consulta plana (sin fotos) y las familias se arman en memoria: pedir los hijos
  // con `select` anidado encadenaría consultas, una tras otra.
  const animales = await prisma.animal.findMany({
    orderBy: { arete: "asc" },
    select: { id: true, arete: true, nombre: true, sexo: true, padreId: true, madreId: true },
  });

  const hijosDe = new Map<string, typeof animales>();
  for (const a of animales) {
    for (const p of [a.padreId, a.madreId]) {
      if (p) hijosDe.set(p, [...(hijosDe.get(p) ?? []), a]);
    }
  }

  // Animales que son progenitores de al menos uno (tienen descendencia registrada).
  const progenitores = animales
    .filter((a) => hijosDe.has(a.id))
    .map((a) => ({ ...a, hijos: hijosDe.get(a.id)! }));

  return (
    <div>
      <PageHeader
        titulo="Familias"
        subtitulo="Cada animal con sus crías. Aparece aquí cuando tiene al menos un hijo registrado."
      />

      {progenitores.length === 0 ? (
        <Card>
          <Vacio
            icono={<IconoFamilia className="h-6 w-6" />}
            mensaje="Aún no hay familias que mostrar. Cuando agregues un animal e indiques quién es su padre o su madre, aquí verás cómo se relacionan."
            accionHref="/animales/nuevo"
            accionLabel="+ Agregar animal"
          />
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {progenitores.map((p) => {
            const hijos = p.hijos;
            return (
              <Card key={p.id} className="p-4 sm:p-5">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <div className="flex min-w-0 items-center gap-2">
                    <IconoAnimal sexo={p.sexo} className="h-5 w-5 shrink-0 text-stone-500 dark:text-stone-400" />
                    <AnimalLink animal={p} />
                  </div>
                  <Badge tono="neutral">
                    {hijos.length} {hijos.length === 1 ? "hijo" : "hijos"}
                  </Badge>
                </div>
                {/* Filas táctiles: toda la fila abre la ficha de la cría. */}
                <ul className="-mx-2 border-t border-stone-100 pt-1 text-sm dark:border-stone-800">
                  {hijos.map((h) => (
                    <li key={h.id}>
                      <Link
                        href={`/animales/${h.id}`}
                        className="flex items-center gap-2 rounded-lg px-2 py-2.5 font-medium text-marca-700 hover:bg-stone-50 active:bg-stone-100 dark:text-marca-400 dark:hover:bg-stone-800/50 dark:active:bg-stone-800"
                      >
                        <span className="text-stone-300 dark:text-stone-600">↳</span>
                        <span className="flex-1">
                          {h.nombre ?? `#${h.arete}`}
                          {h.nombre && (
                            <span className="ml-1 font-normal text-stone-400 dark:text-stone-500">#{h.arete}</span>
                          )}
                        </span>
                        <IconoFlecha className="h-4 w-4 text-stone-300 dark:text-stone-600" />
                      </Link>
                    </li>
                  ))}
                </ul>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
