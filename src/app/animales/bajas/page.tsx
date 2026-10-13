import { PaginaBajas } from "@/components/PaginaBajas";

export const dynamic = "force-dynamic";

export default function AnimalesBajasPage({
  searchParams,
}: {
  searchParams: Promise<{ filtro?: string; q?: string }>;
}) {
  return (
    <PaginaBajas
      titulo="Dados de baja"
      volver={{ href: "/animales", label: "Todos los animales" }}
      basePath="/animales/bajas"
      searchParams={searchParams}
    />
  );
}