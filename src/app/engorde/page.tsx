import { ListaAnimales } from "@/components/ListaAnimales";
import { AvisoBajas } from "@/components/AvisoBajas";
import { TotalesPrincipales, DesgloseGrid, type Celda } from "@/components/ResumenConteos";
import { conteosModulo, desgloseEtapasEngorde, type ConteosModulo } from "@/lib/modulos";
import { ETAPA_LABEL } from "@/lib/tipos";
import {
  IconoPeso,
  IconoMacho,
  IconoHembra,
  IconoBiberon,
  IconoReloj,
  IconoInfo,
} from "@/components/iconos";

export const dynamic = "force-dynamic";

// Celdas del desglose por etapa (orden: Lactancia → Desarrollo → Engorde → Sin etapa).
const ETAPAS_CELDA = [
  { clave: "LACTANCIA", Icono: IconoBiberon, acento: "bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300" },
  { clave: "DESARROLLO", Icono: IconoReloj, acento: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300" },
  { clave: "ENGORDE", Icono: IconoPeso, acento: "bg-marca-100 text-marca-700 dark:bg-marca-950 dark:text-marca-300" },
  { clave: "SIN_ETAPA", Icono: IconoInfo, acento: "bg-stone-100 text-stone-500 dark:bg-stone-800 dark:text-stone-400" },
] as const;

export default async function EngordePage({
  searchParams,
}: {
  searchParams: Promise<{ filtro?: string; q?: string }>;
}) {
  const { filtro, q } = await searchParams;

  // Conteos y lista EN PARALELO: la página no espera los conteos (eso encadenaba dos idas a la
  // base); cada parte espera la promesa en su propio componente. Sin <Suspense> nuevo, así que
  // la página sigue apareciendo entera de una vez, como antes.
  const conteos = conteosModulo("ENGORDE");
  const etapas = desgloseEtapasEngorde();

  return (
    <div className="space-y-6">
      <Resumen conteos={conteos} etapas={etapas} />
      <ListaAnimales modulo="ENGORDE" titulo="Engorde" filtro={filtro} q={q} basePath="/engorde" soloActivos agregarModulo="ENGORDE" />
      <AvisoBajas cantidad={conteos.then((c) => c.inactivos)} href="/engorde/bajas" />
    </div>
  );
}

async function Resumen({
  conteos: conteosP,
  etapas: etapasP,
}: {
  conteos: Promise<ConteosModulo>;
  etapas: Promise<Record<string, number>>;
}) {
  const [conteos, etapas] = await Promise.all([conteosP, etapasP]);

  const totales: Celda[] = [
    { clave: "total", valor: conteos.total, etiqueta: "Total", Icono: IconoPeso, acento: "bg-marca-100 text-marca-700 dark:bg-marca-950 dark:text-marca-300", href: "/engorde" },
    { clave: "machos", valor: conteos.machos, etiqueta: "Machos", Icono: IconoMacho, acento: "bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300" },
    { clave: "hembras", valor: conteos.hembras, etiqueta: "Hembras", Icono: IconoHembra, acento: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300" },
  ];

  const etapasCeldas: Celda[] = ETAPAS_CELDA.map((e) => ({
    clave: e.clave,
    valor: etapas[e.clave] ?? 0,
    etiqueta: e.clave === "SIN_ETAPA" ? "Sin etapa" : ETAPA_LABEL[e.clave] ?? e.clave,
    Icono: e.Icono,
    acento: e.acento,
    // "Sin etapa" no tiene filtro propio en la lista: celda estática.
    href: e.clave === "SIN_ETAPA" ? undefined : `/engorde?filtro=${e.clave}`,
  }));

  return (
    <>
      <TotalesPrincipales celdas={totales} />
      <DesgloseGrid
        titulo="Por etapa"
        celdas={etapasCeldas}
        columnas={2}
        nota="Cada animal se cuenta en su etapa actual (la última sin fecha de fin). Cambia la etapa desde la ficha del animal."
      />
    </>
  );
}
