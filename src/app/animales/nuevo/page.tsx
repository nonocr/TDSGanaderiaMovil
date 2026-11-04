import { listarAnimales, opcionesToro } from "@/lib/genealogia";
import { Card, EnlaceVolver, PageHeader } from "@/components/ui";
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
  // que los animales sin arete se vean como "SENASA …" en los selectores.
  // Padre: solo reproductores (toros y pajillas del módulo Reproductores).
  const todos = await listarAnimales();
  const sinSexo = ({ id, arete, nombre, sinArete, areteCenasa }: (typeof todos)[number]) =>
    ({ id, arete, nombre, sinArete, areteCenasa });
  const machos = opcionesToro(todos);
  const hembras = todos.filter((a) => a.sexo === "HEMBRA").map(sinSexo);

  return (
    <div className="mx-auto max-w-2xl">
      <EnlaceVolver href="/animales">Todos los animales</EnlaceVolver>
      <PageHeader
        titulo={`Agregar animal${moduloInicial ? ` · ${MODULO_LABEL[moduloInicial]}` : ""}`}
        subtitulo="Los campos con * son obligatorios."
      />
      <Card>
        <FormularioAnimal machos={machos} hembras={hembras} moduloInicial={moduloInicial} />
      </Card>
    </div>
  );
}
