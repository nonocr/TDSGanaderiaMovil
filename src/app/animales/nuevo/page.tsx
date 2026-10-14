import Link from "next/link";
import { listarAnimales } from "@/lib/genealogia";
import { Card } from "@/components/ui";
import { FormularioAnimal } from "@/components/FormularioAnimal";
import { MODULO_LABEL } from "@/lib/tipos";
import { MODULOS } from "@/lib/validar";

export const dynamic = "force-dynamic";

export default async function NuevoAnimalPage({
  searchParams,
}: {
  searchParams: Promise<{ modulo?: string }>;
}) {
  const { modulo } = await searchParams;
  // Módulo preseleccionado si se llega desde una página de módulo (p. ej. /lecheria).
  const moduloInicial = modulo && (MODULOS as readonly string[]).includes(modulo) ? modulo : undefined;

  // Padres posibles: una sola consulta (la misma que usa editar), con sinArete/areteCenasa para
  // que los animales sin arete se vean como "CENASA …" en los selectores.
  const todos = await listarAnimales();
  const sinSexo = ({ id, arete, nombre, sinArete, areteCenasa }: (typeof todos)[number]) =>
    ({ id, arete, nombre, sinArete, areteCenasa });
  const machos = todos.filter((a) => a.sexo === "MACHO").map(sinSexo);
  const hembras = todos.filter((a) => a.sexo === "HEMBRA").map(sinSexo);

  return (
    <div className="mx-auto max-w-2xl">
      <Link
        href="/animales"
        className="mb-3 inline-flex items-center gap-1 text-sm text-stone-500 hover:text-marca-700 dark:text-stone-400 dark:hover:text-marca-400"
      >
        ← Todos los animales
      </Link>
      <h1 className="mb-5 text-2xl font-bold tracking-tight text-stone-800 dark:text-stone-100">
        Agregar animal{moduloInicial ? ` · ${MODULO_LABEL[moduloInicial]}` : ""}
      </h1>
      <Card>
        <FormularioAnimal machos={machos} hembras={hembras} moduloInicial={moduloInicial} />
      </Card>
    </div>
  );
}
