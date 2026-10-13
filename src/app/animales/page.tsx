import { ListaAnimales } from "@/components/ListaAnimales";
import { AvisoBajas } from "@/components/AvisoBajas";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function AnimalesPage({
  searchParams,
}: {
  searchParams: Promise<{ filtro?: string; q?: string }>;
}) {
  const { filtro, q } = await searchParams;

  // Cuántos hay dados de baja (para el enlace a su sección). No se espera aquí: va en paralelo
  // con las consultas de la lista (ver engorde/page.tsx).
  const bajas = prisma.animal.count({ where: { estado: { not: "ACTIVO" } } });

  return (
    <div className="space-y-4">
      <ListaAnimales
        titulo="Todos los animales"
        filtro={filtro}
        q={q}
        basePath="/animales"
        soloActivos
      />
      <AvisoBajas cantidad={bajas} href="/animales/bajas" donde="aquí" />
    </div>
  );
}
