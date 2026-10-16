import Link from "next/link";
import { ListaAnimales } from "@/components/ListaAnimales";
import { AvisoBajas } from "@/components/AvisoBajas";
import { TotalesPrincipales, DesgloseGrid, type Celda } from "@/components/ResumenConteos";
import { conteosModulo, desgloseReproLecheria, type ConteosModulo } from "@/lib/modulos";
import { ESTADO_REPRO_LABEL } from "@/lib/estado";
import {
  IconoLeche,
  IconoSecado,
  IconoReloj,
  IconoBiberon,
  IconoCorazon,
  IconoVaca,
  IconoGrafica,
  IconoFlecha,
} from "@/components/iconos";

export const dynamic = "force-dynamic";

// Desglose por estado reproductivo (igual que la Home anterior, pero solo lechería).
const REPRO_CELDA = [
  { clave: "ORDENIO", etiqueta: ESTADO_REPRO_LABEL.ORDENIO, Icono: IconoLeche, acento: "bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300" },
  { clave: "SECADO", etiqueta: ESTADO_REPRO_LABEL.SECADO, Icono: IconoSecado, acento: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300" },
  { clave: "POR_PARIR", etiqueta: ESTADO_REPRO_LABEL.POR_PARIR, Icono: IconoReloj, acento: "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300" },
  { clave: "POSPARTO", etiqueta: ESTADO_REPRO_LABEL.POSPARTO, Icono: IconoBiberon, acento: "bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300" },
  { clave: "LISTA_MONTAR", etiqueta: ESTADO_REPRO_LABEL.LISTA_MONTAR, Icono: IconoCorazon, acento: "bg-marca-100 text-marca-700 dark:bg-marca-950 dark:text-marca-300" },
  { clave: "SIN_CICLO", etiqueta: "Sin ciclo", Icono: IconoVaca, acento: "bg-stone-100 text-stone-500 dark:bg-stone-800 dark:text-stone-400" },
] as const;

export default async function LecheriaPage({
  searchParams,
}: {
  searchParams: Promise<{ filtro?: string; q?: string }>;
}) {
  const { filtro, q } = await searchParams;

  // Conteos y lista EN PARALELO (ver engorde/page.tsx): la página no espera los conteos.
  const conteos = conteosModulo("LECHERIA");
  const repro = desgloseReproLecheria();

  return (
    <div className="space-y-6">
      <Resumen conteos={conteos} repro={repro} />
      <Link
        href="/leche"
        className="flex items-center justify-between rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm font-medium text-sky-800 hover:bg-sky-100 dark:border-sky-900 dark:bg-sky-950 dark:text-sky-200 dark:hover:bg-sky-900"
      >
        <span className="flex items-center gap-2">
          <IconoGrafica className="h-5 w-5" />
          Ver producción de leche (gráficas)
        </span>
        <IconoFlecha className="h-4 w-4" />
      </Link>
      <ListaAnimales modulo="LECHERIA" titulo="Lechería" filtro={filtro} q={q} basePath="/lecheria" soloActivos agregarModulo="LECHERIA" />
      <AvisoBajas cantidad={conteos.then((c) => c.inactivos)} href="/lecheria/bajas" femenino />
    </div>
  );
}

async function Resumen({
  conteos: conteosP,
  repro: reproP,
}: {
  conteos: Promise<ConteosModulo>;
  repro: Promise<Record<string, number>>;
}) {
  const [conteos, repro] = await Promise.all([conteosP, reproP]);

  // Todas las de lechería son hembras: solo mostramos el total.
  const totales: Celda[] = [
    { clave: "total", valor: conteos.total, etiqueta: "Vacas en lechería", Icono: IconoLeche, acento: "bg-marca-100 text-marca-700 dark:bg-marca-950 dark:text-marca-300", href: "/lecheria" },
  ];

  const reproCeldas: Celda[] = REPRO_CELDA.map((e) => ({
    clave: e.clave,
    valor: repro[e.clave] ?? 0,
    etiqueta: e.etiqueta,
    Icono: e.Icono,
    acento: e.acento,
    // "Sin ciclo" no tiene filtro propio en la lista: celda estática.
    href: e.clave === "SIN_CICLO" ? undefined : `/lecheria?filtro=${e.clave}`,
  }));

  return (
    <>
      <TotalesPrincipales celdas={totales} />
      <DesgloseGrid
        titulo="Por estado reproductivo"
        celdas={reproCeldas}
        nota='Estado derivado del ciclo de cada vaca, o el fijado a mano en su ficha. "Sin ciclo" son vacas sin montas registradas.'
      />
    </>
  );
}
