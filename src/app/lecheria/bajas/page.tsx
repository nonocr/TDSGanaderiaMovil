import { PaginaBajas } from "@/components/PaginaBajas";

export const dynamic = "force-dynamic";

export default function LecheriaBajasPage({
  searchParams,
}: {
  searchParams: Promise<{ filtro?: string; q?: string }>;
}) {
  return (
    <PaginaBajas
      modulo="LECHERIA"
      titulo="Lechería · dadas de baja"
      volver={{ href: "/lecheria", label: "Lechería" }}
      basePath="/lecheria/bajas"
      searchParams={searchParams}
    />
  );
}