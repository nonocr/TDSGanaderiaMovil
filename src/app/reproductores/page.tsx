import { ListaAnimales } from "@/components/ListaAnimales";
import { AvisoBajas } from "@/components/AvisoBajas";
import { TotalesPrincipales, type Celda } from "@/components/ResumenConteos";
import { conteosModulo, type ConteosModulo } from "@/lib/modulos";
import { IconoToro } from "@/components/iconos";

export const dynamic = "force-dynamic";

export default async function ReproductoresPage({
  searchParams,
}: {
  searchParams: Promise<{ filtro?: string; q?: string }>;
}) {
  const { filtro, q } = await searchParams;

  // Conteos y lista EN PARALELO (ver engorde/page.tsx): la página no espera los conteos.
  const conteos = conteosModulo("REPRODUCTOR");

  return (
    <div className="space-y-6">
      <Totales conteos={conteos} />
      <ListaAnimales modulo="REPRODUCTOR" titulo="Reproductores" filtro={filtro} q={q} basePath="/reproductores" soloActivos agregarModulo="REPRODUCTOR" />
      <AvisoBajas cantidad={conteos.then((c) => c.inactivos)} href="/reproductores/bajas" />
    </div>
  );
}

async function Totales({ conteos: conteosP }: { conteos: Promise<ConteosModulo> }) {
  const conteos = await conteosP;
  // Todos los reproductores son machos: solo mostramos el total.
  const totales: Celda[] = [
    { clave: "total", valor: conteos.total, etiqueta: "Reproductores", Icono: IconoToro, acento: "bg-marca-100 text-marca-700 dark:bg-marca-950 dark:text-marca-300", href: "/reproductores" },
  ];
  return <TotalesPrincipales celdas={totales} />;
}
