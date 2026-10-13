import { PaginaBajas } from "@/components/PaginaBajas";

export const dynamic = "force-dynamic";

export default function ReproductoresBajasPage({
  searchParams,
}: {
  searchParams: Promise<{ filtro?: string; q?: string }>;
}) {
  return (
    <PaginaBajas
      modulo="REPRODUCTOR"
      titulo="Reproductores · dados de baja"
      volver={{ href: "/reproductores", label: "Reproductores" }}
      basePath="/reproductores/bajas"
      searchParams={searchParams}
    />
  );
}