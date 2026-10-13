import { PaginaBajas } from "@/components/PaginaBajas";

export const dynamic = "force-dynamic";

export default function EngordeBajasPage({
  searchParams,
}: {
  searchParams: Promise<{ filtro?: string; q?: string }>;
}) {
  return (
    <PaginaBajas
      modulo="ENGORDE"
      titulo="Engorde · dados de baja"
      volver={{ href: "/engorde", label: "Engorde" }}
      basePath="/engorde/bajas"
      searchParams={searchParams}
    />
  );
}