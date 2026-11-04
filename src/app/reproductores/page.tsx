import { ListaAnimales } from "@/components/ListaAnimales";
import { AvisoBajas } from "@/components/AvisoBajas";
import { conteosModulo } from "@/lib/modulos";

export const dynamic = "force-dynamic";

export default async function ReproductoresPage({
  searchParams,
}: {
  searchParams: Promise<{ filtro?: string; q?: string }>;
}) {
  const { filtro, q } = await searchParams;

  // Solo hace falta el número de bajas; el total ya sale bajo el título de la lista (antes se
  // repetía en una tarjeta aparte). En paralelo con la lista (ver engorde/page.tsx).
  const conteos = conteosModulo("REPRODUCTOR");

  return (
    <div className="space-y-6">
      <ListaAnimales modulo="REPRODUCTOR" titulo="Reproductores" filtro={filtro} q={q} basePath="/reproductores" soloActivos agregarModulo="REPRODUCTOR" />
      <AvisoBajas cantidad={conteos.then((c) => c.inactivos)} href="/reproductores/bajas" />
    </div>
  );
}
