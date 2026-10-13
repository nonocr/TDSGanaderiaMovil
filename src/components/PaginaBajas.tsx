import Link from "next/link";
import { ListaAnimales } from "@/components/ListaAnimales";
import { IconoAtras } from "@/components/iconos";

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
    <div className="space-y-4">
      <Link
        href={volver.href}
        className="-ml-1 inline-flex items-center gap-0.5 rounded-lg py-1.5 pl-1 pr-2 text-sm text-stone-500 hover:text-marca-700 dark:text-stone-400 dark:hover:text-marca-400"
      >
        <IconoAtras className="h-4 w-4" />
        {volver.label}
      </Link>
      <ListaAnimales modulo={modulo} titulo={titulo} filtro={filtro} q={q} basePath={basePath} soloBajas />
    </div>
  );
}
