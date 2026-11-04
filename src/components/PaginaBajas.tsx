import { ListaAnimales } from "@/components/ListaAnimales";
import { EnlaceVolver } from "@/components/ui";

// Página "dados de baja" (vendidos y muertos), común a todos los animales y a cada módulo.
export async function PaginaBajas({
  modulo,
  titulo,
  volver,
  basePath,
  searchParams,
}: {
  modulo?: "ENGORDE" | "LECHERIA" | "REPRODUCTOR";
  titulo: string;
  volver: { href: string; label: string };
  basePath: string;
  searchParams: Promise<{ filtro?: string; q?: string }>;
}) {
  const { filtro, q } = await searchParams;

  return (
    <div>
      <EnlaceVolver href={volver.href}>{volver.label}</EnlaceVolver>
      <ListaAnimales modulo={modulo} titulo={titulo} filtro={filtro} q={q} basePath={basePath} soloBajas />
    </div>
  );
}
